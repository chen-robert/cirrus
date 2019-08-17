const Joi = require("@hapi/joi");
const router = require("express").Router();
const fs = require("fs");

const {getPath, joiError} = require(__rootdir + "/server/util.js");

const apiSchema = Joi.object().keys({
  name: Joi.string().regex(/[a-zA-Z0-9\.]*/).max(30).required(),
  group: Joi.string().alphanum().max(30).default("global"),
  file: Joi.any(),
});

const upload = require("multer")({
  limits: {
    fileSize: 50 * 1000 * 1000
  }
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
    apiSchema.validate(req.body, (err, {name, file, group}) => {
      if (err) return joiError(res, err);

      fs.rename(file.path, getPath(group, name));

      return res.status(200);
    });
  }
);

module.exports = router;