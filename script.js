
let buttonSection = document.querySelector(".button-section");
let body = document.querySelector("body");
body.addEventListener("click", function(event){
    if(event.target.className === "iniciar-juego-button"){
        buttonSection.innerHTML = "<h2>Juego iniciado</h2>";
    }
});