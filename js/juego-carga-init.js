// Al llegar a index.html con "?...&accion=jugar" (el botón "Jugar" del modal
// de "Ver modos de juego") el juego arranca recién al final de todo el
// script.js, así que sin esto se alcanza a ver la pantalla de inicio durante
// unos milisegundos antes de que la partida la reemplace. Oculta la página
// entera apenas se sabe (antes del primer pintado, igual que theme-init.js
// con el tema) y script.js la vuelve a mostrar recién cuando el juego ya
// está armado.
(function () {
    try {
        if (new URLSearchParams(window.location.search).get("accion") === "jugar") {
            document.documentElement.setAttribute("data-cargando-juego", "");
        }
    } catch (e) {}
})();
