process.env.NODE_ENV = 'test';
process.env.PORT = 4000 + Math.floor(1000 * Math.random());

const server = require("../index.js");

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.should();

chai.use(chaiHttp);

describe("Routes", () => {
  describe("GET /langs", () => {
    it('it should GET an object describing available languages', (done) => {
      chai.request(server)
        .get('/langs')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
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
          res.body.should.be.a('array');
          done();
        });
    });
  })
})