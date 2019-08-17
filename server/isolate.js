const config = require(__rootdir + "/config.json");
const Joi = require("@hapi/joi");

const fs = require("fs");
const path = require("path");

const { exec, execSync, spawn } = require('child_process');

const TESTING = process.env.TESTING !== undefined;

const cache = [];
let lim = 0;

const isolateCmd = "isolate --cg";

const compileDefaults = {
  time: 1,
  wallTime: 10,
  mem: 10 * 1000
}

const runDefaults = {
  time: 4,
  wallTime: 40,
  mem: 100 * 1000,
}

const optToFlag = {
  time: "--time",
  wallTime: "--wall-time",
  mem: "--cg-mem",
  inFile: "--stdin"
}

class Isolate {
  static get langs() {
    return Object.keys(config.langs);
  }

  static get schema() {
    return Joi.object().keys({
      time: Joi.number().min(0).integer(),
      wallTime: Joi.number().min(0).integer(),
      mem: Joi.number().min(0).integer(),
    }).unknown(false);
  }

  constructor(lang){
    if(!Isolate.langs.includes(lang)){
      throw `Invalid language ${lang}`;
    }

    this.config = config.langs[lang];

    let boxId;
    if(cache.length === 0) {
      boxId = lim; 
      lim++;
    } else {
      boxId = cache.pop();
    }

    this.boxId = boxId;
    if(TESTING) {
      this.rootPath = `${__rootdir}/tmp/${boxId}`
      fs.mkdirSync(this.rootPath, { recursive: true });
    } else {
      const resp = execSync(`${isolateCmd} --init -b ${boxId}`);

      if(resp.includes("Sandbox ID out of range")) throw "Out of isolate boxes";

      this.rootPath = path.resolve(resp, "box");
    }

    this.isolateCmd = `${isolateCmd} -b ${boxId}`
  }

  getCommandBase(opts) {
    let cmd = "";
    if(!TESTING) {
      cmd = `${this.isolateCmd} -e`;
      cmd = `${cmd} ${
        Object.keys(opts).map(
          key => `${optToFlag[key]} ${opts[key]}`
        ).join(" ")
      }`;
      cmd = `${cmd} --run --`;
    }
    return cmd;
  }

  compile(source, opts, cb) {
    if(!this.config.compile) {
      this.compiledFile = source;
      return cb();
    }
    this.compiledFile = this.config.out; 

    opts = Object.assign(compileDefaults, opts);
    let cmd = this.getCommandBase(opts);

    const compileCmd = this.config.compile.cmd;
    const compileOpts = this.config.compile.opts;

    if(TESTING) cmd = `cd ${this.rootPath} &&`;
    cmd = `${cmd} ${compileCmd} ${compileOpts.join(" ")} ${source}`;

    exec(cmd, cb);
  }

  run(inFile, opts, cb) {
    opts = Object.assign(runDefaults, opts, {inFile});
    let cmd = this.runCmd(opts);

    if(TESTING) cmd = `cat ${inFile} | ${cmd}`;

    exec(cmd, cb);
  }

  runCmd(opts) {
    let cmd = this.getCommandBase(opts);

    if(this.config.run) {
      const compileCmd = this.config.compile.cmd;
      const compileOpts = this.config.compile.opts;
    } else {
      cmd = `${cmd} ${TESTING? this.rootPath + "/" : ""}${this.compiledFile}`;
    }

    return cmd;
  }

  runGrader(inFile, outFile, graderDir, opts, cb) {
    const graderConfig = require(`${graderDir}/config.json`);
    const {cmd, args} = graderConfig;

    const grader = spawn(cmd, args, {
      cwd: graderDir,
      env: {
        "INPUT_PATH": inFile,
        "ANSWER_PATH": outFile,
        "RUN_CMD": this.runCmd(opts)
      }
    });

    let stdout = "";
    let stderr = "";
    grader.stdout.on("data", data => stdout += data);
    grader.stderr.on("data", data => stderr += data);

    grader.on("close", code => {
      if(code != 0) {
        console.log(`Grader exited with error code: ${code}`);
        console.log(`Stderr: ${stderr}`);
        return cb(`Grader exited with code ${code}`);
      }
      return cb(null, stdout);
    });
  }

  destroy() {
    cache.push(this.boxId);

    if(!TESTING) {
      execSync(`${this.isolateCmd} --destroy`);
    }
  }


}


module.exports = Isolate;