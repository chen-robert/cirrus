process.env.NODE_ENV = 'test';
process.env.PORT = 4000 + Math.floor(1000 * Math.random());

const server = require("../index.js");
const config = require("../config.json");
const util = require("../server/util.js");

const fs = require("fs");

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

chai.use(chaiHttp);

const problemDataPath = __dirname + "/../samples/tests";
const codePath = __dirname + "/../samples/code";
const testsuite = config.defaultTestsuite;
describe("Compilation and Execution", () => {
  before(done => {
    const files = fs.readdirSync(problemDataPath);
    files.forEach(file => {
      fs.copyFileSync(`${problemDataPath}/${file}`, 
        `${util.getTestDir(testsuite)}/${file}`);
    });
    done();
  });

  after(done => {
    server.close();
    done();
  });

  const langs = Object.keys(config.langs)
    .filter(lang => config.langs[lang].test !== undefined);

  langs.forEach(lang => {
    const testFile = config.langs[lang].test;
    describe(lang, () => {
      it("it should execute and produce output with no grader", done => {
        chai.request(server)
          .post("/run")
          .send({
            lang: lang,
            filename: testFile,
            source: fs.readFileSync(`${codePath}/${testFile}`).toString(),
            testsuite
          })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an("array");

            res.body.forEach(result => {
              result.name.should.be.a("string");
              result.stderr.should.be.a("string");
              result.stdout.should.be.a("string");

              should.not.exist(result.err);
            });

            done();
          });
      });

      it("it should execute and produce AC", done => {
        chai.request(server)
          .post("/run")
          .send({
            lang: lang,
            filename: testFile,
            source: fs.readFileSync(`${codePath}/${testFile}`).toString(),
            testsuite,
            grader: "default"
          })
          .end((err, res) => {
            res.body.should.be.an("array");

            res.body.forEach(result => {
              result.name.should.be.a("string");
              result.status.should.equal("AC");
              
              should.not.exist(result.err);
            });

            done();
          });
      });
    });
  });
});