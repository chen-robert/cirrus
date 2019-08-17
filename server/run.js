const Joi = require("@hapi/joi");
const router = require("express").Router();

const {getTestDir} = require(__rootdir + "/server/util.js");
const config = require(__rootdir + "/config.json");

const fs = require("fs");

const Isolate = require(__rootdir + "/server/isolate.js");

const isolateSchema = Isolate.schema;

const apiSchema = Joi.object().keys({
  lang: Joi.string().valid(Isolate.langs).required(),
  source: Joi.string().required(),
  filename: Joi.string().regex(/^[a-zA-Z0-9\.]*$/).max(30).required(),

  grader: Joi.string().valid(config.graders),
  testsuite: Joi.string().alphanum().max(30).default("global"),
  tests: Joi.array(),
  
  compile: isolateSchema,
  execute: isolateSchema,
});

router.post("/", (req, res) => {
  apiSchema.validate(req.body, (err, data) => {
    if(err) {
      return res.status(400).send({
        err: "Parameter validation failed",
        details: err.details.map(err => err.message)
      });
    }
    const {lang, source, filename, testsuite, grader, tests} = data;
    const box = new Isolate(lang);

    const runAllTests = () => {
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
          });

        const results = [];

        const finish = () => {
          box.destroy();
          res.send(results);
        }

        const runTest = () => {
          let i = results.length;

          if(i === testcases.length) return finish();
          
          const name = getTestName(testcases[i])
          
          if(grader) {
            const inputFile = `${testsuiteDir}/${name + config.inExt}`;
            const outputFile = `${testsuiteDir}/${name + config.outExt}`;

            box.runGrader(inputFile, outputFile, grader, {}, (err, result) => {
              results.push({
                name,
                result,
                err
              });

              runTest();
            })
          } else {
            box.run(`${testsuiteDir}/${testcases[i]}`, {}, (err, stdout, stderr) => {
              results.push({
                name,
                err,
                stdout,
                stderr
              });
              runTest();
            });
          }
        }

        runTest();
      });
    }

    fs.writeFileSync(`${box.rootPath}/${filename}`, source);
    box.compile(filename, {}, (err, stdout, stderr) => {
      if(err) {
        return res.send({
          err: "Compilation error",
          stderr: stderr,
          stdout: stdout
        });
      }

      runAllTests();
    });      
  });
});

module.exports = router;