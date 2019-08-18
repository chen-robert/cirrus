process.env.NODE_ENV = 'test';
process.env.PORT = 4000 + Math.floor(1000 * Math.random());

const server = require("../index.js");
const config = require("../config.json");

const {inExt, outExt} = config;

const fs = require("fs");
const crypto = require("crypto");

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.should();

chai.use(chaiHttp);

const problemDataPath = __dirname + "/../samples/tests";
describe("Routes", () => {
  after(done => {
    server.close();
    done();
  });

  describe("GET /langs", () => {
    it('it should GET an object describing available languages', (done) => {
      chai.request(server)
        .get('/langs')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('object');
          done();
        });
    });
  });

  describe("GET /graders", () => {
    it('it should GET all the graders', (done) => {
      chai.request(server)
        .get('/graders')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          done();
        });
    });
  });

  const pname = "0" + inExt;
  describe("POST /upload with no testsuite", () => {
    it("it should upload test data", done => {
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", pname)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("object");
          res.body.name.should.equal(pname);
          res.body.testsuite.should.equal(config.defaultTestsuite);

          done();
        })
    });
  });

  describe("POST /upload with a specified testsuite", () => {
    it("it should upload test data with the testsuite", done => {
      const testsuite = crypto.randomBytes(15).toString("hex");
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", pname)
        .field("testsuite", testsuite)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an("object");
          res.body.name.should.equal(pname);
          res.body.testsuite.should.equal(testsuite);

          done();
        })
      });
    it("it should error because testsuite is too long", done => {
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", pname)
        .field("testsuite", crypto.randomBytes(16).toString("hex"))
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.an("object");
          res.body.err.should.be.a("string");
  
          done();
        })
    });
  
  
    it("it should error because of invalid characters", done => {
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", pname)
        .field("testsuite", ".")
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.an("object");
          res.body.err.should.be.a("string");
  
          done();
        })
    });
  });

  describe("POST /upload with an invalid name", () => {
    it("it should error because of special characters", done => {
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", "*" + inExt)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.an("object");
          res.body.err.should.be.a("string");

          done();
        })
    });

    it("it should error because of invalid extensions", done => {
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", "0.")
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.an("object");
          res.body.err.should.be.a("string");

          done();
        })
    });

    it("it should error because the name is too long", done => {
      chai.request(server)
        .post("/upload")
        .attach("file", fs.readFileSync(`${problemDataPath}/0.in`), "shoudlbeignored.png")
        .field("name", crypto.randomBytes(16).toString("hex"))
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.an("object");
          res.body.err.should.be.a("string");

          done();
        })
    });
  });
})