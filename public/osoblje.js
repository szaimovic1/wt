window.onload = function(){
    Pozivi.ucitajOsoblje(document.getElementById("tijelo-osoblje"));
}

setInterval(function(){
    var tijelo = document.getElementById("tijelo-osoblje")
    tijelo.innerHTML = "";
    Pozivi.ucitajOsoblje(tijelo);
}, 30000);