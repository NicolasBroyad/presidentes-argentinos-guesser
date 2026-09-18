// Fix para el 100dvh de Safari/iOS: en ciertos estados de la barra de
// direcciones (sobre todo dentro de navegadores embebidos, como el de
// WhatsApp), "100dvh" puede quedar calculado contra un alto distinto al que
// realmente se ve en pantalla, dejando el footer pegado al final de
// ".rules-section"/".modos-pantalla" sin el espacio de scroll esperado.
// En vez de confiar en la unidad CSS, medimos el alto real con JS
// (window.visualViewport, que sigue el tamaño visible actual, con
// window.innerHeight como respaldo) y lo exponemos como variable CSS: el
// css usa "calc(var(--app-vh) * 100)" como última palabra, por encima de
// los fallbacks en vh/dvh.
(function () {
    function fijarAlturaViewport() {
        var altura = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        document.documentElement.style.setProperty("--app-vh", (altura * 0.01) + "px");
    }
    fijarAlturaViewport();
    // En el primer pintado, sobre todo dentro de navegadores embebidos, el
    // motor a veces todavía no terminó de resolver el alto real visible
    // (la barra de Safari puede tardar un instante en asentarse) — una
    // segunda medición corrige ese valor inicial sin esperar a que el
    // usuario dispare un resize real. requestAnimationFrame no alcanza solo:
    // si la página carga en una pestaña en segundo plano (o precargada) el
    // navegador puede no llegar a correr ningún frame, así que el setTimeout
    // es el que garantiza la corrección pase lo que pase.
    requestAnimationFrame(fijarAlturaViewport);
    setTimeout(fijarAlturaViewport, 100);
    window.addEventListener("resize", fijarAlturaViewport);
    window.addEventListener("orientationchange", fijarAlturaViewport);
    window.addEventListener("pageshow", fijarAlturaViewport);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") fijarAlturaViewport();
    });
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", fijarAlturaViewport);
    }
})();
