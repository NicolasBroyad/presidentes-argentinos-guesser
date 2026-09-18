// Fix para el 100dvh de Safari/iOS: en ciertos estados de la barra de
// direcciones (sobre todo dentro de navegadores embebidos, como el de
// WhatsApp), "100dvh" puede quedar calculado contra un alto distinto al que
// realmente se ve en pantalla, dejando el footer pegado al final de
// ".rules-section"/".modos-pantalla" sin el espacio de scroll esperado.
// En vez de confiar en la unidad CSS, medimos el alto con window.innerHeight
// y lo exponemos como variable CSS: el css usa "calc(var(--app-vh) * 100)"
// como última palabra, por encima de los fallbacks en vh/dvh.
//
// Ojo con el teclado del celular: tiene que NO afectar a esta variable. Si
// el alto siguiera al teclado, la pantalla de juego se encogería a lo que
// queda visible y el crucigrama/la sopa quedarían tapados por el header y
// el panel de pistas. Por eso no se usa visualViewport (se achica con el
// teclado) y además se ignora (a) cualquier medición con un campo enfocado
// y (b) cualquier baja brusca de alto sin cambio de ancho (un teclado saca
// como mínimo un tercio de la pantalla; las barras del navegador, mucho
// menos).
(function () {
    var anchoAnterior = window.innerWidth;
    var altoAnterior = 0;
    // En los primeros instantes la primera medición puede salir mal (y ser
    // MÁS GRANDE que la real): la corrección hacia abajo se acepta.
    var cargando = true;
    setTimeout(function () { cargando = false; }, 600);

    function hayCampoEnfocado() {
        var el = document.activeElement;
        return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    }

    function fijarAlturaViewport() {
        if (hayCampoEnfocado()) return;
        var alto = window.innerHeight;
        var ancho = window.innerWidth;
        var cambioDeOrientacion = ancho !== anchoAnterior;
        if (!cargando && !cambioDeOrientacion && altoAnterior && alto < altoAnterior * 0.75) return;
        anchoAnterior = ancho;
        altoAnterior = alto;
        document.documentElement.style.setProperty("--app-vh", (alto * 0.01) + "px");
    }

    fijarAlturaViewport();
    // En el primer pintado el motor a veces todavía no terminó de resolver
    // el alto real visible — una segunda medición lo corrige. El setTimeout
    // garantiza esa corrección incluso si el navegador no corre frames
    // (pestaña en segundo plano), donde requestAnimationFrame no dispara.
    requestAnimationFrame(fijarAlturaViewport);
    setTimeout(fijarAlturaViewport, 100);
    window.addEventListener("resize", fijarAlturaViewport);
    window.addEventListener("orientationchange", fijarAlturaViewport);
    window.addEventListener("pageshow", fijarAlturaViewport);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") fijarAlturaViewport();
    });
})();
