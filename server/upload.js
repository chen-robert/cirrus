const Joi = require("@hapi/joi");
const router = require("express").Router();
const fs = require("fs");

const config = require(__rootdir + "/config.json");

const {getPath, getTestDir, joiError} = require(__rootdir + "/server/util.js");

fs.mkdirSync(getTestDir(config.defaultTestsuite), {recursive: true});

const apiSchema = Joi.object().keys({
  name: Joi.string().regex(/^[a-zA-Z0-9\.]*$/).max(30).required(),
  testsuite: Joi.string().alphanum().max(30).default(config.defaultTestsuite)
});

const upload = require("multer")({
  limits: {
    fileSize: 100 * 1000 * 1000
  }, 
  dest: __rootdir + "/uploads/tmp"
});

router.post("/", 
  (req, res, next) => {
    upload.single("file")(req, res, err => {
      if (err) {
        req.status(400).send({
          err: "File too big"
        });
      }
      next();
    });
  },
  (req, res) => {
    apiSchema.validate(req.body, (err, {name, testsuite}) => {
      if (err) return joiError(res, err);

      if(name.endsWith(config.inExt) || name.endsWith(config.outExt)) {
        const testDir = getTestDir(testsuite);
        if(!fs.existsSync(testDir)) fs.mkdirSync(testDir);

        const file = req.file;
        fs.rename(file.path, getPath(testsuite, name), err => {
          if(err) return res.status(500).send({
            err
          });

          res.status(200).send({
            name: name,
            testsuite: testsuite
          });
        });
      } else {
        res.status(400).send({
          err: `"name" must end with either ${config.inExt} or ${config.outExt}`
        })
      }

      
    });
  }
);

module.exports = router;