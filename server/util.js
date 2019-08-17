const fs = require("fs");
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

module.exports = {getPath, getTestDir, getGraderDir, loadTestcases};