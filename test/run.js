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

  if(langs.length !== 0){
    const testLang = langs[0];
    const testFile = config.langs[testLang].test;

    const standardErrorHandler = (done, errStr) => (err, res) => {
      res.should.have.status(400);
      res.body.should.be.an("object");
      res.body.err.should.be.a("string");
      res.body.err.should.include(errStr);

      done();
    }

    const apiTemplate = ({lang, filename, source, tests, grader}) => {
      return {
        lang: lang || testLang,
        filename: filename || testFile,
        source: source || fs.readFileSync(`${codePath}/${testFile}`).toString(),
        testsuite: tests || testsuite,
        grader: grader || "default"
      }
    }

    describe("Error handling", () => {
      it("it should error on nonexistent test suite", done => {
        chai.request(server)
          .post("/run")
          .send(apiTemplate({tests: "notarealtestsuite"}))
          .end(standardErrorHandler(done, "testsuite"));
      });

      it("it should error on nonexistent grader", done => {
        chai.request(server)
          .post("/run")
          .send(apiTemplate({grader: "notarealgrader"}))
          .end(standardErrorHandler(done, "grader"));
      });

      it("it should error on nonexistent lang", done => {
        chai.request(server)
          .post("/run")
          .send(apiTemplate({lang: "notareallang"}))
          .end(standardErrorHandler(done, "lang"));
      });

      it("it should error on invalid filename", done => {
        chai.request(server)
          .post("/run")
          .send(apiTemplate({filename: "invalid../filename"}))
          .end(standardErrorHandler(done, "filename"));
      });
    });
  }
});