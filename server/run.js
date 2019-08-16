const Joi = require("@hapi/joi");
const router = require("express").Router();

const fs = require("fs");

const Isolate = require(__rootdir + "/server/isolate.js");

const apiSchema = Joi.object().keys({
  lang: Joi.string().required(),
  source: Joi.string().required(),
  filename: Joi.string().regex(/[a-zA-Z0-9\.]*/).max(30).required(),
  compile: Joi.any(),
  execute: Joi.any(),
  // tests: Joi.array().required()
});

router.post("/", (req, res) => {
  apiSchema.validate(req.body, (err, data) => {
    const {lang, source, filename} = data;
    if(Isolate.langs.includes(lang)) {
      const box = new Isolate(lang);

      fs.writeFileSync(`${box.rootPath}/${filename}`, source);

      box.compile(filename, {}, (err, stdout, stderr) => {
        if(err) {
          return res.send({
            err: "Compilation error",
            stderr: stderr,
            stdout: stdout
          })
        }
        box.run({}, () => {
          res.send("Yay");
        });
      });      
    } else {
      return res.status(400).send({
        err: "Invalid language. Supported langs: [" + Isolate.langs.join(" ") + "]"
      });
    }
  });
});

module.exports = router;