const Joi = require("@hapi/joi");
const router = require("express").Router();

const {getTestDir, loadTestcases} = require(__rootdir + "/server/util.js");
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
      loadTestcases(testsuite, tests, async testcases => {
        const runTest = name => {
          return new Promise(resolve => {
            const testsuiteDir = getTestDir(testsuite);
            const inputFile = `${testsuiteDir}/${name + config.inExt}`;
            const outputFile = `${testsuiteDir}/${name + config.outExt}`;
            if(grader) {
              box.runGrader(inputFile, outputFile, grader, {}, (err, status) => {
                resolve({
                  name,
                  status,
                  err
                });
              })
            } else {
              box.run(inputFile, {}, (err, stdout, stderr) => {
                resolve({
                  name,
                  err,
                  stdout,
                  stderr
                });
              });
            }
          });
        }

        if(config.runTestsAsync) {
          Promise
            .all(testcases.map(runTest))
            .then(results => {
              box.destroy();
              res.send(results);
            });
        } else {
          const results = [];
          for(let i = 0; i < testcases.length; i++){
            const val = await runTest(testcases[i]);
            results.push(val);
          }

          box.destroy();
          res.send(results);
        }

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