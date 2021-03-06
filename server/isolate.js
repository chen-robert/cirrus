const Joi = require("@hapi/joi");
const fs = require("fs");
const path = require("path");

const { exec, execSync, spawn } = require('child_process');
const config = require(__rootdir + "/config.json");
const {compileDefaults, executeDefaults} = config.isolate;
const {getGraderDir, which} = require(__rootdir + "/server/util.js");

const TESTING = process.env.TESTING !== undefined;
const isolateCmd = "isolate --cg -p";

const cache = [];
let lim = 0;

const optToFlag = {
  time: "--time",
  wallTime: "--wall-time",
  mem: "--cg-mem",
  processes: "-p",
  inFile: "--stdin"
}

// A bit hacky
if(!TESTING) {
  for(let i = 0; i < 1000; i++){
    execSync(`${isolateCmd} --cleanup -b ${i}`);
  }
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
    });
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
      const resp = execSync(`${isolateCmd} --init -b ${boxId}`)
        .toString()
        .trim();

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

      // Force redirect of stderr to stdout. 
      // Stderr is reserved for isolate.
      cmd = `${cmd} --stderr-to-stdout --run --`;
    }
    return cmd;
  }

  compile(source, opts) {
    return new Promise((resolve, reject) => {
      if(!this.config.compile) {
        this.compiledFile = source;
        return resolve();
      }
      
      this.name = source.split(".")[0];
      this.sourceFile = source;
      this.compiledFile = this.parseSpecial(this.config.out); 
  
      opts = Object.assign(compileDefaults, opts);
      let cmd = this.getCommandBase(opts);
  
      if(TESTING) cmd = `cd ${this.rootPath} &&`;
      cmd = `${cmd} ${this.getFullCmd(this.config.compile)}`;
  
      exec(cmd, (err, stdout, stderr) => {
        if(err) return reject({stdout, stderr});
        return resolve();
      });
    })
  }

  parseSpecial(name) {
    return name
      .replace(/\$NAME/g, this.name)
      .replace(/\$OUTFILE/g, (TESTING ? this.rootPath + "/": "") + this.compiledFile)
      .replace(/\$ROOTPATH/g, TESTING? this.rootPath: "/box")
      .replace(/\$SOURCEFILE/g, this.sourceFile);
  }

  getFullCmd(config) {
    const {cmd, opts} = config;

    let ret = which(this.parseSpecial(cmd));

    if(opts) ret = `${ret} ${opts.map(name => this.parseSpecial(name)).join(" ")}`;

    return ret;
  }

  run(inFile, opts) {
    return new Promise(resolve => {
      opts = Object.assign({}, executeDefaults, opts, {inFile});
      let cmd = this.runCmd(opts);
  
      if(TESTING) cmd = `cat ${this.rootPath}/${inFile} | ${cmd}`;
  
      exec(cmd, (err, stdout, stderr) => resolve({err, stdout, stderr}));
    })
  }

  runCmd(opts) {
    let cmd = this.getCommandBase(opts);

    if(this.config.run) {
      cmd = `${cmd} ${this.getFullCmd(this.config.run)}`;
    }
    
    return cmd;
  }

  runGrader(inFile, outFile, grader, opts) {
    return new Promise(resolve => {
      opts = Object.assign({}, executeDefaults, opts);
      const graderDir = getGraderDir(grader);
  
      const graderConfig = require(`${graderDir}/config.json`);
      const {cmd, args} = graderConfig;
  
      const graderProcess = spawn(cmd, args || [], {
        cwd: graderDir,
        env: {
          "INPUT_PATH": inFile,
          "ANSWER_PATH": outFile,
          "RUN_CMD": this.runCmd(opts)
        }
      });
  
      let stdout = "";
      let stderr = "";
      graderProcess.stdout.on("data", data => stdout += data);
      graderProcess.stderr.on("data", data => stderr += data);
  
      graderProcess.on("close", code => {
        if(code != 0) {
          console.log(`Grader exited with error code: ${code}`);
          console.log(`Stderr: ${stderr}`);
          return resolve({err: `Grader error. Exited with code ${code}`});
        }
        return resolve({status: stdout});
      });
    });
  }

  destroy() {
    cache.push(this.boxId);

    if(!TESTING) {
      execSync(`${this.isolateCmd} --cleanup`);
    }
  }
}


module.exports = Isolate;
