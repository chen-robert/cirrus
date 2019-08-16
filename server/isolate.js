const config = require(__rootdir + "/config.json");

const fs = require("fs");
const path = require("path");

const { exec, execSync } = require('child_process');

const TESTING = process.env.TESTING !== undefined;

const cache = [];
let lim = 0;

const isolateCmd = "isolate --cg";

class Isolate {
  static get langs() {
    return Object.keys(config.langs);
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
    if(TESTING) {
      this.rootPath = `${__rootdir}/tmp/${boxId}`
      fs.mkdirSync(this.rootPath, { recursive: true });
    } else {
      const resp = execSync(`${isolateCmd} --init ${boxId}`);

      if(resp.includes("Sandbox ID out of range")) throw "Out of isolate boxes";

      this.rootPath = path.resolve(resp, "box");
    }
  }

  compile(source, opts, cb) {
    if(!this.config.compile) return cb();

    let cmd = "";
    if(!TESTING) {
      cmd = `${isolateCmd} -e --run --`;
    }

    const compileCmd = this.config.compile.cmd;
    const compileOpts = this.config.compile.opts;

    if(TESTING) cmd = `cd ${this.rootPath} &&`;
    cmd = `${cmd} ${compileCmd} ${compileOpts.join(" ")} ${source}`;

    exec(cmd, cb);
  }

  run(opts, cb) {
    let cmd = "";
    if(!TESTING) {
      cmd = `${isolateCmd} -e --run --`;
    }

    if(this.config.run) {
      
    } else {
      cmd = `${cmd} ${TESTING? this.rootPath + "/" : ""}${this.config.out}`;
    }

    exec(cmd, cb);
  }


}


module.exports = Isolate;