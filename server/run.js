const Joi = require("@hapi/joi");
const router = require("express").Router();

const {getTestDir, loadTestcases, joiError} = require(__rootdir + "/server/util.js");
const config = require(__rootdir + "/config.json");

const fs = require("fs");

const Isolate = require(__rootdir + "/server/isolate.js");

const isolateSchema = Isolate.schema;

const apiSchema = Joi.object().keys({
  lang: Joi.string().valid(Isolate.langs).required(),
  source: Joi.string().required(),
  filename: Joi.string().regex(/^[a-zA-Z0-9\.]*$/).max(30).required(),

  grader: Joi.string().valid(config.graders),
  testsuite: Joi.string().alphanum().max(30).default(config.defaultTestsuite),
  tests: Joi.array(),
  
  compileOpts: isolateSchema,
  executeOpts: isolateSchema,
});

router.post("/", async (req, res) => {
  const data = await apiSchema.validate(req.body)
    .catch(err => joiError(res, err));
  if(!data) return;
    
  const {lang, source, filename, testsuite, grader, tests, compileOpts, executeOpts} = data;
  const box = new Isolate(lang);

  if(!fs.existsSync(getTestDir(testsuite))) {
    return res.status(400).send({
      err: `Invalid testsuite: ${testsuite}`
    });  
  }

  const testcases = await loadTestcases(testsuite, tests)
    .catch(err => {
      res.status(500).send({
        err: "Failed to read testcases from folder",
        message: err
      });
    });
  if(!testcases) return;

  fs.writeFileSync(`${box.rootPath}/${filename}`, source);
  await box.compile(filename, compileOpts)
    .catch(({stdout, stderr}) => {
      res.send({
        err: "Compilation error",
        stderr: stderr,
        stdout: stdout
      });
    });

  const runTest = async name => {
    const ret = {name};

    const testsuiteDir = getTestDir(testsuite);
    const inputFile = `${testsuiteDir}/${name + config.inExt}`;
    const outputFile = `${testsuiteDir}/${name + config.outExt}`;
    
    if(grader) {
      let {err, status} = await box.runGrader(inputFile, outputFile, grader, executeOpts);
      if(status) status = status.trim();
      
      Object.assign(ret, {
        status,
        err
      });
    } else {
      const inputFileName = name + config.inExt;
      fs.copyFileSync(inputFile, `${box.rootPath}/${inputFileName}`);
      const {err, stdout, stderr} = await box.run(inputFileName, executeOpts);
      
      Object.assign(ret, {
        err,
        stdout,
        stderr
      });
    }

    return ret;
  }

  const results = [];
  for(let i = 0; i < testcases.length; i++){
    const val = await runTest(testcases[i]);
    results.push(val);
  }

  box.destroy();
  res.send(results);
});

module.exports = router;