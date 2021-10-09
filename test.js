let chai = require("chai");
let chaiHttp = require("chai-http");
let expect = chai.expect;
let assert = chai.assert;
let app = require("./index.js");
let db = require("./db");
chai.use(chaiHttp);

describe('Testovi', function(){
    before(function(done){        
        this.enableTimeouts(false);
        db.sequelize.sync({force:true}).then(function(){
            inicijalizacija(done);
        });
    });
    after(function(done){
        this.enableTimeouts(false);
        db.sequelize.sync(/*{force: true}*/).then(() => done());
    });

    describe('GET/osoblje', function(){
        it('Tačno tri osobe u bazi', function(done) {
            chai
                .request(app)
                .get("/osoblje")
                .end((err, res) => {
                    expect(res.body.podaci.length).to.eql(3);
                    done();
                });
           });
        it('Tačno tri osobe u kancelariji', function(done) {
        chai
            .request(app)
            .get("/osobljeFilter")
            .end((err, res) => {
                expect(res.body.uKancelariji.length).to.eql(3);
                done();
            });
        });
    });
    describe('GET/zauzeca', function(){
        it('Tačno dvije rezervacije u bazi', function(done) {
            chai
                .request(app)
                .get("/zauzeca")
                .end((err, res) => {
                    expect(res.body.periodicna.length+res.body.vanredna.length).to.eql(2);
                    done();
                });
           });
           it('Rezervisanje i ažuriranje', function(done) {
            chai
                .request(app)
                .post("/zauzeca")
                .send({  
                    "dan": 2,
                    "semestar": "zimski",
                    "pocetak": "11:00",
                    "kraj": "12:30",
                    "naziv": "1-15",
                    "predavac": "Drugi Neko"
                })
                .end((err, res) => {
                    expect(res.body.periodicna.length+res.body.vanredna.length).to.eql(3);
                    done();
                });
        });
    });
    describe('GET/sale', function(){
        it('Tačno dvije sale u bazi', function(done) {
            chai
                .request(app)
                .get("/sale")
                .end((err, res) => {
                    expect(res.body.podaci.length).to.eql(2);
                    done();
                });
           });
    });
    describe('Rezervacije', function(){
        it('Postoji isto zauzeće, od iste osobe', function(done) {
           chai
                .request(app)
                .post("/zauzeca")
                .send({  
                    "datum": "01.01.2020",
                    "pocetak": "11:00",
                    "kraj": "12:30",
                    "naziv": "1-11",
                    "predavac": "Neko Nekić"
                })
                .end((err, res) => {
                    expect(res.body.error).to.eql("Sala 1-11 je za navedeni datum 01.01.2020 i termin od 11:00 do 12:30 rezervisana od strane Neko Nekić!");
                    done();
                });
        });
    });
});

function inicijalizacija(done){    
    let promises = [];
    
    return new Promise(function(resolve, reject){
        promises.push(
            db.osoblje.findOrCreate({
                where: {ime: "Neko", prezime: "Nekić", uloga: "profesor"}
            })
        );
        promises.push(
            db.osoblje.findOrCreate({
                where: {ime: "Drugi", prezime: "Neko", uloga: "asistent"}
            })
        );
        promises.push(
            db.osoblje.findOrCreate({
                where: {ime: "Test", prezime: "Test", uloga: "asistent"}
            })
        );
        promises.push(
            db.sala.findOrCreate({
                where: {naziv: "1-11"}
            })
        );
        promises.push(
            db.sala.findOrCreate({
                where: {naziv: "1-15"}
            })
        );
        promises.push(
            db.termin.findOrCreate({
                where: {redovni: false, dan:null, datum:"01.01.2020", semestar:null, pocetak:"12:00", kraj:"13:00"}
            })
        );
        promises.push(
            db.termin.findOrCreate({
                where: {redovni: true, dan:0, datum:null, semestar:"zimski", pocetak:"13:00", kraj:"14:00"}
            })
        );
        promises.push(
            db.rezervacija.findOrCreate({
                where: {id: 1}
            })
        );
        promises.push(
            db.rezervacija.findOrCreate({
                where: {id: 2}
            })
        );
        Promise.all(promises, done).then(function(dodano){
            dodano[3][0].setZaduzenaOsobaN(dodano[0][0]);
            dodano[4][0].setZaduzenaOsobaN(dodano[1][0]);
            dodano[7][0].setSalaN(dodano[3][0]);
            dodano[7][0].setTerminN(dodano[5][0]);
            dodano[7][0].setOsobaN(dodano[0][0]);
            dodano[8][0].setSalaN(dodano[3][0]);
            dodano[8][0].setTerminN(dodano[6][0]);
            dodano[8][0].setOsobaN(dodano[2][0]);
            done();
        }).catch(function(err){
            console.log();
        });
    });
    }