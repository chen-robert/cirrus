const fs = require("fs");
const { execSync } = require('child_process');

const config = require(__rootdir + "/config.json");

const testsPath = `${__rootdir}/${config.testsDir}`;
const graderPath = `${__rootdir}/${config.graderDir}`;

const getPath = (group, name) => `${testsPath}/${group}/${name}`;
const getTestDir = group => `${testsPath}/${group}`;

const getGraderDir = name => `${graderPath}/${name}`;

const loadTestcases = (testsuite, tests) => {
  return new Promise((resolve, reject) => {
    const testsuiteDir = getTestDir(testsuite);
    fs.readdir(testsuiteDir, (err, files) => {
      if(err) return reject(err);
  
      const getTestName = inFileName => inFileName.substring(0, inFileName.length - config.inExt.length);
  
      const testcases = files
        .filter(file => file.endsWith(config.inExt))
        .filter(file => {
          if(!tests) return true;
          return tests.includes(getTestName(file));
        })
        .map(getTestName);
  
      resolve(testcases);
    });
  })
}

const which = binary => {
  if(which.memo[binary]) return which.memo[binary];

  const dirs = process.env.PATH.split(":");

  which.memo[binary] = dirs
    .map(dir => `${dir}/${binary}`)
    .filter(dir => fs.existsSync(dir))
    .map(path => fs.realpathSync(path))[0] || binary;

  return which.memo[binary];
}
which.memo = {};

const prepareGraders = () => {
  config.graders.forEach(grader => {
    const graderDir = getGraderDir(grader);
    const configPath = `${graderDir}/config.json`;

    if(!fs.existsSync(configPath)) {
      console.error(`ERROR: Missing config file for ${grader}.`);
      console.error(`Expected config at ${configPath}`);
      return;
    }
    const config = require(configPath);
  
    if(!config.prepare) return;
  
    try{
      execSync(config.prepare, {
        cwd: graderDir
      });
    } catch (e) {
      console.error(`Command failed: ${config.prepare}`);
      console.error(`Failed to prepare grader in ${graderDir}`);
    }
  });
}

const joiError = (res, err) => {
  res.status(400).send({
    err: `Parameter validation failed: ${err.details.map(err => err.message).join(", ")}`,
    details: err.details.map(err => err.message)
  })
}

module.exports = {getPath, getTestDir, getGraderDir, loadTestcases, which, prepareGraders, joiError};
