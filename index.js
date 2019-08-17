global.__rootdir = __dirname;

const express = require("express");
const bodyParser = require("body-parser");

const config = require(__rootdir + "/config.json");

const {prepareGraders} = require(__rootdir + "/server/util.js");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

prepareGraders();
console.log(`Using graders: ${JSON.stringify(config.graders)}`);

app.use("/hash", require(__rootdir + "/server/hash.js"));
app.use("/upload", require(__rootdir + "/server/upload.js"));
app.use("/run", require(__rootdir + "/server/run.js"));

app.get("/langs", (req, res) => res.send(config.langs));
app.get("/graders", (req, res) => res.send(config.graders));

app.listen(PORT, () => console.log(`Started server at port ${PORT}`));

module.exports = app;