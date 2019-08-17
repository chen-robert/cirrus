const Joi = require("@hapi/joi");
const router = require("express").Router();
const fs = require("fs");
const crypto = require("crypto");

const {getPath, joiError} = require(__rootdir + "/server/util.js");

const apiSchema = Joi.object().keys({
  name: Joi.string().regex(/[a-zA-Z0-9\.]*/).max(30).required(),
  group: Joi.string().alphanum().max(30).default("global"),
});

router.get("/:group/:name", (req, res) => {
  apiSchema.validate(req.params, (err, {name, group}) => {
    if (err) return joiError(res, err);

    const filePath = getPath(group, name);
    if(fs.existsSync(filePath)) {
      fs.readFile(filePath, null, (err, buffer) => {
        if(err) return res.status(500).send("Failed to read file");
        
        return res.send(crypto.createHash("sha256").update(buffer).digest("base64"));
      });
    } else {
      return res.status(400).send("File not found");
    }
  });
});

module.exports = router;