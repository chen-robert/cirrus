const Joi = require("@hapi/joi");
const router = require("express").Router();

const {getTestDir} = require(__rootdir + "/server/util.js");
const config = require(__rootdir + "/config.json");

const fs = require("fs");

const Isolate = require(__rootdir + "/server/isolate.js");

const apiSchema = Joi.object().keys({
  lang: Joi.string().required(),
  source: Joi.string().required(),
  filename: Joi.string().regex(/[a-zA-Z0-9\.]*/).max(30).required(),
  testsuite: Joi.string().alphanum().max(30).default("global"),
  tests: Joi.array(),
  compile: Joi.any(),
  execute: Joi.any(),
}).without("testsuite", "tests");

router.post("/", (req, res) => {
  apiSchema.validate(req.body, (err, data) => {
    const {lang, source, filename, testsuite} = data;
    if(Isolate.langs.includes(lang)) {
      const box = new Isolate(lang);

      fs.writeFileSync(`${box.rootPath}/${filename}`, source);

      box.compile(filename, {}, (err, stdout, stderr) => {
        if(err) {
          return res.send({
            err: "Compilation error",
            stderr: stderr,
            stdout: stdout
          });
        }

        if(testsuite) {
          const testsuiteDir = getTestDir(testsuite);
          fs.readdir(testsuiteDir, (err, files) => {
            if(err) {
              return res.status(400).send(`Invalid testsuite: ${testsuite}`);
            }

            testcases = files.filter(file => file.endsWith(config.inExt));
            results = [];

            const finish = () => {
              res.send(results);
            }
            const runTest = () => {
              let i = results.length;

              if(i === testcases.length) return finish();

              const inputFileName = "data.in";
              fs.copyFile(`${testsuiteDir}/${testcases[i]}`, `${box.rootPath}/${inputFileName}`, err => {
                if(err) return res.status(500).send("Error when copying input files");

                box.run(inputFileName, {}, (err, stdout, stderr) => {
                  results.push({
                    err,
                    stdout,
                    stderr
                  });
                  runTest();
                });
              });
            }

            runTest();
          })

        }
      });      
    } else {
      return res.status(400).send({
        err: "Invalid language. Supported langs: [" + Isolate.langs.join(" ") + "]"
      });
    }
  });
});

module.exports = router;