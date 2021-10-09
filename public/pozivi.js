let Pozivi = (function(){
    var serverUrl = 'http://localhost:8080/zauzeca';

    function popuniSelekt(tijelo){
        var zahtjev = new XMLHttpRequest();
        zahtjev.open('GET', 'http://localhost:8080/osoblje');
        zahtjev.onload = function(){
            var podaci = JSON.parse(zahtjev.responseText).podaci;
            for(let i=0; i<podaci.length ; i++){
                var opcija = document.createElement("OPTION");
                opcija.innerText = podaci[i].ime + " " + podaci[i].prezime;
                tijelo.appendChild(opcija);
            } 
        }
        zahtjev.send();
    }

    function ponudiSale(tijelo){
        var zahtjev = new XMLHttpRequest();
        zahtjev.open('GET', 'http://localhost:8080/sale');
        zahtjev.onload = function(){
            var podaci = JSON.parse(zahtjev.responseText).podaci;
            for(let i=0; i<podaci.length ; i++){
                var opcija = document.createElement("OPTION");
                opcija.innerText = podaci[i].naziv;
                tijelo.appendChild(opcija);
            } 
        }
        zahtjev.send();
    }

    function ucitajOsoblje(tijelo){
        var zahtjev = new XMLHttpRequest();
        zahtjev.open('GET', 'http://localhost:8080/osobljeFilter');
        zahtjev.onload = function(){
            var podaci = JSON.parse(zahtjev.responseText);
            var kljucevi = Object.keys(podaci);
            var duzina = 0;
            if(kljucevi.includes("rezervisani")) duzina = podaci.rezervisani.length;
            for(let i =0; i<duzina; i++){
                let row = document.createElement("tr");
                for(let j=0; j<3; j++){
                    let cell = document.createElement("td");
                    if(j===0) cell.innerHTML = podaci.rezervisani[i].predavac;
                    else if(j===1) cell.innerHTML = podaci.rezervisani[i].uloga;
                    else if(j===2) cell.innerHTML = podaci.rezervisani[i].sala;
                    row.appendChild(cell);
                }
                tijelo.appendChild(row);
            }
            duzina = 0;
            if(kljucevi.includes("uKancelariji")) duzina = podaci.uKancelariji.length;
            for(let i =0; i<duzina; i++){
                let row = document.createElement("tr");
                for(let j=0; j<3; j++){
                    let cell = document.createElement("td");
                    if(j===2){ cell.innerHTML = "u kancelariji";}
                    else if(j===0){cell.innerHTML = podaci.uKancelariji[i].predavac;} 
                    else if(j===1){cell.innerHTML = podaci.uKancelariji[i].uloga;}            
                    row.appendChild(cell);
                }
                tijelo.appendChild(row);
            }
        }
        zahtjev.send();
    }

    function rezervacijaLoad(){
        var zahtjev = new XMLHttpRequest();
        zahtjev.open('GET', serverUrl);
        zahtjev.onload = function(){
            var podaci = JSON.parse(zahtjev.responseText);
            Kalendar.ucitajPodatke(podaci.periodicna, podaci.vanredna); 
        }
        zahtjev.send();
    }

    function rezervisanje(dan, prostorija, pocetak, kraj, periodicna, mjesec, godina, osoba){
        var semestar = "";
        if(mjesec >= 9 && mjesec <=11 || mjesec === 0)
            semestar = "zimski";
        else if (mjesec >= 1 && mjesec <=5)
            semestar = "ljetni";
        if(periodicna){
            var prviDan = ((new Date(godina, mjesec)).getDay()+6)%7;
            var danBr = parseInt(dan);                    
            var pozicija = (prviDan+danBr)%7 - 1;
            if(pozicija < 0) pozicija += 7;
            novaRezervacija = {  
                "dan": pozicija,
                "semestar": semestar,
                "pocetak": pocetak,
                "kraj": kraj,
                "naziv": prostorija,
                "predavac": osoba
            };
        }
        else{
            mjesec++;
            var danStr = dan.toString();
            var mjesecStr = (mjesec).toString();
            if(danStr.length === 1)
                danStr = "0" + dan;
            if(mjesecStr.length === 1)
                mjesecStr = "0" + mjesec;
            novaRezervacija = {  
            "datum": danStr + "." + mjesecStr + "." + godina,
            "pocetak": pocetak,
            "kraj": kraj,
            "naziv": prostorija,
            "predavac": osoba
            };
            mjesec--;
        }
        var zahtjev = new XMLHttpRequest();
        zahtjev.open('POST', serverUrl);
        zahtjev.setRequestHeader("Content-type", "application/json");
        zahtjev.onreadystatechange = function () {
            if(zahtjev.readyState === XMLHttpRequest.DONE && zahtjev.status === 200) {
                var rezultat = JSON.parse(zahtjev.responseText);
                var kljucevi = Object.keys(rezultat);
                if(kljucevi.includes("error")){
                    window.alert(rezultat.error);
                    Kalendar.ucitajPodatke(rezultat.periodicna, rezultat.vanredna);
                }
                else Kalendar.ucitajPodatke(rezultat.periodicna, rezultat.vanredna);
                Kalendar.obojiZauzeca(
                    document.getElementById("tijelo-kalendara"),
                    mjesec,                                               
                    prostorija,
                    pocetak,
                    kraj
                );
                dodajListener();
            }
        };
        zahtjev.send(JSON.stringify(novaRezervacija));
    }

    function dostupnost(dan, duzina, prviDan){
        var tijelo = document.getElementById("tijelo-kalendara");
        var pozicija = (prviDan+parseInt(dan))%7 - 1;
        if(pozicija < 0) pozicija += 7;
        for(let i = 0; i <= duzina; i++){
            if(pozicija <= tijelo.rows[i].cells.length-1 && tijelo.rows[i].cells[pozicija].className === "datum zauzeta")
                return false;
        }
        return true;
    }

    function ucitajSlike(tijelo){
        var zahtjev = new XMLHttpRequest();
        zahtjev.open('GET', 'http://localhost:8080/slike');
        zahtjev.onload = function(){
            var zahtjev1 = new XMLHttpRequest();
            zahtjev1.open('GET', 'http://localhost:8080/s1');
            zahtjev1.onload = function(){
                var img = document.createElement("img");
                img.src = 'http://localhost:8080/s1';
                tijelo.appendChild(img);

                var zahtjev2 = new XMLHttpRequest();
                zahtjev2.open('GET', 'http://localhost:8080/s2');
                zahtjev2.onload = function(){
                    var img = document.createElement("img");
                    img.src = 'http://localhost:8080/s2';
                    tijelo.appendChild(img);

                    var zahtjev3 = new XMLHttpRequest();
                    zahtjev3.open('GET', 'http://localhost:8080/s3');
                    zahtjev3.onload = function(){
                        var img = document.createElement("img");
                        img.src = 'http://localhost:8080/s3';
                        tijelo.appendChild(img);
                    };
                    zahtjev3.send();
                };
                zahtjev2.send();
            };
            zahtjev1.send();
        };
        zahtjev.send();
    }

    return {
        ucitajJSON: rezervacijaLoad,
        rezervacija: rezervisanje,
        dostupnost: dostupnost,
        ucitajSlike: ucitajSlike,
        popuniSelekt: popuniSelekt,
        ponudiSale: ponudiSale,
        ucitajOsoblje: ucitajOsoblje
    }

}());


    