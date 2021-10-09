window.onload = function(){
    Pozivi.ucitajJSON();
    dodajListener();
    mjesec = new Date().getMonth();
    var tijelo = document.getElementById("osobe");
    tijelo.innerHTML = "";
    Pozivi.popuniSelekt(tijelo);
    tijelo = document.getElementById("prostorije");
    tijelo.innerHTML = "";
    Pozivi.ponudiSale(tijelo);
}

function dodajListener(){
    document.querySelectorAll('#tijelo-kalendara td')
    .forEach(e => e.addEventListener("click", function(event) {
        var dan = event.target;
        var pocetak = document.getElementById("pocetak").value;
        var kraj = document.getElementById("kraj").value;
        var boks = document.getElementById("periodicna").checked;
        var moguceRezervisati = true;
        var godinaIMjesec = document.getElementById("nazivMjeseca").innerHTML
        godina = parseInt(godinaIMjesec.split(" ")[1]);
        var osoba = document.getElementById("osobe").value;
        var tijelo = document.getElementById("tijelo-kalendara");
        if(dan.innerHTML !== null && pocetak.length && kraj.length && (dan.className === "datum slobodna" || dan.className === "datum slobodna bg-info")){
            if(boks)
                moguceRezervisati = Pozivi.dostupnost(dan.innerHTML, tijelo.rows.length-1, ((new Date(godina, mjesec)).getDay()+6)%7);
            if(moguceRezervisati && confirm("Da li želite rezervisati ovaj termin?")) {
                Pozivi.rezervacija(dan.innerHTML, document.getElementById("prostorije").value, pocetak, kraj, boks, mjesec, godina, osoba, dodajListener());
            }
            else if(!moguceRezervisati) window.alert("Sala je zauzeta!");
        }
        else if(dan.innerHTML !== null && pocetak.length && kraj.length && (dan.className === "datum zauzeta" || dan.className === "datum zauzeta bg-info")){
            window.alert("Sala je zauzeta!");
        }
    })); 
}

document.getElementById("izmjena").addEventListener("change", function(){
    document.getElementById("tijelo-kalendara").innerHTML = "";
    Pozivi.ucitajJSON();
    Kalendar.iscrtajKalendar(document.getElementById("tijelo-kalendara"), mjesec);
    Kalendar.obojiZauzeca(
        document.getElementById("tijelo-kalendara"),
        mjesec,
        document.getElementById("prostorije").value,
        document.getElementById("pocetak").value,
        document.getElementById("kraj").value
    );
    dodajListener();
});

document.getElementById("sljedeciMjesec").onclick = function() {mjesec = Kalendar.sljedeciMjesec(); dodajListener()};
document.getElementById("prethodniMjesec").onclick = function() {mjesec = Kalendar.prethodniMjesec(); dodajListener()};
var mjesec;



