const fs = require("fs");
const { execSync } = require('child_process');

const config = require(__rootdir + "/config.json");

const testsPath = `${__rootdir}/${config.testsDir}`;
const graderPath = `${__rootdir}/${config.graderDir}`;

const getPath = (group, name) => `${testsPath}/${group}/${name}`;
const getTestDir = group => `${testsPath}/${group}`;

const getGraderDir = name => `${graderPath}/${name}`;

const loadTestcases = (testsuite, tests, cb) => {
  const testsuiteDir = getTestDir(testsuite);
  fs.readdir(testsuiteDir, (err, files) => {
    if(err) {
      return res.status(400).send(`Invalid testsuite: ${testsuite}`);
    }

    const getTestName = inFileName => inFileName.substring(0, inFileName.length - config.inExt.length);

    const testcases = files
      .filter(file => file.endsWith(config.inExt))
      .filter(file => {
        if(!tests) return true;
        return tests.includes(getTestName(file));
      })
      .map(getTestName);

    cb(testcases);
  });
}

const which = binary => {
  if(which.memo[binary]) return which.memo[binary];

  const dirs = process.env.PATH.split(":");

  which.memo[binary] = dirs
    .map(dir => `${dir}/${binary}`)
    .filter(dir => fs.existsSync(dir))[0] || binary;

  return which.memo[binary];
}
which.memo = {};

const prepareGraders = () => {
  config.graders.forEach(grader => {
    const graderDir = getGraderDir(grader);
    const config = require(`${graderDir}/config.json`);
  
    if(!config.prepare) return;
  
    try{
      execSync(config.prepare, {
        cwd: graderDir
      });
    } catch (e) {
      console.error(`Failed to prepare grader in ${graderDir}`);
      console.error(`Command failed: ${config.prepare}`);
    }
  });
}

module.exports = {getPath, getTestDir, getGraderDir, loadTestcases, which, prepareGraders};