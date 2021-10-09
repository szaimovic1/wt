const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
var url = require('url');
var path = require('path');
const app = express();
const session = require('express-session');
const db = require('./db.js');
const mysql = require("mysql");

db.sequelize.sync({force:true}).then(function(){
    inicializacija().then(function(){
        console.log("Gotovo kreiranje tabela i ubacivanje pocetnih podataka!");
        process.exit();
    });
});

function inicializacija(){
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
        Promise.all(promises).then(function(dodano){
            dodano[3][0].setZaduzenaOsobaN(dodano[0][0]);
            dodano[4][0].setZaduzenaOsobaN(dodano[1][0]);
            dodano[7][0].setSalaN(dodano[3][0]);
            dodano[7][0].setTerminN(dodano[5][0]);
            dodano[7][0].setOsobaN(dodano[0][0]);
            dodano[8][0].setSalaN(dodano[3][0]);
            dodano[8][0].setTerminN(dodano[6][0]);
            dodano[8][0].setOsobaN(dodano[2][0]);
        }).catch(function(err){
            console.log();
        });
    });
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join("public")));

var connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "DBWT19"
});

app.get('/osoblje',function(req,res){
    var data = connection.query("SELECT * FROM osobljes", function(
        error,
        results,
        fields
      ) {
        if (error) throw error;
        res.send({ podaci: results});
    });
});

app.get('/osobljeFilter',function(req,res){
    var data = connection.query("SELECT CONCAT(o.ime, ' ', o.prezime) AS predavac, o.uloga AS uloga, s.naziv AS sala, t.pocetak as pocetak, t.kraj AS kraj, " +
    "t.dan AS dan, t.datum AS datum, t.semestar AS semestar FROM osobljes o, salas s, rezervacijas r, termins t WHERE r.termin = t.id AND r.osoba = o.id AND r.sala = s.id", function(
        error,
        results,
        fields
      ) {
        if (error) throw error;
        var rezervisani = [];
        var uKancelariji = [];
        for(let i=0; i<results.length; i++){
            if(jeLiRezervisani(results[i].dan, results[i].datum, results[i].semestar, results[i].pocetak, results[i].kraj))
                rezervisani.push(results[i]);
            else uKancelariji.push(results[i]);
        }
        for(let i=0; i<uKancelariji.length; i++)
            for(let j=i+1; j<uKancelariji.length; j++)
               if(uKancelariji[i].predavac === uKancelariji[j].predavac) uKancelariji.splice(j--, 1);
        for(let i=0; i<rezervisani.length; i++)
            for(let j=0; j<uKancelariji.length; j++)
                if(rezervisani[i].predavac === uKancelariji[j].predavac) uKancelariji.splice(j, 1);
        var data1 = connection.query("SELECT CONCAT(ime, ' ', prezime) AS predavac, uloga AS uloga FROM osobljes WHERE " +
        "id NOT IN (SELECT r.osoba FROM rezervacijas r)", function(
            error,
            results,
            fields){
            if(error) throw error;
            for(let i=0; i<results.length; i++)
                uKancelariji.push(results[i]);
            if(!rezervisani.length && !results.length)
                res.send({});    
            else if(!rezervisani.length)
                res.send({"uKancelariji": uKancelariji}); 
            else if(!results.length)
            res.send({"rezervisani": rezervisani}); 
            else res.send({"rezervisani": rezervisani, "uKancelariji": uKancelariji}); 
        });
    });
});

function jeLiRezervisani(dan, datumRez, semestar, pocetak, kraj){
    var datum = new Date();
    var sati = datum.getHours();
    var minute = datum.getMinutes();
    if(sati < 10) sati = "0" + sati;
    if(minute < 10) minute = "0" + minute;
    var vrijeme = sati + ":" + minute + ":00";
    var dan = datum.getDate();
    var mjesec = datum.getMonth();
    var godina = datum.getFullYear();
    if(dan < 10) dan = "0" + dan;
    if(mjesec < 10) mjesec = "0" + (mjesec+1);
    var praviDat = dan + "." + mjesec + "." + godina;
    if(!datumRez){
        var dani = [];
        var prviDan = (datum.getDay()+6)%7;                  
        var pozicija = (prviDan+dan)%7 - 1;
        if(pozicija < 0) pozicija += 7;
        while(pozicija <= 32){
            dani.push(pozicija);
            pozicija += 7;
        }
        if(dani.includes(dan) && vrijeme >= pocetak && vrijeme <= kraj
           && ((semestar === "ljetni" && datum.getMonth() >=1 && datum.getMonth() <=5)
           || (semestar === "zimski" && (datum.getMonth() >=9 && datum.getMonth() <=11 || datum.getMonth() === 0))))
            return true;
        else return false;
    }
    else if(datumRez === praviDat && vrijeme >= pocetak && vrijeme <= kraj){
        return true;
    } 
    /*else*/ return false;
}

app.get('/sale',function(req,res){
    var data = connection.query("SELECT * FROM salas", function(
        error,
        results,
        fields
      ) {
        if (error) throw error;
        res.send({ podaci: results});
    });
});

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname, "/public" ,"pocetna.html"));
});

app.get('/zauzeca',function(req,res){
    var data = connection.query("SELECT t.dan AS dan, t.semestar AS semestar, t.pocetak AS pocetak, t.kraj AS kraj, " +
    "s.naziv AS naziv, CONCAT(o.ime, ' ', o.prezime) AS predavac FROM termins t, salas s, osobljes o, rezervacijas r " +
    "WHERE r.termin = t.id AND r.osoba = o.id AND r.sala = s.id AND t.dan IS NOT NULL", function(error, results, fields) {
        if (error) throw error; 
        var periodicna = results;
        var data1 = connection.query("SELECT t.datum AS datum, t.pocetak AS pocetak, t.kraj AS kraj, " +
        "s.naziv AS naziv, CONCAT(o.ime, ' ', o.prezime) AS predavac FROM termins t, salas s, osobljes o, rezervacijas r " +
        "WHERE r.termin = t.id AND r.osoba = o.id AND r.sala = s.id AND t.dan IS NULL", function(error, results, fields){
            if(error) throw error;
            var vanredna = results;
            res.send({"periodicna": periodicna, "vanredna": vanredna}); 
        });            
        }); 
});

app.post('/zauzeca',function(req,res){  
    var novaRezervacija = req.body;
    var kljucevi = Object.keys(novaRezervacija);
    var periodicna = true;
    var podaci = ispravnoZauzece(novaRezervacija);
    var greska = podaci.greska;

    if(kljucevi.length === 5)
        periodicna = false;
    else if(kljucevi.length !== 6){
        greska.error = ("Nepravilan format podatka!");
        pravilna = false;
    } 
        let promises = [];
        var imeIPr = novaRezervacija.predavac.split(" ");
        return new Promise(function(resolve, reject){
            if(greska.error === ""){
                promises.push(
                    db.sala.findOrCreate({
                        where: {naziv: novaRezervacija.naziv}
                    })
                );
                promises.push(
                    db.osoblje.findOrCreate({
                        where: {ime: imeIPr[0], prezime: imeIPr[1]}
                    })
                );
                if(periodicna){
                    var data = connection.query("SELECT * FROM termins t, salas s, rezervacijas r Where s.naziv = '" + novaRezervacija.naziv.toString()
                                                + "' AND r.termin = t.id AND r.sala = s.id AND t.dan is not null", function(error, results, fields) {
                    if (error) throw error;
                    if(uPeriodicnim(results, novaRezervacija)){
                        promises.push(
                            db.termin.findOrCreate({
                                where: {redovni: true, dan:novaRezervacija.dan, datum:null, semestar:novaRezervacija.semestar, pocetak:novaRezervacija.pocetak, kraj:novaRezervacija.kraj}
                            })
                        );
                        promises.push(
                            db.rezervacija.findOrCreate({
                                where: {termin: null}
                            })
                        );
                        Promise.all(promises).then(function(dodano){
                                dodano[3][0].setTerminN(dodano[2][0]);
                                dodano[3][0].setOsobaN(dodano[1][0]);
                                dodano[3][0].setSalaN(dodano[0][0]);
                            }).catch(function(err){
                                console.log();
                        });
                    }
                    else greska.error = ("Sala " +  novaRezervacija.naziv + " je za navedeni dan " + novaRezervacija.dan+1 + " za " + novaRezervacija.semestar + 
                                     " semestar i termin od " + novaRezervacija.pocetak + " do " +  novaRezervacija.kraj + " rezervisana od strane " + novaRezervacija.predavac + "!");
                   });
                }
                else{
                    var data = connection.query("SELECT * FROM termins t, salas s, rezervacijas r Where s.naziv = '" + novaRezervacija.naziv.toString()
                    + "' AND r.termin = t.id AND r.sala = s.id AND t.dan is null", function(error, results, fields) {
                        if (error) throw error;
                        if(uVanrednim(results, novaRezervacija)){
                            promises.push(
                                db.termin.findOrCreate({
                                    where: {redovni: false, dan: null, datum: novaRezervacija.datum, semestar: null, pocetak:novaRezervacija.pocetak, kraj:novaRezervacija.kraj}
                                })
                            );
                            promises.push(
                                db.rezervacija.findOrCreate({
                                    where: {termin: null}
                                })
                            );
                            Promise.all(promises).then(function(dodano){        
                                    dodano[3][0].setTerminN(dodano[2][0]);
                                    dodano[3][0].setOsobaN(dodano[1][0]);
                                    dodano[3][0].setSalaN(dodano[0][0]);
                                }).catch(function(err){
                                    console.log();
                            });
                        }
                        else greska.error = ("Sala " +  novaRezervacija.naziv + " je za navedeni datum " +  novaRezervacija.datum +
                                     " i termin od " + novaRezervacija.pocetak + " do " + novaRezervacija.kraj + " rezervisana od strane " + novaRezervacija.predavac + "!");          
                    });
                }    
            }
            
    var data = connection.query("SELECT t.dan AS dan, t.semestar AS semestar, t.pocetak AS pocetak, t.kraj AS kraj, " +
    "s.naziv AS naziv, CONCAT(o.ime, ' ', o.prezime) AS predavac FROM termins t, salas s, osobljes o, rezervacijas r " +
    "WHERE r.termin = t.id AND r.osoba = o.id AND r.sala = s.id AND t.dan IS NOT NULL", function(error, results, fields) {
        if (error) throw error; 
        var p = results;
        if(periodicna && greska.error === "") p.push(novaRezervacija);
        var data1 = connection.query("SELECT t.datum AS datum, t.pocetak AS pocetak, t.kraj AS kraj, " +
        "s.naziv AS naziv, CONCAT(o.ime, ' ', o.prezime) AS predavac FROM termins t, salas s, osobljes o, rezervacijas r " +
        "WHERE r.termin = t.id AND r.osoba = o.id AND r.sala = s.id AND t.dan IS NULL", function(error, results, fields){
            if(error) throw error;
            var vanredna = results;
            if(!periodicna && greska.error === "") vanredna.push(novaRezervacija);
            if(greska.error !== "")
                res.send({"error": greska.error, "periodicna": p, "vanredna": vanredna});
            else res.send({"periodicna": p, "vanredna": vanredna}); 
        });            
        }); 
        });
});

function ispravnoZauzece(novaRezervacija){
    var sale = ["0-01", "1-01", "0-02", "1-02", "0-03", "1-03", "0-04", "1-04", "0-05", "1-05", "0-06", "1-15",
              "1-06", "0-07", "1-07", "0-08", "1-08", "0-09", "1-09", "VA1", "VA2", "MA", "EE1", "EE2", "1-11"];
    var kljucevi = Object.keys(novaRezervacija);
    var periodicna = true;
    var pravilna = true;
    var error = {"error": ""};

    if(kljucevi.length === 5)
        periodicna = false;
    else if(kljucevi.length !== 6){
        error.error = ("Nepravilan format podatka!");
        pravilna = false;
    } 

    if(pravilna){
        if(periodicna){
            if(typeof novaRezervacija.dan !== "number" || typeof novaRezervacija.semestar !== "string" || typeof novaRezervacija.pocetak !== "string"
                || typeof novaRezervacija.kraj !== "string" || typeof novaRezervacija.naziv !== "string" || typeof novaRezervacija.predavac !== "string"){
                error.error = ("Nepravilni tipovi parametara!");
                pravilna = false;
            }  
            else if(kljucevi[0] !== "dan" || kljucevi[1] !== "semestar" || kljucevi[2] !== "pocetak" 
               || kljucevi[3] !== "kraj" || kljucevi[4] !== "naziv" || kljucevi[5] !== "predavac"){
                error.error = ("Nepravilni nazivi polja!");
                pravilna = false;
            }      
            else if(!(novaRezervacija.dan >=0 && novaRezervacija.dan <= 6)){
                error.error = ("Nepravilan dan!");
                pravilna = false;
            }     
            else if(novaRezervacija.semestar !== "ljetni" && novaRezervacija.semestar !== "zimski"){
                error.error = ("Nepravilan semestar!");
                pravilna = false;
            }
        }
        else{
            if(typeof novaRezervacija.datum !== "string" || typeof novaRezervacija.pocetak !== "string"
                || typeof novaRezervacija.kraj !== "string" || typeof novaRezervacija.naziv !== "string" || typeof novaRezervacija.predavac !== "string"){
                error.error = ("Nepravilni tipovi parametara!");
                pravilna = false;
            }
            var datum = novaRezervacija.datum.split(".");
            if(datum.length !== 3){
                error.error = ("Nepravilan datum!");
                pravilna = false;
            } 
            else if(!((datum[0] >=1 && datum[0] <= 32) && (datum[1] >= 1 & datum[1] <= 12) && (datum[2] === "2019" || datum[2] === "2020"))){
                error.error = ("Nepravilan datum!");
                pravilna = false;
            }
        }  
        var vrijemePocetak = novaRezervacija.pocetak.split(":");
        var vrijemeKraj = novaRezervacija.pocetak.split(":");
        if(vrijemePocetak.length !== 2 || vrijemeKraj.length !== 2){
            error.error = ("Nepravilan format vremena");
            pravilna = false;
        }     
        else if(!((parseInt(vrijemePocetak[0]) >= 0 && parseInt(vrijemePocetak[0]) < 24) && 
          (parseInt(vrijemeKraj[0]) >= 0 && parseInt(vrijemeKraj[0]) < 24))){
            error.error = ("Nepravilan format vremena");
            pravilna = false;
        }  
        else if(novaRezervacija.pocetak >= novaRezervacija.kraj && novaRezervacija.kraj !== "00:00"){
            error.error = ("Nepravilan format vremena");
            pravilna = false;
        }
        else if(!sale.includes(novaRezervacija.naziv)){
            error.error = ("Neispravna sala");
            pravilna = false;
        }        
    }  
    return {"pravilna": pravilna, "greska": error};
}

function uPeriodicnim(podaci, rezervacija){
    var duzina = podaci.length;
    if(duzina){
        for(let i=0; i<duzina; i++){
            var dani = [];
            var pocetakKolone = podaci[i].dan;
            while(pocetakKolone >= 0)
                pocetakKolone -= 7;
            pocetakKolone += 7;
            while(pocetakKolone <= 32){
                dani.push(pocetakKolone);
                pocetakKolone += 7;
            }
            if(rezervacija.semestar === podaci[i].semestar && rezervacija.naziv === podaci[i].naziv
                && slobodnoVrijeme(podaci[i].pocetak, rezervacija.pocetak + ":00", podaci[i].kraj, rezervacija.kraj + ":00")
                && dani.includes(rezervacija.dan)){
                return false;
            }
        }
    }  
    return true;               
}
       

function uVanrednim(podaci, rezervacija){
    var duzina = podaci.length;
    if(duzina){
        for(let i=0; i<duzina; i++)
            if(rezervacija.datum === podaci[i].datum && rezervacija.naziv === podaci[i].naziv
                && slobodnoVrijeme(podaci[i].pocetak, rezervacija.pocetak + ":00", podaci[i].kraj, rezervacija.kraj + ":00")){
                    return false;
                }          
    }  
    return true;  
}

function slobodnoVrijeme(pocetak1, pocetak2, kraj1, kraj2){
    if(pocetak2.length && kraj2.length){
        if(pocetak2 >= pocetak1 && pocetak2 <= kraj1)
            return true;
        else if(kraj2 >= pocetak1 && kraj2 <= kraj1)
            return true;
        else if(pocetak1 >= pocetak2 && kraj2 >= kraj1)
            return true;
    }    
    return false;
}

app.use(session({
    secret: 'neka tajna sifra',
    resave: true,
    saveUninitialized: true
 })); 

 app.get('/slike',function(req,res){
    fs.readdir('slike', function (err, data) {
        if (err) return console.error(err); 
        req.session.duzina = data.length;
        req.session.render = 0;
        req.session.data = data;
        res.send();
    });  
 });

 app.get('/s1',function(req,res){
    if(req.session.duzina <= req.session.render)
        res.send();
    else{
        res.sendFile(__dirname + "/slike/" + req.session.data[req.session.render]);
        req.session.render++;
    }
});

 app.get('/s2',function(req,res){
    if(req.session.duzina <= req.session.render)
        res.send();
    else{
        res.sendFile(__dirname + "/slike/" + req.session.data[req.session.render]);
        req.session.render++;
    }
});

app.get('/s3',function(req,res){
    if(req.session.duzina <= req.session.render)
        res.send();
    else{
        res.sendFile(__dirname + "/slike/" + req.session.data[req.session.render]);
        req.session.render++;
    }
});

module.exports = app;


app.listen(8080);
