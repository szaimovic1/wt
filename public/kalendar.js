let Kalendar = (function(){
    
    let trenutniDatum = new Date();
    let trenutniMjesec = trenutniDatum.getMonth();
    let godina = trenutniDatum.getFullYear();
    let nazivMjeseca = document.getElementById("nazivMjeseca");
    let mjeseci = ["Januar", "Februar", "Mart", "April", "Maj", "Juni", "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"];
    iscrtajKalendarImpl(document.getElementById("tijelo-kalendara"), trenutniMjesec);       
    
    let zauzecaPeriodicna = new Array();
    let zauzecaVanredna = new Array();
    //ucitajPodatkeImpl(periodicna, vanredna);

    function obojiZauzecaImpl(kalendarRef, mjesec, sala, pocetak, kraj){
        iscrtajKalendarImpl(kalendarRef, mjesec);
        let prviDan = ((new Date(godina, mjesec)).getDay()+6)%7;
        let duzina = zauzecaPeriodicna.length;
        let k;
        let brojDana = 32 - new Date(godina, mjesec, 32).getDate();

        //console.log(mjesec + "\n");

        if(duzina){
            for(let i=0; i<duzina; i++)
            if((((mjesec >= 9 && mjesec <=11) || mjesec === 0) && zauzecaPeriodicna[i].semestar === "zimski")
               || (mjesec >= 1 && mjesec <=5 && zauzecaPeriodicna[i].semestar === "ljetni"))
                if(sala === zauzecaPeriodicna[i].naziv && slobodnoVrijeme(zauzecaPeriodicna[i].pocetak, pocetak, zauzecaPeriodicna[i].kraj, kraj))
                    for(let j=0; j<kalendarRef.rows.length; j++)
                        if(kalendarRef.rows[j].cells.length-1 >= zauzecaPeriodicna[i].dan && kalendarRef.rows[j].cells[zauzecaPeriodicna[i].dan] != ""){

                            //console.log(j + " " + zauzecaPeriodicna[i].dan );

                            kalendarRef.rows[j].cells[zauzecaPeriodicna[i].dan].className = "datum zauzeta";
                        }
                            
        }   

        if(zauzecaVanredna.length){
            for(let i=0; i<zauzecaVanredna.length; i++){
                let brojac = 0;
                if(parseInt((zauzecaVanredna[i].datum).substr(3,2)) === (mjesec+1) && (zauzecaVanredna[i].datum).substr(6,4) === godina.toString()
                && zauzecaVanredna[i].naziv === sala && slobodnoVrijeme(zauzecaVanredna[i].pocetak, pocetak, zauzecaVanredna[i].kraj, kraj))
                for(let j=0; j<kalendarRef.rows.length-1; j++){
                     if(j === 0)
                         k = prviDan-1;
                    else k = 0;
                    for(; k<7; k++){
                        if(brojac === parseInt((zauzecaVanredna[i].datum).substr(0, 2))){
                            kalendarRef.rows[j].cells[k].className = "datum zauzeta";
                            j = kalendarRef.rows.length;
                        }
                        brojac++;
                    }       
                }
            }

            //console.log("zanima me");

        }
        //return mjesec;
    }

    /*function slobodnoVrijeme(pocetak1, pocetak2, kraj1, kraj2){
            if(pocetak2.length && kraj2.length){
                if(pocetak1 >= pocetak2 && kraj1 <= kraj2)
                    return true;
                else if(pocetak1 <= pocetak2 && kraj1 >= kraj2)
                    return true;
                else if(kraj1 >= pocetak2 && kraj1 <= kraj2)
                    return true;
                else if(pocetak1 >= pocetak2 && pocetak1 <= kraj2)
                    return true;
            }    
            return false;
    }*/

    function slobodnoVrijeme(pocetak2, pocetak1, kraj2, kraj1){
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

    function ucitajPodatkeImpl(periodicna, vanredna){
        zauzecaPeriodicna = [];
        zauzecaVanredna = [];
        let duzina = periodicna.length;
        for(let i=0; i<duzina; i++){
            zauzecaPeriodicna.push(new Object());
            zauzecaPeriodicna[i] = periodicna[i];
        }
        duzina = vanredna.length;
        for(let i=0; i<duzina; i++){
            zauzecaVanredna.push(new Object());
            zauzecaVanredna[i] = vanredna[i];
        }
    }

    function iscrtajKalendarImpl(kalendarRef, mjesec){
        let prviDan = ((new Date(godina, mjesec)).getDay()+6)%7;
        let brojDana = 32 - new Date(godina, mjesec, 32).getDate();
        kalendarRef.innerHTML = "";
        nazivMjeseca.innerHTML = mjeseci[mjesec] + " " + godina;
        let dan = 1;
        for (let i = 0; i < 6; i++) {
            let row = document.createElement("tr");
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < prviDan) {
                    let cell = document.createElement("td");
                    let cellText = document.createTextNode("");
                    cell.appendChild(cellText);
                    row.appendChild(cell);
                }
                else if (dan > brojDana) {
                    break;
                }
                else {
                    let cell = document.createElement("td");
                    cell.className = "datum slobodna";
                    let cellText = document.createTextNode(dan);
                    if (dan === trenutniDatum.getDate() && godina === trenutniDatum.getFullYear() && mjesec === trenutniDatum.getMonth()) {
                        cell.classList.add("bg-info");
                    } 
                    cell.appendChild(cellText);
                    row.appendChild(cell);
                    dan++;
                }
            }
            kalendarRef.appendChild(row); 
            
        }
    }

    function sljedeciMjesecImpl(){
        if(godina === 2020)
            godina = (trenutniMjesec === 11) ? godina : godina;
        else if(godina === 2019){
            godina = (trenutniMjesec === 11) ? godina+1 : godina;
            if(trenutniMjesec === 11) trenutniMjesec = -1;
        }
        if(trenutniMjesec < 11)
            trenutniMjesec++;
        obojiZauzecaImpl(document.getElementById("tijelo-kalendara"), trenutniMjesec, document.getElementById("prostorije").value, 
        document.getElementById("pocetak").value, document.getElementById("kraj").value);

        //console.log("RETUUURN");

        return trenutniMjesec;
    }
    
    function prethodniMjesecImpl() {
        if(godina === 2019)
            godina = (trenutniMjesec === 0) ? godina : godina;
        else if(godina === 2020){
            godina = (trenutniMjesec === 0) ? godina-1 : godina;
            if(trenutniMjesec === 0) trenutniMjesec = 12;
        }
        if(trenutniMjesec > 0)
            trenutniMjesec--;
        obojiZauzecaImpl(document.getElementById("tijelo-kalendara"), trenutniMjesec, document.getElementById("prostorije").value, 
        document.getElementById("pocetak").value, document.getElementById("kraj").value);
        return trenutniMjesec;
    }

   

    return {
        obojiZauzeca: obojiZauzecaImpl,
        ucitajPodatke: ucitajPodatkeImpl, 
        iscrtajKalendar: iscrtajKalendarImpl,
        sljedeciMjesec: sljedeciMjesecImpl,
        prethodniMjesec: prethodniMjesecImpl,
        slobodnoVrijeme: slobodnoVrijeme
    }
}());

//exports.slobodnoVrijeme = Kalendar.slobodnoVrijeme;
    