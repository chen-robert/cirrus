global.__rootdir = __dirname;

const express = require("express");
const bodyParser = require("body-parser");
const Joi = require("@hapi/joi");

const crypto = require("crypto");
const fs = require("fs");

const {getPath} = require(__rootdir + "/server/util.js");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


const upload = require("multer")({
  limits: {
    fileSize: 50 * 1000 * 1000
  }
});


const apiSchema = Joi.object().keys({
  name: Joi.string().regex(/[a-zA-Z0-9\.]*/).max(30).required(),
  group: Joi.string().alphanum().max(30).default("global"),
  file: Joi.any(),
});

app.get("/hash/:group/:name", (req, res) => {
  apiSchema.validate(req.params, (err, {name, group}) => {
    if (err) {
      console.log(err);
      return res.status(400).send("Invalid parameters");
    }

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

app.post("/upload", 
  (req, res, next) => {
    upload.single("file")(req, res, err => {
      if (err) {
        req.session.error = "File is too big!";
        return res.redirect("/");
      }
      next();
    });
  },
  (req, res) => {
    apiSchema.validate(req.body, (err, {name, file, group}) => {
      if (err) {
        return res.status(400).send("Invalid parameters");
      }

      fs.rename(file.path, `${uploadPath}/${group}/${name}`);

      return res.status(200);
    });
  }
);

app.use("/run", require(__rootdir + "/server/run.js"));


app.listen(PORT, () => console.log(`Started server at port ${PORT}`));
