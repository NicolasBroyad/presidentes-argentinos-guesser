document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const body = document.querySelector("body");
    const heroContent = document.querySelector(".hero-content");
    const botonIniciar = document.querySelector(".iniciar-juego-button");
    const main = document.querySelector(".main");

    // --- Sonido de acierto ---
    // Archivo de audio (correct.mp3). Se llama a reproducirSonidoAcierto()
    // desde cada modo de juego (clásico, imagen, sopa de letras, crucigrama)
    // justo cuando se confirma una respuesta correcta.
    const SONIDO_ACIERTO_KEY = "pag-sonido-acierto";
    let sonidoAciertoActivado = localStorage.getItem(SONIDO_ACIERTO_KEY) !== "off";

    function reproducirSonidoAcierto() {
        if (!sonidoAciertoActivado) return;
        try {
            const audio = new Audio("audio/correct.mp3");
            audio.play().catch(() => {}); // autoplay bloqueado, modo privado, etc.
        } catch (e) {
            // Audio no disponible en este navegador: fallamos en silencio.
        }
    }

    // --- Sonido de click de botón ---
    // Archivo de audio (sonido-boton.wav) para "Iniciar Juego" y el botón
    // que abre/cierra el selector de modo. Es WAV (no MP3) a propósito: en
    // un clip tan corto, el "priming delay" que agrega el encoder MP3 al
    // principio del archivo (unos ms de silencio de por sí, propios del
    // formato) se nota como un delay al tocar el botón. WAV no tiene ese
    // problema. Respeta el mismo mute que el sonido de acierto (un solo
    // botón de "silenciar sonido" para todo el sitio).
    function reproducirSonidoBoton() {
        if (!sonidoAciertoActivado) return;
        try {
            const audio = new Audio("audio/sonido-boton.wav");
            audio.play().catch(() => {}); // autoplay bloqueado, modo privado, etc.
        } catch (e) {
            // Audio no disponible en este navegador: fallamos en silencio.
        }
    }

    // Sopa de letras y Crucigrama no tienen nada configurable (el desafío
    // del día es fijo para todos), así que la rosquita de "Configurar" no
    // se muestra para esos modos, ni en el inicio ni en el modal de
    // "Ver modos de juego".
    function modoTieneConfiguracion(modo) {
        return modo !== "sopa" && modo !== "crucigrama";
    }

    // Cuando "Configurar" se toca desde el modal de vista previa de "Ver
    // modos de juego", al cerrar #configDialog (Guardar o Cancelar) hay que
    // volver a ese modal en vez de dejar todo cerrado. cerrarConfig() (más
    // abajo) se fija en estas dos variables, seteadas por el bloque del
    // modal a continuación.
    let modoModalPendienteTrasConfig = null;
    let mostrarModoModalRef = null;

    // --- Modal de vista previa en "Ver modos de juego" (modos.html) ---
    // Al tocar una tarjeta de modo, en vez de navegar directo a index.html
    // se abre un modal con ese modo y dos acciones: "Jugar" (navega a
    // index.html y arranca la partida al toque) y "Configurar" (abre el
    // mismo diálogo de configuración que existe en el inicio, PERO sin salir
    // de esta página — modos.html tiene su propia copia de #configDialog,
    // que script.js maneja igual que la del inicio).
    const modoModal = document.getElementById("modoModal");
    if (modoModal) {
        const modoModalIcono = document.getElementById("modoModalIcono");
        const modoModalTitulo = document.getElementById("modoModalTitulo");
        const modoModalDescripcion = document.getElementById("modoModalDescripcion");
        const modoModalJugar = document.getElementById("modoModalJugar");
        const modoModalConfigurar = document.getElementById("modoModalConfigurar");
        const modoModalCerrar = document.getElementById("modoModalCerrar");
        let modoElegidoEnModal = null;

        // Si el título (la placa dorada) no entra en una sola línea, se va
        // achicando la fuente hasta que entre (mismo truco que
        // ajustarBadgeModoAlAncho para el badge "JUGANDO MODO X"). Ojo: NO
        // comparamos contra el clientWidth de la propia placa (columna del
        // grid con minmax(0, auto)) porque, recién mostrado el modal, ese
        // ancho todavía no está resuelto y da valores erróneos (mucho más
        // chicos que el real). En cambio, calculamos el ancho disponible a
        // partir del de toda la fila (una caja simple, sin sizing
        // intrínseco raro), que sí es correcto desde el primer momento.
        function ajustarModoModalTitulo() {
            const placa = modoModalTitulo.querySelector(".modo-de-juego-seleccionado");
            const fila = modoModal.querySelector(".modo-modal-fila-titulo");
            if (!placa || !fila) return;
            placa.style.fontSize = "";
            const gearVisible = modoModalConfigurar && modoModalConfigurar.style.display !== "none";
            const anchoGear = gearVisible ? modoModalConfigurar.offsetWidth + 8 : 0;
            const disponible = fila.clientWidth - anchoGear * 2; // la columna vacía de la izquierda espeja el ancho de la rosquita
            const pisoPx = 12;
            let tamanioPx = parseFloat(getComputedStyle(placa).fontSize);
            let intentos = 0;
            while (placa.scrollWidth > disponible && tamanioPx > pisoPx && intentos < 30) {
                tamanioPx -= 1;
                placa.style.fontSize = tamanioPx + "px";
                intentos++;
            }
        }

        function mostrarModoModal(modo) {
            const card = document.querySelector(`.modo-card[data-modo="${modo}"]`);
            if (!card) return;
            modoElegidoEnModal = modo;
            const icono = card.querySelector(".modo-card-icono");
            // Solo la imagen/svg del ícono, no ".modo-card-icono" entero: ese
            // contenedor puede traer también la insignia de "nueva"/tick de
            // los modos diarios (ver actualizarEstadoDiarioEnTarjetas), que
            // en la card tiene su propio posicionamiento relativo al ícono
            // pero acá adentro del modal queda mal ubicada — y total ya se ve
            // en la card de atrás, no hace falta repetirla en el modal.
            const iconoImagen = icono ? icono.querySelector("img, svg") : null;
            const titulo = card.querySelector(".modo-de-juego-seleccionado");
            const descripcion = card.querySelector(".modo-card-texto p");
            if (modoModalIcono && iconoImagen) modoModalIcono.innerHTML = iconoImagen.outerHTML;
            if (modoModalTitulo && titulo) modoModalTitulo.innerHTML = titulo.outerHTML;
            if (modoModalDescripcion && descripcion) modoModalDescripcion.textContent = descripcion.textContent;
            if (modoModalConfigurar) {
                modoModalConfigurar.style.display = modoTieneConfiguracion(modo) ? "" : "none";
            }
            modoModal.showModal();
            // Justo después de showModal() el layout del <dialog> (que se
            // pinta en el "top layer") todavía no está estabilizado: medir
            // el ancho acá mismo puede dar valores erróneos (de hecho, mucho
            // más chicos de lo real) y terminar recortando el texto en vez
            // de achicarlo. Se reintenta unas cuantas veces (setTimeout, no
            // requestAnimationFrame: éste se pausa del todo si la pestaña
            // queda en segundo plano) para asegurar que corra ya con el
            // layout estable.
            ajustarModoModalTitulo();
            [0, 50, 150].forEach(ms => setTimeout(ajustarModoModalTitulo, ms));
        }
        mostrarModoModalRef = mostrarModoModal;

        document.querySelectorAll(".modo-card").forEach(card => {
            card.addEventListener("click", (e) => {
                e.preventDefault();
                reproducirSonidoBoton();
                mostrarModoModal(card.dataset.modo);
            });
        });

        if (modoModalJugar) {
            modoModalJugar.addEventListener("click", () => {
                reproducirSonidoBoton();
                if (modoElegidoEnModal) window.location.href = `index.html?modo=${modoElegidoEnModal}&accion=jugar`;
            });
        }
        if (modoModalConfigurar) {
            modoModalConfigurar.addEventListener("click", () => {
                reproducirSonidoBoton();
                if (!modoElegidoEnModal) return;
                seleccionarModo(modoElegidoEnModal);
                modoModalPendienteTrasConfig = modoElegidoEnModal;
                modoModal.close();
                abrirConfig();
            });
        }
        if (modoModalCerrar) {
            modoModalCerrar.addEventListener("click", () => modoModal.close());
        }
        modoModal.addEventListener("click", (e) => {
            if (e.target === modoModal) modoModal.close(); // click fuera de la tarjeta
        });
        window.addEventListener("resize", ajustarModoModalTitulo);
        // La reapertura al guardar/cancelar la vuelve a mostrar cerrarConfig()
        // (ver más abajo), usando modoModalPendienteTrasConfig/mostrarModoModalRef.
    }

    // En el header compacto de mobile durante la partida, el badge "JUGANDO
    // MODO X" tiene que entrar completo (no se corta ni se oculta el
    // prefijo): si el texto no entra en el ancho disponible, se va achicando
    // la fuente de a poco hasta que entre, con un piso legible.
    //
    // "última" recuerda con qué ancho y texto se calculó la última vez: en
    // mobile, scrollear hace que el navegador esconda/muestre la barra de
    // direcciones, y eso dispara "resize" (cambia el alto, no el ancho) una
    // y otra vez mientras se scrollea. Sin este chequeo, cada uno de esos
    // resize de mentira volvía a sacar y poner la clase "--recortada" más
    // abajo — y sacar/poner una clase con una animación CSS la reinicia
    // desde 0%, así que el cartel nunca llegaba a moverse: quedaba
    // eternamente reiniciado en el primer frame, viéndose quieto.
    let ultimoAjusteBadgeModo = null; // { ancho, texto }
    function ajustarBadgeModoAlAncho() {
        const heading = document.querySelector(".jugando-modo-heading");
        if (!heading) return;
        const textoModo = heading.querySelector(".modo-de-juego-seleccionado-texto");
        const anchoActual = window.innerWidth;
        const textoActual = textoModo ? textoModo.textContent : "";
        if (
            ultimoAjusteBadgeModo &&
            ultimoAjusteBadgeModo.ancho === anchoActual &&
            ultimoAjusteBadgeModo.texto === textoActual
        ) {
            return; // ni el ancho ni el modo cambiaron: no tocar nada (no reiniciar el cartel)
        }
        ultimoAjusteBadgeModo = { ancho: anchoActual, texto: textoActual };

        // Se saca antes de medir: mientras esté presente, la placa del modo
        // tiene min-width:0 + overflow propio (ver CSS) y su sola presencia
        // hace que el flex-shrink absorba cualquier desborde en el layout
        // SIN que heading.scrollWidth llegue a superar a heading.clientWidth
        // — o sea, con la clase puesta el chequeo de abajo nunca detecta
        // nada para achicar, aunque la placa haya quedado carcomida a un
        // par de píxeles. Por eso el estado "recortada" se decide recién al
        // final, una vez confirmado que ni el piso de fuente alcanza.
        heading.classList.remove("jugando-modo-heading--recortada");
        heading.style.fontSize = ""; // vuelve al tamaño base definido en CSS
        if (!window.matchMedia("(max-width: 768px)").matches) return;
        const pisoPx = 9;
        let tamanioPx = parseFloat(getComputedStyle(heading).fontSize);
        while (heading.scrollWidth > heading.clientWidth + 1 && tamanioPx > pisoPx) {
            tamanioPx -= 1;
            heading.style.fontSize = tamanioPx + "px";
        }
        // Último recurso: ni siquiera en el piso entra completo (nombre de
        // modo largo, ej. "CRUCIGRAMA", en un celular angosto). En vez de
        // dejar que el "overflow:hidden" del heading corte la placa del
        // modo a la mitad y pegada al borde (sin su padding ni sus bordes
        // redondeados), se le cede el desborde a la placa, que pasa a
        // mostrar el nombre completo como un cartel: el texto se desliza
        // de derecha a izquierda hasta mostrarlo entero y vuelve a arrancar,
        // en vez de cortarlo con "…".
        if (heading.scrollWidth > heading.clientWidth + 1) {
            heading.classList.add("jugando-modo-heading--recortada");
            const placa = heading.querySelector(".modo-de-juego-seleccionado");
            const texto = placa ? placa.querySelector(".modo-de-juego-seleccionado-texto") : null;
            if (placa && texto) {
                // Cuánto le sobra el texto por afuera del borde derecho
                // VISIBLE de la placa: medido en píxeles de pantalla (no con
                // scrollWidth/clientWidth) porque esos dos no cuentan el
                // padding izquierdo de la placa, donde arranca el texto —
                // restando solo scrollWidth-clientWidth el cartel se quedaba
                // corto exactamente por ese padding y nunca llegaba a
                // mostrar la última letra.
                //
                // Se le resta el padding derecho de la placa: sin esto, el
                // desplazamiento deja la última letra pegada justo al borde
                // (0 de aire), mientras que el arranque del cartel sí tiene
                // ese mismo padding a la derecha (es parte de la placa
                // siempre). Restándolo, el final del recorrido deja el mismo
                // margen que tenía al principio, en vez de "pasarse de largo".
                const paddingDerechoPlaca = parseFloat(getComputedStyle(placa).paddingRight) || 0;
                const desborde = Math.max(
                    0,
                    texto.getBoundingClientRect().right - placa.getBoundingClientRect().right + paddingDerechoPlaca
                );
                texto.style.setProperty("--desplazamiento-texto", desborde + "px");
                fijarTiemposCartelModo(texto, desborde);
            }
        }
    }
    window.addEventListener("resize", ajustarBadgeModoAlAncho);
    // La tipografía (Cinzel, vía @import de Google Fonts) carga en forma
    // asíncrona: si el modo arranca antes de que esté lista, esta función
    // mide con la fuente de reemplazo (más angosta) y el desplazamiento del
    // cartel queda corto para el ancho real de Cinzel — se ve el texto
    // "recortado" quedándose corto de nuevo, ahora por muy poco, al llegar
    // al final. "ultimoAjusteBadgeModo = null" fuerza el recálculo aunque
    // el ancho y el texto sean los mismos que la vez anterior (si no, el
    // chequeo para no reiniciar el cartel de la función de arriba
    // bloquearía esta segunda pasada).
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            ultimoAjusteBadgeModo = null;
            ajustarBadgeModoAlAncho();
        });
    }

    // El cartel del nombre de modo recortado (ver ajustarBadgeModoAlAncho)
    // necesita una pausa de verdad (en segundos) al principio y al final,
    // no un simple porcentaje del ciclo — con un desborde chico, un 12%
    // fijo de una duración corta daba una pausa casi nula. Para eso el
    // @keyframes no puede ser estático en el CSS: se genera acá, con los
    // puntos de pausa calculados a partir de la duración real del ciclo.
    let hojaEstiloCartelModo = null;
    function fijarTiemposCartelModo(texto, desborde) {
        const VELOCIDAD_PX_POR_SEG = 16; // lento, para poder leer mientras se desliza
        const PAUSA_INICIO_SEG = 1;
        const PAUSA_FIN_SEG = 1.8;
        const tiempoDeslizamiento = Math.max(0.8, desborde / VELOCIDAD_PX_POR_SEG);
        const duracionTotal = PAUSA_INICIO_SEG + tiempoDeslizamiento + PAUSA_FIN_SEG;
        texto.style.setProperty("--duracion-cartel", duracionTotal + "s");

        const pctInicio = (PAUSA_INICIO_SEG / duracionTotal) * 100;
        const pctFin = 100 - (PAUSA_FIN_SEG / duracionTotal) * 100;

        if (!hojaEstiloCartelModo) {
            hojaEstiloCartelModo = document.createElement("style");
            document.head.appendChild(hojaEstiloCartelModo);
        }
        hojaEstiloCartelModo.textContent = `
            @keyframes cartel-modo-recortado {
                0%, ${pctInicio}% { transform: translateX(0); }
                ${pctFin}%, 100% { transform: translateX(calc(-1 * var(--desplazamiento-texto, 0px))); }
            }
        `;
    }

    const botonSonido = document.querySelector(".sonido-toggle");
    const iconoSonidoOn = `<svg class="sonido-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Silenciar sonido</title><path d="M3,9V15H7L12,20V4L7,9H3Z" /><path d="M16,8.5C17,9.5 17,14.5 16,15.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /><path d="M18.5,6C20.5,8.5 20.5,15.5 18.5,18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>`;
    const iconoSonidoOff = `<svg class="sonido-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Activar sonido</title><path d="M3,9V15H7L12,20V4L7,9H3Z" /><path d="M16.5,9.5L20.5,13.5M20.5,9.5L16.5,13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>`;

    function actualizarBotonSonido() {
        if (!botonSonido) return;
        botonSonido.innerHTML = sonidoAciertoActivado ? iconoSonidoOn : iconoSonidoOff;
        botonSonido.setAttribute("aria-label", sonidoAciertoActivado ? "Silenciar sonido" : "Activar sonido");
    }

    if (botonSonido) {
        actualizarBotonSonido();
        botonSonido.addEventListener("click", () => {
            sonidoAciertoActivado = !sonidoAciertoActivado;
            localStorage.setItem(SONIDO_ACIERTO_KEY, sonidoAciertoActivado ? "on" : "off");
            actualizarBotonSonido();
            if (sonidoAciertoActivado) reproducirSonidoBoton();
        });
    }

    // --- Estado de configuración por defecto ---
    // Se guarda en localStorage: configurar un modo desde el modal de "Ver
    // modos de juego" y despues tocar "Jugar" navega a index.html, que es
    // una carga de página nueva (JS desde cero). Sin persistir esto, esa
    // configuración se perdía apenas se navegaba y "Jugar" arrancaba
    // siempre con los valores por defecto.
    const CONFIG_JUEGO_LS_KEY = "pag-configuracion-juego";
    const CONFIG_JUEGO_DEFAULT = {
        tiempo: 10, // minutos (modo clásico)
        tiempoImagen: 2, // minutos (modo "Adivina la imagen")
        eliminarDeFacto: false, // solo modo clásico
        eliminarInterinosClasico: false, // solo modo clásico
        // El filtro de "gobiernos de menos de 1 año" tiene un default distinto
        // por modo: en clásico se incluyen (como siempre). En "Adivina la
        // imagen" este checkbox ya no se usa fuera del modo "custom" del
        // filtro (ver filtroImagenModo más abajo): el default ahí es la
        // lista de exclusión fija, no este checkbox.
        eliminarMenosDeUnAnioClasico: false,
        eliminarMenosDeUnAnioImagen: false,
        eliminarMenosDeUnAnioSopa: true,
        tiempoSopa: 4, // minutos (modo "Sopa de letras")
        cantidad: 10, // presidentes por partida (solo modo "Adivina la imagen")
        // --- Filtro de "Adivina la imagen" (independiente del de clásico) ---
        // "default": lista de exclusión fija (APELLIDOS_EXCLUSION_FIJA) —
        // opción recomendada, la que viene activada de entrada.
        // "todas": sin ningún filtro, entran todos los presidentes.
        // "custom": se combinan eliminarDeFactoImagen / eliminarMenosDeUnAnioImagen
        // / eliminarInterinosImagen, cada uno independiente y combinable.
        filtroImagenModo: "default",
        eliminarDeFactoImagen: false,
        eliminarInterinosImagen: false
    };
    function cargarConfiguracionGuardada() {
        try {
            const guardada = JSON.parse(localStorage.getItem(CONFIG_JUEGO_LS_KEY));
            if (guardada && typeof guardada === "object") {
                return { ...CONFIG_JUEGO_DEFAULT, ...guardada };
            }
        } catch (e) { /* localStorage no disponible, JSON corrupto, etc. */ }
        return { ...CONFIG_JUEGO_DEFAULT };
    }
    let configuracionJuego = cargarConfiguracionGuardada();

    let configuracionTemporal = {}; // Para snapshot temporal al abrir modal

    // Modo elegido en la pantalla de inicio y modo que se está jugando.
    let modoSeleccionado = 'clasico'; // 'clasico' | 'imagen'
    let modoActual = 'clasico';

    // Logos de cada modo (los mismos SVG que los iconos de la sección
    // "Modos de juego"): representan de forma ultra simplificada lo que se
    // ve en pantalla al jugar ese modo. Heredan el celeste del tema vía
    // rgb(var(--blue-strong)), así funcionan en oscuro y en claro.
    const logoModo = {
        clasico: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="rgb(var(--blue-strong))"><circle cx="8.6" cy="17.2" r="8.6"/><rect x="25" y="8.6" width="75" height="17.2" rx="5.2"/><circle cx="8.6" cy="50" r="8.6"/><rect x="25" y="41.4" width="75" height="17.2" rx="5.2"/></g><rect x="25" y="74.2" width="75" height="17.2" rx="5.2" fill="rgb(var(--blue-strong))" fill-opacity="0.22"/><circle cx="8.6" cy="82.8" r="6.5" fill="none" stroke="rgb(var(--blue-strong))" stroke-width="3.6" opacity="0.55"/><rect x="30.3" y="77.4" width="3.6" height="11" rx="1.8" fill="rgb(var(--blue-strong))" opacity="0.85"/><g fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.4 17.2 L7.6 20.6 L13 12.8"/><path d="M4.4 50 L7.6 53.4 L13 45.6"/></g></svg>`,
        imagen: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="15" y="4" width="70" height="67" rx="11" fill="rgb(var(--blue-strong))" fill-opacity="0.22"/><g fill="rgb(var(--blue-strong))"><circle cx="50" cy="30.5" r="11.5"/><path d="M28 71V60a22 22 0 0 1 44 0v11z"/></g><rect x="15" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--gold))"/><rect x="34" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--blue-strong))" fill-opacity="0.34"/><rect x="53" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--blue-strong))" fill-opacity="0.34"/><rect x="71.3" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--blue-strong))" fill-opacity="0.34"/></svg>`,
        sopa: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="rgb(var(--blue-strong))" fill-opacity="0.34"><rect x="0" y="0" width="16" height="16" rx="3"/><rect x="21" y="0" width="16" height="16" rx="3"/><rect x="42" y="0" width="16" height="16" rx="3"/><rect x="63" y="0" width="16" height="16" rx="3"/><rect x="84" y="0" width="16" height="16" rx="3"/><rect x="21" y="21" width="16" height="16" rx="3"/><rect x="42" y="21" width="16" height="16" rx="3"/><rect x="63" y="21" width="16" height="16" rx="3"/><rect x="84" y="21" width="16" height="16" rx="3"/><rect x="0" y="42" width="16" height="16" rx="3"/><rect x="42" y="42" width="16" height="16" rx="3"/><rect x="63" y="42" width="16" height="16" rx="3"/><rect x="84" y="42" width="16" height="16" rx="3"/><rect x="0" y="63" width="16" height="16" rx="3"/><rect x="21" y="63" width="16" height="16" rx="3"/><rect x="63" y="63" width="16" height="16" rx="3"/><rect x="84" y="63" width="16" height="16" rx="3"/><rect x="0" y="84" width="16" height="16" rx="3"/><rect x="21" y="84" width="16" height="16" rx="3"/><rect x="42" y="84" width="16" height="16" rx="3"/><rect x="84" y="84" width="16" height="16" rx="3"/></g><g fill="#a78bfa"><rect x="0" y="21" width="16" height="16" rx="3"/><rect x="21" y="42" width="16" height="16" rx="3"/><rect x="42" y="63" width="16" height="16" rx="3"/><rect x="63" y="84" width="16" height="16" rx="3"/></g></svg>`,
        crucigrama: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="rgb(var(--blue-strong))" fill-opacity="0.34"><rect x="21" y="0" width="16" height="16" rx="3"/><rect x="63" y="0" width="16" height="16" rx="3"/><rect x="21" y="42" width="16" height="16" rx="3"/><rect x="63" y="42" width="16" height="16" rx="3"/><rect x="0" y="63" width="16" height="16" rx="3"/><rect x="21" y="63" width="16" height="16" rx="3"/><rect x="42" y="63" width="16" height="16" rx="3"/><rect x="63" y="63" width="16" height="16" rx="3"/><rect x="21" y="84" width="16" height="16" rx="3"/><rect x="63" y="84" width="16" height="16" rx="3"/></g><g fill="#8fd6a8"><rect x="0" y="21" width="16" height="16" rx="3"/><rect x="21" y="21" width="16" height="16" rx="3"/><rect x="42" y="21" width="16" height="16" rx="3"/><rect x="63" y="21" width="16" height="16" rx="3"/><rect x="84" y="21" width="16" height="16" rx="3"/></g></svg>`
    };

    const MODOS = {
        clasico: {
            badge: 'CLÁSICO',
            nombre: 'Clásico',
            descripcion: 'Escribí los apellidos de todos los presidentes que puedas antes de que se termine el tiempo.'
        },
        imagen: {
            badge: 'ADIVINA LA IMAGEN',
            nombre: 'Adiviná la imagen',
            descripcion: 'Reconocé a los presidentes de las imágenes y escribí sus apellidos, antes de que se termine el tiempo.'
        },
        sopa: {
            badge: 'SOPA DE LETRAS',
            nombre: 'Sopa de letras',
            descripcion: 'Marcá en la grilla los apellidos de presidentes escondidos, guiándote por las imágenes y los años de mandato.',
            // Textos del estado del desafío diario en la tarjeta del inicio
            // (ver actualizarEstadoDiarioEnTarjetas): femenino, "la sopa".
            etiquetaNuevo: 'NUEVA',
            textoPendiente: 'No resuelta',
            textoResuelto: 'Resuelta',
            textoProxima: 'próxima en'
        },
        crucigrama: {
            badge: 'CRUCIGRAMA',
            nombre: 'Crucigrama',
            descripcion: 'Completá las filas y columnas con apellidos de presidentes argentinos, guiándote por las pistas.',
            // Masculino: "el crucigrama".
            etiquetaNuevo: 'NUEVO',
            textoPendiente: 'No resuelto',
            textoResuelto: 'Resuelto',
            textoProxima: 'próximo en'
        }
    };

    // Permite llegar a la pantalla de inicio con un modo ya elegido desde
    // otra página (ej. "Ver modos de juego" linkea a index.html?modo=sopa),
    // y opcionalmente actuar directo sobre ese modo: "jugar" arranca la
    // partida al toque, "configurar" abre el diálogo de configuración.
    const paramsUrl = new URLSearchParams(window.location.search);
    const modoDesdeUrl = paramsUrl.get("modo");
    const accionDesdeUrl = paramsUrl.get("accion");
    if (modoDesdeUrl && MODOS[modoDesdeUrl]) {
        modoSeleccionado = modoDesdeUrl;
    }

    // El botón "volver" del header (solo visible durante una partida, ver
    // ".volver-atras-juego" en el CSS) vuelve a donde se empezó a jugar:
    // "?modo=X&accion=jugar" es justo la marca que deja el botón "Jugar"
    // del modal de "Ver modos de juego" al navegar acá, así que es la
    // única señal que distingue "vine de ahí" de "arranqué desde el inicio".
    const volverA = accionDesdeUrl === "jugar" ? "modos.html" : "index.html";
    const botonVolverAtrasJuego = document.querySelector(".volver-atras-juego");
    if (botonVolverAtrasJuego) {
        botonVolverAtrasJuego.addEventListener("click", () => {
            reproducirSonidoBoton();
            // Al volver al inicio (no a "Ver modos de juego"), lleva el modo
            // que se estaba jugando en la URL para que el carrusel del
            // inicio arranque en ese mismo modo (si no, seleccionarModo()
            // siempre arranca en "clasico", el default).
            window.location.href = volverA === "index.html" ? `index.html?modo=${modoActual}` : volverA;
        });
    }

    const botonesModo = document.querySelectorAll(".modo-de-juego-button");

    // --- Elementos del modal ---
    const slider = document.getElementById("sliderTiempo");
    const valorRango = document.getElementById("valorRango");
    const sliderCantidad = document.getElementById("sliderCantidad");
    const valorCantidad = document.getElementById("valorCantidad");
    const contenedorTemporizador = document.querySelector(".configuracion-temporizador-container");
    const contenedorCantidad = document.querySelector(".configuracion-cantidad-container");
    const contenedorFiltrosClasico = document.getElementById("filtrosClasico");
    const contenedorFiltrosImagen = document.getElementById("filtrosImagen");
    const botonGuardar = document.querySelector(".guardar");
    const botonCancelar = document.querySelector(".cancelar");
    // Checkboxes del filtro de "Clásico" (el único que sigue funcionando
    // como antes: checkboxes simples, sin exclusividad entre ellos).
    const checkboxDeFactoClasico = document.getElementById("checkboxDeFactoClasico");
    const checkboxCortosClasico = document.getElementById("checkboxCortosClasico");
    const checkboxInterinosClasico = document.getElementById("checkboxInterinosClasico");
    // Filtro de "Adiviná la imagen": dos radios mutuamente excluyentes
    // ("default"/"todas", más un tercer radio oculto "custom" que se activa
    // solo, en código, cuando se toca cualquiera de los tres checkboxes
    // combinables) — ver aplicarExclusividadFiltroImagen() más abajo.
    const radioImgDefecto = document.getElementById("radioImgDefecto");
    const radioImgTodas = document.getElementById("radioImgTodas");
    const radioImgCustom = document.getElementById("radioImgCustom");
    const checkboxImgDeFacto = document.getElementById("checkboxImgDeFacto");
    const checkboxImgCortos = document.getElementById("checkboxImgCortos");
    const checkboxImgInterinos = document.getElementById("checkboxImgInterinos");
    const checkboxesImgCombinables = [checkboxImgDeFacto, checkboxImgCortos, checkboxImgInterinos].filter(Boolean);

    // Inicializar valores de los sliders inmediatamente
    if (valorRango && slider) {
        valorRango.textContent = slider.value + " minutos";
    }
    if (valorCantidad && sliderCantidad) {
        valorCantidad.textContent = sliderCantidad.value + " presidentes";
    }

    // --- Íconos ---
    const iconoPausa = `
        <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(10, 34, 53)"><title>Pausar</title>
        <path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>`;

    const iconoPlay = `
        <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(10, 34, 53)"><title>Activar</title>
        <path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>`;

    // Deriva la ruta a la versión con la cara centrada de una foto de
    // presidente (carpeta "images/presidentes/presidentes centrados/"),
    // pensada para encajar en los círculos del modo clásico, la sopa de
    // letras y "Ver Presidencias" sin cortar la cabeza. El modo "Adivina la
    // imagen" sigue usando las fotos originales sin cambios.
    function imagenCentradaDe(rutaOriginal) {
        const idx = rutaOriginal.lastIndexOf('/');
        const carpeta = rutaOriginal.slice(0, idx);
        const archivo = rutaOriginal.slice(idx + 1);
        const punto = archivo.lastIndexOf('.');
        const base = archivo.slice(0, punto);
        const ext = archivo.slice(punto);
        return `${carpeta}/presidentes%20centrados/${base}(centrado)${ext}`;
    }

    // --- DATOS DE PRESIDENTES ---
const listaPresidentes = [
    new Presidente("Bernardino", "", "Rivadavia", new Periodo(new Date("1826-02-08"), new Date("1827-06-27")), false, "images/presidentes/rivadavia.jpg", "Primer presidente de las Provincias Unidas del Río de la Plata. De ideas unitarias, promovió reformas liberales y la creación de instituciones educativas, pero su proyecto centralista chocó con el rechazo de las provincias federales, y ese conflicto, sumado a la guerra con Brasil, provocó su renuncia."),
    new Presidente("Vicente", "", "López", new Periodo(new Date("1827-07-07"), new Date("1827-08-18")), false, "images/presidentes/vicentelopez.jpg", "Presidente interino durante 41 días tras la renuncia de Rivadavia, en medio del colapso del proyecto de gobierno unitario. Disolvió el Congreso Nacional y convocó a elecciones provinciales, dando paso a casi tres décadas sin un poder ejecutivo nacional. Es recordado, además, por ser el autor de la letra del Himno Nacional Argentino.", true),
    new Presidente("Bartolomé", "", "Mitre", new Periodo(new Date("1862-10-12"), new Date("1868-10-12")), false, "images/presidentes/mitre.jpg", "Primer presidente de la Argentina ya unificada, tras derrotar a la Confederación en la batalla de Pavón. Impulsó la organización institucional del país, reorganizó la Corte Suprema de Justicia y fundó el diario La Nación. Condujo la Guerra de la Triple Alianza contra Paraguay, un conflicto prolongado y costoso que marcó buena parte de su gestión. Además de su carrera política y militar, fue un destacado historiador, autor de obras fundamentales sobre la independencia argentina."),
    new Presidente("Domingo", "Faustino", "Sarmiento", new Periodo(new Date("1868-10-12"), new Date("1874-10-12")), false, "images/presidentes/sarmiento.jpg", "Escritor, periodista y político, impulsó una profunda reforma educativa que incluyó la creación de escuelas normales y la incorporación de maestras extranjeras para formar docentes. Antes de la presidencia, escribió \"Facundo\", una de las obras más influyentes del pensamiento argentino del siglo XIX. Durante su gobierno se realizó el primer censo nacional y se promovió la inmigración europea y el desarrollo de infraestructura ferroviaria."),
    new Presidente("Nicolás", "Remigio Aurelio", "Avellaneda", new Periodo(new Date("1874-10-12"), new Date("1880-10-12")), false, "images/presidentes/avellaneda.jpg", "Abogado, periodista y exministro de Educación de Sarmiento, asumió la presidencia tras un breve intento de sublevación armada por parte de la oposición derrotada en las elecciones. Bajo su gobierno se llevó a cabo la Campaña del Desierto, liderada por Julio A. Roca, su ministro de guerra, y se sancionó la ley que federalizó la Ciudad de Buenos Aires, poniendo fin a un largo conflicto entre la Nación y esa provincia. También impulsó la inmigración europea y promovió el desarrollo agrícola del país."),
    new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1880-10-12"), new Date("1886-10-12")), false, "images/presidentes/roca1.jpg", "Militar y político tucumano, llegó a la presidencia tras dirigir la Campaña del Desierto como ministro de Guerra de Avellaneda. Bajo su lema \"Paz y administración\", consolidó la autoridad del Estado nacional sobre la totalidad del territorio, incluyendo Buenos Aires como capital federal. Sancionó la Ley de educación laica, gratuita y obligatoria, e impulsó el Registro Civil y el matrimonio civil, en medio de fuertes tensiones con la Iglesia católica. Fue una de las figuras centrales de la llamada Generación del 80."),
    new Presidente("Miguel", "Ángel", "Juárez Celman", new Periodo(new Date("1886-10-12"), new Date("1890-08-06")), false, "images/presidentes/juarezcelman.jpg", "Abogado y político cordobés, cuñado de Julio A. Roca, a quien sucedió en la presidencia. Concentró el poder de manera personalista, en un estilo de gobierno conocido como \"unicato\". Su gestión coincidió con un fuerte ciclo de endeudamiento y especulación financiera que derivó en una grave crisis económica. Fue derrocado por la Revolución del Parque en 1890, un levantamiento cívico-militar que dio origen a la Unión Cívica, antecedente directo de la UCR."),
    new Presidente("Carlos", "Enrique José", "Pellegrini", new Periodo(new Date("1890-08-06"), new Date("1892-10-12")), false, "images/presidentes/pellegrini.jpg", "Abogado y político porteño, era vicepresidente cuando asumió el cargo tras la renuncia de Juárez Celman, forzada por la Revolución del Parque. Debió enfrentar la grave crisis financiera heredada de su antecesor, conocida como \"crisis del 90\" o \"pánico de Baring\". Fundó el Banco de la Nación Argentina en 1891, buscando dar estabilidad al sistema financiero, y años antes había impulsado la creación de la escuela de comercio que hoy lleva su nombre."),
    new Presidente("Luis", "", "Sáenz Peña", new Periodo(new Date("1892-10-12"), new Date("1895-01-22")), false, "images/presidentes/luissaenzpena.jpg", "Jurista y político porteño, padre de quien años más tarde también llegaría a la presidencia, Roque Sáenz Peña. Asumió a los 70 años, en un acuerdo entre las facciones de Roca y Mitre. Su gobierno estuvo marcado por una fuerte inestabilidad política y por el saneamiento de las finanzas públicas tras la crisis de 1890. Debió enfrentar la revolución radical de 1893, impulsada por la Unión Cívica Radical en varias provincias, y renunció en 1895, debilitado políticamente y sin apoyo suficiente para sostener su gestión."),
    new Presidente("José", "Evaristo", "Uriburu", new Periodo(new Date("1895-01-23"), new Date("1898-10-12")), false, "images/presidentes/joseevaristouriburu.jpg", "Diplomático y político salteño, tío del futuro presidente de facto José Félix Uriburu. Asumió como vicepresidente tras la renuncia de Luis Sáenz Peña, completando el período que éste había dejado inconcluso. Durante su gestión se construyeron edificios públicos como el Museo Nacional de Bellas Artes, la Facultad de Medicina y el actual Palacio del Congreso, y se fundó la Facultad de Filosofía y Letras de la UBA. Enfrentó disputas limítrofes con Chile por el Canal de Beagle y otros sectores de la Patagonia. Entregó el poder a Roca en su segunda presidencia."),
    new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1898-10-12"), new Date("1904-10-12")), false, "images/presidentes/roca2.jpg", "Fue reelecto presidente 18 años después de su primer mandato, en un contexto de fuerte influencia del Partido Autonomista Nacional. Resolvió pacíficamente varios conflictos limítrofes con Chile, incluyendo el litigio por la Puna de Atacama y el arbitraje británico sobre la Patagonia. Continuó impulsando la modernización económica e institucional del país, aunque su gestión mostró los primeros signos de agotamiento del régimen conservador que él mismo había ayudado a consolidar."),
    new Presidente("Manuel", "Pedro", "Quintana", new Periodo(new Date("1904-10-12"), new Date("1906-03-12")), false, "images/presidentes/quintana.jpg", "Abogado porteño, asumió la presidencia a los 70 años, sucediendo a Roca en su segundo mandato. Debió enfrentar la Revolución Radical de 1905, liderada por Hipólito Yrigoyen, y sobrevivió a un atentado poco después. Su salud se deterioró durante la gestión, y falleció en el cargo en 1906, sin completar su mandato."),
    new Presidente("José", "", "Figueroa Alcorta", new Periodo(new Date("1906-03-12"), new Date("1910-10-12")), false, "images/presidentes/figueroaalcorta.jpg", "Abogado cordobés, asumió la presidencia tras la muerte de Quintana, de quien era vicepresidente. Gobernó durante los festejos del Centenario de la Revolución de Mayo, en 1910. En 1908 clausuró el Congreso Nacional en medio de un conflicto institucional con el Poder Legislativo. Tras finalizar su mandato, presidió la Corte Suprema de Justicia de la Nación."),
    new Presidente("Roque", "", "Sáenz Peña", new Periodo(new Date("1910-10-12"), new Date("1914-08-09")), false, "images/presidentes/roquesaenzpena.jpg", "Abogado y militar porteño, hijo del expresidente Luis Sáenz Peña. Antes de la política, combatió como voluntario en la guerra del Pacífico y en Sudán. Como presidente, impulsó la ley que estableció el voto secreto, universal y obligatorio, sancionada en 1912, que puso fin al fraude electoral sistemático y permitió la primera victoria electoral del radicalismo con Yrigoyen en 1916. Falleció en el cargo en 1914, sin llegar a ver los resultados completos de su reforma."),
    new Presidente("Victorino", "", "de la Plaza", new Periodo(new Date("1914-08-09"), new Date("1916-10-12")), false, "images/presidentes/delaplaza.jpg", "Abogado y economista salteño, varias veces ministro de Hacienda antes de llegar a la vicepresidencia. Asumió la presidencia tras la muerte de Roque Sáenz Peña, siendo el último mandatario elegido bajo el viejo sistema previo a la reforma electoral. Debió conducir al país durante el estallido de la Primera Guerra Mundial, manteniendo una posición de neutralidad. Le entregó el poder a Hipólito Yrigoyen en 1916, en la primera transición realizada bajo el nuevo sistema de voto secreto y obligatorio."),
    new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1916-10-12"), new Date("1922-10-12")), false, "images/presidentes/yrigoyen1.jpg", "Líder histórico de la Unión Cívica Radical, sobrino de su fundador, Leandro N. Alem. Fue el primer presidente elegido mediante voto secreto, universal y obligatorio, tras la sanción de la Ley Sáenz Peña. Impulsó reformas sociales y laborales, y amplió el acceso a la educación universitaria. Su gobierno enfrentó una fuerte conflictividad social, con episodios como la Semana Trágica de 1919. "),
    new Presidente("Marcelo", "Torcuato", "de Alvear", new Periodo(new Date("1922-10-12"), new Date("1928-10-12")), false, "images/presidentes/alvear.jpg", "Diplomático radical de origen patricio porteño, bisnieto del prócer Carlos María de Alvear. Sucedió a Yrigoyen en la presidencia, en medio de la creciente división del radicalismo entre \"personalistas\" y \"antipersonalistas\". Bajo su gobierno se creó YPF, la primera petrolera estatal del país. Terminado su mandato, le devolvió la presidencia al propio Yrigoyen, reelecto en 1928."),
    new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1928-10-12"), new Date("1930-09-06")), false, "images/presidentes/yrigoyen2.jpg", "Reelecto en 1928, tras la fractura entre \"personalistas\" y \"antipersonalistas\" que había dividido a la UCR. Su segundo gobierno estuvo marcado por su avanzada edad y por el creciente aislamiento respecto a su propio entorno, popularizado en la expresión \"el diario de Yrigoyen\". El estallido de la crisis económica mundial de 1929 agravó el malestar social y político. Fue derrocado en septiembre de 1930 por un golpe militar liderado por José Félix Uriburu, el primero del siglo XX en Argentina."),
    new Presidente("José", "Félix", "Uriburu", new Periodo(new Date("1930-09-06"), new Date("1932-02-20")), true, "images/presidentes/uriburu.jpg", "General de origen salteño, sobrino del expresidente civil José Evaristo Uriburu. Encabezó el primer golpe militar de la era moderna argentina, que derrocó a Yrigoyen y dio inicio a la etapa conocida como \"Década Infame\", marcada por gobiernos conservadores y fraude electoral sistemático. Su gobierno buscó instaurar un sistema corporativista, inspirado en modelos europeos de la época, sin éxito. Entregó el poder en 1932, tras elecciones marcadas por el fraude, a Agustín P. Justo."),
    new Presidente("Agustín", "Pedro", "Justo", new Periodo(new Date("1932-02-20"), new Date("1938-02-20")), false, "images/presidentes/justo.jpg", "Militar e ingeniero, ministro de Guerra durante la presidencia de Alvear. Llegó a la presidencia mediante elecciones marcadas por el fraude electoral, durante el periodo conocido como “Década Infame”. Firmó el controvertido Pacto Roca-Runciman con Gran Bretaña en 1933, y proscribió electoralmente al radicalismo yrigoyenista durante buena parte de su gestión."),
    new Presidente("Roberto", "Marcelino", "Ortiz", new Periodo(new Date("1938-02-20"), new Date("1942-06-26")), false, "images/presidentes/ortiz.jpg", "Abogado y político radical antipersonalista, sucedió a Justo en la presidencia. A diferencia de su antecesor, intentó combatir el fraude electoral que había caracterizado a la “Década Infame”, llegando a anular elecciones fraudulentas en la provincia de Buenos Aires en 1940. Una grave enfermedad lo obligó a delegar el mando en su vicepresidente, Ramón S. Castillo, antes de morir en 1942 sin completar su mandato."),
    new Presidente("Ramón", "", "Castillo", new Periodo(new Date("1942-06-26"), new Date("1943-06-04")), false, "images/presidentes/castillo.jpg", "Jurista, asumió el mando delegado por la enfermedad de Ortiz y luego la presidencia plena tras su muerte. A diferencia de este, profundizó el fraude electoral en lugar de combatirlo, consolidando el rasgo más característico de la \"Década Infame\". Mantuvo la neutralidad argentina durante parte de la Segunda Guerra Mundial. Fue derrocado por el golpe militar conocido como \"Revolución del 43\", liderado por Rawson."),
    new Presidente("Arturo", "Franklin", "Rawson", new Periodo(new Date("1943-06-04"), new Date("1943-06-07")), true, "images/presidentes/rawson.jpg", "General que lideró el golpe militar, conocido como \"Revolución del 43\", que derrocó a Castillo y puso fin a la \"Década Infame\". Fue presidente durante apenas 3 días, ya que su elección de gabinete generó rechazo dentro de las propias fuerzas golpistas. Nunca llegó a jurar formalmente el cargo, y fue reemplazado por Pedro Pablo Ramírez."),
    new Presidente("Pedro", "Pablo", "Ramírez", new Periodo(new Date("1943-06-07"), new Date("1944-02-24")), true, "images/presidentes/pabloramirez.jpg", "General, había sido ministro de Guerra del gobierno de Castillo antes del golpe de 1943. Reemplazó a Rawson tras su fugaz mandato. Bajo su gobierno, Perón comenzó a ganar protagonismo político al frente de la naciente Secretaría de Trabajo y Previsión. Rompió relaciones diplomáticas con las potencias del Eje en enero de 1944, decisión que le costó el apoyo interno de las fuerzas armadas y forzó su renuncia meses después."),
    new Presidente("Edelmiro", "Julián", "Farrell", new Periodo(new Date("1944-02-24"), new Date("1946-06-04")), true, "images/presidentes/farrell.jpg", "General, reemplazó a Ramírez y fue el último presidente de facto antes del regreso a la democracia. Bajo su gobierno, Perón sumó los cargos de ministro de Guerra y vicepresidente, consolidando su poder político. Le declaró la guerra a Alemania y Japón en 1945. Su gobierno atravesó el 17 de octubre de 1945, día en que una movilización popular exigió la liberación de Perón, detenido pocos días antes. Convocó a las elecciones de febrero de 1946, las primeras sin fraude en 18 años, en las que ganó Perón, a quien le entregó el poder ese mismo año."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1946-06-04"), new Date("1952-06-04")), false, "images/presidentes/peron1.jpg", "Militar y político, ganó las elecciones en 1946, las primeras sin fraude en 18 años, tras haber sido secretario de Trabajo y Previsión bajo los gobiernos de facto de Ramírez y Farrell. Impulsó una profunda reforma laboral, el voto femenino y una reforma constitucional que habilitó su reelección. Su esposa, Eva Duarte, tuvo un rol central en su gobierno hasta su muerte en 1952. Fue reelecto ese mismo año, dando inicio a su segundo mandato."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1952-06-04"), new Date("1955-09-21")), false, "images/presidentes/peron2.jpg", "Reelecto en 1952, ya sin Eva Perón, fallecida pocos meses después de asumir. Su gobierno enfrentó un fuerte deterioro económico y una creciente tensión con la Iglesia católica, que derivó en su excomunión y en el bombardeo de Plaza de Mayo en junio de 1955. Fue derrocado en septiembre de ese año por un golpe militar autodenominado \"Revolución Libertadora\", e inició un exilio que se prolongaría durante 18 años."),
    new Presidente("Eduardo", "Ernesto", "Lonardi", new Periodo(new Date("1955-09-23"), new Date("1955-11-13")), true, "images/presidentes/lonardi.jpg", "General que lideró el golpe militar de septiembre de 1955, conocido como \"Revolución Libertadora\", que derrocó a Perón. Asumió con el lema \"ni vencedores ni vencidos\", buscando una salida conciliadora con el peronismo. Fue desplazado apenas dos meses después por sectores militares más duros, que lo consideraban demasiado condescendiente, y reemplazado por Pedro Eugenio Aramburu."),
    new Presidente("Pedro", "Eugenio", "Aramburu", new Periodo(new Date("1955-11-13"), new Date("1958-05-01")), true, "images/presidentes/aramburu.jpg", "General, reemplazó a Lonardi al frente de la \"Revolución Libertadora\" y proscribió al peronismo, prohibiendo incluso mencionar su nombre y sus símbolos. Bajo su gobierno se ordenó el traslado secreto del cadáver de Eva Perón fuera del país. Convocó a la Convención Constituyente de 1957 y a las elecciones de 1958. Fue secuestrado y asesinado en 1970 por la organización guerrillera Montoneros, hecho que dio a conocer públicamente a esa agrupación."),
    new Presidente("Arturo", "", "Frondizi", new Periodo(new Date("1958-05-01"), new Date("1962-03-29")), false, "images/presidentes/frondizi.jpg", "Líder de la Unión Cívica Radical Intransigente, ganó las elecciones de 1958 con el apoyo tácito de Perón, que desde el exilio instruyó a sus seguidores a votarlo, en un contexto de proscripción del peronismo. Impulsó el \"desarrollismo\" como modelo económico, promoviendo la inversión extranjera y alcanzando el autoabastecimiento petrolero. Fue derrocado por un golpe militar en 1962, tras permitir que el peronismo, todavía proscripto, se presentara y ganara elecciones legislativas ese mismo año."),
    new Presidente("José", "María", "Guido", new Periodo(new Date("1962-03-29"), new Date("1963-10-12")), false, "images/presidentes/guido.jpg", "Presidente provisional del Senado, fue designado por los militares para dar una fachada de legalidad civil al golpe que había derrocado a Frondizi, aplicando la Ley de Acefalía. Gobernó bajo fuerte tutela militar, en medio de la interna entre las facciones \"azules\" y \"colorados\" de las Fuerzas Armadas. Convocó a las elecciones de 1963, con el peronismo nuevamente proscripto.", true),
    new Presidente("Arturo", "Umberto", "Illia", new Periodo(new Date("1963-10-12"), new Date("1966-06-28")), false, "images/presidentes/illia.jpg", "Médico rural y político, candidato de la Unión Cívica Radical del Pueblo, ganó las elecciones de 1963 con el peronismo nuevamente proscripto. Anuló los contratos petroleros firmados por Frondizi con empresas extranjeras y sancionó la Ley de Medicamentos, regulando precios de la industria farmacéutica. Fue derrocado por un golpe militar en 1966 liderado por Onganía."),
    new Presidente("Juan", "Carlos", "Onganía", new Periodo(new Date("1966-06-28"), new Date("1970-06-08")), true, "images/presidentes/ongania.jpg", "General que lideró el golpe militar de junio de 1966 contra Illia, encabezando la autodenominada \"Revolución Argentina\". A diferencia de golpes anteriores, no prometió un retorno cercano a elecciones, sino una refundación institucional de largo plazo. Disolvió los partidos políticos y ordenó la intervención de las universidades en 1966, en el episodio conocido como \"La Noche de los Bastones Largos\". Fue desplazado internamente por otros militares en 1970, tras el estallido social conocido como el Cordobazo."),
    new Presidente("Roberto", "Marcelo", "Levingston", new Periodo(new Date("1970-06-18"), new Date("1971-03-23")), true, "images/presidentes/levingston.jpg", "General de bajo perfil público, elegido por la Junta de Comandantes como figura de transición tras el desplazamiento de Onganía. Su gobierno coincidió con el secuestro y asesinato de Aramburu por Montoneros, en 1970. Duró menos de un año en el poder y fue desplazado por Alejandro Lanusse, quien buscaba encauzar una salida electoral que Levingston no ofrecía."),
    new Presidente("Alejandro", "Agustín", "Lanusse", new Periodo(new Date("1971-03-23"), new Date("1973-05-25")), true, "images/presidentes/lanusse.jpg", "General, último presidente de la \"Revolución Argentina\", sucedió a Levingston tras desplazarlo del poder. Impulsó el \"Gran Acuerdo Nacional\", buscando una salida electoral negociada, y levantó la proscripción del peronismo, aunque le impidió a Perón presentarse como candidato. Convocó a las elecciones de marzo de 1973, ganadas por Héctor Cámpora, poniendo fin a siete años de dictadura militar."),
    new Presidente("Héctor", "José", "Cámpora", new Periodo(new Date("1973-05-25"), new Date("1973-07-13")), false, "images/presidentes/campora.jpg", "Candidato peronista que ganó las elecciones de 1973, las primeras con el peronismo habilitado desde 1955, bajo la consigna \"Cámpora al gobierno, Perón al poder\". Durante su breve gestión tuvo lugar el regreso definitivo de Perón al país, el 20 de junio de 1973, jornada marcada por la Masacre de Ezeiza. Renunció apenas 49 días después de asumir, dando paso a un gobierno interino que convocaría a las nuevas elecciones que habilitarían la candidatura del propio Perón."),
    new Presidente("Raúl", "Alberto", "Lastiri", new Periodo(new Date("1973-07-13"), new Date("1973-10-12")), false, "images/presidentes/lastiri.jpg", "Presidente de la Cámara de Diputados, asumió como interino por acefalía tras la renuncia de Cámpora, completando la transición hasta las nuevas elecciones que este había forzado. Yerno de José López Rega, cuya influencia comenzó a consolidarse durante su breve gestión. Convocó a las elecciones de septiembre de 1973, ganadas por la fórmula Perón-Perón, a quienes entregó el poder ese mismo año.", true),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1973-10-12"), new Date("1974-07-01")), false, "images/presidentes/peron3.jpg", "Ganó las elecciones de 1973 con más del 60% de los votos, con su esposa Isabel Martínez como vicepresidenta. Su regreso al poder, tras 18 años de exilio y proscripción, coincidió con una creciente violencia entre las facciones de izquierda y derecha del propio movimiento peronista. Se apoyó cada vez más en los sectores sindicales y conservadores del partido, rompiendo públicamente con la izquierda peronista y con la organización Montoneros. Durante su gobierno se organizó la Triple A, un grupo parapolicial de extrema derecha impulsado por su ministro José López Rega. Murió en el cargo en 1974, sucedido por su esposa."),
    new Presidente("María", "Estela", "Martínez", new Periodo(new Date("1974-07-01"), new Date("1976-03-24")), false, "images/presidentes/isabel.jpg", "Asumió la presidencia tras la muerte de su esposo, Juan Domingo Perón, siendo la primera mujer en ocupar ese cargo en la historia argentina. Su gobierno estuvo marcado por una fuerte crisis económica y por la intensificación de la violencia política, con la Triple A actuando abiertamente bajo la influencia de su ministro José López Rega. Fue derrocada por un golpe militar en 1976, que dio inicio a la dictadura más extensa de la historia del país."),
    new Presidente("Jorge", "Rafael", "Videla", new Periodo(new Date("1976-03-29"), new Date("1981-03-29")), true, "images/presidentes/videla.jpg", "General, encabezó el golpe militar de 1976 que derrocó a Isabel Perón, iniciando el autodenominado \"Proceso de Reorganización Nacional\". Bajo su gobierno se implementó un plan sistemático de represión clandestina, con miles de personas desaparecidas. Le entregó el poder a Roberto Viola en 1981, dentro del propio esquema de rotación presidencial fijado por la Junta Militar. Fue juzgado y condenado por delitos de lesa humanidad en el histórico Juicio a las Juntas de 1985, y murió en prisión en 2013."),
    new Presidente("Roberto", "Eduardo", "Viola", new Periodo(new Date("1981-03-29"), new Date("1981-12-11")), true, "images/presidentes/viola_roberto.jpg", "General, comandante en jefe del Ejército, sucedió a Videla al frente de la dictadura, dentro del esquema de rotación presidencial fijado por la Junta Militar. Su breve gestión, de apenas ocho meses, intentó una tibia apertura política que generó desconfianza dentro de las propias Fuerzas Armadas. Fue desplazado antes de completar el período previsto, en medio de una fuerte crisis económica. Fue juzgado y condenado por delitos de lesa humanidad."),
    new Presidente("Carlos", "Alberto", "Lacoste", new Periodo(new Date("1981-12-11"), new Date("1981-12-22")), true, "images/presidentes/lacoste.jpg", "Vicealmirante, presidente interino durante apenas 11 días tras el desplazamiento de Viola por la Junta Militar. Había sido el organizador de facto del Mundial de Fútbol de 1978, al frente del Ente Autárquico Mundial '78. Entregó el poder a Leopoldo Galtieri, designado por la Junta para completar el período que Viola no había terminado."),
    new Presidente("Leopoldo", "Fortunato", "Galtieri", new Periodo(new Date("1981-12-22"), new Date("1982-06-18")), true, "images/presidentes/galtieri.jpg", "General, comandante en jefe del Ejército, asumió la presidencia de facto tras Lacoste. Ordenó el desembarco militar en las Islas Malvinas el 2 de abril de 1982, dando inicio a la guerra contra el Reino Unido por su soberanía. Tras la derrota argentina, renunció en junio de ese año, en medio del repudio popular y el fuerte desgaste de la dictadura. Fue juzgado y condenado por la conducción de la guerra, e investigado años después por delitos de lesa humanidad, aunque murió en 2003 sin que se dictara sentencia en esa segunda causa."),
    new Presidente("Reynaldo", "Benito", "Bignone", new Periodo(new Date("1982-07-01"), new Date("1983-12-10")), true, "images/presidentes/bignone.jpg", "General, último presidente de facto de la dictadura iniciada en 1976, asumió tras la renuncia de Galtieri en medio de la derrota en la Guerra de Malvinas. Convocó a las elecciones de octubre de 1983, ganadas por Alfonsín. Antes de dejar el poder, impulsó una autoamnistía militar que sería declarada nula por el gobierno democrático. Fue juzgado y condenado por delitos de lesa humanidad ya en democracia."),
    new Presidente("Raúl", "Ricardo", "Alfonsín", new Periodo(new Date("1983-12-10"), new Date("1989-07-08")), false, "images/presidentes/alfonsin.jpg", "Líder de la Unión Cívica Radical, ganó las elecciones de octubre de 1983, las primeras tras la dictadura, marcando el regreso de la democracia. Impulsó el histórico Juicio a las Juntas Militares y creó la CONADEP, cuyo informe \"Nunca Más\" documentó los crímenes de la dictadura. Enfrentó varios alzamientos militares (\"carapintadas\") y, bajo esa presión, sancionó las leyes de Punto Final y Obediencia Debida. Adelantó la entrega del poder a Carlos Menem en medio de una crisis hiperinflacionaria."),
    new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1989-07-08"), new Date("1995-07-08")), false, "images/presidentes/menem1.jpg", "Riojano, exgobernador de su provincia, asumió la presidencia de manera anticipada en 1989, en medio de la crisis hiperinflacionaria que forzó la salida temprana de Alfonsín. Estableció la convertibilidad, con paridad fija entre el peso y el dólar, e impulsó privatizaciones masivas de empresas estatales. Reformó la Constitución en 1994, lo que le permitió ser reelecto en 1995. Indultó a los jefes militares condenados por delitos de lesa humanidad durante su primer mandato."),
    new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1995-07-08"), new Date("1999-12-10")), false, "images/presidentes/menem2.jpg", "Reelecto en 1995 tras la reforma constitucional de 1994, que había acortado el mandato presidencial a cuatro años y habilitado la reelección. Continuó con el esquema de convertibilidad, que comenzó a mostrar signos de agotamiento hacia el final de su gestión, con aumento del desempleo y la deuda externa. Intentó sin éxito una segunda reelección. Entregó el poder a Fernando de la Rúa en 1999."),
    new Presidente("Fernando", "", "De La Rúa", new Periodo(new Date("1999-12-10"), new Date("2001-12-20")), false, "images/presidentes/delarua.jpeg", "Líder de la Alianza (UCR-FREPASO), ganó las elecciones de 1999 en medio del desgaste final de la convertibilidad. Su gobierno enfrentó una profunda crisis económica y social, que se agravó con la implementación del \"Corralito\" en diciembre de 2001, restringiendo la extracción de depósitos bancarios. En medio de saqueos y protestas masivas, renunció el 20 de diciembre de 2001, abandonando la Casa Rosada en un histórico vuelo en helicóptero."),
    new Presidente("Federico", "Ramón", "Puerta", new Periodo(new Date("2001-12-20"), new Date("2001-12-22")), false, "images/presidentes/puerta.jpg", "Presidente provisional del Senado, asumió por acefalía tras la renuncia de De la Rúa, siendo el primero de los cinco presidentes que gobernaron Argentina en apenas diez días. Su mandato duró solo dos días, en los que convocó a la Asamblea Legislativa que eligió a Adolfo Rodríguez Saá como presidente interino, y luego renunció para volver a su banca de senador.", true),
    new Presidente("Adolfo", "", "Rodríguez Saá", new Periodo(new Date("2001-12-22"), new Date("2001-12-30")), false, "images/presidentes/rodriguezsaa.jpg", "Gobernador de San Luis durante muchos años, fue elegido presidente interino por la Asamblea Legislativa tras la breve gestión de Puerta. Ante el Congreso, anunció la cesación de pagos de la deuda externa argentina, el default más grande de la historia del país, recibido con una ovación de pie. Renunció apenas una semana después, sin lograr apoyo político suficiente dentro de su propio partido.", true),
    new Presidente("Eduardo", "Oscar", "Camaño", new Periodo(new Date("2001-12-31"), new Date("2002-01-01")), false, "images/presidentes/camano.jpg", "Presidente de la Cámara de Diputados, asumió por acefalía tras la renuncia de Rodríguez Saá, en el marco de la crisis de diciembre de 2001. Su función fue prácticamente administrativa, ya que convocó a la Asamblea Legislativa que eligió a Eduardo Duhalde como presidente, a quien le entregó el poder apenas dos días después de haber asumido.", true),
    new Presidente("Eduardo", "Alberto", "Duhalde", new Periodo(new Date("2002-01-02"), new Date("2003-05-25")), false, "images/presidentes/duhalde.jpg", "Exvicepresidente de Menem y exgobernador de Buenos Aires, fue elegido presidente por la Asamblea Legislativa tras la renuncia de Camaño, cerrando la seguidilla de cinco presidentes de diciembre de 2001. Puso fin a la Convertibilidad y devaluó el peso, aplicando además la pesificación asimétrica de depósitos y deudas. Impulsó el Plan Jefes y Jefas de Hogar ante la emergencia social, y convocó a elecciones anticipadas para 2003, entregando el poder a Kirchner.", true),
    new Presidente("Néstor", "Carlos", "Kirchner", new Periodo(new Date("2003-05-25"), new Date("2007-12-10")), false, "images/presidentes/kirchner.jpg", "Gobernador de Santa Cruz, ganó las elecciones de 2003 tras el retiro de Menem de la segunda vuelta, en un país todavía golpeado por la crisis de 2001. Impulsó la renovación de la Corte Suprema de Justicia y la anulación de las leyes de Punto Final y Obediencia Debida, reabriendo los juicios por delitos de lesa humanidad. Renegoció la deuda externa en default con una fuerte quita a los acreedores y canceló la deuda con el FMI. Bajo su gobierno, la economía argentina se recuperó de la crisis. Entregó el poder a su esposa, Cristina Fernández."),
    new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2007-12-10"), new Date("2011-12-10")), false, "images/presidentes/cristinafernandez1.jpg", "Senadora nacional y esposa de Néstor Kirchner, ganó las elecciones de 2007, sucediéndolo en la presidencia. Enfrentó un fuerte conflicto con el sector agropecuario por las retenciones móviles, conocido como la \"Resolución 125\". Estatizó el sistema jubilatorio privado (AFJP) en 2008 y creó la Asignación Universal por Hijo en 2009. Impulsó también la Ley de Servicios de Comunicación Audiovisual, conocida como \"Ley de Medios\", que generó un fuerte enfrentamiento con el Grupo Clarín."),
    new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2011-12-10"), new Date("2015-12-10")), false, "images/presidentes/cristinafernandez2.jpg", "Reelecta en 2011 con más del 54% de los votos. Estatizó la mayoría accionaria de YPF en 2012 e impulsó la Ley de Matrimonio Igualitario, sancionada durante su primer mandato pero consolidada en este período. Su gestión enfrentó una creciente inflación, restricciones cambiarias conocidas como el \"cepo\", y diversas causas judiciales por presunta corrupción que marcaron el clima político hacia el final de su mandato."),
    new Presidente("Mauricio", "", "Macri", new Periodo(new Date("2015-12-10"), new Date("2019-12-10")), false, "images/presidentes/macri.jpg", "Exjefe de Gobierno de la Ciudad de Buenos Aires y fundador del PRO, ganó las elecciones de 2015 en el primer ballotage de la historia presidencial argentina, derrotando a Daniel Scioli. Su gobierno impulsó una serie de reformas económicas de apertura y desregulación, y afrontó una fuerte crisis cambiaria hacia el final de su mandato, que lo llevó a tomar un préstamo histórico del FMI en 2018. Perdió la reelección frente a Alberto Fernández en 2019."),
    new Presidente("Alberto", "Ángel", "Fernández", new Periodo(new Date("2019-12-10"), new Date("2023-12-10")), false, "images/presidentes/albertofernandez.jpg", "Exjefe de Gabinete de Néstor Kirchner, ganó las elecciones de 2019 con Cristina Fernández como vicepresidenta, derrotando a Macri. Presidió el país durante gran parte de la pandemia de COVID-19 e impulsó la Ley de Interrupción Voluntaria del Embarazo, sancionada en 2020. Renegoció la deuda externa con acreedores privados y con el FMI. Enfrentó tensiones internas con su vicepresidenta y no buscó la reelección en 2023."),
    new Presidente("Javier", "Gerardo", "Milei", new Periodo(new Date("2023-12-10"), null), false, "images/presidentes/milei.jpg", "Economista y exdiputado nacional, líder de La Libertad Avanza, ganó el ballotage de 2023 frente a Sergio Massa. Impulsó un fuerte plan de ajuste fiscal desde el inicio de su gestión, junto con una amplia desregulación económica a través de la Ley Bases y el DNU 70/2023.")
];


    // Hacer listaPresidentes global para presidencias.html
    window.listaPresidentes = listaPresidentes;

    function normalizarTexto(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // --- Lista de exclusi\u00f3n fija (mandatos muy breves y/o poco conocidos) ---
    // Nunca aparecen en Sopa de letras ni Crucigrama (el desaf\u00edo del d\u00eda es
    // fijo para todos, no hay forma de filtrarlos desde la configuraci\u00f3n).
    // En "Adivin\u00e1 la imagen" es la lista que usa la opci\u00f3n "Por defecto
    // (recomendado)" del filtro (ver presidentesUnicosFiltrados()). El modo
    // Cl\u00e1sico no usa esta lista.
    const APELLIDOS_EXCLUSION_FIJA = [
        "Cama\u00f1o", "Puerta", "Rawson", "Rodr\u00edguez Sa\u00e1", "Lacoste", "L\u00f3pez",
        "Lonardi", "Lastiri", "Viola", "Ram\u00edrez", "Levingston", "Castillo",
        "Quintana", "Bignone", "Guido", "Lanusse", "de la Plaza", "Farrell"
    ].map(normalizarTexto);
    function estaEnListaExclusionFija(presidente) {
        return APELLIDOS_EXCLUSION_FIJA.includes(normalizarTexto(presidente.apellido));
    }

    // Como normalizarTexto pero preservando la \u00d1 (que normalize("NFD") tambi\u00e9n
    // descompone en "n" + tilde combinada, perdi\u00e9ndola con el replace de
    // arriba). Se usa para armar las palabras que se VEN en sopa de letras y
    // crucigrama, donde si el apellido lleva \u00f1 (p. ej. "Cama\u00f1o") corresponde
    // mostrarla en el tablero en vez de una "n".
    function letraGrillaDe(texto) {
        return texto
            .toUpperCase()
            .replace(/\u00d1/g, "\ue000")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\ue000/g, "\u00d1")
            .replace(/[^A-Z\u00d1]/g, "");
    }

    // En crucigrama, aceptar "N" como acierto para una celda que pide "\u00d1" (y
    // viceversa): hay teclados que no tienen la tecla \u00f1.
    function letraCoincide(valor, requerida) {
        if (valor === requerida) return true;
        return (valor === "N" && requerida === "\u00d1") || (valor === "\u00d1" && requerida === "N");
    }

    // --- Opciones de texto que cuentan como acierto para un presidente ---
    // (mismas reglas para todos los modos de juego)
    // Para apellidos compuestos con preposición ("de Alvear", "de la Plaza",
    // "De La Rúa") también vale escribir solo la parte "fuerte" del apellido
    // (p. ej. "alvear", "plaza", "rua"), sin la preposición.
    function apellidoSinPreposicion(apellidoNormalizado) {
        return apellidoNormalizado.replace(/^(de la |de los |de las |del |de )/, "");
    }

    function obtenerOpcionesValidas(presidente) {
        const apellido = normalizarTexto(presidente.apellido);
        const apellidoCorto = apellidoSinPreposicion(apellido);
        const primerNombre = normalizarTexto(presidente.nombre);
        const segundosNombres = (presidente.segundoNombre || "")
            .split(" ")
            .map(n => normalizarTexto(n))
            .filter(Boolean);

        const nombreCompleto = normalizarTexto(
            [presidente.nombre, presidente.segundoNombre, presidente.apellido].filter(Boolean).join(" ")
        );

        const opcionesValidas = new Set();
        opcionesValidas.add(apellido);
        opcionesValidas.add(apellidoCorto);
        opcionesValidas.add(`${primerNombre} ${apellido}`);
        opcionesValidas.add(`${primerNombre} ${apellidoCorto}`);
        segundosNombres.forEach(seg => {
            opcionesValidas.add(`${seg} ${apellido}`);
            opcionesValidas.add(`${seg} ${apellidoCorto}`);
        });
        opcionesValidas.add(nombreCompleto);
        return opcionesValidas;
    }

    // Nombre completo para mostrar cuando se adivina / se revela un presidente
    function nombreCompletoPresidente(presidente) {
        return [presidente.nombre, presidente.segundoNombre, presidente.apellido]
            .filter(Boolean).join(" ");
    }

    // ==========================================================================
    //  PRESIDENTES ÚNICOS + BOMBOS DE FAMA (para el modo "Adivina la imagen")
    // ==========================================================================
    //  En el modo imagen cada persona aparece UNA sola vez aunque haya tenido
    //  varios mandatos. Cada presidente único guarda TODOS sus períodos (para
    //  la pista) y todas sus fotos (se elige una al azar por partida).

    function periodoDuroMasDeUnAnio(periodo) {
        const inicio = periodo.inicio;
        if (!inicio) return false;
        const fin = periodo.fin || new Date();
        const unAnioMs = 365.25 * 24 * 60 * 60 * 1000;
        return (fin - inicio) >= unAnioMs;
    }

    // Bombos de fama: B1 = los más conocidos ... B3 = los menos conocidos.
    // Las claves se comparan (normalizadas) contra apellido / nombre+apellido /
    // nombre completo, así que alcanza con poner lo mínimo para desambiguar.
    // Esta clasificación es un punto de partida: se puede ajustar a gusto.
    const BOMBOS_FAMA = {
        1: ["Perón", "Alfonsín", "Menem","Néstor Kirchner", "Cristina Fernández",
            "Macri", "Milei", "Videla", "Alberto Fernández"],
        2: ["Rivadavia", "Pellegrini", "Roque Sáenz Peña", "de Alvear","Frondizi", "Illia",
            "Onganía", "Cámpora", "María Estela Martínez", "Galtieri", "De La Rúa", "Duhalde",
            "Sarmiento", "Roca", "Yrigoyen", "Mitre",
            "Juárez Celman", "Luis Sáenz Peña", "Figueroa Alcorta", "Farrell", "Bignone",
            "Rodríguez Saá", "Avellaneda", "Aramburu"],
        3: ["Quintana", "de la Plaza", "Justo", "Ortiz", "Castillo", "José Félix Uriburu",
            "Vicente López",
            "José Evaristo Uriburu", "Rawson", "Ramírez", "Levingston",
            "Lastiri", "Viola", "Lacoste", "Puerta", "Camaño", "Lonardi", "Guido", "Lanusse"]
    };

    function bomboDePresidente(u) {
        const apellido = normalizarTexto(u.apellido);
        const nombreApellido = normalizarTexto(`${u.nombre} ${u.apellido}`);
        const completo = normalizarTexto(nombreCompletoPresidente(u));
        for (const bombo of Object.keys(BOMBOS_FAMA)) {
            for (const clave of BOMBOS_FAMA[bombo]) {
                const c = normalizarTexto(clave);
                if (c === apellido || c === nombreApellido || c === completo) {
                    return Number(bombo);
                }
            }
        }
        return 2; // si quedara alguno sin clasificar, va al bombo intermedio
    }

    // Para las personas con más de un mandato, en el modo imagen siempre se
    // usa la MISMA foto (elegida a mano) en vez de una al azar cada partida.
    // Se matchea por apellido; si esa persona no tiene esa foto entre las
    // suyas (o no está en la lista), se sigue eligiendo al azar como antes.
    const FOTO_FIJA_MODO_IMAGEN = {
        "fernandez": "cristinafernandez2.jpg",
        "menem": "menem2.jpg",
        "peron": "peron1.jpg",
        "roca": "roca2.jpg",
        "yrigoyen": "yrigoyen1.jpg"
    };

    function fotoFijaDePresidente(u) {
        const archivo = FOTO_FIJA_MODO_IMAGEN[normalizarTexto(u.apellido)];
        if (!archivo) return null;
        return u.imagenes.find(img => img.endsWith("/" + archivo)) || null;
    }

    const presidentesUnicos = (function construirPresidentesUnicos() {
        const mapa = new Map();
        listaPresidentes.forEach(p => {
            const clave = normalizarTexto(nombreCompletoPresidente(p));
            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    nombre: p.nombre,
                    segundoNombre: p.segundoNombre,
                    apellido: p.apellido,
                    deFacto: p.deFacto,
                    interino: p.interino,
                    descripcion: p.descripcion,
                    imagenes: [p.imagen],
                    periodos: [p.periodo]
                });
            } else {
                const u = mapa.get(clave);
                u.imagenes.push(p.imagen);
                u.periodos.push(p.periodo);
                // Si en CUALQUIERA de sus mandatos fue interino, cuenta como
                // interino (no hay ningún caso real así hoy, pero por las dudas).
                if (p.interino) u.interino = true;
            }
        });
        const lista = [...mapa.values()];
        lista.forEach(u => {
            u.bombo = bomboDePresidente(u);
            u.periodos.sort((a, b) => (a.inicio ? a.inicio.getTime() : 0) - (b.inicio ? b.inicio.getTime() : 0));
        });
        return lista;
    })();

    function presidentesUnicosFiltrados() {
        if (configuracionJuego.filtroImagenModo === "todas") {
            return presidentesUnicos.slice();
        }
        if (configuracionJuego.filtroImagenModo === "custom") {
            return presidentesUnicos.filter(u => {
                if (configuracionJuego.eliminarDeFactoImagen && u.deFacto) return false;
                if (configuracionJuego.eliminarMenosDeUnAnioImagen && !u.periodos.some(periodoDuroMasDeUnAnio)) return false;
                if (configuracionJuego.eliminarInterinosImagen && u.interino) return false;
                return true;
            });
        }
        // "default" (o cualquier valor viejo/desconocido persistido): lista fija.
        return presidentesUnicos.filter(u => !estaEnListaExclusionFija(u));
    }

    // Texto de la pista: fecha(s) del/los mandato(s) del presidente actual.
    function textoPistaMandatos(u) {
        const partes = u.periodos.map(p => p.toString());
        return partes.length > 1
            ? `Mandatos: ${partes.join('   ·   ')}`
            : `Mandato: ${partes[0]}`;
    }

    // Probabilidad de cada bombo en la "ruleta" que se tira antes de cada
    // presidente (20% B1, 70% B2, 10% B3 — las mismas proporciones que se
    // venían usando, solo que antes se pre-calculaba una cantidad fija por
    // bombo para toda la partida).
    const PROBABILIDAD_BOMBO = { 1: 0.2, 2: 0.7, 3: 0.1 };

    // Tira la "ruleta" entre los bombos que todavía tienen gente disponible,
    // respetando (renormalizando entre sí) sus probabilidades relativas.
    function tirarRuletaDeBombo(bombosDisponibles) {
        const pesoTotal = bombosDisponibles.reduce((acc, b) => acc + PROBABILIDAD_BOMBO[b], 0);
        let tiro = Math.random() * pesoTotal;
        for (const b of bombosDisponibles) {
            tiro -= PROBABILIDAD_BOMBO[b];
            if (tiro <= 0) return b;
        }
        return bombosDisponibles[bombosDisponibles.length - 1]; // fallback por redondeo de floats
    }

    // Arma la tanda de presidentes de una partida: para CADA presidente que
    // va a aparecer se tira la ruleta de bombos (20/70/10) y, según qué
    // bombo salga, se elige una persona al azar entre las de ese bombo (sin
    // repetir a nadie dos veces en la misma partida). Es un doble sorteo
    // independiente por cada presidente, no una cantidad fija por bombo
    // calculada de antemano para toda la partida.
    function elegirPresidentesPorBombo(pool, cantidad) {
        const disponiblesPorBombo = { 1: [], 2: [], 3: [] };
        pool.forEach(u => disponiblesPorBombo[u.bombo].push(u));
        [1, 2, 3].forEach(b => { disponiblesPorBombo[b] = mezclarArray(disponiblesPorBombo[b]); });

        const seleccion = [];
        for (let i = 0; i < cantidad; i++) {
            const bombosConGente = [1, 2, 3].filter(b => disponiblesPorBombo[b].length > 0);
            if (bombosConGente.length === 0) break; // no queda nadie en ningún bombo

            const bomboElegido = tirarRuletaDeBombo(bombosConGente);
            // El array de ese bombo ya está mezclado, así que sacar el
            // último es elegir a alguien al azar dentro del bombo.
            seleccion.push(disponiblesPorBombo[bomboElegido].pop());
        }

        return seleccion;
    }

    // --- Filtrar presidentes según configuración ---
    function filtrarPresidentes(){
        return listaPresidentes.filter(p => {
            if(configuracionJuego.eliminarDeFacto && p.esDeFacto()) return false;
            if(configuracionJuego.eliminarMenosDeUnAnioClasico && !p.estuvoMasDeUnAnio()) return false;
            if(configuracionJuego.eliminarInterinosClasico && p.esInterino()) return false;
            return true;
        });
    }

    // --- Generar tabla HTML ---
    function generarTablaHTML(presidentesFiltrados) {
        const filasTabla = presidentesFiltrados.map((presidente, index) => `
            <tr data-id="${index}" data-periodo="${presidente.periodo.toString()}">
                <td class="imagen-presidente-cell">
                    <div class="imagen-presidente-desconocido-container">
                        <img src="images/presidentes/presidente-desconocido.png" alt="Presidente desconocido">
                    </div>
                </td>
                <td class="presidente-card">
                    <div class="nombre-presidente-cell"><span class="nombre-presidente-texto">?</span></div>
                    <div class="periodo-presidente-cell">${presidente.periodo}</div>
                </td>
            </tr>
        `).join('');

        const restartIconSvg = `<svg class="restart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Volver a empezar</title><path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z" /></svg>`;
        const pauseIconSvg = `<svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Pausar</title><path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>`;
        const tiempoInicial = `${configuracionJuego.tiempo.toString().padStart(2,'0')}:00`;
        const tabla = `
            <table class="tabla" border="1" cellspacing="0" cellpadding="5">
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>
            <div class="tabla-paused-overlay" style="display:none;">Juego en pausa</div>
        `;

        // En mobile el input, el reloj y "rendirse" flotan semitransparentes
        // arriba/abajo del cuadro (superpuestos, no en filas propias) para
        // que la tabla ocupe casi toda la pantalla visible con el teclado abierto.
        const esMobile = window.matchMedia('(max-width: 768px)').matches;

        if (esMobile) {
            return `
                <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado"><span class="modo-de-juego-seleccionado-texto">CLÁSICO</span></span></h4>
                <div class="tabla-container tabla-container-compacta">
                    <div class="tabla-wrapper" style="position:relative;">
                        ${tabla}
                        <div class="hud-bottom-group">
                            <div class="hud-timer">
                                ${restartIconSvg}
                                <div id="contador-presidentes" class="contador">0/${presidentesFiltrados.length}</div>
                                <div id="temporizador" class="temporizador">${tiempoInicial}</div>
                                ${pauseIconSvg}
                            </div>
                            <div class="hud-bottom">
                                <input class="input-presidente" type="text" id="input-presidente" placeholder="Apellido...">
                                <button class="rendirse-button rendirse-button-compacta" type="button" aria-label="Rendirse"><svg class="rendirse-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Rendirse</title><path d="M14.4,6L14,4H5V21H7V14H12.6L13,16H20V6H14.4Z" /></svg></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado"><span class="modo-de-juego-seleccionado-texto">CLÁSICO</span></span></h4>
            <div class="tabla-container">
                <div class="tabla-wrapper" style="position:relative;">
                    ${tabla}
                </div>
                <div class="input-container">
                    <div class="input-container-first-row">
                        ${restartIconSvg}
                        <div id="temporizador" class="temporizador">${tiempoInicial}</div>
                        ${pauseIconSvg}
                    </div>
                    <div class="input-container-second-row">
                        <div id="contador-presidentes" class="contador">
                            0 / ${presidentesFiltrados.length}
                        </div>
                        <input class="input-presidente" type="text" id="input-presidente" placeholder="Ingrese el apellido...">
                    </div>
                    <button class="rendirse-button" type="button">RENDIRSE</button>
                </div>
            </div>
        `;
    }

    // --- Verificar respuestas ---
    let aciertos = 0;

    // Centra la fila dentro del scroll interno de la tabla, sin mover la página.
    function scrollFilaAlCentro(fila) {
        const contenedor = fila.closest('tbody');
        if (!contenedor) return;
        // En mobile el HUD del reloj/input queda flotando superpuesto sobre
        // la parte de abajo de la tabla (ver ".hud-bottom-group"): si la
        // fila a centrar es de las últimas de la lista, no hay scroll
        // disponible para subirla hasta la mitad y termina tapada detrás
        // de ese HUD. Se reserva como padding-bottom la mitad de la altura
        // visible del contenedor -lo máximo que puede llegar a hacer falta
        // para centrar la última fila-, así cualquier fila se puede
        // centrar, aunque eso deje un tramo vacío al final de la lista.
        if (window.matchMedia('(max-width: 768px)').matches) {
            const alturaExtra = contenedor.clientHeight / 2;
            if (parseFloat(getComputedStyle(contenedor).paddingBottom) < alturaExtra) {
                contenedor.style.paddingBottom = `${alturaExtra}px`;
            }
        }
        const contenedorRect = contenedor.getBoundingClientRect();
        const filaRect = fila.getBoundingClientRect();
        const desplazamiento = (filaRect.top - contenedorRect.top) - (contenedorRect.height / 2) + (filaRect.height / 2);
        contenedor.scrollBy({ top: desplazamiento, behavior: 'smooth' });
    }

    function verificarRespuestaTiempoReal(inputElement) {
        const textoIngresado = normalizarTexto(inputElement.value);
        if (textoIngresado.length < 3) return;

        // Buscar todos los índices que coincidan
        let indicesCoincidentes = [];
        window.listaFiltrada.forEach((presidente, index) => {
            if (obtenerOpcionesValidas(presidente).has(textoIngresado)) {
                indicesCoincidentes.push(index);
            }
        });

        if (indicesCoincidentes.length > 0) {
            let hizoScroll = false;
            indicesCoincidentes.forEach((indice, i) => {
                const presidente = window.listaFiltrada[indice];
                const fila = document.querySelector(`tr[data-id="${indice}"]`);
                if (!fila) return;

                const celdaNombre = fila.querySelector('.nombre-presidente-cell');
                const imagen = fila.querySelector('img');
                const checkIcon = "<svg class='check-icon' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><title>check-bold</title><path d='M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z' /></svg>"
                const presidenteCard = fila.querySelector('.presidente-card');

                const nombreParaMostrar = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                    .filter(Boolean).join(" ");

                if (celdaNombre.textContent === "?") {
                    imagen.src = imagenCentradaDe(presidente.imagen);
                    imagen.alt = nombreParaMostrar;
                    celdaNombre.innerHTML = `${checkIcon} <span class="nombre-presidente-texto">${nombreParaMostrar}</span>`;
                    presidenteCard.style.backgroundColor = "rgb(27, 190, 241)";
                    const presidenteTexto = fila.querySelector('.nombre-presidente-texto');
                    presidenteTexto.style.border = "none";
                    presidenteTexto.style.marginBottom = "0";
                    presidenteTexto.style.color = "rgb(10, 34, 53)";

                    aciertos++;
                    reproducirSonidoAcierto();
                    const contador = document.getElementById("contador-presidentes");
                    if (contador) contador.textContent = `${aciertos} / ${window.listaFiltrada.length}`;

                    fila.classList.add('acierto-animacion');
                    setTimeout(() => fila.classList.remove('acierto-animacion'), 2000);

                    // Solo hacer scroll en el primer mandato encontrado
                    if (!hizoScroll) {
                        scrollFilaAlCentro(fila);
                        hizoScroll = true;
                    }
                } else if (!hizoScroll) {
                    // Si ya estaba adivinado, igual hacemos scroll solo al primero
                    scrollFilaAlCentro(fila);
                    fila.classList.add('ya-adivinado');
                    setTimeout(() => fila.classList.remove('ya-adivinado'), 2000);
                    hizoScroll = true;
                }
            });

            inputElement.value = "";
        }

        if (aciertos === window.listaFiltrada.length) {
            clearInterval(window.temporizadorInterval);
            lanzarConfetti();
            mostrarFinJuego('victoria');
        }
    }

    // --- Iniciar juego ---
    function iniciarJuego() {
        modoActual = 'clasico';
        if (heroContent) heroContent.remove();
        main.classList.add("juego-activo");
        // En cualquier modo, jugando: sin footer y sin scroll de página.
        body.classList.add("juego-activo");

        const presidentesFiltrados = filtrarPresidentes();
        const contenidoDelJuego = generarTablaHTML(presidentesFiltrados);
        main.insertAdjacentHTML("beforeend", contenidoDelJuego);

        // En mobile, el HUD flotante (reloj + input/rendirse) queda superpuesto
        // sobre la parte de abajo de la tabla (ver ".hud-bottom-group"), pero
        // sin ocupar espacio real en el layout — así que el scroll interno del
        // tbody, por default, termina antes de que la última fila (Milei) se
        // pueda ver completa: queda tapada detrás del HUD. Reservar de entrada
        // este padding-bottom (la misma cantidad que ya usa
        // scrollFilaAlCentro() para poder CENTRAR la última fila) hace que
        // también alcance con margen de sobra para simplemente scrollear a mano
        // hasta el final y verla entera, sin depender de que se dispare esa
        // función.
        if (window.matchMedia('(max-width: 768px)').matches) {
            const tbodyEl = document.querySelector("tbody");
            if (tbodyEl) tbodyEl.style.paddingBottom = `${tbodyEl.clientHeight / 2}px`;
        }

        // El header compacto (hamburguesa + modo + tema en una sola franja)
        // es solo para mobile; en desktop el header queda como estaba.
        if (window.matchMedia('(max-width: 768px)').matches) {
            const navToggleEl = document.querySelector(".nav-toggle");
            const jugandoModoHeading = document.querySelector(".jugando-modo-heading");
            if (navToggleEl && jugandoModoHeading) {
                navToggleEl.insertAdjacentElement("afterend", jugandoModoHeading);
                ajustarBadgeModoAlAncho();
            }
        }

        // ⚡ Guardar lista filtrada global
        window.listaFiltrada = presidentesFiltrados;

        const inputPresidente = document.getElementById("input-presidente");
        if (inputPresidente) {
            inputPresidente.addEventListener("input", (event) => {
                verificarRespuestaTiempoReal(event.target);
            });
            inputPresidente.focus();
        }

        const botonRendirse = document.querySelector(".rendirse-button");
        if (botonRendirse){
            botonRendirse.addEventListener("click", rendirse);
        }

        // --- Temporizador ---
        iniciarTemporizador(configuracionJuego.tiempo * 60);

        // --- Botones Pausa y Reiniciar ---
        const botonPausa = document.querySelector(".pause-icon");
        const botonReiniciar = document.querySelector(".restart-icon");

        if (botonPausa) {
            botonPausa.addEventListener("click", togglePausa);
        }
        if (botonReiniciar) {
            botonReiniciar.addEventListener("click", reiniciarJuego);
        }

        // En mobile el HUD del reloj/pausa queda tapado por el overlay de
        // pausa; tocar en cualquier parte del overlay reanuda el juego.
        const overlayPausa = document.querySelector(".tabla-paused-overlay");
        if (overlayPausa) {
            overlayPausa.addEventListener("click", () => {
                if (pausado) togglePausa();
            });
        }


        window.temporizadorInterval = temporizadorInterval;
    }
    // --- Elegir modo de juego en la pantalla de inicio ---
    // Elegir un modo NO arranca la partida: solo mueve el carrusel a esa
    // tarjeta y marca su puntito. La partida arranca recién con "Iniciar
    // Juego". El orden acá define el orden de navegación del carrusel
    // (flechas y swipe van y vienen en este mismo orden).
    const ORDEN_MODOS = Object.keys(MODOS);

    // Cada modo es una tarjeta del carrusel de "Ver modos de juego": mismo
    // formato de título (placa dorada ".modo-de-juego-seleccionado") que en
    // esas tarjetas. La rosquita de configurar solo aparece si el modo
    // tiene algo configurable, y el contador de reinicio solo si es un modo
    // "del día" (así ninguno reserva espacio de más que no necesita).
    function htmlReglas(modo) {
        const datos = MODOS[modo];
        const esDiario = modo === "sopa" || modo === "crucigrama";
        const gear = modoTieneConfiguracion(modo) ? `
                    <button class="configuracion-link" type="button" aria-label="Configurar ${datos.nombre}">
                        <svg class="configuracion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Configuración</title><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>
                    </button>` : "";
        // La racha (días consecutivos jugados) y el estado del desafío de
        // hoy (resuelto/no resuelto) se completan recién en
        // actualizarRachaEnTarjetas()/actualizarEstadoDiarioEnTarjetas():
        // acá arriba, en la construcción inicial del carrusel, las
        // claves/funciones que necesitan (SOPA_LS_RES, fechaHoyISO, etc.)
        // todavía no están definidas más abajo en este mismo archivo
        // (temporal dead zone), así que estos elementos arrancan
        // vacíos/ocultos y se completan después.
        const insigniaEstado = esDiario ? `<span class="modo-card-badge-estado" hidden></span>` : "";
        // La racha va DENTRO de la línea de estado, a la derecha del
        // contador (mismo renglón) — no debajo, como antes.
        const lineaEstado = esDiario ? `
                    <span class="modo-card-estado" hidden>
                        <span class="modo-card-estado-texto"></span>
                        <span class="contador-reinicio-diario modo-card-contador"></span>
                        <span class="modo-card-racha" hidden></span>
                    </span>` : "";
        return `
            <div class="modo-actual-card" data-modo="${modo}">
                <div class="modo-card-logo-wrap">
                    <div class="modo-card-logo">${logoModo[modo]}</div>
                    ${insigniaEstado}
                </div>
                <div class="modo-card-text">
                    <div class="modo-card-titulo-fila">
                        <h3 class="modo-card-titulo"><span class="modo-de-juego-seleccionado">${datos.badge}</span></h3>${gear}
                    </div>
                    <p>${datos.descripcion}</p>
                    ${lineaEstado}
                </div>
            </div>
        `;
    }

    // Arma, una sola vez, las 4 tarjetas del carrusel y sus 4 puntitos.
    // A diferencia del esquema anterior (que reemplazaba el HTML de una
    // sola tarjeta al cambiar de modo), acá las 4 quedan siempre en el DOM
    // y el carrusel solo se desplaza entre ellas: así cada una conserva su
    // propio contador/rosquita sin volver a generarse en cada cambio.
    function renderCarrusel() {
        const track = document.querySelector(".modo-carrusel-track");
        const puntos = document.querySelector(".modo-carrusel-puntos");
        if (!track || !puntos) return;

        track.innerHTML = ORDEN_MODOS.map(htmlReglas).join("");
        puntos.innerHTML = ORDEN_MODOS.map(modo =>
            `<button class="modo-carrusel-punto" type="button" role="tab" data-modo="${modo}" aria-label="${MODOS[modo].nombre}"></button>`
        ).join("");

        // Delegado: la rosquita de cada tarjeta se regenera con el resto de
        // la tarjeta, así que un solo listener en el contenedor (en vez de
        // uno por botón) sigue funcionando pase lo que pase con el HTML.
        track.addEventListener("click", (e) => {
            const gear = e.target.closest(".configuracion-link");
            if (!gear) return;
            const tarjeta = gear.closest(".modo-actual-card");
            if (!tarjeta) return;
            reproducirSonidoBoton();
            seleccionarModo(tarjeta.dataset.modo);
            abrirConfig();
        });

        puntos.querySelectorAll(".modo-carrusel-punto").forEach(punto => {
            punto.addEventListener("click", () => {
                reproducirSonidoBoton();
                seleccionarModo(punto.dataset.modo);
            });
        });
    }

    // La placa del título de cada tarjeta ("CLÁSICO", "ADIVINA LA IMAGEN",
    // etc.) tiene que entrar en una sola línea: si no, se ve una placa
    // partida en dos renglones en vez de la pastilla redondeada de siempre.
    // En mobile, la columna central del grid de ".modo-card-titulo-fila"
    // puede terminar más angosta que el texto (ver CSS), así que acá se
    // achica la fuente hasta que entre, con un piso legible — mismo patrón
    // que ajustarBadgeModoAlAncho()/ajustarModoModalTitulo() para las otras
    // placas doradas del sitio.
    function ajustarBadgesCarrusel() {
        document.querySelectorAll(".modo-card-titulo-fila").forEach(fila => {
            const placa = fila.querySelector(".modo-de-juego-seleccionado");
            if (!placa) return;
            placa.style.fontSize = "";
            // El h3 de la placa no tiene ancho propio (se agranda con su
            // contenido), así que medirlo a él no detecta nada: hay que
            // medir contra el ancho disponible de la FILA completa, restando
            // la rosquita de configurar — mismo cálculo que
            // ajustarModoModalTitulo() para la placa del modal de "Ver
            // modos de juego".
            const gear = fila.querySelector(".configuracion-link");
            const anchoGear = gear ? gear.offsetWidth + 8 : 0;
            // En mobile ".modo-card-titulo-fila" pasa a un grid de 3
            // columnas simétricas (ver CSS) para centrar la placa de
            // verdad, reservando el ancho de la rosquita a AMBOS lados. En
            // desktop es un flex row simple: la rosquita solo resta una vez.
            const esGrid = getComputedStyle(fila).display === "grid";
            const disponible = esGrid ? fila.clientWidth - anchoGear * 2 : fila.clientWidth - anchoGear;
            const pisoPx = 11;
            let tamanioPx = parseFloat(getComputedStyle(placa).fontSize);
            let intentos = 0;
            // ".modo-de-juego-seleccionado" es un <span> "display: inline":
            // su scrollWidth da 0 en los navegadores basados en Chromium (no
            // arma caja propia), así que hay que medir con
            // getBoundingClientRect() en su lugar.
            while (placa.getBoundingClientRect().width > disponible && tamanioPx > pisoPx && intentos < 30) {
                tamanioPx -= 1;
                placa.style.fontSize = tamanioPx + "px";
                intentos++;
            }
        });
    }

    // Desliza el carrusel hasta el modo actualmente seleccionado, marca su
    // puntito y ajusta la altura del viewport a la de ESA tarjeta nada más
    // (no a la más alta de las 4), para no reservarle espacio de sobra a
    // los modos sin contador de reinicio.
    function actualizarCarrusel() {
        const viewport = document.querySelector(".modo-carrusel-viewport");
        const track = document.querySelector(".modo-carrusel-track");
        if (!viewport || !track) return;

        const indice = ORDEN_MODOS.indexOf(modoSeleccionado);
        if (indice === -1) return;

        ajustarBadgesCarrusel();
        track.style.transform = `translateX(-${indice * viewport.getBoundingClientRect().width}px)`;

        const tarjetaActual = track.children[indice];
        if (tarjetaActual) viewport.style.height = `${tarjetaActual.getBoundingClientRect().height}px`;

        document.querySelectorAll(".modo-carrusel-punto").forEach(punto => {
            const activo = punto.dataset.modo === modoSeleccionado;
            punto.classList.toggle("activo", activo);
            punto.setAttribute("aria-selected", String(activo));
        });
    }

    function irAModoRelativo(delta) {
        const n = ORDEN_MODOS.length;
        const actual = ORDEN_MODOS.indexOf(modoSeleccionado);
        seleccionarModo(ORDEN_MODOS[(actual + delta + n) % n]);
    }

    function seleccionarModo(modo) {
        if (!MODOS[modo]) return;
        modoSeleccionado = modo;

        botonesModo.forEach(boton => {
            boton.classList.toggle("seleccionado", boton.dataset.modo === modo);
        });

        actualizarCarrusel();
    }

    botonesModo.forEach(boton => {
        boton.addEventListener("click", () => seleccionarModo(boton.dataset.modo));
    });

    // --- Carrusel "MODO DE JUEGO SELECCIONADO" ---
    const flechaModoIzq = document.querySelector(".modo-carrusel-flecha-izq");
    const flechaModoDer = document.querySelector(".modo-carrusel-flecha-der");
    if (flechaModoIzq) flechaModoIzq.addEventListener("click", () => { reproducirSonidoBoton(); irAModoRelativo(-1); });
    if (flechaModoDer) flechaModoDer.addEventListener("click", () => { reproducirSonidoBoton(); irAModoRelativo(1); });

    // Swipe táctil: solo dispara si el arrastre es predominantemente
    // horizontal (si no, sería un scroll vertical normal de la página).
    const carruselViewport = document.querySelector(".modo-carrusel-viewport");
    if (carruselViewport) {
        let swipeX = null;
        let swipeY = null;
        carruselViewport.addEventListener("touchstart", (e) => {
            swipeX = e.changedTouches[0].clientX;
            swipeY = e.changedTouches[0].clientY;
        }, { passive: true });
        carruselViewport.addEventListener("touchend", (e) => {
            if (swipeX === null) return;
            const dx = e.changedTouches[0].clientX - swipeX;
            const dy = e.changedTouches[0].clientY - swipeY;
            swipeX = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                irAModoRelativo(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    renderCarrusel();
    seleccionarModo(modoSeleccionado);

    // La tipografía (Cinzel, vía @import de Google Fonts) carga en forma
    // asíncrona. Si actualizarCarrusel() mide antes de que esté lista, el
    // texto todavía está en la fuente de reemplazo (más angosta) y la
    // altura calculada queda corta. Se recalcula apenas terminan de cargar
    // las fuentes para corregir esa medición inicial.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(actualizarCarrusel);
    }

    // Recalcular ante cambios de tamaño de ventana (rotar el celular, cambiar
    // de mobile a desktop, etc.): tanto la altura de la tarjeta actual como
    // la posición en píxeles del carrusel dependen del ancho disponible.
    let resizeCarruselTimeout = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeCarruselTimeout);
        resizeCarruselTimeout = setTimeout(actualizarCarrusel, 150);
    });

    function iniciarModoSeleccionado() {
        if (modoSeleccionado === 'imagen') {
            iniciarJuegoImagen();
        } else if (modoSeleccionado === 'sopa') {
            iniciarJuegoSopa();
        } else if (modoSeleccionado === 'crucigrama') {
            iniciarJuegoCrucigrama();
        } else {
            iniciarJuego();
        }
    }

    if (botonIniciar) {
        botonIniciar.addEventListener("click", () => {
            reproducirSonidoBoton();
            iniciarModoSeleccionado();
        });
    }


    // ==========================================================================
    //  MODO "ADIVINA LA IMAGEN"
    // ==========================================================================
    //  Aparece una foto de un presidente y el usuario escribe su apellido en el
    //  input de al lado. Las reglas de cómo se adivina (apellido, nombre +
    //  apellido, nombre completo, etc.) son las mismas que en el modo clásico:
    //  reutilizamos obtenerOpcionesValidas() y filtrarPresidentes().

    let juegoImagenOrden = [];   // presidentes barajados para esta partida
    let juegoImagenIndice = 0;   // presidente que se está mostrando
    let juegoImagenBloqueado = false; // evita dobles avances durante la animación
    const JUEGO_IMAGEN_PISTAS_MAX = 2;
    let juegoImagenPistas = JUEGO_IMAGEN_PISTAS_MAX; // pistas que quedan en la partida
    let juegoImagenPistaUsada = false;               // ya se pidió pista para el presidente actual
    let juegoImagenTimer = null;                     // intervalo del temporizador
    let juegoImagenTerminado = false;                // la partida ya cerró (fin, rendición o tiempo)

    function mezclarArray(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function iniciarJuegoImagen() {
        modoActual = 'imagen';

        if (heroContent) heroContent.remove();
        main.classList.add("juego-activo");
        // En cualquier modo, jugando: sin footer y sin scroll de página.
        body.classList.add("juego-activo");

        // Cada persona aparece una sola vez (aunque haya tenido varios mandatos).
        // Se juega una cantidad al azar (configurable, 10 por defecto), eligiendo
        // por bombos de fama y barajada distinta en cada partida.
        const pool = presidentesUnicosFiltrados();
        const cantidad = Math.min(configuracionJuego.cantidad, pool.length);
        juegoImagenOrden = elegirPresidentesPorBombo(pool, cantidad);
        // Para quienes tuvieron varios mandatos: foto fija elegida a mano si
        // está definida; si no, al azar (como antes).
        juegoImagenOrden.forEach(u => {
            u.imagen = fotoFijaDePresidente(u) || u.imagenes[Math.floor(Math.random() * u.imagenes.length)];
            u.resultadoPartida = null; // se completa con 'acierto' / 'error' al jugar
        });
        juegoImagenIndice = 0;
        juegoImagenBloqueado = false;
        juegoImagenTerminado = false;
        juegoImagenPistas = JUEGO_IMAGEN_PISTAS_MAX;
        juegoImagenPistaUsada = false;

        // mostrarFinJuego() usa window.listaFiltrada y la variable aciertos
        window.listaFiltrada = juegoImagenOrden;
        aciertos = 0;

        const contenido = `
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado"><span class="modo-de-juego-seleccionado-texto">IMAGEN</span></span></h4>
            <div class="juego-imagen-container">
                <div class="juego-imagen-foto-col">
                    <div class="juego-imagen-card">
                        <img class="juego-imagen-foto" src="images/presidentes/presidente-desconocido.png" alt="¿Quién es este presidente?">
                    </div>
                    <button class="juego-imagen-pista-btn" type="button"></button>
                    <p class="juego-imagen-pista" id="ji-pista" hidden></p>
                </div>
                <div class="juego-imagen-panel">
                    <div class="juego-imagen-hud">
                        <span class="juego-imagen-timer" id="ji-timer">${configuracionJuego.tiempoImagen.toString().padStart(2, '0')}:00</span>
                        <span class="juego-imagen-contador">
                            <span id="ji-aciertos">0</span> / <span id="ji-total">${juegoImagenOrden.length}</span>
                        </span>
                    </div>
                    <label class="juego-imagen-label" for="ji-input">¿Qué presidente es?</label>
                    <input class="input-presidente juego-imagen-input" type="text" id="ji-input" placeholder="Ingrese el apellido..." autocomplete="off" autocapitalize="off" spellcheck="false">
                    <div class="juego-imagen-feedback" id="ji-feedback"></div>
                    <div class="juego-imagen-acciones">
                        <button class="juego-imagen-saltar" type="button">No sé / Paso</button>
                        <button class="juego-imagen-rendirse" type="button">Rendirse</button>
                    </div>
                </div>
            </div>
        `;
        main.insertAdjacentHTML("beforeend", contenido);

        // En mobile el header se vuelve compacto y el título del modo se
        // mueve dentro de la franja del header (igual que en el modo clásico).
        if (window.matchMedia('(max-width: 768px)').matches) {
            const navToggleEl = document.querySelector(".nav-toggle");
            const jugandoModoHeading = document.querySelector(".jugando-modo-heading");
            if (navToggleEl && jugandoModoHeading) {
                navToggleEl.insertAdjacentElement("afterend", jugandoModoHeading);
                ajustarBadgeModoAlAncho();
            }
        }

        const input = document.getElementById("ji-input");
        if (input) {
            input.addEventListener("input", verificarRespuestaImagen);
        }
        const botonSaltar = document.querySelector(".juego-imagen-saltar");
        if (botonSaltar) {
            botonSaltar.addEventListener("click", saltarPresidenteImagen);
        }
        const botonRendirseImagen = document.querySelector(".juego-imagen-rendirse");
        if (botonRendirseImagen) {
            botonRendirseImagen.addEventListener("click", rendirseJuegoImagen);
        }
        const botonPista = document.querySelector(".juego-imagen-pista-btn");
        if (botonPista) {
            botonPista.addEventListener("click", pedirPistaImagen);
        }

        mostrarPresidenteImagen();
        iniciarTemporizadorImagen(configuracionJuego.tiempoImagen * 60);
    }

    // --- Temporizador del modo "Adivina la imagen" ---
    function iniciarTemporizadorImagen(segundos) {
        detenerTemporizadorImagen();
        let restante = Math.max(1, Math.floor(segundos));
        const div = document.getElementById("ji-timer");

        const pintar = () => {
            const m = String(Math.floor(restante / 60)).padStart(2, "0");
            const s = String(restante % 60).padStart(2, "0");
            if (div) {
                div.textContent = `${m}:${s}`;
                div.classList.toggle("por-terminar", restante <= 30);
            }
        };

        pintar();
        juegoImagenTimer = setInterval(() => {
            restante--;
            pintar();
            if (restante <= 0) {
                detenerTemporizadorImagen();
                tiempoAgotadoImagen();
            }
        }, 1000);
    }

    function detenerTemporizadorImagen() {
        if (juegoImagenTimer) {
            clearInterval(juegoImagenTimer);
            juegoImagenTimer = null;
        }
    }

    function tiempoAgotadoImagen() {
        if (juegoImagenTerminado) return;
        juegoImagenTerminado = true;
        juegoImagenBloqueado = true;
        bloquearControlesImagen();
        marcarRestantesComoNoAcertados();
        mostrarFinJuego('tiempo');
    }

    function actualizarBotonPista() {
        const botonPista = document.querySelector(".juego-imagen-pista-btn");
        if (!botonPista) return;
        botonPista.textContent = `💡 Pedir pista (${juegoImagenPistas})`;
        botonPista.disabled = juegoImagenPistas <= 0 || juegoImagenPistaUsada || juegoImagenBloqueado;
    }

    function pedirPistaImagen() {
        if (juegoImagenPistas <= 0 || juegoImagenPistaUsada || juegoImagenBloqueado) return;
        if (juegoImagenIndice >= juegoImagenOrden.length) return;

        juegoImagenPistas--;
        juegoImagenPistaUsada = true;

        const pista = document.getElementById("ji-pista");
        if (pista) {
            pista.textContent = textoPistaMandatos(juegoImagenOrden[juegoImagenIndice]);
            pista.hidden = false;
        }
        actualizarBotonPista();
    }

    function mostrarPresidenteImagen() {
        if (juegoImagenTerminado) return;

        const foto = document.querySelector(".juego-imagen-foto");
        const input = document.getElementById("ji-input");
        const feedback = document.getElementById("ji-feedback");
        const card = document.querySelector(".juego-imagen-card");

        if (juegoImagenIndice >= juegoImagenOrden.length) {
            finalizarJuegoImagen();
            return;
        }

        const presidente = juegoImagenOrden[juegoImagenIndice];
        juegoImagenBloqueado = false;
        juegoImagenPistaUsada = false;

        if (card) card.classList.remove("acierto", "error");
        if (foto) {
            foto.src = presidente.imagen;
            foto.alt = "¿Quién es este presidente?";
        }
        if (feedback) {
            feedback.textContent = "";
            feedback.classList.remove("correcto", "incorrecto");
        }
        const pista = document.getElementById("ji-pista");
        if (pista) {
            pista.hidden = true;
            pista.textContent = "";
        }
        actualizarBotonPista();
        if (input) {
            input.value = "";
            input.disabled = false;
            input.focus();
        }
    }

    function verificarRespuestaImagen(event) {
        if (juegoImagenBloqueado) return;

        const textoIngresado = normalizarTexto(event.target.value);
        if (textoIngresado.length < 3) return;

        const presidente = juegoImagenOrden[juegoImagenIndice];
        if (!obtenerOpcionesValidas(presidente).has(textoIngresado)) return;

        // Acierto
        juegoImagenBloqueado = true;
        aciertos++;
        reproducirSonidoAcierto();
        presidente.resultadoPartida = 'acierto';

        const card = document.querySelector(".juego-imagen-card");
        const feedback = document.getElementById("ji-feedback");
        const input = document.getElementById("ji-input");
        const contador = document.getElementById("ji-aciertos");

        if (card) card.classList.add("acierto");
        if (feedback) {
            feedback.textContent = `✓ ${nombreCompletoPresidente(presidente)}`;
            feedback.classList.add("correcto");
        }
        if (input) input.disabled = true;
        if (contador) contador.textContent = aciertos;
        actualizarBotonPista();

        juegoImagenIndice++;
        setTimeout(mostrarPresidenteImagen, 1100);
    }

    function saltarPresidenteImagen() {
        if (juegoImagenBloqueado) return;
        if (juegoImagenIndice >= juegoImagenOrden.length) return;

        juegoImagenBloqueado = true;
        const presidente = juegoImagenOrden[juegoImagenIndice];
        presidente.resultadoPartida = 'error';
        const card = document.querySelector(".juego-imagen-card");
        const feedback = document.getElementById("ji-feedback");
        const input = document.getElementById("ji-input");

        if (card) card.classList.add("error");
        if (feedback) {
            feedback.textContent = `Era: ${nombreCompletoPresidente(presidente)}`;
            feedback.classList.add("incorrecto");
        }
        if (input) input.disabled = true;
        actualizarBotonPista();

        juegoImagenIndice++;
        setTimeout(mostrarPresidenteImagen, 1600);
    }

    // Al rendirse o agotarse el tiempo, todo lo que no se llegó a contestar
    // (incluido el presidente que se estaba mostrando) cuenta como error en
    // el resumen final.
    function marcarRestantesComoNoAcertados() {
        for (let i = juegoImagenIndice; i < juegoImagenOrden.length; i++) {
            if (juegoImagenOrden[i].resultadoPartida === null) {
                juegoImagenOrden[i].resultadoPartida = 'error';
            }
        }
    }

    function bloquearControlesImagen() {
        const input = document.getElementById("ji-input");
        const botonSaltar = document.querySelector(".juego-imagen-saltar");
        const botonRendirseImagen = document.querySelector(".juego-imagen-rendirse");
        const botonPista = document.querySelector(".juego-imagen-pista-btn");
        if (input) input.disabled = true;
        if (botonSaltar) botonSaltar.disabled = true;
        if (botonRendirseImagen) botonRendirseImagen.disabled = true;
        if (botonPista) botonPista.disabled = true;
    }

    function finalizarJuegoImagen() {
        juegoImagenTerminado = true;
        juegoImagenBloqueado = true;
        detenerTemporizadorImagen();
        bloquearControlesImagen();
        const gano = aciertos === juegoImagenOrden.length && juegoImagenOrden.length > 0;
        if (gano) lanzarConfetti();
        mostrarFinJuego(gano ? 'victoria' : 'fin');
    }

    function rendirseJuegoImagen() {
        if (juegoImagenTerminado || juegoImagenIndice >= juegoImagenOrden.length) return;
        juegoImagenTerminado = true;
        juegoImagenBloqueado = true;
        detenerTemporizadorImagen();
        bloquearControlesImagen();
        marcarRestantesComoNoAcertados();
        mostrarFinJuego('rendicion');
    }


    // ==========================================================================
    //  MODO "SOPA DE LETRAS"
    // ==========================================================================
    //  A la izquierda una grilla de letras; a la derecha, una pista por
    //  presidente (foto + años de mandato). Hay que encontrar cada APELLIDO
    //  arrastrando sobre la grilla, en cualquiera de las 8 direcciones
    //  (horizontal/vertical/diagonal, de derecha a izquierda o de abajo hacia
    //  arriba también). Al encontrarlo se tacha la pista y se revela el
    //  nombre. Se gana al encontrar todos los apellidos antes de que se
    //  acabe el tiempo.
    //  Reutiliza: presidentesUnicos, mezclarArray, normalizarTexto,
    //  nombreCompletoPresidente, mostrarFinJuego (vía window.listaFiltrada +
    //  la variable aciertos).

    // Las 8 direcciones de colocación. [df, dc], cada uno en {-1, 0, 1}.
    const SOPA_DIRECCIONES = [
        [0, 1],   // horizontal  →
        [0, -1],  // horizontal  ←
        [1, 0],   // vertical    ↓
        [-1, 0],  // vertical    ↑
        [1, 1],   // diagonal    ↘
        [-1, -1], // diagonal    ↖
        [1, -1],  // diagonal    ↙
        [-1, 1]   // diagonal    ↗
    ];
    const SOPA_LETRAS_RELLENO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Un color por presidente hallado, para distinguir las palabras en la grilla.
    // El rojo queda reservado para las que NO se encontraron al terminar. Ninguno
    // de estos puede coincidir con el celeste de ".sopa-celda.marcando"
    // (rgb(var(--blue-strong)) = #1bbef1): si a una palabra le toca ese mismo
    // color, mientras la estás seleccionando y ya resuelta se ven casi iguales
    // y no se distingue que se completó.
    const SOPA_COLORES = [
        "#3fb56b", "#e6b043", "#5c6bc0", "#e67e22",
        "#a980d8", "#15a89a", "#d98cb3", "#7fae3a"
    ];

    let sopaObjetivos = [];      // [{ u, palabra, celdas:[{r,c}], encontrada, color }]
    let sopaGrilla = [];         // matriz de letras
    let sopaTam = 0;             // lado de la grilla
    let sopaTimer = null;
    let sopaTerminado = false;
    let sopaSegundos = 0;         // cronómetro: tiempo transcurrido (cuenta hacia arriba, sin límite)
    let sopaResultadoOficial = null; // resultado guardado de la sopa de hoy
    let sopaEsRejugada = false;      // ya se completó hoy y se está rejugando
    let sopaFinInfo = null;          // datos para el dialog de fin

    // Arrastre en curso
    let sopaArrastrando = false;
    let sopaCeldaInicio = null;  // {r,c}
    let sopaCeldasMarcadas = []; // celdas resaltadas mientras se arrastra

    // --- Vista ampliada de la foto al pasar el mouse (o tocar) una pista ---
    // No agranda la card ni la miniatura en su lugar: es una copia de la
    // imagen en un overlay position:fixed, aparte del layout de la lista,
    // que "vuela" (animación FLIP) desde el tamaño/posición exactos de la
    // miniatura hasta agrandada en el centro de la pantalla, y de vuelta al
    // cerrarse. Un solo overlay compartido por todas las pistas (se crea
    // una vez y se reutiliza, no uno por card).
    let zoomFotoOverlayEl = null;
    let zoomFotoImgEl = null;
    let zoomFotoCardAbierta = null;
    let zoomFotoHoverTimeout = null;
    // Espera antes de agrandar la foto al pasar el mouse: evita que se
    // dispare con un simple paso de cursor por la card.
    const ZOOM_FOTO_HOVER_DELAY_MS = 500;

    function obtenerZoomFotoOverlay() {
        if (zoomFotoOverlayEl) return zoomFotoOverlayEl;
        zoomFotoOverlayEl = document.createElement("div");
        zoomFotoOverlayEl.className = "sopa-foto-zoom-overlay";
        zoomFotoImgEl = document.createElement("img");
        zoomFotoImgEl.className = "sopa-foto-zoom-img";
        zoomFotoImgEl.alt = "";
        zoomFotoOverlayEl.appendChild(zoomFotoImgEl);
        document.body.appendChild(zoomFotoOverlayEl);
        // Tocar el overlay (fuera de la imagen) lo cierra: en mobile es la
        // forma de "tocar cualquier parte de la pantalla" para achicarla de
        // nuevo (en desktop el overlay no intercepta clicks -ver CSS-, así
        // que ahí cerrar es siempre por mouseleave de la card original).
        zoomFotoOverlayEl.addEventListener("click", cerrarZoomFoto);
        return zoomFotoOverlayEl;
    }

    // Mide dónde terminaría la imagen agrandada "en reposo" (centrada,
    // tamaño final) y devuelve el transform que la hace lucir exactamente
    // como "rectOrigen" (la miniatura): es el estado inicial de la
    // animación de apertura, y el estado final de la de cierre.
    function calcularTransformFlipDesde(rectOrigen) {
        zoomFotoImgEl.style.transition = "none";
        zoomFotoImgEl.style.transform = "translate(-50%, -50%)";
        const rectDestino = zoomFotoImgEl.getBoundingClientRect();
        const dx = (rectOrigen.left + rectOrigen.width / 2) - (rectDestino.left + rectDestino.width / 2);
        const dy = (rectOrigen.top + rectOrigen.height / 2) - (rectDestino.top + rectDestino.height / 2);
        const sx = rectOrigen.width / rectDestino.width;
        const sy = rectOrigen.height / rectDestino.height;
        return `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    }

    function abrirZoomFoto(card) {
        const foto = card.querySelector(".sopa-pista-foto");
        if (!foto || !foto.src) return;
        const overlay = obtenerZoomFotoOverlay();
        zoomFotoCardAbierta = card;
        zoomFotoImgEl.src = foto.src;
        overlay.classList.add("activo");

        const transformInicial = calcularTransformFlipDesde(foto.getBoundingClientRect());
        zoomFotoImgEl.style.transform = transformInicial;
        // Fuerza el reflow para que el navegador registre este estado
        // inicial (sin transición) antes de animar al de reposo.
        zoomFotoImgEl.getBoundingClientRect();
        zoomFotoImgEl.style.transition = "transform 0.35s cubic-bezier(0.22, 0.9, 0.3, 1)";
        requestAnimationFrame(() => {
            zoomFotoImgEl.style.transform = "translate(-50%, -50%)";
        });
    }

    function cerrarZoomFoto() {
        if (!zoomFotoCardAbierta || !zoomFotoOverlayEl) return;
        const foto = zoomFotoCardAbierta.querySelector(".sopa-pista-foto");
        zoomFotoCardAbierta = null;
        zoomFotoOverlayEl.classList.remove("activo");
        if (!foto) return;
        const transformCierre = calcularTransformFlipDesde(foto.getBoundingClientRect());
        zoomFotoImgEl.style.transition = "transform 0.3s ease";
        requestAnimationFrame(() => {
            zoomFotoImgEl.style.transform = transformCierre;
        });
    }

    // Desktop (mouse de verdad): hover en cualquier parte de la card abre,
    // sacar el mouse de la card cierra. Mobile/táctil: tocar la imagen
    // abre, tocar cualquier parte de la pantalla (el overlay) cierra -ver
    // obtenerZoomFotoOverlay()-. Ramas separadas para que un mismo toque no
    // dispare las dos lógicas a la vez.
    function wireZoomFotosSopa() {
        const esHoverCapaz = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        document.querySelectorAll(".sopa-pista").forEach(card => {
            if (esHoverCapaz) {
                card.addEventListener("mouseenter", () => {
                    clearTimeout(zoomFotoHoverTimeout);
                    zoomFotoHoverTimeout = setTimeout(() => abrirZoomFoto(card), ZOOM_FOTO_HOVER_DELAY_MS);
                });
                card.addEventListener("mouseleave", () => {
                    clearTimeout(zoomFotoHoverTimeout);
                    cerrarZoomFoto();
                });
            } else {
                const foto = card.querySelector(".sopa-pista-foto");
                if (foto) foto.addEventListener("click", (e) => {
                    e.stopPropagation();
                    abrirZoomFoto(card);
                });
            }
        });
    }

    // Apellido "sopeable": una sola palabra, sin tildes, en MAYÚSCULAS (los
    // compuestos se juegan sin el espacio; ver PALABRA_GRILLA_ESPECIAL).
    function palabraSopaDe(u) {
        const especial = PALABRA_GRILLA_ESPECIAL[normalizarTexto(nombreCompletoPresidente(u))];
        return letraGrillaDe(especial || u.apellido);
    }

    // Presidentes elegibles: apellido de largo razonable para que entre en la
    // grilla y sea reconocible. Igual para todos (como el crucigrama): NO se
    // aplican los filtros de configuración, la del día es fija.
    // Los de la lista de exclusión fija (APELLIDOS_EXCLUSION_FIJA) nunca entran.
    function presidentesSopaDisponibles(maxLargo) {
        return presidentesUnicos.filter(u => {
            if (estaEnListaExclusionFija(u)) return false;
            const palabra = palabraSopaDe(u);
            return palabra.length >= 4 && palabra.length <= maxLargo;
        });
    }

    // Elige hasta `cantidad` presidentes con apellido único.
    function elegirPalabrasSopa(cantidad, maxLargo, rng) {
        const pool = mezclarConRng(presidentesSopaDisponibles(maxLargo), rng);
        const elegidas = [];
        const usadas = new Set();
        for (const u of pool) {
            if (elegidas.length >= cantidad) break;
            const palabra = palabraSopaDe(u);
            if (usadas.has(palabra)) continue;
            usadas.add(palabra);
            elegidas.push({ u, palabra });
        }
        return elegidas;
    }

    // Intenta ubicar una palabra en la grilla; devuelve las celdas o null.
    // Rango válido de la celda inicial en un eje, según hacia dónde avanza la
    // palabra en ese eje: si avanza (+1) tiene que arrancar antes para que
    // entre; si retrocede (-1) tiene que arrancar después; si no se mueve en
    // ese eje (0), puede arrancar en cualquier posición.
    function rangoInicioSopa(direccion, tam, largo) {
        if (direccion === 1) return [0, tam - largo];
        if (direccion === -1) return [largo - 1, tam - 1];
        return [0, tam - 1];
    }

    function intentarColocarSopa(grilla, palabra, tam, rng, intentos = 150) {
        for (let t = 0; t < intentos; t++) {
            const [df, dc] = SOPA_DIRECCIONES[Math.floor(rng() * SOPA_DIRECCIONES.length)];
            const [rMin, rMax] = rangoInicioSopa(df, tam, palabra.length);
            const [cMin, cMax] = rangoInicioSopa(dc, tam, palabra.length);
            const r0 = rMin + Math.floor(rng() * (rMax - rMin + 1));
            const c0 = cMin + Math.floor(rng() * (cMax - cMin + 1));
            const celdas = [];
            let ok = true;
            for (let i = 0; i < palabra.length; i++) {
                const r = r0 + df * i;
                const c = c0 + dc * i;
                const actual = grilla[r][c];
                if (actual && actual !== palabra[i]) { ok = false; break; }
                celdas.push({ r, c });
            }
            if (ok) return celdas;
        }
        return null;
    }

    function construirGrillaSopa(palabras, tam, rng) {
        const grilla = Array.from({ length: tam }, () => Array(tam).fill(""));
        const colocadas = [];
        // Palabras más largas primero: son las más difíciles de ubicar.
        [...palabras].sort((a, b) => b.palabra.length - a.palabra.length).forEach(item => {
            const celdas = intentarColocarSopa(grilla, item.palabra, tam, rng);
            if (!celdas) return; // si no entra, se descarta (rara vez pasa)
            celdas.forEach(({ r, c }, i) => { grilla[r][c] = item.palabra[i]; });
            colocadas.push({ u: item.u, palabra: item.palabra, celdas, encontrada: false });
        });
        for (let r = 0; r < tam; r++) {
            for (let c = 0; c < tam; c++) {
                if (!grilla[r][c]) {
                    grilla[r][c] = SOPA_LETRAS_RELLENO[Math.floor(rng() * SOPA_LETRAS_RELLENO.length)];
                }
            }
        }
        return { grilla, colocadas };
    }

    // Un solo tramo de años que abarca todos los mandatos del presidente
    // (p. ej. Perón 1946–1974), para que la pista quede compacta.
    function aniosMandato(u) {
        const inicios = u.periodos.map(p => p.inicio && p.inicio.getFullYear()).filter(Boolean);
        const enCurso = u.periodos.some(p => !p.fin);
        const fines = u.periodos.map(p => (p.fin ? p.fin.getFullYear() : new Date().getFullYear()));
        const desde = Math.min(...inicios);
        const hasta = Math.max(...fines);
        if (!isFinite(desde)) return "";
        if (desde === hasta) return `${desde}`;
        return `${desde}–${enCurso ? "hoy" : hasta}`;
    }

    function iniciarJuegoSopa() {
        modoActual = 'sopa';
        if (heroContent) heroContent.remove();
        main.classList.add("juego-activo");
        body.classList.add("juego-activo");

        sopaTerminado = false;
        sopaArrastrando = false;
        sopaCeldaInicio = null;
        sopaCeldasMarcadas = [];
        // Por si quedó abierta de una partida anterior (poco probable, pero
        // el overlay vive en document.body, fuera de lo que se reemplaza
        // acá abajo).
        if (zoomFotoOverlayEl) zoomFotoOverlayEl.classList.remove("activo");
        zoomFotoCardAbierta = null;

        const hoyISO = fechaHoyISO();
        sopaResultadoOficial = lsLeer(SOPA_LS_RES(hoyISO));
        sopaEsRejugada = !!sopaResultadoOficial;
        const racha = rachaVigente(SOPA_LS_STREAK, hoyISO);

        // Igual para todos: toda la generación usa el PRNG sembrado con la
        // fecha, nunca la configuración del usuario ni el tamaño de pantalla.
        const rng = mulberry32(hashCadena("sopa-" + hoyISO));
        const cantidad = 5;
        const maxLargo = 15;
        const baseTam = 12;

        const elegidas = elegirPalabrasSopa(cantidad, maxLargo, rng);
        const largoMax = elegidas.reduce((m, x) => Math.max(m, x.palabra.length), 0);
        sopaTam = Math.max(baseTam, largoMax + 1);

        const { grilla, colocadas } = construirGrillaSopa(elegidas, sopaTam, rng);
        sopaGrilla = grilla;
        // Orden cronológico para las pistas y el historial de fin de partida
        // (independiente del orden en que se colocaron en la grilla).
        sopaObjetivos = colocadas.sort((a, b) => {
            const ia = a.u.periodos[0].inicio ? a.u.periodos[0].inicio.getTime() : 0;
            const ib = b.u.periodos[0].inicio ? b.u.periodos[0].inicio.getTime() : 0;
            return ia - ib;
        });

        // Color por presidente + reset de datos para el historial de fin de partida.
        const paleta = mezclarConRng(SOPA_COLORES, rng);
        sopaObjetivos.forEach((o, i) => {
            o.color = paleta[i % paleta.length];
            o.u.imagen = o.u.imagenes[0];
            o.u.colorSopa = o.color;
            o.u.resultadoPartida = null;
        });

        // mostrarFinJuego() y el historial usan window.listaFiltrada + aciertos
        window.listaFiltrada = sopaObjetivos.map(o => o.u);
        aciertos = 0;

        const filasHTML = grilla.map((fila, r) =>
            fila.map((ch, c) => `<button type="button" class="sopa-celda" data-r="${r}" data-c="${c}">${ch}</button>`).join("")
        ).join("");

        const pistasHTML = sopaObjetivos.map((obj, i) => `
            <li class="sopa-pista" data-i="${i}">
                <img class="sopa-pista-foto" src="${obj.u.imagenes[0]}" alt="" loading="lazy">
                <span class="sopa-pista-datos">
                    <span class="sopa-pista-anios">${aniosMandato(obj.u)}</span>
                    <span class="sopa-pista-nombre"></span>
                </span>
            </li>
        `).join("");

        const contenido = `
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado"><span class="modo-de-juego-seleccionado-texto">SOPA</span></span></h4>
            <div class="sopa-container">
                <div class="sopa-grid-col">
                    <div class="sopa-grid" style="grid-template-columns: repeat(${sopaTam}, 1fr);">
                        ${filasHTML}
                    </div>
                </div>
                <div class="sopa-panel">
                    <div class="cruci-hud">
                        <span class="cruci-fecha">Sopa de letras del ${fechaHoyLegible()}</span>
                        <span class="cruci-hud-right">
                            ${racha > 0 ? `<span class="cruci-racha" title="Racha de días consecutivos">🔥 ${racha}</span>` : ""}
                        </span>
                    </div>
                    ${sopaEsRejugada ? `<p class="cruci-rejugada-banner">${textoBannerRejugadaSopa()}</p>` : ""}
                    <div class="sopa-hud">
                        <span class="sopa-timer" id="sopa-timer">00:00</span>
                        <span class="sopa-contador"><span id="sopa-aciertos">0</span> / <span id="sopa-total">${sopaObjetivos.length}</span></span>
                    </div>
                    <p class="sopa-instruccion">Encontrá el apellido de cada presidente</p>
                    <ul class="sopa-pistas">${pistasHTML}</ul>
                    <button class="sopa-rendirse" type="button">Rendirse</button>
                </div>
            </div>
        `;
        main.insertAdjacentHTML("beforeend", contenido);

        if (window.matchMedia('(max-width: 768px)').matches) {
            const navToggleEl = document.querySelector(".nav-toggle");
            const jugandoModoHeading = document.querySelector(".jugando-modo-heading");
            if (navToggleEl && jugandoModoHeading) {
                navToggleEl.insertAdjacentElement("afterend", jugandoModoHeading);
                ajustarBadgeModoAlAncho();
            }
        }

        wireSopaEventos();

        // Si es la primera vez del día y quedó una partida sin terminar
        // (se abandonó sin ganar ni rendirse), ofrecer retomarla en vez de
        // arrancar directo el cronómetro de cero.
        const progresoSopa = !sopaEsRejugada ? lsLeer(SOPA_LS_PROGRESO(hoyISO)) : null;
        if (progresoSopa && ((progresoSopa.encontrados || []).length > 0 || progresoSopa.segundos > 2)) {
            mostrarReanudarSopa(progresoSopa);
        } else if (!sopaEsRejugada) {
            // Primer intento del día: avisar antes de arrancar el cronómetro.
            mostrarListo('sopa', () => iniciarCronometroSopa());
        } else {
            iniciarCronometroSopa();
        }
    }

    function wireSopaEventos() {
        wireZoomFotosSopa();

        const grid = document.querySelector(".sopa-grid");
        if (!grid) return;

        const celdaDesde = (nodo) => {
            const btn = nodo && nodo.closest ? nodo.closest(".sopa-celda") : null;
            if (!btn || !grid.contains(btn)) return null;
            return { r: +btn.dataset.r, c: +btn.dataset.c };
        };

        grid.addEventListener("pointerdown", (e) => {
            if (sopaTerminado) return;
            const celda = celdaDesde(e.target);
            if (!celda) return;
            e.preventDefault();
            sopaArrastrando = true;
            sopaCeldaInicio = celda;
            pintarMarcadoSopa([celda]);
        });

        grid.addEventListener("pointermove", (e) => {
            if (!sopaArrastrando || !sopaCeldaInicio) return;
            const celda = celdaDesde(document.elementFromPoint(e.clientX, e.clientY));
            if (!celda) return;
            const linea = lineaEntreSopa(sopaCeldaInicio, celda);
            if (linea) pintarMarcadoSopa(linea);
        });

        const terminarArrastre = () => {
            if (!sopaArrastrando) return;
            sopaArrastrando = false;
            const seleccion = sopaCeldasMarcadas.slice();
            limpiarMarcadoSopa();
            sopaCeldaInicio = null;
            evaluarSeleccionSopa(seleccion);
        };
        grid.addEventListener("pointerup", terminarArrastre);
        grid.addEventListener("pointercancel", terminarArrastre);
        window.addEventListener("pointerup", terminarArrastre);

        const botonRendirse = document.querySelector(".sopa-rendirse");
        if (botonRendirse) botonRendirse.addEventListener("click", rendirseSopa);
    }

    // Celdas en línea recta entre a y b, solo si es horizontal, vertical o
    // diagonal exacta. Devuelve null si no forma una recta válida.
    function lineaEntreSopa(a, b) {
        const dr = b.r - a.r;
        const dc = b.c - a.c;
        if (dr === 0 && dc === 0) return [{ r: a.r, c: a.c }];
        const esRecta = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
        if (!esRecta) return null;
        const pasos = Math.max(Math.abs(dr), Math.abs(dc));
        const sr = Math.sign(dr);
        const sc = Math.sign(dc);
        const celdas = [];
        for (let i = 0; i <= pasos; i++) celdas.push({ r: a.r + sr * i, c: a.c + sc * i });
        return celdas;
    }

    function pintarMarcadoSopa(celdas) {
        limpiarMarcadoSopa();
        sopaCeldasMarcadas = celdas;
        celdas.forEach(({ r, c }) => {
            const btn = document.querySelector(`.sopa-celda[data-r="${r}"][data-c="${c}"]`);
            if (btn) btn.classList.add("marcando");
        });
    }

    function limpiarMarcadoSopa() {
        document.querySelectorAll(".sopa-celda.marcando").forEach(b => b.classList.remove("marcando"));
        sopaCeldasMarcadas = [];
    }

    function evaluarSeleccionSopa(celdas) {
        if (sopaTerminado || !celdas || celdas.length < 2) return;
        const dentro = celdas.every(({ r, c }) => sopaGrilla[r] && sopaGrilla[r][c] !== undefined);
        if (!dentro) return;

        const texto = celdas.map(({ r, c }) => sopaGrilla[r][c]).join("");
        const invertido = texto.split("").reverse().join("");
        const obj = sopaObjetivos.find(o => !o.encontrada && (o.palabra === texto || o.palabra === invertido));
        if (!obj) return;

        marcarPalabraEncontradaSopa(obj, sopaObjetivos.indexOf(obj));

        aciertos++;
        reproducirSonidoAcierto();
        const cont = document.getElementById("sopa-aciertos");
        if (cont) cont.textContent = aciertos;
        guardarProgresoSopa();

        if (sopaObjetivos.every(o => o.encontrada)) finalizarSopa(true);
    }

    // Marca UNA palabra como encontrada en la grilla + la pista: lo usa tanto
    // una jugada en vivo (evaluarSeleccionSopa) como la restauración silenciosa
    // de una partida retomada (aplicarProgresoSopa), que no debe repetir
    // sonido/contador acá (eso lo maneja cada llamador por separado).
    function marcarPalabraEncontradaSopa(obj, indice) {
        obj.encontrada = true;
        obj.u.resultadoPartida = 'acierto';
        obj.celdas.forEach(({ r, c }) => {
            const btn = document.querySelector(`.sopa-celda[data-r="${r}"][data-c="${c}"]`);
            if (btn) {
                btn.classList.add("encontrada");
                btn.style.backgroundColor = obj.color;
                btn.style.color = "#0a2235";
            }
        });
        marcarPistaSopa(indice, 'resuelta', obj.u, obj.color);
    }

    function marcarPistaSopa(indice, clase, u, color) {
        const pista = document.querySelector(`.sopa-pista[data-i="${indice}"]`);
        if (!pista) return;
        pista.classList.add(clase);
        if (color) {
            pista.style.borderColor = color;
            pista.style.boxShadow = `inset 4px 0 0 ${color}`;
        }
        const nombre = pista.querySelector(".sopa-pista-nombre");
        if (nombre) nombre.textContent = nombreCompletoPresidente(u);
    }

    // Guarda el progreso de la partida en curso (solo tiene sentido para la
    // PRIMERA vez del día: si ya es una rejugada o la partida ya terminó no
    // hay nada que retomar). Se llama en cada tick del cronómetro y también
    // apenas se encuentra una palabra, para perder como mucho ~1s de progreso
    // si se cierra la pestaña de golpe.
    function guardarProgresoSopa() {
        if (sopaEsRejugada || sopaTerminado) return;
        const encontrados = [];
        sopaObjetivos.forEach((o, i) => { if (o.encontrada) encontrados.push(i); });
        lsGuardar(SOPA_LS_PROGRESO(fechaHoyISO()), { segundos: sopaSegundos, encontrados });
    }

    // Diálogo compartido por sopa y crucigrama para ofrecer retomar una
    // partida sin terminar (ver "#reanudarDialog" en index.html). Conecta
    // los dos botones a las acciones que corresponda cada vez que se
    // muestra (distintas según el modo/la partida guardada), evitando que
    // un cierre por fuera del modal (backdrop o ESC) deje el juego sin
    // arrancar el cronómetro: en ese caso, por default, "empieza de cero".
    // Igual que #listoDialog, se abre con show() (no showModal()) para que
    // el header ("volver"/inicio) siga clickeable mientras está abierto —
    // el resto del tablero se ve borroso e inerte vía CSS
    // (".juego-preparandose" en ".main", que a propósito excluye al
    // header). Como no hay showModal() no hay ::backdrop nativo, así que el
    // "click afuera cierra" se reimplementa a mano con un listener en
    // document que ignora los clics dentro del diálogo O dentro del header.
    let reanudarDialogWireado = false;
    // Sin showModal() no hay top layer: el diálogo se abre en el mismo click
    // que lo dispara (p. ej. "Iniciar Juego"), y ESE click sigue burbujeando
    // hasta document DESPUÉS de que dialog.open ya es true — sin este guard,
    // el listener de "click afuera" de abajo lo interpretaría como un click
    // afuera y cerraría el diálogo al toque, saltándose la elección. Se
    // "arma" recién en el siguiente tick (setTimeout 0), después de que ese
    // click original termine de burbujear.
    let reanudarClickAfueraArmado = false;
    function wireReanudarBotones(dialog, { reanudar, empezarDeCero }) {
        const btnReanudar = document.getElementById("reanudarContinuar");
        const btnEmpezar = document.getElementById("reanudarEmpezarDeCero");
        if (!btnReanudar || !btnEmpezar) { empezarDeCero(); return; }

        let resuelto = false;
        const elegir = (cb) => { if (resuelto) return; resuelto = true; cb(); };
        const onReanudarClick = () => { dialog.close(); elegir(reanudar); };
        const onEmpezarClick = () => { dialog.close(); elegir(empezarDeCero); };

        btnReanudar.addEventListener("click", onReanudarClick, { once: true });
        btnEmpezar.addEventListener("click", onEmpezarClick, { once: true });
        dialog.addEventListener("close", () => {
            btnReanudar.removeEventListener("click", onReanudarClick);
            btnEmpezar.removeEventListener("click", onEmpezarClick);
            main.classList.remove("juego-preparandose");
            elegir(empezarDeCero);
        }, { once: true });

        reanudarClickAfueraArmado = false;
        setTimeout(() => { reanudarClickAfueraArmado = true; }, 0);

        if (!reanudarDialogWireado) {
            reanudarDialogWireado = true;
            document.addEventListener("click", (e) => {
                if (!dialog.open || !reanudarClickAfueraArmado) return;
                if (dialog.contains(e.target)) return;
                const headerEl = document.querySelector(".header");
                if (headerEl && headerEl.contains(e.target)) return;
                dialog.close();
            });
        }
    }

    // Diálogo "¿Estás listo?" compartido por sopa y crucigrama: se muestra
    // justo antes de arrancar el cronómetro en el PRIMER intento del día
    // (no en reanudar ni en rejugada, ver los llamados en
    // iniciarJuegoSopa()/iniciarJuegoCrucigrama()), con el tablero ya armado
    // pero borroso detrás (clase ".juego-preparandose" en ".main", que
    // excluye al header), para que quede claro que el tiempo de este
    // intento es el que cuenta. A diferencia de todos los demás <dialog>
    // del sitio, este NO se cierra al tocar afuera (ni tiene una acción de
    // "cancelar": la única forma de arrancar es tocar "Empezar", y la única
    // forma de salir sin arrancar es usar "volver"/el logo del header, que
    // siguen clickeables). Por eso se abre con show(), no showModal(): así
    // no hay backdrop nativo ni cierre por click-afuera/ESC de por medio.
    function mostrarListo(modo, alEmpezar) {
        const dialog = document.getElementById("listoDialog");
        const boton = document.getElementById("listoDialogEmpezar");
        if (!dialog || !boton) { alEmpezar(); return; }

        const icono = document.getElementById("listoDialogIcono");
        if (icono) icono.innerHTML = logoModo[modo] || "";

        const badge = document.getElementById("listoDialogBadge");
        if (badge) badge.textContent = MODOS[modo].badge;

        const fecha = document.getElementById("listoDialogFecha");
        if (fecha) fecha.textContent = fechaHoyLegible();

        const texto = document.getElementById("listoDialogTexto");
        if (texto) {
            texto.textContent = modo === 'sopa'
                ? "Tu resultado de la sopa de letras de hoy va a ser el tiempo que tardes en resolverla en este primer intento."
                : "Tu resultado del crucigrama de hoy va a ser el tiempo que tardes en resolverlo en este primer intento.";
        }

        main.classList.add("juego-preparandose");

        const onEmpezarClick = () => {
            dialog.close();
            main.classList.remove("juego-preparandose");
            alEmpezar();
        };
        boton.addEventListener("click", onEmpezarClick, { once: true });

        dialog.show();
    }

    // Restaura en silencio (sin sonido ni animación) las palabras que ya
    // estaban encontradas en una partida abandonada y retomada.
    function aplicarProgresoSopa(progreso) {
        (progreso.encontrados || []).forEach(i => {
            const obj = sopaObjetivos[i];
            if (!obj || obj.encontrada) return;
            marcarPalabraEncontradaSopa(obj, i);
            aciertos++;
        });
        const cont = document.getElementById("sopa-aciertos");
        if (cont) cont.textContent = aciertos;
        // Defensivo: si por algún motivo el progreso guardado tenía todas las
        // palabras encontradas (no debería pasar: se borra al terminar).
        if (sopaObjetivos.every(o => o.encontrada)) finalizarSopa(true);
    }

    // Ofrece retomar la sopa de letras donde se abandonó (solo tiene sentido
    // en la PRIMERA vez del día: ver el filtro en iniciarJuegoSopa). Si el
    // usuario elige "Reanudar", restaura lo encontrado y arranca el
    // cronómetro desde el tiempo guardado; si elige "Empezar de nuevo" (o
    // cierra el modal sin elegir), descarta el progreso y arranca de cero.
    function mostrarReanudarSopa(progreso) {
        const dialog = document.getElementById("reanudarDialog");
        if (!dialog) { iniciarCronometroSopa(); return; }
        const texto = document.getElementById("reanudarTexto");
        if (texto) {
            const encontrados = (progreso.encontrados || []).length;
            texto.textContent = `Habías encontrado ${encontrados} de ${sopaObjetivos.length} presidentes, con ${formatoCronometro(progreso.segundos)} de tiempo.`;
        }
        wireReanudarBotones(dialog, {
            reanudar: () => {
                aplicarProgresoSopa(progreso);
                iniciarCronometroSopa(progreso.segundos);
            },
            // "Empezar de nuevo" abandona la partida sin terminar de la
            // primera vez del día: eso ES rendirse, así que el progreso
            // que traías (lo que habías encontrado + el tiempo) queda
            // registrado como tu resultado oficial de hoy, igual que si
            // hubieras tocado "Rendirse" ahí mismo. Después arranca una
            // partida nueva de cero (ahora sí, una rejugada).
            empezarDeCero: () => {
                const hoyISO = fechaHoyISO();
                sopaResultadoOficial = {
                    segundos: progreso.segundos,
                    aciertos: (progreso.encontrados || []).length,
                    total: sopaObjetivos.length,
                    gano: false,
                    fecha: hoyISO
                };
                lsGuardar(SOPA_LS_RES(hoyISO), sopaResultadoOficial);
                sopaEsRejugada = true;
                lsBorrar(SOPA_LS_PROGRESO(hoyISO));
                // El banner de rejugada no se llegó a renderizar al armar la
                // pantalla (en ese momento todavía no era una rejugada).
                mostrarBannerRejugada(".sopa-panel", textoBannerRejugadaSopa());
                iniciarCronometroSopa();
            }
        });
        main.classList.add("juego-preparandose");
        dialog.show();
    }

    // Cronómetro sin límite (como el crucigrama): cuenta hacia arriba desde
    // "segundosIniciales" (0 salvo que se esté retomando una partida sin
    // terminar); el tiempo que tardaste se guarda al resolverlo la primera
    // vez del día.
    function iniciarCronometroSopa(segundosIniciales = 0) {
        detenerTemporizadorSopa();
        sopaSegundos = segundosIniciales;
        const div = document.getElementById("sopa-timer");
        if (div) div.textContent = formatoCronometro(sopaSegundos);
        sopaTimer = setInterval(() => {
            sopaSegundos++;
            if (div) div.textContent = formatoCronometro(sopaSegundos);
            guardarProgresoSopa();
        }, 1000);
    }

    function detenerTemporizadorSopa() {
        if (sopaTimer) { clearInterval(sopaTimer); sopaTimer = null; }
    }

    function revelarSopaNoEncontradas() {
        sopaObjetivos.forEach((o, i) => {
            if (o.encontrada) return;
            o.u.resultadoPartida = 'error';
            o.celdas.forEach(({ r, c }) => {
                const btn = document.querySelector(`.sopa-celda[data-r="${r}"][data-c="${c}"]`);
                if (btn) btn.classList.add("revelada");
            });
            marcarPistaSopa(i, 'revelada', o.u);
        });
    }

    function finalizarSopa(gano) {
        if (sopaTerminado) return;
        sopaTerminado = true;
        sopaArrastrando = false;
        detenerTemporizadorSopa();
        limpiarMarcadoSopa();
        const botonRendirse = document.querySelector(".sopa-rendirse");
        if (botonRendirse) botonRendirse.disabled = true;
        if (!gano) revelarSopaNoEncontradas();

        const segundos = sopaSegundos;
        const total = sopaObjetivos.length;
        const aciertosPartida = aciertos;
        const hoyISO = fechaHoyISO();
        // Terminada (gane o se rinda), ya no hay nada que retomar.
        lsBorrar(SOPA_LS_PROGRESO(hoyISO));

        // El resultado del día es el de la PRIMERA vez que se completó.
        const primeraVez = !sopaResultadoOficial;
        let racha = rachaVigente(SOPA_LS_STREAK, hoyISO);
        let record = null;

        if (primeraVez) {
            sopaResultadoOficial = { segundos, aciertos: aciertosPartida, total, gano, fecha: hoyISO };
            lsGuardar(SOPA_LS_RES(hoyISO), sopaResultadoOficial);
            if (gano) record = evaluarRecord(SOPA_LS_RECORD, segundos, hoyISO);
        }
        // La racha suma el día apenas lo COMPLETÁS, aunque te hayas rendido
        // en el primer intento: sumarRacha es idempotente si ya se sumó hoy,
        // así que no hay riesgo de sumarlo dos veces.
        if (gano) racha = sumarRacha(SOPA_LS_STREAK, hoyISO);
        // El tick de "completado" es aparte del resultado oficial: se marca
        // apenas la resolvés, sea en la primera vez o en una rejugada
        // después de haberte rendido (ver actualizarEstadoDiarioEnTarjetas).
        // Una vez en true queda así todo el día, no se puede "desmarcar".
        if (gano) lsGuardar(SOPA_LS_COMPLETADO(hoyISO), true);
        if (primeraVez || gano) {
            // La tarjeta del carrusel del inicio pasa a su estado nuevo ya
            // mismo, sin esperar a volver al inicio ni recargar la página.
            actualizarEstadoDiarioEnTarjetas();
        }

        sopaFinInfo = {
            primeraVez, gano, segundos, aciertosPartida, total, racha, record,
            oficial: sopaResultadoOficial
        };

        if (gano) lanzarConfetti();
        mostrarFinJuego(gano ? 'victoria' : 'rendicion');
    }

    function rendirseSopa() {
        finalizarSopa(false);
    }


    // ==========================================================================
    //  MODO "CRUCIGRAMA" (del día)
    // ==========================================================================
    //  Un crucigrama de apellidos de presidentes que se regenera cada día y es
    //  IGUAL para todos: toda la generación usa un PRNG sembrado con la fecha,
    //  nunca la configuración del usuario ni el tamaño de pantalla.
    //  Cada pista es el/los período/s de gobierno; se escribe el apellido en
    //  la grilla. Pistas numeradas a la derecha (Horizontales / Verticales).

    let cruciData = null;          // { grilla, entradas, ancho, alto }
    let cruciEntradas = [];        // [{ palabra, u, r, c, dir, celdas, numero }]
    let cruciMapa = new Map();     // "numero-DIR" -> entrada
    let cruciActiva = null;        // entrada activa
    let cruciCeldaActiva = null;   // { r, c }
    let cruciTerminado = false;
    let cruciCronometro = null;    // intervalo del cronómetro
    let cruciSegundos = 0;         // tiempo transcurrido (cuenta hacia arriba)
    let cruciResultadoOficial = null; // resultado guardado del crucigrama de hoy
    let cruciEsRejugada = false;      // ya se completó hoy y se está rejugando
    let cruciFinInfo = null;          // datos para el dialog de fin
    let cruciResueltasPrev = new Set(); // entradas ya verdes (para animar las nuevas)

    // --- Persistencia (localStorage) ---
    // Mismo mecanismo para los dos modos "del día" (crucigrama y sopa de
    // letras): cada uno con sus propias claves, pero compartiendo la lógica
    // de racha/récord (rachaVigente/sumarRacha/evaluarRecord reciben la
    // clave de storage como parámetro).
    const CRUCI_LS_RES = f => `cruci-res-${f}`;
    const CRUCI_LS_STREAK = "cruci-streak";
    const CRUCI_LS_RECORD = "cruci-record";
    const SOPA_LS_RES = f => `sopa-res-${f}`;
    const SOPA_LS_STREAK = "sopa-streak";
    const SOPA_LS_RECORD = "sopa-record";
    // Partida sin terminar de la PRIMERA vez del día (la única que cuenta):
    // si se abandona sin ganar ni rendirse y se vuelve a entrar el mismo día,
    // se puede retomar donde quedó en vez de arrancar de cero. Se borra al
    // terminar la partida (gane o se rinda) — ver finalizarSopa/finalizarCrucigrama.
    const SOPA_LS_PROGRESO = f => `sopa-progreso-${f}`;
    const CRUCI_LS_PROGRESO = f => `cruci-progreso-${f}`;
    // "Completado" es DISTINTO de "oficial" (SOPA_LS_RES/CRUCI_LS_RES): el
    // oficial se fija para siempre en la PRIMERA vez (gane o se rinda, ver
    // finalizarSopa/finalizarCrucigrama) y es lo que cuenta para el
    // historial/racha/récord. "Completado" en cambio marca si en algún
    // momento del día —esa primera vez o cualquier rejugada después de
    // rendirte— llegaste a resolverla entera; el tick verde de la tarjeta
    // del modo (actualizarEstadoDiarioEnTarjetas) se basa en ESTO, no en si
    // ya existe un resultado oficial, para no marcarla como "hecha" con un
    // simple "me rendí".
    const SOPA_LS_COMPLETADO = f => `sopa-completado-${f}`;
    const CRUCI_LS_COMPLETADO = f => `cruci-completado-${f}`;

    function lsLeer(clave) {
        try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; }
    }
    function lsGuardar(clave, valor) {
        try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* modo privado, etc. */ }
    }
    function lsBorrar(clave) {
        try { localStorage.removeItem(clave); } catch (e) { /* modo privado, etc. */ }
    }

    // Texto del aviso que se ve al reingresar el mismo día a un modo diario
    // ya jugado. Tres casos: ganaste (nada más que decir), te rendiste pero
    // todavía no la completaste (podés seguir intentando, para el tick —
    // pero el tiempo no cuenta), o te rendiste y ya la completaste después
    // en una rejugada (el tick ya está, solo aclara que el oficial sigue
    // siendo "te rendiste").
    function textoBannerRejugadaSopa() {
        const resultado = sopaResultadoOficial.gano
            ? formatoCronometro(sopaResultadoOficial.segundos)
            : "Te rendiste";
        return `Tu resultado de hoy en tu primer intento: ${resultado}`;
    }
    function textoBannerRejugadaCrucigrama() {
        const resultado = cruciResultadoOficial.gano
            ? formatoCronometro(cruciResultadoOficial.segundos)
            : "Te rendiste";
        return `Tu resultado de hoy en tu primer intento: ${resultado}`;
    }

    // Inserta (o actualiza, si ya existe) el aviso de rejugada dentro del
    // panel del juego. Hace falta como función aparte porque cuando "Empezar
    // de nuevo" convierte la partida en una rejugada sobre la marcha, la
    // pantalla ya se armó SIN ese aviso (en ese momento todavía no lo era).
    function mostrarBannerRejugada(panelSelector, texto) {
        const panel = document.querySelector(panelSelector);
        if (!panel) return;
        let banner = panel.querySelector(".cruci-rejugada-banner");
        if (!banner) {
            banner = document.createElement("p");
            banner.className = "cruci-rejugada-banner";
            const hud = panel.querySelector(".cruci-hud");
            if (hud) hud.insertAdjacentElement("afterend", banner);
            else panel.prepend(banner);
        }
        banner.textContent = texto;
    }

    function fechaISOMenosDias(iso, n) {
        const [y, m, d] = iso.split("-").map(Number);
        const dt = new Date(y, m - 1, d - n);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    }

    // Racha vigente sin tocar el storage (para mostrar durante la partida).
    function rachaVigente(claveStreak, hoyISO) {
        const s = lsLeer(claveStreak);
        if (!s || !s.ultima) return 0;
        if (s.ultima === hoyISO || s.ultima === fechaISOMenosDias(hoyISO, 1)) return s.count || 0;
        return 0;
    }
    // Suma el día de hoy a la racha (solo al ganar por primera vez).
    function sumarRacha(claveStreak, hoyISO) {
        const s = lsLeer(claveStreak) || { count: 0, ultima: null };
        if (s.ultima === hoyISO) return s.count;
        s.count = (s.ultima === fechaISOMenosDias(hoyISO, 1)) ? (s.count || 0) + 1 : 1;
        s.ultima = hoyISO;
        lsGuardar(claveStreak, s);
        return s.count;
    }

    // Muestra la racha de días consecutivos (si hay alguna) en las
    // tarjetas de Sopa de letras y Crucigrama, tanto en el carrusel del
    // inicio como en la grilla de "Ver modos de juego": antes solo se veía
    // adentro de la partida. Va acá (no en htmlReglas(), donde se arman
    // las tarjetas del carrusel) porque recién en este punto del archivo
    // están definidas las claves/funciones de racha (SOPA_LS_STREAK,
    // rachaVigente, etc.); llamarlas desde más arriba tira ReferenceError
    // por temporal dead zone.
    function actualizarRachaEnTarjetas() {
        const hoyISO = fechaHoyISO();
        [
            { modo: "sopa", clave: SOPA_LS_STREAK },
            { modo: "crucigrama", clave: CRUCI_LS_STREAK },
        ].forEach(({ modo, clave }) => {
            const racha = rachaVigente(clave, hoyISO);
            if (racha <= 0) return;
            const texto = `🔥 ${racha}`;
            const titulo = `Racha de ${racha} ${racha === 1 ? "día" : "días"} consecutivos`;

            // Carrusel del inicio: el span ya existe (oculto) desde htmlReglas().
            const spanCarrusel = document.querySelector(`.modo-actual-card[data-modo="${modo}"] .modo-card-racha`);
            if (spanCarrusel) {
                spanCarrusel.textContent = texto;
                spanCarrusel.title = titulo;
                spanCarrusel.hidden = false;
            }

            // Grilla de "Ver modos de juego": ahí la tarjeta es HTML fijo
            // (no generado por script.js), así que el span se crea recién acá.
            const tarjetaGrilla = document.querySelector(`.modo-card[data-modo="${modo}"]`);
            if (tarjetaGrilla && !tarjetaGrilla.querySelector(".modo-card-racha")) {
                const span = document.createElement("span");
                span.className = "modo-card-racha";
                span.textContent = texto;
                span.title = titulo;
                const contador = tarjetaGrilla.querySelector(".modo-card-contador");
                if (contador) {
                    contador.insertAdjacentElement("afterend", span);
                } else {
                    tarjetaGrilla.querySelector(".modo-card-texto").appendChild(span);
                }
            }
        });
    }
    actualizarRachaEnTarjetas();

    // Estado del desafío diario (resuelto / no resuelto) en la tarjeta del
    // carrusel del inicio: mismo esquema que actualizarRachaEnTarjetas() de
    // arriba, con las mismas restricciones de orden (necesita SOPA_LS_RES/
    // CRUCI_LS_RES/lsLeer/fechaHoyISO, ya definidas acá arriba). Se
    // re-ejecuta al terminar una partida de sopa o crucigrama (ver
    // finalizarSopa/finalizarCrucigrama) para que la tarjeta pase a
    // "resuelto" sin recargar la página, y en cada tick del contador de
    // medianoche (actualizarContadoresReinicioDiario) para que, pasada la
    // medianoche, un modo resuelto vuelva solo a pendiente.
    const TILDE_SVG_ESTADO_DIARIO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="rgb(var(--navy))" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    // Aplica el estado (insignia + línea "No resuelta/Resuelta · próxima
    // en...") a UNA tarjeta ya encontrada en el DOM — la usan tanto la del
    // carrusel del inicio (".modo-actual-card") como la de la grilla de
    // "Ver modos de juego" (".modo-card"), que comparten los mismos nombres
    // de clase internos (".modo-card-badge-estado", ".modo-card-estado",
    // ".modo-card-estado-texto").
    function aplicarEstadoDiarioATarjeta(card, modo, resuelto) {
        const datos = MODOS[modo];
        card.classList.toggle("is-pendiente", !resuelto);
        card.classList.toggle("is-resuelto", resuelto);

        const insignia = card.querySelector(".modo-card-badge-estado");
        if (insignia) {
            insignia.hidden = false;
            insignia.className = "modo-card-badge-estado " + (resuelto ? "modo-card-badge-ok" : "modo-card-badge-nuevo");
            insignia.innerHTML = resuelto ? TILDE_SVG_ESTADO_DIARIO : datos.etiquetaNuevo;
        }

        const estado = card.querySelector(".modo-card-estado");
        if (estado) {
            estado.hidden = false;
            estado.classList.toggle("es-pendiente", !resuelto);
            estado.classList.toggle("es-resuelto", resuelto);
            const texto = estado.querySelector(".modo-card-estado-texto");
            if (texto) texto.textContent = `${resuelto ? datos.textoResuelto : datos.textoPendiente} · ${datos.textoProxima}`;
        }
    }

    function actualizarEstadoDiarioEnTarjetas() {
        const hoyISO = fechaHoyISO();
        [
            { modo: "sopa", claveCompletado: SOPA_LS_COMPLETADO },
            { modo: "crucigrama", claveCompletado: CRUCI_LS_COMPLETADO },
        ].forEach(({ modo, claveCompletado }) => {
            // El tick verde es "la resolviste alguna vez hoy" (completado),
            // NO "ya tenés un resultado oficial" — rendirte deja un
            // resultado oficial pero no debe pintar el tick.
            const resuelto = !!lsLeer(claveCompletado(hoyISO));
            // Carrusel del inicio.
            const cardCarrusel = document.querySelector(`.modo-actual-card[data-modo="${modo}"]`);
            if (cardCarrusel) aplicarEstadoDiarioATarjeta(cardCarrusel, modo, resuelto);
            // Grilla de "Ver modos de juego".
            const cardGrilla = document.querySelector(`.modo-card[data-modo="${modo}"]`);
            if (cardGrilla) aplicarEstadoDiarioATarjeta(cardGrilla, modo, resuelto);
        });
    }
    actualizarEstadoDiarioEnTarjetas();

    // Compara y guarda el récord personal de tiempo. Devuelve cómo salió.
    function evaluarRecord(claveRecord, segundos, hoyISO) {
        const r = lsLeer(claveRecord);
        if (!r || segundos < r.segundos) {
            lsGuardar(claveRecord, { segundos, fecha: hoyISO });
            return { nuevo: true, anterior: r ? r.segundos : null };
        }
        return { nuevo: false, mejor: r.segundos, fecha: r.fecha };
    }

    // --- PRNG sembrado por fecha (mulberry32) ---
    function hashCadena(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }
    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function fechaHoyISO() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    function fechaHoyLegible() {
        const d = new Date();
        return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    }

    // --- Cuenta regresiva hasta que se reinicien los modos "del día" ---
    // Sopa de letras y Crucigrama usan la fecha local como semilla, así que
    // ambos cambian exactamente a la medianoche local del dispositivo.
    function msHastaMedianoche() {
        const ahora = new Date();
        const medianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0);
        return medianoche - ahora;
    }
    function formatoCuentaRegresiva(ms) {
        const totalSeg = Math.max(0, Math.floor(ms / 1000));
        const h = String(Math.floor(totalSeg / 3600)).padStart(2, "0");
        const m = String(Math.floor((totalSeg % 3600) / 60)).padStart(2, "0");
        const s = String(totalSeg % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }
    // Actualiza CUALQUIER elemento ".contador-reinicio-diario" presente en la
    // página: los que viven dentro de la línea de estado (".modo-card-estado",
    // tanto en el carrusel del inicio como en la grilla de "Ver modos de
    // juego") llevan solo el tiempo, porque el prefijo ya lo pone esa línea
    // ("No resuelta · próxima en …" / "Resuelta · próxima en …"); cualquier
    // otro (formato viejo, si quedara alguno) sigue con el texto completo.
    function actualizarContadoresReinicioDiario() {
        const elementos = document.querySelectorAll(".contador-reinicio-diario");
        if (!elementos.length) return;
        const tiempo = formatoCuentaRegresiva(msHastaMedianoche());
        elementos.forEach(el => {
            el.textContent = el.closest(".modo-card-estado") ? tiempo : `Se reinicia en ${tiempo}`;
        });
        // Corre acá también (no solo al terminar una partida) para que, si
        // el reloj cruza la medianoche con la página abierta, un modo
        // resuelto vuelva a pendiente sin necesidad de recargar.
        actualizarEstadoDiarioEnTarjetas();
    }
    if (document.querySelector(".contador-reinicio-diario")) {
        actualizarContadoresReinicioDiario();
        setInterval(actualizarContadoresReinicioDiario, 1000);
    }
    function mezclarConRng(array, rng) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // Apellidos compuestos que en crucigrama/sopa se juegan distinto a como
    // figuran en u.apellido (sin el "de" delante, en el caso de Alvear).
    const PALABRA_GRILLA_ESPECIAL = {
        [normalizarTexto("Marcelo Torcuato de Alvear")]: "Alvear"
    };

    // Apellidos aptos para el crucigrama: sin tildes, 4–15 letras (los
    // compuestos se juegan como una sola palabra, sin el espacio).
    // NO se aplican los filtros de configuración (el del día es fijo).
    // Los de la lista de exclusión fija (APELLIDOS_EXCLUSION_FIJA) nunca entran.
    function poolCrucigrama(rng) {
        const vistas = new Map(); // palabra -> índice en pool
        const pool = [];
        presidentesUnicos.forEach(u => {
            if (estaEnListaExclusionFija(u)) return;
            const especial = PALABRA_GRILLA_ESPECIAL[normalizarTexto(nombreCompletoPresidente(u))];
            const palabra = letraGrillaDe(especial || u.apellido);
            if (palabra.length < 4 || palabra.length > 15) return;
            if (vistas.has(palabra)) {
                // Dos presidentes distintos con la misma palabra de grilla
                // (ambos Sáenz Peña, o Cristina/Alberto Fernández): en vez de
                // que uno tape siempre al otro, se alterna al azar cuál entra
                // hoy, con la misma semilla del día (mismo resultado todo el
                // día, cambia de un día a otro).
                if (rng() < 0.5) return;
                pool[vistas.get(palabra)] = { u, palabra };
                return;
            }
            vistas.set(palabra, pool.length);
            pool.push({ u, palabra });
        });
        return pool;
    }

    // --- Generador de crucigrama (greedy con cruces + compacidad) ---
    const CRUCI_DIM_MAX = 15; // lado máximo del tablero

    function armarCrucigrama(orden, rng) {
        const celdas = new Map(); // "r,c" -> { letra }
        const entradas = [];      // { palabra, u, r, c, dir, celdas:[{r,c}] }
        const key = (r, c) => `${r},${c}`;
        const bounds = { minR: 0, minC: 0, maxR: 0, maxC: 0 };

        function puedeColocar(palabra, r0, c0, dir) {
            const [dr, dc] = dir === 'H' ? [0, 1] : [1, 0];
            const [pr, pc] = dir === 'H' ? [1, 0] : [0, 1];
            if (celdas.has(key(r0 - dr, c0 - dc))) return null;
            if (celdas.has(key(r0 + dr * palabra.length, c0 + dc * palabra.length))) return null;
            let cruces = 0, nuevas = 0;
            for (let i = 0; i < palabra.length; i++) {
                const r = r0 + dr * i, c = c0 + dc * i;
                const cel = celdas.get(key(r, c));
                if (cel) {
                    if (cel.letra !== palabra[i]) return null;
                    cruces++;
                } else {
                    nuevas++;
                    if (celdas.has(key(r + pr, c + pc))) return null;
                    if (celdas.has(key(r - pr, c - pc))) return null;
                }
            }
            if (nuevas === 0) return null;                       // palabra duplicada encima de otra
            if (entradas.length > 0 && cruces === 0) return null; // toda palabra debe cruzar
            return { cruces, nuevas };
        }

        // Cuánto crecería cada lado del tablero al colocar esta palabra, y si
        // el tablero seguiría dentro del máximo.
        function crecimiento(r0, c0, dir, largo) {
            const rf = dir === 'H' ? r0 : r0 + largo - 1;
            const cf = dir === 'H' ? c0 + largo - 1 : c0;
            const nMinR = Math.min(bounds.minR, r0), nMinC = Math.min(bounds.minC, c0);
            const nMaxR = Math.max(bounds.maxR, rf), nMaxC = Math.max(bounds.maxC, cf);
            const alto = nMaxR - nMinR + 1, ancho = nMaxC - nMinC + 1;
            if (alto > CRUCI_DIM_MAX || ancho > CRUCI_DIM_MAX) return null;
            const crece = (alto - (bounds.maxR - bounds.minR + 1)) + (ancho - (bounds.maxC - bounds.minC + 1));
            return { crece, nMinR, nMinC, nMaxR, nMaxC };
        }

        function colocar(palabra, u, r0, c0, dir) {
            const [dr, dc] = dir === 'H' ? [0, 1] : [1, 0];
            const cs = [];
            for (let i = 0; i < palabra.length; i++) {
                const r = r0 + dr * i, c = c0 + dc * i;
                if (!celdas.has(key(r, c))) celdas.set(key(r, c), { letra: palabra[i] });
                cs.push({ r, c });
                bounds.minR = Math.min(bounds.minR, r); bounds.minC = Math.min(bounds.minC, c);
                bounds.maxR = Math.max(bounds.maxR, r); bounds.maxC = Math.max(bounds.maxC, c);
            }
            entradas.push({ palabra, u, r: r0, c: c0, dir, celdas: cs });
        }

        colocar(orden[0].palabra, orden[0].u, 0, 0, 'H');

        for (let w = 1; w < orden.length; w++) {
            const { palabra, u } = orden[w];
            let mejor = null;
            for (const ent of entradas) {
                for (let i = 0; i < palabra.length; i++) {
                    for (let j = 0; j < ent.palabra.length; j++) {
                        if (palabra[i] !== ent.palabra[j]) continue;
                        const dir = ent.dir === 'H' ? 'V' : 'H';
                        const [dr, dc] = dir === 'H' ? [0, 1] : [1, 0];
                        const cj = ent.celdas[j];
                        const r0 = cj.r - dr * i;
                        const c0 = cj.c - dc * i;
                        const val = puedeColocar(palabra, r0, c0, dir);
                        if (!val) continue;
                        const crec = crecimiento(r0, c0, dir, palabra.length);
                        if (!crec) continue; // se pasa del tamaño máximo
                        const score = val.cruces * 12 - val.nuevas * 0.4 - crec.crece * 4 + rng() * 0.4;
                        if (!mejor || score > mejor.score) mejor = { r0, c0, dir, score };
                    }
                }
            }
            if (mejor) colocar(palabra, u, mejor.r0, mejor.c0, mejor.dir);
        }

        // Normalizar coordenadas a (0,0)
        let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
        for (const k of celdas.keys()) {
            const [r, c] = k.split(",").map(Number);
            if (r < minR) minR = r; if (c < minC) minC = c;
            if (r > maxR) maxR = r; if (c > maxC) maxC = c;
        }
        const alto = maxR - minR + 1, ancho = maxC - minC + 1;
        const grilla = Array.from({ length: alto }, () => Array(ancho).fill(null));
        for (const [k, v] of celdas.entries()) {
            const [r, c] = k.split(",").map(Number);
            grilla[r - minR][c - minC] = { letra: v.letra };
        }
        entradas.forEach(e => {
            e.r -= minR; e.c -= minC;
            e.celdas = e.celdas.map(({ r, c }) => ({ r: r - minR, c: c - minC }));
        });

        // Numerar celdas de inicio
        let num = 0;
        const numeroDe = new Map();
        for (let r = 0; r < alto; r++) {
            for (let c = 0; c < ancho; c++) {
                if (!grilla[r][c]) continue;
                const inicioH = (c === 0 || !grilla[r][c - 1]) && (c + 1 < ancho && grilla[r][c + 1]);
                const inicioV = (r === 0 || !grilla[r - 1][c]) && (r + 1 < alto && grilla[r + 1][c]);
                if (inicioH || inicioV) {
                    num++;
                    grilla[r][c].num = num;
                    numeroDe.set(`${r},${c}`, num);
                }
            }
        }
        entradas.forEach(e => { e.numero = numeroDe.get(`${e.r},${e.c}`); });
        entradas.sort((a, b) => (a.numero - b.numero) || (a.dir === 'H' ? -1 : 1));

        return { grilla, entradas, ancho, alto, area: ancho * alto, celdasUsadas: celdas.size };
    }

    function construirCrucigrama(pool, rng) {
        // "Calidad" = muchas palabras cruzadas y tablero compacto (buena
        // densidad de relleno). Probamos varios órdenes y nos quedamos con el
        // mejor.
        const calidad = res => res.entradas.length * 100 - res.area
            + (res.celdasUsadas / res.area) * 60;
        let mejor = null;
        for (let intento = 0; intento < 40; intento++) {
            const orden = mezclarConRng(pool, rng)
                .sort((a, b) => b.palabra.length - a.palabra.length);
            const res = armarCrucigrama(orden, rng);
            if (!mejor || calidad(res) > calidad(mejor)) mejor = res;
            if (mejor.entradas.length >= 9 && mejor.celdasUsadas / mejor.area >= 0.42) break;
        }
        return mejor;
    }

    function inputCruci(r, c) {
        return document.querySelector(`.cruci-input[data-r="${r}"][data-c="${c}"]`);
    }
    function entradasEnCelda(r, c) {
        return cruciEntradas.filter(e => e.celdas.some(cc => cc.r === r && cc.c === c));
    }
    function periodosTexto(u) {
        return u.periodos.map(p => p.toString().replace(/\s+/g, "")).join("  ·  ");
    }

    // --- Pistas del crucigrama ---
    // Lista curada a mano (una entrada por presidente único, con varias
    // pistas equivalentes cada una). La del día se elige con el PRNG
    // sembrado por fecha: el mismo presidente en otra fecha trae otra pista
    // (no memorizable). Incluye también a los presidentes de la lista de
    // exclusión fija (ver APELLIDOS_EXCLUSION_FIJA): quedan cargados por si
    // en el futuro se decide incluirlos, aunque hoy no se usan.
    const CRUCI_PISTAS_CURADAS = {
        [normalizarTexto("Bernardino Rivadavia")]: [
            "El presidente de nombre Bernardino que asumió en 1826",
            "Su apellido da origen al sillón que usan los presidentes de la nación",
            "Primer presidente de las Provincias Unidas del Río de la Plata."
        ],
        [normalizarTexto("Vicente López")]: [
            "Designado como presidente provisional tras la renuncia de Rivadavia",
            "El presidente de nombre Vicente que sucedió a Rivadavia",
            "Fue autor de la letra del Himno Nacional Argentino",
            "Da nombre a un partido bonaerense limítrofe con la capital federal"
        ],
        [normalizarTexto("Bartolomé Mitre")]: [
            "El presidente de nombre Bartolomé que asumió en 1862",
            "Primer presidente de la Argentina unificada, fue sucedido por Sarmiento",
            "Fundó el diario La Nación",
            "Condujo la guerra de la Triple Alianza durante su gobierno"
        ],
        [normalizarTexto("Domingo Faustino Sarmiento")]: [
            "El presidente de nombre Domingo Faustino que asumió en 1868",
            "Educador y escritor, reconocido por su impulso a la educación pública y la modernización del país",
            "El dia del maestro se celebra en honor a su fallecimiento",
            `Escribió "Civilización y barbarie" antes de gobernar`
        ],
        [normalizarTexto("Nicolás Remigio Aurelio Avellaneda")]: [
            "Presidente entre 1874 y 1880",
            "El presidente de nombre Nicolás Remigio Aurelio que asumió en 1874",
            "Asumió después de Sarmiento en 1874",
            "Presidente cuyo apellido nombra hoy un partido de la zona sur del Gran Buenos Aires"
        ],
        [normalizarTexto("Julio Argentino Roca")]: [
            "Gobernó en dos mandatos: 1880-1886 y 1898-1904",
            "El presidente de nombre Julio Argentino que asumió en 1880",
            "General al mando de la Conquista del Desierto",
            "Fue la cara del billete de 100$ durante años",
            "Presidente de la Generación del 80, máximo referente del Partido Autonomista Nacional"
        ],
        [normalizarTexto("Miguel Ángel Juárez Celman")]: [
            "Presidente entre 1886 y 1890",
            "El presidente de nombre Miguel Ángel que asumió en 1886",
            "Asumió después de Roca en 1886",
            "Lo sucedió en el cargo Pellegrini",
            "Presidente derrocado por la Revolución del Parque en 1890",
            "Cuñado y sucesor de Julio Argentino Roca"
        ],
        [normalizarTexto("Carlos Enrique José Pellegrini")]: [
            "Presidente de nombre Carlos Enrique José entre 1890-1892",
            "Asumió después de Juárez Celman en 1890 y lo sucedió Luis Sáenz Peña",
            "Da nombre a uno de los colegios preuniversitarios más prestigiosos de la UBA"
        ],
        [normalizarTexto("Luis Sáenz Peña")]: [
            "Presidente de nombre Luis entre 1892-1895",
            "Asumió después de Pellegrini en 1892 y lo sucedió en el cargo José Uriburu",
            "Padre de otro presidente de nombre Roque"
        ],
        [normalizarTexto("José Evaristo Uriburu")]: [
            "Presidente de nombre José Evaristo entre 1895-1898",
            "Asumió después de la renuncia de Luis Sáenz Peña en 1895 y completó su mandato",
            "Tío de un futuro presidente de facto de mismo apellido en 1930"
        ],
        [normalizarTexto("Manuel Pedro Quintana")]: [
            "Presidente de nombre Manuel Pedro entre 1904-1906",
            "Asumió después de la segunda presidencia de Roca en 1904 y lo sucedió Figueroa Alcorta",
            "Presidente porteño que murió en el cargo en 1906"
        ],
        [normalizarTexto("José Figueroa Alcorta")]: [
            "Presidente de nombre José entre 1906-1910",
            "Asumió tras el fallecimiento de Quintana en 1906 y lo sucedió Roque Sáenz Peña",
            "Su apellido compuesto nombra una avenida porteña que pasa por Recoleta, Palermo y Belgrano"
        ],
        [normalizarTexto("Roque Sáenz Peña")]: [
            "Presidente de nombre Roque entre 1910-1914",
            "Durante su mandato se realizaron los primeros comicios con voto secreto gracias a una ley que promovió",
            "Autor de la ley de sufragio universal, secreto y obligatorio que lleva su apellido",
            "Presidente que asumió en 1910 y cuyo padre fue presidente entre 1892-1895",
            "Su reforma electoral terminó con el fraude que sostenía al PAN en el poder y dio lugar a la primera victoria electoral del radicalismo con Yrigoyen"
        ],
        [normalizarTexto("Victorino de la Plaza")]: [
            "Presidente de nombre Victorino entre 1914-1916",
            "Asumió después de Roque Sáenz Peña en 1914 y lo sucedió Yrigoyen",
            "Presidente que debió conducir el país durante el estallido de la Primera Guerra Mundial"
        ],
        [normalizarTexto("Hipólito Yrigoyen")]: [
            "Gobernó en 1916-1922 y 1928-1930",
            "El presidente de nombre Hipólito que goberno en dos mandatos",
            "Primer presidente en ser derrocado por un golpe militar en 1930",
            "Primer presidente radical de la historia argentina",
            `Su apellido da origen a la expresión "el diario de ___"`,
            "Primer presidente elegido con el voto secreto y obligatorio"
        ],
        [normalizarTexto("Marcelo Torcuato de Alvear")]: [
            "Presidente de nombre Marcelo Torcuato entre 1922-1928",
            "Gobernó entre los dos mandatos de Yrigoyen"
        ],
        [normalizarTexto("José Félix Uriburu")]: [
            "Asumió en 1930 y su tio de mismo apellido había sido presidente entre 1895-1898",
            "El presidente de facto de nombre José Félix que asumió en 1930",
            "Lideró el primer golpe de Estado de la historia constitucional argentina en 1930, derrocando a Yrigoyen.",
            `Militar que inauguró la "Década Infame" como el primer presidente de facto del país.`
        ],
        [normalizarTexto("Agustín Pedro Justo")]: [
            `Presidente de nombre Agustín Pedro entre 1932 y 1938, durante la "Década Infame"`,
            `Asumió después de José Uriburu en 1932 elegido en comicios mediante fraude electoral ("Fraude patriótico")`,
            "General que gobernó entre 1932 y 1938; su vicepresidente firmó el polémico pacto comercial con Gran Bretaña (Roca-Runciman)."
        ],
        [normalizarTexto("Roberto Marcelino Ortiz")]: [
            `Presidente de nombre Roberto Marcelino entre 1938 y 1942, durante la "Década Infame"`,
            "Presidente en la segunda mitad de la Década Infame que quiso terminar con el fraude electoral"
        ],
        [normalizarTexto("Ramón Castillo")]: [
            "Presidente de nombre Ramón que goberno entre 1942 y 1943",
            `Último presidente de la "Década Infame", sucedió a Ortiz`,
            "Su corto gobierno terminó con el golpe militar conocido como Revolución del 43, liderado por Rawson"
        ],
        [normalizarTexto("Arturo Franklin Rawson")]: [
            `Su presidencia duró solo 3 días. Derrocó a Ramón Castillo, terminando con la "Década Infame"`,
            "Su apellido nombra la capital de la provincia de Chubut en honor a su padre",
            "Militar que lideró el golpe conocido como Revolución del 43"
        ],
        [normalizarTexto("Pedro Pablo Ramírez")]: [
            "Asumió después de Rawson en 1943 y lo sucedió en el cargo Farrell en 1944",
            "Bajo su gobierno, Perón fue designado al frente de la naciente Secretaría de Trabajo y Previsión"
        ],
        [normalizarTexto("Edelmiro Julián Farrell")]: [
            "Convocó a las elecciones de 1946 en las que ganó Perón",
            "El presidente de nombre Edelmiro Julián que gobernó entre 1944-1946",
            "Asumió después de Ramírez en 1944 y lo sucedió en el cargo Perón en su primera presidencia"
        ],
        [normalizarTexto("Juan Domingo Perón")]: [
            "Gobernó en tres mandatos: 1946-1952, 1952-1955 y 1973-1974",
            "El presidente de nombre Juan Domingo que asumió en 1946 su primer mandato",
            "Líder popular y fundador del movimiento político que lleva su apellido",
            "Esposo de Eva Duarte, figura central de su primer gobierno"
        ],
        [normalizarTexto("Eduardo Ernesto Lonardi")]: [
            "General que lideró el golpe militar que derrocó a Perón",
            "Presidente de facto argentino durante 3 meses en 1955 (septiembre-noviembre)",
            `Sucesor de Perón tras la "Revolución Libertadora", lo sucedió Aramburu`
        ],
        [normalizarTexto("Pedro Eugenio Aramburu")]: [
            "Presidente de facto argentino entre 1955 y 1958",
            `Sucesor de Lonardi tras un golpe interno dentro de la misma "Revolución Libertadora" que derrocó a Perón`,
            "Lo sucedió en el cargo Frondizi",
            "Presidente de facto que proscribió al peronismo"
        ],
        [normalizarTexto("Arturo Frondizi")]: [
            "Ganó las elecciones de 1958 gracias a un pacto con Perón, que instruyó a sus seguidores a votarlo",
            "El presidente de nombre Arturo que asumió en 1958",
            "Presidente desarrollista que ganó las elecciones con el peronismo proscripto",
            "Líder de la Unión Cívica Radical Intransigente, que sucedió a Aramburu en el cargo"
        ],
        [normalizarTexto("José María Guido")]: [
            "Presidió el corto interregno entre las presidencias de Frondizi e Illia",
            "Asumió como presidente provisional tras la crisis de 1962 y administró la transición hasta nuevas elecciones que ganaría Illia"
        ],
        [normalizarTexto("Arturo Umberto Illia")]: [
            "Presidente entre 1963 y 1966",
            "El presidente de nombre Arturo Umberto que asumió en 1963",
            "Presidente radical que fue derrocado por un golpe militar en 1966, liderado por Onganía",
            "Presidente de la UCR del Pueblo, que ganó las elecciones con el peronismo proscripto"
        ],
        [normalizarTexto("Juan Carlos Onganía")]: [
            "Presidente de facto entre 1966 y 1970",
            `General que lideró el golpe militar de junio de 1966 contra Illia en la autodenominada "Revolución Argentina"`,
            `Su gobierno terminó en 1970 tras el estallido social conocido como el "Cordobazo", en 1969`
        ],
        [normalizarTexto("Roberto Marcelo Levingston")]: [
            "Fue elegido por la Junta Militar como figura de transición, tras la caída de Onganía en 1970"
        ],
        [normalizarTexto("Alejandro Agustín Lanusse")]: [
            "Convocó a las elecciones de 1973 para las que levantó la proscripción al peronismo, sin permitir al propio Perón como candidato",
            `Último presidente de la "Revolución Argentina", que le entregó el poder a Cámpora en la vuelta del peronismo`
        ],
        [normalizarTexto("Héctor José Cámpora")]: [
            `"_____ al gobierno, Perón al poder" fue su consigna de campaña`,
            "En 1973, ganó las primeras elecciones con el peronismo habilitado desde 1955",
            "Su presidencia permitió el retorno definitivo de Perón al país en 1973 luego de su exilio."
        ],
        [normalizarTexto("Raúl Alberto Lastiri")]: [
            "Fue presidente interino entre los gobiernos de Cámpora y Perón en su tercer mandato"
        ],
        [normalizarTexto("María Estela Martínez")]: [
            "El presidente de nombre María Estela que asumió en 1974",
            "Primera mujer presidenta de la historia argentina (y de América)",
            "Vicepresidenta que asumió tras la muerte de Juan Domingo Perón, su esposo",
            "Derrocada por el golpe militar liderado por Videla en 1976"
        ],
        [normalizarTexto("Jorge Rafael Videla")]: [
            "Líder del golpe militar de 1976 contra Isabel Perón",
            "Bajo su gobierno se implementó el terrorismo de Estado, con miles de personas desaparecidas",
            "Presidió Argentina durante todo el Mundial de Fútbol de 1978, organizado en el país",
            "Murió en prisión en 2013, cumpliendo condena por crímenes de lesa humanidad"
        ],
        [normalizarTexto("Roberto Eduardo Viola")]: [
            "Asumió después de Videla en 1981"
        ],
        [normalizarTexto("Carlos Alberto Lacoste")]: [
            "Presidió un breve interinato de solo 11 días durante la última dictadura militar del país, entre Viola y Galtieri"
        ],
        [normalizarTexto("Leopoldo Fortunato Galtieri")]: [
            `Pronunció la frase "Si quieren venir, que vengan, les presentaremos batalla" desde el balcón de la Casa Rosada en el marco de la incipiente Guerra de Malvinas`,
            "General cuyo gobierno impulsó la guerra de Malvinas en 1982, conflicto que precipitó la crisis y debilitamiento del régimen militar."
        ],
        [normalizarTexto("Reynaldo Benito Bignone")]: [
            "Asumió tras la renuncia de Galtieri, provocada por la derrota en Malvinas",
            "Convocó a las elecciones de octubre de 1983 que ganó Alfonsín",
            "Le entregó el poder a Alfonsín el 10 de diciembre de 1983, cerrando la última dictadura argentina"
        ],
        [normalizarTexto("Raúl Ricardo Alfonsín")]: [
            "Presidente entre 1983 y 1989",
            "El presidente de nombre Raúl Ricardo que asumió en 1983",
            "Primer presidente electo tras el retorno a la democracia en 1983",
            "Predecesor de Menem en la Casa Rosada",
            `Pronunció la frase "con la democracia se come, se cura y se educa" el día de su asunción`
        ],
        [normalizarTexto("Carlos Saúl Menem")]: [
            "Gobernó en 1989-1995 y 1995-1999",
            "El presidente de nombre Carlos Saúl que asumió en 1989",
            "Sucesor de Alfonsín en 1989",
            "Estableció la convertibilidad (1 peso = 1 dólar) junto a su ministro Domingo Cavallo",
            "Modificó la Constitución en 1994, lo que le permitió ser reelecto en 1995"
        ],
        [normalizarTexto("Fernando De La Rúa")]: [
            "Presidente entre 1999 y 2001",
            "El presidente de nombre Fernando que asumió en 1999",
            "Asumió después de Menem en 1999",
            "Renunció a su cargo tras protestas masivas, abandonando la Casa Rosada en helicóptero",
            `El final de su gobierno quedó marcado por el "Corralito" que implementó por la crisis económica`
        ],
        [normalizarTexto("Federico Ramón Puerta")]: [
            "Presidente interino argentino por apenas 2 días, en diciembre de 2001 tras la renuncia de De La Rua"
        ],
        [normalizarTexto("Adolfo Rodríguez Saá")]: [
            "Presidente interino argentino por una semana, en diciembre de 2001",
            "Anunció la cesación de pagos (default) de la deuda externa argentina ante la Asamblea Legislativa, en diciembre de 2001"
        ],
        [normalizarTexto("Eduardo Oscar Camaño")]: [
            "Diputado que ejerció brevemente la presidencia interina en la sucesión de 2001",
            "Convocó a la Asamblea Legislativa que eligió a Duhalde como presidente"
        ],
        [normalizarTexto("Eduardo Alberto Duhalde")]: [
            "Presidente entre 2002 y 2003",
            "Predecesor de Néstor Kirchner en la presidencia",
            "Puso fin a la convertibilidad y aplicó la pesificación asimétrica, rompiendo la paridad peso-dólar",
            `Su famosa frase de campaña fue "el que depositó dólares, recibirá dólares", en el marco de la crisis del 2001`
        ],
        [normalizarTexto("Néstor Carlos Kirchner")]: [
            "Presidente entre 2003 y 2007",
            "El presidente de nombre Néstor Carlos que asumió en 2003",
            "Asumió después de Duhalde en 2003",
            "Lo sucedió en el cargo Cristina Fernández"
        ],
        [normalizarTexto("Cristina Elisabet Fernández")]: [
            "Gobernó en 2007-2011 y 2011-2015",
            "El presidente de nombre Cristina Elisabet que asumió en 2007",
            "Asumió en 2007, sucediendo en el cargo a su marido",
            "La sucedió en el cargo Macri",
            "Primera mujer reelecta en la presidencia de la historia argentina"
        ],
        [normalizarTexto("Mauricio Macri")]: [
            "Presidente entre 2015 y 2019",
            "El presidente de nombre Mauricio que asumió en 2015",
            "Asumió después de Cristina Fernández en 2015",
            "Fundador del PRO",
            "Fue presidente de Boca Juniors antes de dedicarse a la política nacional",
            "Su gobierno tomó un préstamo histórico del FMI en 2018, el más grande otorgado por el organismo hasta entonces",
            "Perdió la reelección frente a Alberto Fernández en 2019"
        ],
        [normalizarTexto("Alberto Ángel Fernández")]: [
            "Presidente entre 2019 y 2023",
            "Asumió después de Macri en 2019",
            "Predecesor de Milei en la presidencia",
            "Presidió el país durante la pandemia del COVID-19"
        ],
        [normalizarTexto("Javier Gerardo Milei")]: [
            "El presidente de nombre Javier Gerardo que asumió en 2023",
            "Asumió después de Alberto Fernández en 2023",
            "Ganó el ballotage de 2023 frente a Sergio Massa",
            "Primer y único economista en llegar a la presidencia argentina"
        ]
    };

    function pistaCrucigramaDe(u, rng) {
        const pistas = CRUCI_PISTAS_CURADAS[normalizarTexto(nombreCompletoPresidente(u))];
        if (!pistas || !pistas.length) return `Presidente ${nombreCompletoPresidente(u)}`;
        return pistas[Math.floor(rng() * pistas.length)];
    }

    // --- Cronómetro del crucigrama (cuenta hacia arriba) ---
    function formatoCronometro(s) {
        const m = Math.floor(s / 60);
        const ss = String(s % 60).padStart(2, "0");
        if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${ss}`;
        return `${String(m).padStart(2, "0")}:${ss}`;
    }
    // Mismo esquema que guardarProgresoSopa(): solo tiene sentido mientras la
    // partida en curso sea la PRIMERA del día y no haya terminado todavía.
    // Guarda directamente lo que hay tipeado en cada celda (no "qué palabras
    // están resueltas": eso se recalcula solo al restaurar, comparando cada
    // letra contra la grilla con letraCoincide()).
    function guardarProgresoCrucigrama() {
        if (cruciEsRejugada || cruciTerminado) return;
        const letras = {};
        document.querySelectorAll(".cruci-input").forEach(inp => {
            if (inp.value) letras[`${inp.dataset.r},${inp.dataset.c}`] = inp.value;
        });
        lsGuardar(CRUCI_LS_PROGRESO(fechaHoyISO()), { segundos: cruciSegundos, letras });
    }

    // Restaura en silencio lo que estaba tipeado en cada celda. Antes de
    // recalcular qué palabras quedan resueltas, se precarga
    // "cruciResueltasPrev" con las que YA están completas: así
    // refrescarEstadoCrucigrama() las pinta bien pero no las trata como
    // "recién completadas" (no dispara sonido ni animación por algo que el
    // usuario ya había resuelto antes de abandonar la partida).
    function aplicarProgresoCrucigrama(progreso) {
        Object.entries(progreso.letras || {}).forEach(([clave, letra]) => {
            const [r, c] = clave.split(",").map(Number);
            const inp = inputCruci(r, c);
            if (inp) inp.value = letra;
        });
        cruciResueltasPrev = new Set(
            cruciEntradas
                .filter(e => e.celdas.every(({ r, c }) => {
                    const inp = inputCruci(r, c);
                    return inp && letraCoincide(inp.value.toUpperCase(), cruciData.grilla[r][c].letra);
                }))
                .map(e => `${e.numero}-${e.dir}`)
        );
        refrescarEstadoCrucigrama();
    }

    // Cuántas entradas quedan resueltas con lo que había tipeado en una
    // partida abandonada (progreso.letras), sin depender del DOM — para
    // poder registrar ese número como aciertos al rendirse por abandono
    // (ver "empezarDeCero" en mostrarReanudarCrucigrama).
    function contarAciertosDesdeLetras(letras) {
        return cruciEntradas.reduce((total, e) => {
            const ok = e.celdas.every(({ r, c }) => {
                const val = (letras || {})[`${r},${c}`];
                return val && letraCoincide(val.toUpperCase(), cruciData.grilla[r][c].letra);
            });
            return ok ? total + 1 : total;
        }, 0);
    }

    // Mismo esquema que mostrarReanudarSopa(), para el crucigrama.
    function mostrarReanudarCrucigrama(progreso) {
        const dialog = document.getElementById("reanudarDialog");
        if (!dialog) { iniciarCronometroCrucigrama(); return; }
        const texto = document.getElementById("reanudarTexto");
        if (texto) {
            texto.textContent = `Tenías ${formatoCronometro(progreso.segundos)} de tiempo en la partida de hoy.`;
        }
        wireReanudarBotones(dialog, {
            reanudar: () => {
                aplicarProgresoCrucigrama(progreso);
                iniciarCronometroCrucigrama(progreso.segundos);
            },
            // Ver el comentario análogo en mostrarReanudarSopa(): "Empezar
            // de nuevo" acá equivale a rendirse con lo que tenías tipeado.
            empezarDeCero: () => {
                const hoyISO = fechaHoyISO();
                cruciResultadoOficial = {
                    segundos: progreso.segundos,
                    aciertos: contarAciertosDesdeLetras(progreso.letras),
                    total: cruciEntradas.length,
                    gano: false,
                    fecha: hoyISO
                };
                lsGuardar(CRUCI_LS_RES(hoyISO), cruciResultadoOficial);
                cruciEsRejugada = true;
                lsBorrar(CRUCI_LS_PROGRESO(hoyISO));
                mostrarBannerRejugada(".cruci-panel", textoBannerRejugadaCrucigrama());
                iniciarCronometroCrucigrama();
            }
        });
        main.classList.add("juego-preparandose");
        dialog.show();
    }

    function iniciarCronometroCrucigrama(segundosIniciales = 0) {
        detenerCronometroCrucigrama();
        cruciSegundos = segundosIniciales;
        const el = document.getElementById("cruci-timer");
        if (el) el.textContent = formatoCronometro(cruciSegundos);
        cruciCronometro = setInterval(() => {
            cruciSegundos++;
            const t = document.getElementById("cruci-timer");
            if (t) t.textContent = formatoCronometro(cruciSegundos);
            guardarProgresoCrucigrama();
        }, 1000);
    }
    function detenerCronometroCrucigrama() {
        if (cruciCronometro) { clearInterval(cruciCronometro); cruciCronometro = null; }
    }

    function iniciarJuegoCrucigrama() {
        modoActual = 'crucigrama';
        if (heroContent) heroContent.remove();
        main.classList.add("juego-activo");
        body.classList.add("juego-activo");

        cruciTerminado = false;
        cruciActiva = null;
        cruciCeldaActiva = null;
        cruciResueltasPrev = new Set();
        cruciFinInfo = null;

        const hoyISO = fechaHoyISO();
        cruciResultadoOficial = lsLeer(CRUCI_LS_RES(hoyISO));
        cruciEsRejugada = !!cruciResultadoOficial;
        const racha = rachaVigente(CRUCI_LS_STREAK, hoyISO);

        const rng = mulberry32(hashCadena("cruci-" + hoyISO));
        const pool = mezclarConRng(poolCrucigrama(rng), rng).slice(0, 11);
        cruciData = construirCrucigrama(pool, rng);
        cruciEntradas = cruciData.entradas;

        cruciEntradas.forEach(e => {
            e.u.imagen = e.u.imagenes[0];
            e.u.resultadoPartida = null;
        });
        // Pista del día para cada entrada (tipo elegido con el PRNG sembrado).
        cruciEntradas.forEach(e => { e.pista = pistaCrucigramaDe(e.u, rng); });

        // mostrarFinJuego() + historial usan window.listaFiltrada + aciertos
        window.listaFiltrada = cruciEntradas.map(e => e.u);
        aciertos = 0;

        const filasHTML = cruciData.grilla.map((fila, r) =>
            fila.map((cel, c) => {
                if (!cel) return `<div class="cruci-celda cruci-celda--bloque"></div>`;
                const numHTML = cel.num ? `<span class="cruci-num">${cel.num}</span>` : "";
                return `<div class="cruci-celda" data-r="${r}" data-c="${c}">${numHTML}<input class="cruci-input" type="text" maxlength="1" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" data-r="${r}" data-c="${c}" aria-label="fila ${r + 1}, columna ${c + 1}"></div>`;
            }).join("")
        ).join("");

        const listaPistas = arr => arr.map(e => `
            <li class="cruci-pista" data-entrada="${e.numero}-${e.dir}">
                <span class="cruci-pista-num">${e.numero}</span>
                <span class="cruci-pista-texto">${e.pista}</span>
            </li>
        `).join("");
        const pistasH = cruciEntradas.filter(e => e.dir === 'H');
        const pistasV = cruciEntradas.filter(e => e.dir === 'V');

        const contenido = `
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado"><span class="modo-de-juego-seleccionado-texto">CRUCIGRAMA</span></span></h4>
            <div class="cruci-container">
                <div class="cruci-grid-col">
                    <div class="cruci-grid" style="--c:${cruciData.ancho}; --r:${cruciData.alto}; grid-template-columns: repeat(${cruciData.ancho}, 1fr);">
                        ${filasHTML}
                    </div>
                </div>
                <div class="cruci-panel">
                    <div class="cruci-hud">
                        <span class="cruci-fecha">Crucigrama del ${fechaHoyLegible()}</span>
                        <span class="cruci-hud-right">
                            ${racha > 0 ? `<span class="cruci-racha" title="Racha de días consecutivos">🔥 ${racha}</span>` : ""}
                            <span class="cruci-timer" id="cruci-timer">00:00</span>
                        </span>
                    </div>
                    ${cruciEsRejugada ? `<p class="cruci-rejugada-banner">${textoBannerRejugadaCrucigrama()}</p>` : ""}
                    <div class="cruci-pistas-scroll">
                        <h5 class="cruci-pistas-titulo">Horizontales</h5>
                        <ul class="cruci-pistas">${listaPistas(pistasH)}</ul>
                        <h5 class="cruci-pistas-titulo">Verticales</h5>
                        <ul class="cruci-pistas">${listaPistas(pistasV)}</ul>
                    </div>
                    <div class="cruci-acciones">
                        <button class="cruci-rendirse" type="button">RENDIRSE</button>
                    </div>
                </div>
            </div>
        `;
        main.insertAdjacentHTML("beforeend", contenido);

        if (window.matchMedia('(max-width: 768px)').matches) {
            const navToggleEl = document.querySelector(".nav-toggle");
            const jugandoModoHeading = document.querySelector(".jugando-modo-heading");
            if (navToggleEl && jugandoModoHeading) {
                navToggleEl.insertAdjacentElement("afterend", jugandoModoHeading);
                ajustarBadgeModoAlAncho();
            }
        }

        wireCrucigrama();

        // Mismo esquema que en la sopa de letras: solo se ofrece retomar en
        // la primera vez del día, si quedó una partida sin terminar.
        const progresoCruci = !cruciEsRejugada ? lsLeer(CRUCI_LS_PROGRESO(hoyISO)) : null;
        if (progresoCruci && (Object.keys(progresoCruci.letras || {}).length > 0 || progresoCruci.segundos > 2)) {
            mostrarReanudarCrucigrama(progresoCruci);
        } else if (!cruciEsRejugada) {
            // Primer intento del día: avisar antes de arrancar el cronómetro.
            mostrarListo('crucigrama', () => iniciarCronometroCrucigrama());
        } else {
            iniciarCronometroCrucigrama();
        }
    }

    function wireCrucigrama() {
        const grid = document.querySelector(".cruci-grid");
        cruciMapa = new Map();
        cruciEntradas.forEach(e => cruciMapa.set(`${e.numero}-${e.dir}`, e));

        grid.addEventListener("click", (e) => {
            const celda = e.target.closest(".cruci-celda");
            if (!celda || celda.classList.contains("cruci-celda--bloque")) return;
            const r = +celda.dataset.r, c = +celda.dataset.c;
            // Click sobre el número: activa la palabra que ARRANCA en esa celda.
            if (e.target.classList.contains("cruci-num")) {
                const inicioAca = cruciEntradas.filter(x => x.celdas[0].r === r && x.celdas[0].c === c);
                if (inicioAca.length) {
                    const yaEnH = cruciActiva && inicioAca.includes(cruciActiva) && cruciActiva.dir === 'H';
                    const ent = (yaEnH && inicioAca.find(x => x.dir === 'V'))
                        || inicioAca.find(x => x.dir === 'H') || inicioAca[0];
                    activarEntrada(ent, true);
                    return;
                }
            }
            activarDesdeCelda(r, c);
        });
        grid.addEventListener("input", onCruciInput);
        grid.addEventListener("keydown", onCruciKeydown);
        grid.addEventListener("focusin", (e) => {
            const inp = e.target.closest(".cruci-input");
            if (!inp) return;
            const r = +inp.dataset.r, c = +inp.dataset.c;
            if (!cruciCeldaActiva || cruciCeldaActiva.r !== r || cruciCeldaActiva.c !== c) {
                activarDesdeCelda(r, c, true);
            }
        });

        document.querySelectorAll(".cruci-pista").forEach(li => {
            li.addEventListener("click", () => {
                const ent = cruciMapa.get(li.dataset.entrada);
                if (ent) activarEntrada(ent, true);
            });
        });
        const btnRendirse = document.querySelector(".cruci-rendirse");
        if (btnRendirse) btnRendirse.addEventListener("click", () => finalizarCrucigrama(false));

        if (cruciEntradas.length) activarEntrada(cruciEntradas[0], true);
    }

    function activarDesdeCelda(r, c, mantener) {
        const ents = entradasEnCelda(r, c);
        if (!ents.length) return;
        const mismaCelda = cruciCeldaActiva && cruciCeldaActiva.r === r && cruciCeldaActiva.c === c;
        let ent;
        if (!mantener && mismaCelda && ents.length > 1 && cruciActiva) {
            ent = ents.find(e => e !== cruciActiva) || cruciActiva; // toca de nuevo -> cambia dirección
        } else if (cruciActiva && ents.some(e => e.dir === cruciActiva.dir)) {
            ent = ents.find(e => e.dir === cruciActiva.dir);
        } else {
            ent = ents[0];
        }
        cruciCeldaActiva = { r, c };
        cruciActiva = ent;
        pintarCrucigrama();
        enfocarCeldaCruci(r, c);
    }

    function activarEntrada(ent, irAlInicio) {
        cruciActiva = ent;
        const enLaEntrada = cruciCeldaActiva && ent.celdas.some(c => c.r === cruciCeldaActiva.r && c.c === cruciCeldaActiva.c);
        if (irAlInicio || !enLaEntrada) {
            // Siempre la primera celda de la palabra, aunque ya tenga letra
            // (por cruzarse con una palabra perpendicular ya completada): se
            // tipea igual encima, en vez de saltar directo a la primera
            // celda vacía. Es la misma lógica de moverEnEntrada() al tipear
            // — acá aplica al elegir/activar la palabra (clic en la pista,
            // en el número, o al saltar sola a la próxima pista pendiente).
            // Si después el usuario se mueve a mano (flechas, clic en otra
            // celda), esto no vuelve a pisarlo: solo corre al ACTIVAR.
            cruciCeldaActiva = { r: ent.celdas[0].r, c: ent.celdas[0].c };
        }
        pintarCrucigrama();
        enfocarCeldaCruci(cruciCeldaActiva.r, cruciCeldaActiva.c);
    }

    // Enfoca un input y selecciona su contenido (si tiene), para poder
    // sobrescribir una letra ya puesta sin tener que reposicionar el cursor.
    function enfocarCeldaCruci(r, c) {
        const inp = inputCruci(r, c);
        if (!inp) return;
        inp.focus({ preventScroll: true });
        if (inp.value) { try { inp.select(); } catch (e) { /* noop */ } }
    }

    function pintarCrucigrama() {
        document.querySelectorAll(".cruci-celda--activa, .cruci-celda--foco")
            .forEach(el => el.classList.remove("cruci-celda--activa", "cruci-celda--foco"));
        document.querySelectorAll(".cruci-pista--activa")
            .forEach(el => el.classList.remove("cruci-pista--activa"));

        if (cruciActiva) {
            cruciActiva.celdas.forEach(({ r, c }) => {
                const celda = document.querySelector(`.cruci-celda[data-r="${r}"][data-c="${c}"]`);
                if (celda) celda.classList.add("cruci-celda--activa");
            });
            const li = document.querySelector(`.cruci-pista[data-entrada="${cruciActiva.numero}-${cruciActiva.dir}"]`);
            if (li) {
                li.classList.add("cruci-pista--activa");
                li.scrollIntoView({ block: "nearest" });
            }
        }
        if (cruciCeldaActiva) {
            const celda = document.querySelector(`.cruci-celda[data-r="${cruciCeldaActiva.r}"][data-c="${cruciCeldaActiva.c}"]`);
            if (celda) celda.classList.add("cruci-celda--foco");
        }
    }

    function moverEnEntrada(delta) {
        if (!cruciActiva || !cruciCeldaActiva) return;
        const celdas = cruciActiva.celdas;
        const idx = celdas.findIndex(c => c.r === cruciCeldaActiva.r && c.c === cruciCeldaActiva.c);
        const next = idx + delta;
        if (next < 0 || next >= celdas.length) return;
        cruciCeldaActiva = { ...celdas[next] };
        pintarCrucigrama();
        enfocarCeldaCruci(cruciCeldaActiva.r, cruciCeldaActiva.c);
    }

    function palabraLlenaYCorrecta(ent) {
        return ent.celdas.every(({ r, c }) => {
            const i = inputCruci(r, c);
            return i && letraCoincide(i.value.toUpperCase(), cruciData.grilla[r][c].letra);
        });
    }

    // Salta a la próxima pista (en orden) que todavía tenga casilleros vacíos.
    function saltarSiguientePistaPendiente() {
        const n = cruciEntradas.length;
        const base = cruciEntradas.indexOf(cruciActiva);
        for (let k = 1; k <= n; k++) {
            const cand = cruciEntradas[(base + k) % n];
            if (cand.celdas.some(({ r, c }) => !inputCruci(r, c).value)) {
                activarEntrada(cand, true);
                return true;
            }
        }
        return false;
    }

    function onCruciInput(e) {
        const inp = e.target.closest(".cruci-input");
        if (!inp || cruciTerminado) return;
        const limpio = letraGrillaDe(inp.value);
        inp.value = limpio.slice(-1);
        inp.classList.remove("cruci-input--mal");
        refrescarEstadoCrucigrama();
        if (inp.value) {
            if (cruciActiva && palabraLlenaYCorrecta(cruciActiva)) {
                saltarSiguientePistaPendiente(); // palabra lista -> próxima pista
            } else {
                // Avanza a la SIGUIENTE celda sin saltear las que ya tienen
                // letra (de una palabra cruzada ya completada): es más
                // intuitivo poder escribir el apellido entero de corrido,
                // reescribiendo esa letra al pasar, que tener que estar
                // atento a no tipearla para no romper el salto automático.
                moverEnEntrada(1);
            }
        }
        comprobarVictoriaCrucigrama();
        guardarProgresoCrucigrama();
    }

    // Verificación en vivo: cada palabra completa y correcta se pinta de verde
    // y su pista queda tachada; si se rompe, vuelve atrás.
    function refrescarEstadoCrucigrama() {
        const okCeldas = new Set();
        const resueltasAhora = new Set();
        cruciEntradas.forEach(e => {
            const ok = e.celdas.every(({ r, c }) => {
                const inp = inputCruci(r, c);
                return inp && letraCoincide(inp.value.toUpperCase(), cruciData.grilla[r][c].letra);
            });
            const id = `${e.numero}-${e.dir}`;
            const li = document.querySelector(`.cruci-pista[data-entrada="${id}"]`);
            if (li) li.classList.toggle("cruci-pista--resuelta", ok);
            if (ok) {
                resueltasAhora.add(id);
                e.celdas.forEach(({ r, c }) => okCeldas.add(`${r},${c}`));
                // Animación y sonido al recién completarse (no en cada tecla posterior).
                if (!cruciResueltasPrev.has(id) && !cruciTerminado) {
                    animarPalabraCrucigrama(e);
                    reproducirSonidoAcierto();
                }
            }
        });
        cruciResueltasPrev = resueltasAhora;
        document.querySelectorAll(".cruci-celda[data-r]").forEach(celda => {
            celda.classList.toggle("cruci-celda--ok", okCeldas.has(`${celda.dataset.r},${celda.dataset.c}`));
        });
    }

    function animarPalabraCrucigrama(entrada) {
        entrada.celdas.forEach(({ r, c }, i) => {
            const celda = document.querySelector(`.cruci-celda[data-r="${r}"][data-c="${c}"]`);
            if (!celda) return;
            setTimeout(() => {
                celda.classList.remove("cruci-celda--pop");
                void celda.offsetWidth;
                celda.classList.add("cruci-celda--pop");
                setTimeout(() => celda.classList.remove("cruci-celda--pop"), 400);
            }, i * 45);
        });
    }

    function onCruciKeydown(e) {
        if (cruciTerminado) return;
        const inp = e.target.closest(".cruci-input");
        if (!inp) return;
        const r = +inp.dataset.r, c = +inp.dataset.c;

        if (e.key === "Backspace") {
            if (inp.value) { inp.value = ""; refrescarEstadoCrucigrama(); return; }
            e.preventDefault();
            moverEnEntrada(-1);
            const prev = inputCruci(cruciCeldaActiva.r, cruciCeldaActiva.c);
            if (prev) prev.value = "";
            refrescarEstadoCrucigrama();
            return;
        }
        if (e.key === "Tab") {
            e.preventDefault();
            const dir = e.shiftKey ? -1 : 1;
            const n = cruciEntradas.length;
            const base = cruciEntradas.indexOf(cruciActiva);
            let objetivo = null, fallback = null;
            for (let k = 1; k <= n; k++) {
                const cand = cruciEntradas[((base + dir * k) % n + n) % n];
                if (!fallback) fallback = cand;
                if (cand.celdas.some(({ r, c }) => !inputCruci(r, c).value)) { objetivo = cand; break; }
            }
            activarEntrada(objetivo || fallback, true);
            return;
        }
        if (e.key === " ") {
            e.preventDefault();
            const ents = entradasEnCelda(r, c);
            if (ents.length > 1 && cruciActiva) {
                cruciActiva = ents.find(x => x !== cruciActiva) || cruciActiva;
                pintarCrucigrama();
            }
            return;
        }
        const flechas = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
        if (flechas[e.key]) {
            e.preventDefault();
            const [dr, dc] = flechas[e.key];
            for (let paso = 1; paso < Math.max(cruciData.ancho, cruciData.alto); paso++) {
                const nr = r + dr * paso, nc = c + dc * paso;
                if (nr < 0 || nc < 0 || nr >= cruciData.alto || nc >= cruciData.ancho) break;
                if (cruciData.grilla[nr][nc]) { activarDesdeCelda(nr, nc, true); break; }
            }
        }
    }

    function comprobarVictoriaCrucigrama() {
        if (cruciTerminado) return;
        for (let r = 0; r < cruciData.alto; r++) {
            for (let c = 0; c < cruciData.ancho; c++) {
                const cel = cruciData.grilla[r][c];
                if (!cel) continue;
                const inp = inputCruci(r, c);
                if (!inp || !letraCoincide(inp.value.toUpperCase(), cel.letra)) return;
            }
        }
        finalizarCrucigrama(true);
    }

    function marcarResultadosCrucigrama() {
        aciertos = 0;
        cruciEntradas.forEach(e => {
            const ok = e.celdas.every(({ r, c }) => {
                const inp = inputCruci(r, c);
                return inp && letraCoincide(inp.value.toUpperCase(), cruciData.grilla[r][c].letra);
            });
            e.u.resultadoPartida = ok ? 'acierto' : 'error';
            if (ok) aciertos++;
        });
    }

    function finalizarCrucigrama(gano) {
        if (cruciTerminado) return;
        cruciTerminado = true;
        detenerCronometroCrucigrama();
        marcarResultadosCrucigrama(); // con lo que hay escrito AHORA

        const segundos = cruciSegundos;
        const total = cruciEntradas.length;
        const aciertosPartida = aciertos;
        const hoyISO = fechaHoyISO();
        // Terminado (gane o se rinda), ya no hay nada que retomar.
        lsBorrar(CRUCI_LS_PROGRESO(hoyISO));

        // El resultado del día es el de la PRIMERA vez que se completó.
        const primeraVez = !cruciResultadoOficial;
        let racha = rachaVigente(CRUCI_LS_STREAK, hoyISO);
        let record = null;

        if (primeraVez) {
            cruciResultadoOficial = { segundos, aciertos: aciertosPartida, total, gano, fecha: hoyISO };
            lsGuardar(CRUCI_LS_RES(hoyISO), cruciResultadoOficial);
            if (gano) record = evaluarRecord(CRUCI_LS_RECORD, segundos, hoyISO);
        }
        // La racha suma el día apenas lo COMPLETÁS, aunque te hayas rendido
        // en el primer intento: sumarRacha es idempotente si ya se sumó hoy,
        // así que no hay riesgo de sumarlo dos veces.
        if (gano) racha = sumarRacha(CRUCI_LS_STREAK, hoyISO);
        // El tick de "completado" es aparte del resultado oficial: se marca
        // apenas lo resolvés, sea en la primera vez o en una rejugada
        // después de haberte rendido (ver actualizarEstadoDiarioEnTarjetas).
        // Una vez en true queda así todo el día, no se puede "desmarcar".
        if (gano) lsGuardar(CRUCI_LS_COMPLETADO(hoyISO), true);
        if (primeraVez || gano) {
            // La tarjeta del carrusel del inicio pasa a su estado nuevo ya
            // mismo, sin esperar a volver al inicio ni recargar la página.
            actualizarEstadoDiarioEnTarjetas();
        }

        cruciFinInfo = {
            primeraVez, gano, segundos, aciertosPartida, total, racha, record,
            oficial: cruciResultadoOficial
        };

        if (!gano) {
            // Revelar la solución en las celdas mal o vacías
            document.querySelectorAll(".cruci-input").forEach(inp => {
                const cel = cruciData.grilla[+inp.dataset.r][+inp.dataset.c];
                if (cel && !letraCoincide(inp.value.toUpperCase(), cel.letra)) {
                    inp.value = cel.letra;
                    inp.classList.add("cruci-input--revelada");
                }
            });
        } else {
            lanzarConfetti();
        }
        document.querySelectorAll(".cruci-input").forEach(i => { i.disabled = true; });
        const btnRendirse = document.querySelector(".cruci-rendirse");
        if (btnRendirse) btnRendirse.disabled = true;

        mostrarFinJuego(gano ? 'victoria' : 'rendicion');
    }

    // --- Confetti (solo al ganar) ---
    function lanzarConfetti() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const cont = document.createElement("div");
        cont.className = "confetti-cont";
        const colores = ["#3fb56b", "#e6b043", "#1bbef1", "#e67e22", "#a980d8", "#ff6b6b"];
        for (let i = 0; i < 90; i++) {
            const p = document.createElement("i");
            p.className = "confetti-p";
            p.style.left = (Math.random() * 100) + "vw";
            p.style.background = colores[i % colores.length];
            p.style.animationDelay = (Math.random() * 0.7) + "s";
            p.style.animationDuration = (2.2 + Math.random() * 1.8) + "s";
            cont.appendChild(p);
        }
        document.body.appendChild(cont);
        setTimeout(() => cont.remove(), 4500);
    }

    function poblarFinDiario(i) {
        const elTiempo = document.getElementById("cruciFinTiempo");
        const elRecord = document.getElementById("cruciFinRecord");
        const elRacha = document.getElementById("cruciFinRacha");

        if (i.primeraVez) {
            elTiempo.textContent = (i.gano ? "Lo completaste en " : "Te rendiste a los ")
                + formatoCronometro(i.segundos);
        } else {
            const of = i.oficial;
            const oficialTxt = of.gano ? formatoCronometro(of.segundos) : "Te rendiste";
            elTiempo.textContent = `Tu resultado de hoy en tu primer intento: ${oficialTxt}`;
        }

        if (i.primeraVez && i.gano && i.record) {
            if (i.record.nuevo) {
                elRecord.textContent = i.record.anterior
                    ? `¡Nuevo récord! ${formatoCronometro(i.segundos)} (antes ${formatoCronometro(i.record.anterior)})`
                    : `¡Tu primer récord! ${formatoCronometro(i.segundos)}`;
            } else {
                elRecord.textContent = `Tu tiempo: ${formatoCronometro(i.segundos)}`
                    + `  ·  Tu mejor tiempo: ${formatoCronometro(i.record.mejor)}`;
            }
            elRecord.hidden = false;
        } else {
            elRecord.hidden = true;
        }

        if (i.racha && i.racha > 0) {
            elRacha.textContent = `🔥 Racha: ${i.racha} ${i.racha === 1 ? "día" : "días"}`;
            elRacha.hidden = false;
        } else {
            elRacha.hidden = true;
        }
    }


    // --- Estado de pausa ---
    let pausado = false;
    let tiempoRestanteGlobal; // lo usamos para guardar segundos restantes

    // --- Función Pausar / Reanudar ---
    function togglePausa() {
        const botonPausa = document.querySelector(".pause-icon");
        const inputPresidente = document.getElementById("input-presidente");
        const tabla = document.querySelector(".tabla");
        const overlay = document.querySelector(".tabla-paused-overlay");

        if (!pausado) {
            // Pausar juego
            clearInterval(window.temporizadorInterval);
            pausado = true;
            if (botonPausa) botonPausa.innerHTML = iconoPlay;
            if (inputPresidente) {
                inputPresidente.disabled = true;   // Deshabilitar input
                inputPresidente.placeholder = "Juego en pausa";
            }
            if (overlay) {
                overlay.style.display = "flex";
                overlay.textContent = "Juego en pausa";
            }
        } else {
            // Reanudar juego
            iniciarTemporizador(tiempoRestanteGlobal);
            pausado = false;
            if (botonPausa) botonPausa.innerHTML = iconoPausa;
            if (inputPresidente) {
                inputPresidente.disabled = false;  // Habilitar input
                inputPresidente.placeholder = "Ingrese el apellido...";
                inputPresidente.focus();
            }
            if (overlay) {
                overlay.style.display = "none";
                overlay.textContent = "";
            }
        }
    }


    // --- Función Reiniciar ---
    function reiniciarJuego() {
        clearInterval(window.temporizadorInterval);
        detenerTemporizadorImagen();
        detenerTemporizadorSopa();
        detenerCronometroCrucigrama();
        aciertos = 0;
        pausado = false;

        // Eliminar pantalla de juego anterior
        const tabla = document.querySelector(".tabla-container");
        const juegoImagen = document.querySelector(".juego-imagen-container");
        const juegoSopa = document.querySelector(".sopa-container");
        const juegoCrucigrama = document.querySelector(".cruci-container");
        const headingModo = document.querySelector(".jugando-modo-heading");
        if (tabla) tabla.remove();
        if (juegoImagen) juegoImagen.remove();
        if (juegoSopa) juegoSopa.remove();
        if (juegoCrucigrama) juegoCrucigrama.remove();
        if (headingModo) headingModo.remove();

        // Volver a iniciar el modo que se estaba jugando
        if (modoActual === 'imagen') {
            iniciarJuegoImagen();
        } else if (modoActual === 'sopa') {
            iniciarJuegoSopa();
        } else if (modoActual === 'crucigrama') {
            iniciarJuegoCrucigrama();
        } else {
            iniciarJuego();
        }
    }

    // --- Función separada de temporizador ---
    function iniciarTemporizador(segundosIniciales) {
        tiempoRestanteGlobal = segundosIniciales;
        const temporizadorDiv = document.getElementById("temporizador");

        window.temporizadorInterval = setInterval(() => {
            const minutos = String(Math.floor(tiempoRestanteGlobal / 60)).padStart(2, '0');
            const segundos = String(tiempoRestanteGlobal % 60).padStart(2, '0');
            temporizadorDiv.textContent = `${minutos}:${segundos}`;

            if (tiempoRestanteGlobal <= 0) {
                clearInterval(window.temporizadorInterval);
                rendirse(); // Esto ya maneja todo
                // Cambiar el motivo en rendirse para tiempo agotado
                setTimeout(() => {
                    cerrarFinJuego();
                    mostrarFinJuego('tiempo');
                }, 100);
            }

            tiempoRestanteGlobal--;
        }, 1000);
    }


    // Cuántos presidentes únicos quedan para el modo imagen según el filtro
    // elegido (mismo criterio que presidentesUnicosFiltrados()).
    function contarDisponiblesImagen(filtroModo, sinDeFacto, sinCortos, sinInterinos) {
        if (filtroModo === "todas") return presidentesUnicos.length;
        if (filtroModo === "default") {
            return presidentesUnicos.filter(u => !estaEnListaExclusionFija(u)).length;
        }
        return presidentesUnicos.filter(u => {
            if (sinDeFacto && u.deFacto) return false;
            if (sinCortos && !u.periodos.some(periodoDuroMasDeUnAnio)) return false;
            if (sinInterinos && u.interino) return false;
            return true;
        }).length;
    }

    // Qué opción del filtro de imagen está tildada ahora mismo en el modal
    // ("default" | "todas" | "custom"): mirar el radio marcado alcanza, ya
    // que radioImgCustom se activa solo apenas se toca cualquiera de los 3
    // checkboxes combinables (ver más abajo).
    function filtroImagenModoActual() {
        const radio = document.querySelector('input[name="filtroImagenModo"]:checked');
        return radio ? radio.value : "default";
    }

    function refrescarMaxCantidad() {
        if (!sliderCantidad || modoSeleccionado !== 'imagen') return;
        const min = parseInt(sliderCantidad.min, 10);
        const max = Math.max(min, contarDisponiblesImagen(
            filtroImagenModoActual(),
            !!(checkboxImgDeFacto && checkboxImgDeFacto.checked),
            !!(checkboxImgCortos && checkboxImgCortos.checked),
            !!(checkboxImgInterinos && checkboxImgInterinos.checked)
        ));
        sliderCantidad.max = max;
        if (parseInt(sliderCantidad.value, 10) > max) sliderCantidad.value = max;
        if (valorCantidad) valorCantidad.textContent = sliderCantidad.value + " presidentes";
        const spanMax = contenedorCantidad && contenedorCantidad.querySelector(".max");
        if (spanMax) spanMax.textContent = max;
    }

    // El temporizador tiene un valor propio por modo:
    // clásico -> configuracionJuego.tiempo, imagen -> configuracionJuego.tiempoImagen
    function claveTiempoActual() {
        if (modoSeleccionado === 'imagen') return 'tiempoImagen';
        if (modoSeleccionado === 'sopa') return 'tiempoSopa';
        return 'tiempo';
    }

    // --- Botón Configuración ---
    function abrirConfig() {
        configuracionTemporal = { ...configuracionJuego };

        const minutos = configuracionJuego[claveTiempoActual()];
        slider.value = minutos;
        valorRango.textContent = minutos + " minutos";

        // Filtro de "Clásico": sin cambios respecto a como funcionaba antes.
        if (checkboxDeFactoClasico) checkboxDeFactoClasico.checked = configuracionJuego.eliminarDeFacto;
        if (checkboxCortosClasico) checkboxCortosClasico.checked = configuracionJuego.eliminarMenosDeUnAnioClasico;
        if (checkboxInterinosClasico) checkboxInterinosClasico.checked = configuracionJuego.eliminarInterinosClasico;

        // Filtro de "Adiviná la imagen": radio (default/todas/custom) + los
        // 3 checkboxes combinables (solo tienen sentido visual en "custom").
        const filtroImg = configuracionJuego.filtroImagenModo;
        if (radioImgDefecto) radioImgDefecto.checked = filtroImg === "default";
        if (radioImgTodas) radioImgTodas.checked = filtroImg === "todas";
        if (radioImgCustom) radioImgCustom.checked = filtroImg === "custom";
        if (checkboxImgDeFacto) checkboxImgDeFacto.checked = filtroImg === "custom" && configuracionJuego.eliminarDeFactoImagen;
        if (checkboxImgCortos) checkboxImgCortos.checked = filtroImg === "custom" && configuracionJuego.eliminarMenosDeUnAnioImagen;
        if (checkboxImgInterinos) checkboxImgInterinos.checked = filtroImg === "custom" && configuracionJuego.eliminarInterinosImagen;

        // El slider de cantidad (modo imagen) no puede pedir más presidentes
        // de los que quedan disponibles con los filtros elegidos.
        if (sliderCantidad) {
            sliderCantidad.value = configuracionJuego.cantidad;
            refrescarMaxCantidad();
        }

        // El temporizador con límite solo aplica a clásico e imagen (sopa y
        // crucigrama son cronómetros sin límite); la cantidad de presidentes,
        // solo a "Adivina la imagen". Los filtros de gobiernos no tienen
        // efecto en sopa/crucigrama (el desafío del día es fijo para todos).
        // Todos esos controles se ocultan en los modos donde no aplican.
        const esModoDiario = modoSeleccionado === 'sopa' || modoSeleccionado === 'crucigrama';
        const esImagen = modoSeleccionado === 'imagen';
        if (contenedorTemporizador) {
            contenedorTemporizador.style.display = esModoDiario ? 'none' : '';
        }
        if (contenedorCantidad) {
            contenedorCantidad.style.display = esImagen ? '' : 'none';
        }
        if (contenedorFiltrosClasico) contenedorFiltrosClasico.hidden = esModoDiario || esImagen;
        if (contenedorFiltrosImagen) contenedorFiltrosImagen.hidden = esModoDiario || !esImagen;

        document.getElementById("configDialog").showModal(); // Cambio aquí
    }

    function cerrarConfig() {
        document.getElementById("configDialog").close(); // Cambio aquí

        if (modoModalPendienteTrasConfig && mostrarModoModalRef) {
            const modo = modoModalPendienteTrasConfig;
            modoModalPendienteTrasConfig = null;
            mostrarModoModalRef(modo);
        }
    }

    function guardarConfig() {
        configuracionJuego[claveTiempoActual()] = parseInt(slider.value);

        if (checkboxDeFactoClasico) configuracionJuego.eliminarDeFacto = checkboxDeFactoClasico.checked;
        if (checkboxCortosClasico) configuracionJuego.eliminarMenosDeUnAnioClasico = checkboxCortosClasico.checked;
        if (checkboxInterinosClasico) configuracionJuego.eliminarInterinosClasico = checkboxInterinosClasico.checked;

        configuracionJuego.filtroImagenModo = filtroImagenModoActual();
        configuracionJuego.eliminarDeFactoImagen = !!(checkboxImgDeFacto && checkboxImgDeFacto.checked);
        configuracionJuego.eliminarMenosDeUnAnioImagen = !!(checkboxImgCortos && checkboxImgCortos.checked);
        configuracionJuego.eliminarInterinosImagen = !!(checkboxImgInterinos && checkboxImgInterinos.checked);

        if (sliderCantidad) {
            configuracionJuego.cantidad = parseInt(sliderCantidad.value);
        }

        try {
            localStorage.setItem(CONFIG_JUEGO_LS_KEY, JSON.stringify(configuracionJuego));
        } catch (e) { /* modo privado, localStorage lleno, etc. */ }

        cerrarConfig();
    }

    function cancelarConfig() {
        const minutos = configuracionTemporal[claveTiempoActual()];
        slider.value = minutos;
        valorRango.textContent = minutos + " minutos";

        if (checkboxDeFactoClasico) checkboxDeFactoClasico.checked = configuracionTemporal.eliminarDeFacto;
        if (checkboxCortosClasico) checkboxCortosClasico.checked = configuracionTemporal.eliminarMenosDeUnAnioClasico;
        if (checkboxInterinosClasico) checkboxInterinosClasico.checked = configuracionTemporal.eliminarInterinosClasico;

        const filtroImg = configuracionTemporal.filtroImagenModo;
        if (radioImgDefecto) radioImgDefecto.checked = filtroImg === "default";
        if (radioImgTodas) radioImgTodas.checked = filtroImg === "todas";
        if (radioImgCustom) radioImgCustom.checked = filtroImg === "custom";
        if (checkboxImgDeFacto) checkboxImgDeFacto.checked = filtroImg === "custom" && configuracionTemporal.eliminarDeFactoImagen;
        if (checkboxImgCortos) checkboxImgCortos.checked = filtroImg === "custom" && configuracionTemporal.eliminarMenosDeUnAnioImagen;
        if (checkboxImgInterinos) checkboxImgInterinos.checked = filtroImg === "custom" && configuracionTemporal.eliminarInterinosImagen;

        if (sliderCantidad) {
            sliderCantidad.value = configuracionTemporal.cantidad;
            if (valorCantidad) valorCantidad.textContent = configuracionTemporal.cantidad + " presidentes";
        }

        cerrarConfig();
    }

    if (botonGuardar) {
        botonGuardar.addEventListener("click", guardarConfig);
    }
    if (botonCancelar) {
        botonCancelar.addEventListener("click", cancelarConfig);
    }

    if (slider) {
        slider.addEventListener("input", () => {
            valorRango.textContent = slider.value + " minutos";
        });
    }

    if (sliderCantidad && valorCantidad) {
        sliderCantidad.addEventListener("input", () => {
            valorCantidad.textContent = sliderCantidad.value + " presidentes";
        });
    }

    // Si cambian los filtros, se recalcula el máximo del slider de cantidad.
    if (checkboxDeFactoClasico) checkboxDeFactoClasico.addEventListener("change", refrescarMaxCantidad);
    if (checkboxCortosClasico) checkboxCortosClasico.addEventListener("change", refrescarMaxCantidad);
    if (checkboxInterinosClasico) checkboxInterinosClasico.addEventListener("change", refrescarMaxCantidad);

    // --- Exclusividad del filtro de "Adiviná la imagen" ---
    // "Por defecto" e "Incluir todas" son radios del mismo grupo, así que ya
    // son excluyentes entre sí de forma nativa. Elegir cualquiera de los 2
    // limpia los 3 checkboxes combinables (no tiene sentido combinarlos con
    // un modo "único"). Tocar cualquiera de los 3 combinables pasa el grupo
    // a "custom" (radioImgCustom, un radio oculto que nunca se ve ni se
    // toca a mano) y a partir de ahí se pueden combinar libremente entre sí.
    [radioImgDefecto, radioImgTodas].forEach(radio => {
        if (!radio) return;
        radio.addEventListener("change", () => {
            if (radio.checked) checkboxesImgCombinables.forEach(cb => { cb.checked = false; });
            refrescarMaxCantidad();
        });
    });
    checkboxesImgCombinables.forEach(cb => {
        cb.addEventListener("change", () => {
            if (radioImgCustom) radioImgCustom.checked = true;
            refrescarMaxCantidad();
        });
    });

    // Agregar este event listener DENTRO del DOMContentLoaded
    const configDialog = document.getElementById("configDialog");
    if (configDialog) {
        configDialog.addEventListener("click", (e) => {
            if (e.target === configDialog) {
                cerrarConfig(); // Cerrar al hacer clic en el backdrop
            }
        });
    }

    // --- Función rendirse ---
    function rendirse() {
        clearInterval(window.temporizadorInterval);

        window.listaFiltrada.forEach((presidente, index) => {
            const fila = document.querySelector(`tr[data-id="${index}"]`);
            if (fila) {
                const celdaNombre = fila.querySelector('.nombre-presidente-cell');
                // Si NO fue adivinado (tiene el ?)
                if (celdaNombre.textContent.trim() === "?") {
                    // Mostrar nombre en celeste, fondo negro, animación roja
                    const nombreParaMostrar = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                        .filter(Boolean).join(" ");
                    celdaNombre.innerHTML = `<span class="nombre-presidente-texto rendido">${nombreParaMostrar}</span>`;
                    fila.querySelector('img').src = imagenCentradaDe(presidente.imagen);
                    fila.querySelector('img').alt = nombreParaMostrar;
                    fila.style.backgroundColor = "#111"; // fondo negro
                    const presidenteCard = fila.querySelector('.presidente-card');
                    presidenteCard.style.backgroundColor = "#111";
                    const nombreTexto = fila.querySelector('.nombre-presidente-texto');
                    nombreTexto.style.color = "#1bbeff"; // celeste
                    nombreTexto.style.borderBottom = "none";
                    nombreTexto.style.marginBottom = "0";
                    // animación en rojo
                    fila.classList.add('rendicion-animacion');
                    setTimeout(() => fila.classList.remove('rendicion-animacion'), 2000);
                }
            }
        });

        //Bloquear input
        const inputPresidente = document.getElementById("input-presidente");
        if (inputPresidente) { 
            inputPresidente.disabled = true;
            inputPresidente.placeholder = "Juego terminado";
        }

        // Cambiar boton a "JUEGO TERMINADO" (el botón compacto de mobile
        // solo tiene lugar para el ícono, así que ese mantiene el ícono)
        const botonRendirse = document.querySelector(".rendirse-button");
        if (botonRendirse) {
            if (!botonRendirse.classList.contains("rendirse-button-compacta")) {
                botonRendirse.textContent = "JUEGO TERMINADO";
            }
            botonRendirse.disabled = true;
            botonRendirse.style.backgroundColor = "gray";
            botonRendirse.style.cursor = "not-allowed";
        }

        // Mostrar dialog de fin de juego
        setTimeout(() => {
            mostrarFinJuego('rendicion');
        }, 500); // Pequeña pausa para que se vea la animación
    }

    // --- Función para mostrar dialog de fin de juego ---
function mostrarFinJuego(motivo) {
    const dialog = document.getElementById("finJuegoDialog");
    const titulo = document.getElementById("tituloFinJuego");
    const aciertosSpan = document.getElementById("aciertosFinales");
    const totalSpan = document.getElementById("totalPresidentes");
    const porcentajeSpan = document.getElementById("porcentaje");
    
    const total = window.listaFiltrada.length;
    const porcentaje = Math.round((aciertos / total) * 100);
    
    // Personalizar mensaje según el motivo
    switch(motivo) {
        case 'victoria':
            titulo.textContent = "¡FELICITACIONES!";
            titulo.style.color = "#2ecc71";
            break;
        case 'tiempo':
            titulo.textContent = "⏰ ¡SE ACABÓ EL TIEMPO!";
            titulo.style.color = "#f39c12";
            break;
        case 'rendicion':
            titulo.textContent = "😔 TE RENDISTE";
            titulo.style.color = "#e74c3c";
            break;
        case 'fin':
            titulo.textContent = "🏁 ¡JUEGO TERMINADO!";
            titulo.style.color = "#f39c12";
            break;
    }
    
    aciertosSpan.textContent = aciertos;
    totalSpan.textContent = total;
    porcentajeSpan.textContent = `${porcentaje}%`;
    
    // Cambiar color del porcentaje según el resultado
    if (porcentaje >= 80) {
        porcentajeSpan.style.color = "#2ecc71"; // Verde
    } else if (porcentaje >= 50) {
        porcentajeSpan.style.color = "#f39c12"; // Naranja
    } else {
        porcentajeSpan.style.color = "#e74c3c"; // Rojo
    }
    
    // Panel de fin de los modos "del día" (tiempo, récord, racha):
    // crucigrama y sopa de letras comparten el mismo panel y mecanismo.
    const finPanel = document.getElementById("cruciFinPanel");
    if (finPanel) {
        const infoDiario = modoActual === 'sopa' ? sopaFinInfo
            : modoActual === 'crucigrama' ? cruciFinInfo
            : null;
        if (infoDiario) {
            poblarFinDiario(infoDiario);
            finPanel.hidden = false;
        } else {
            finPanel.hidden = true;
        }
    }

    actualizarResumenPartida();

    dialog.showModal();
}

// --- Historial de la partida (modos "Adivina la imagen", "Sopa de letras" y
// "Crucigrama") ---
// Muestra, al terminar, la tanda completa de presidentes que tocaron marcando
// cuáles se acertaron y cuáles no (salteados, errados, sin llegar a jugarlos).
function actualizarResumenPartida() {
    const contenedor = document.getElementById("resumenPartidaImagen");
    const lista = document.getElementById("resumenPartidaLista");
    if (!contenedor || !lista) return;

    const modosConResumen = ['imagen', 'sopa', 'crucigrama'];
    if (!modosConResumen.includes(modoActual) || !Array.isArray(window.listaFiltrada)) {
        contenedor.hidden = true;
        lista.innerHTML = "";
        return;
    }

    lista.innerHTML = window.listaFiltrada.map(u => {
        const acierto = u.resultadoPartida === 'acierto';
        const nombre = nombreCompletoPresidente(u);
        const icono = acierto ? '✓' : '✕';
        const puntoColor = (modoActual === 'sopa' && u.colorSopa)
            ? `<span class="resumen-partida-color" style="background:${u.colorSopa}" aria-hidden="true"></span>`
            : '';
        // "Adivina la imagen" usa la foto original (sin recortar) en todos
        // lados, incluida esta lista; sopa/crucigrama siguen con la versión
        // centrada (son círculos chicos, la original se ve mal recortada).
        const foto = modoActual === 'imagen' ? u.imagen : imagenCentradaDe(u.imagen);
        return `
            <li class="resumen-partida-item ${acierto ? 'acierto' : 'error'}">
                <img class="resumen-partida-foto" src="${foto}" alt="" loading="lazy">
                ${puntoColor}
                <span class="resumen-partida-nombre">${nombre}</span>
                <span class="resumen-partida-icono" aria-hidden="true">${icono}</span>
            </li>
        `;
    }).join('');

    contenedor.hidden = false;
}

// --- Función para cerrar dialog de fin de juego ---
function cerrarFinJuego() {
    document.getElementById("finJuegoDialog").close();
}

// --- Event listeners para los botones del dialog ---
// Agregar después de cerrarFinJuego()
function agregarEventListenersModalFinJuego() {
    const botonJugarOtraVez = document.querySelector(".jugar-otra-vez");
    const botonVolverInicio = document.querySelector(".volver-inicio");
    const botonCerrarModal = document.querySelector(".cerrar-modal"); // AGREGAR ESTA LÍNEA

    if (botonJugarOtraVez) {
        botonJugarOtraVez.addEventListener("click", () => {
            cerrarFinJuego();
            reiniciarJuego();
        });
    }

    if (botonVolverInicio) {
        botonVolverInicio.addEventListener("click", () => {
            // No usar location.reload(): si se llegó acá con
            // "?modo=X&accion=jugar" (botón "Jugar" del modal de "Ver modos
            // de juego"), reload() repite esa misma URL y el auto-arranque
            // de iniciarModoSeleccionado() (más abajo en este archivo) vuelve
            // a meter de una en la misma partida en vez de ir al inicio.
            window.location.href = "index.html";
        });
    }

    // AGREGAR ESTE BLOQUE
    if (botonCerrarModal) {
        botonCerrarModal.addEventListener("click", () => {
            cerrarFinJuego();
        });
    }

    // Cerrar también al tocar fuera del modal (el backdrop): en un <dialog>
    // nativo, un click ahí (no en su contenido) llega con target === el
    // propio <dialog> — mismo patrón que ya usan #configDialog y #modoModal.
    const finJuegoDialog = document.getElementById("finJuegoDialog");
    if (finJuegoDialog) {
        finJuegoDialog.addEventListener("click", (e) => {
            if (e.target === finJuegoDialog) {
                cerrarFinJuego();
            }
        });
    }
}

// Llamar a esta función cuando se inicia el juego

// --- Hamburger menu toggle - FUERA del DOMContentLoaded del juego ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.header-nav');

    if (toggleButton && nav) {
        toggleButton.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
});

// --- Selector de tema claro/oscuro - FUERA del DOMContentLoaded del juego ---
function inicializarSelectorDeTema() {
    const THEME_KEY = 'pag-theme';
    const root = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle');

    const iconoSol = `<svg class="theme-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Cambiar a tema claro</title><path d="M3.55,19.09L4.96,20.5L6.76,18.71L5.35,17.29M12,6C8.69,6 6,8.69 6,12C6,15.31 8.69,18 12,18C15.31,18 18,15.31 18,12C18,8.69 15.31,6 12,6M20,13H23V11H20M17.24,18.71L19.04,20.5L20.45,19.09L18.66,17.29M20.45,5L19.04,3.6L17.24,5.39L18.66,6.81M13,1H11V4H13M6.76,5.39L4.96,3.6L3.55,5L5.35,6.81M1,13H4V11H1M13,20H11V23H13Z" /></svg>`;
    const iconoLuna = `<svg class="theme-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Cambiar a tema oscuro</title><path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z" /></svg>`;

    function aplicarTema(tema) {
        root.setAttribute('data-theme', tema);
        if (themeToggle) {
            themeToggle.innerHTML = tema === 'light' ? iconoLuna : iconoSol;
            themeToggle.setAttribute('aria-label', tema === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
        }
    }

    aplicarTema(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nuevoTema = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            try { localStorage.setItem(THEME_KEY, nuevoTema); } catch (e) {}
            aplicarTema(nuevoTema);
        });
    }
}

// El script se carga con "defer", así que el DOM ya está listo: no hace falta
// esperar a DOMContentLoaded (evita inconsistencias de timing con ese evento).
inicializarSelectorDeTema();

// --- Línea de tiempo en presidencias.html ---
function cargarLineaDeTiempo() {
    const timelineContainer = document.querySelector('.timeline-container');
    if (!timelineContainer) return; // Solo ejecutar si estamos en presidencias.html

    // px de alto del tramo del eje por año de mandato, y piso para mandatos
    // de pocos meses (si no, el tramo casi desaparece).
    const ANIOS_A_PX = 16;
    const ALTO_MIN = 34;

    function claseTipo(presidente) {
        if (presidente.esDeFacto()) return "es-de-facto";
        if (presidente.esInterino()) return "es-interino";
        return "";
    }

    function etiquetaTipo(presidente) {
        if (presidente.esDeFacto()) return "De facto";
        if (presidente.esInterino()) return "Interino";
        return "Constitucional";
    }

    function altoTramo(presidente) {
        const inicio = presidente.periodo.inicio;
        if (!inicio) return ALTO_MIN;
        const fin = presidente.periodo.fin || new Date(); // presidencia en curso: mide hasta hoy
        const anios = Math.max(0, (fin - inicio) / (1000 * 60 * 60 * 24 * 365.25));
        return Math.max(ALTO_MIN, Math.round(anios * ANIOS_A_PX));
    }

    // --- Modal con el retrato en grande, al tocar la foto de una tarjeta ---
    // Usa la foto original (sin el recorte centrado pensado para el círculo
    // chico), igual que el modo "Adivina la imagen".
    let retratoModal = null;
    let retratoOrigenEl = null; // miniatura desde la que se abrió, para animar ida y vuelta

    // Anima el modal entre la posición/tamaño de la miniatura tocada y su
    // posición final centrada (la que ya define el CSS de ".retrato-modal").
    // "haciaMiniatura=true" hace el recorrido inverso (usado al cerrar).
    function animarRetratoModalDesdeOrigen(dialog, haciaMiniatura) {
        if (!retratoOrigenEl) return false;

        const origen = retratoOrigenEl.getBoundingClientRect();
        const destino = dialog.getBoundingClientRect();
        const escalaX = origen.width / destino.width;
        const escalaY = origen.height / destino.height;
        const dx = (origen.left + origen.width / 2) - (destino.left + destino.width / 2);
        const dy = (origen.top + origen.height / 2) - (destino.top + destino.height / 2);
        const transformEnMiniatura = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${escalaX}, ${escalaY})`;
        const transformCentrado = 'translate(-50%, -50%)';

        if (haciaMiniatura) {
            dialog.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease';
            dialog.style.opacity = '0';
            dialog.style.transform = transformEnMiniatura;
        } else {
            dialog.style.transition = 'none';
            dialog.style.opacity = '0';
            dialog.style.transform = transformEnMiniatura;
            dialog.offsetHeight; // forzar reflow: sin esto no hay estado "de partida" que animar
            dialog.style.transition = 'transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.28s ease';
            dialog.style.opacity = '1';
            dialog.style.transform = transformCentrado;
        }
        return true;
    }

    function cerrarRetratoModal() {
        if (!retratoModal || !retratoModal.open) return;

        const animado = animarRetratoModalDesdeOrigen(retratoModal, true);
        retratoModal.classList.remove('retrato-modal-visible');
        if (!animado) {
            retratoModal.close();
            return;
        }
        const finalizarCierre = () => {
            retratoModal.removeEventListener('transitionend', finalizarCierre);
            retratoModal.close();
        };
        retratoModal.addEventListener('transitionend', finalizarCierre);
    }

    function asegurarRetratoModal() {
        if (retratoModal) return retratoModal;

        retratoModal = document.createElement('dialog');
        retratoModal.id = 'retratoModal';
        retratoModal.className = 'retrato-modal';
        retratoModal.innerHTML = `
            <button type="button" class="retrato-modal-cerrar" aria-label="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
            </button>
            <img class="retrato-modal-img" src="" alt="">
            <p class="retrato-modal-nombre"></p>
            <p class="retrato-modal-periodo"></p>
        `;
        document.body.appendChild(retratoModal);

        retratoModal.querySelector('.retrato-modal-cerrar').addEventListener('click', () => cerrarRetratoModal());
        // Click en el backdrop (target === el propio <dialog>) también cierra,
        // mismo patrón que #modoModal y #finJuegoDialog.
        retratoModal.addEventListener('click', (e) => {
            if (e.target === retratoModal) cerrarRetratoModal();
        });
        // Esc dispara "cancel" y cerraría el <dialog> de golpe: lo frenamos
        // para poder reproducir la animación de cierre también en ese caso.
        retratoModal.addEventListener('cancel', (e) => {
            e.preventDefault();
            cerrarRetratoModal();
        });
        // Al terminar de cerrar (por cualquier vía) se limpian los estilos
        // inline de la animación, así la próxima apertura arranca de cero.
        retratoModal.addEventListener('close', () => {
            retratoModal.style.transition = '';
            retratoModal.style.transform = '';
            retratoModal.style.opacity = '';
            retratoModal.classList.remove('retrato-modal-visible');
            retratoOrigenEl = null;
        });

        return retratoModal;
    }

    function abrirRetratoModal(src, nombre, periodo, origenEl) {
        const dialog = asegurarRetratoModal();
        const img = dialog.querySelector('.retrato-modal-img');
        dialog.querySelector('.retrato-modal-nombre').textContent = nombre;
        dialog.querySelector('.retrato-modal-periodo').textContent = periodo;
        img.alt = nombre;
        retratoOrigenEl = origenEl || null;

        const mostrarConAnimacion = () => {
            dialog.showModal();
            dialog.classList.add('retrato-modal-visible');
            animarRetratoModalDesdeOrigen(dialog, false);
        };

        // La foto es la original sin recortar (no la miniatura, que ya está
        // cacheada): si se mide/anima antes de que termine de cargar, el
        // modal todavía no tiene su alto real (la imagen ocupa 0px) y el
        // punto de partida de la animación queda mal calculado. Al terminar
        // de cargar, el layout se acomoda de golpe y se ve como un
        // "teletransporte" al centro en vez de una animación continua. Por
        // eso se espera a que la imagen esté lista antes de mostrar y animar
        // el modal.
        img.onload = null;
        img.src = src;
        if (img.complete && img.naturalWidth > 0) {
            mostrarConAnimacion();
        } else {
            img.onload = () => {
                img.onload = null;
                mostrarConAnimacion();
            };
        }
    }

    function intentarRenderizar() {
        // window.listaPresidentes se arma en otro bloque que puede tardar
        // un instante en ejecutarse; reintentamos hasta que esté disponible.
        if (!window.listaPresidentes) {
            setTimeout(intentarRenderizar, 50);
            return;
        }

        const filasHTML = window.listaPresidentes.map((presidente, indice) => {
            const nombreCompleto = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                .filter(Boolean).join(" ");

            const tipo = claseTipo(presidente);
            const lado = indice % 2 === 0 ? "es-izquierda" : "es-derecha";
            const anioInicio = presidente.periodo.inicio ? presidente.periodo.inicio.getFullYear() : "";

            return `
                <div class="presidencia-fila ${lado}">
                    <span class="presidencia-punto ${tipo}"></span>
                    <span class="presidencia-anio">${anioInicio}</span>
                    <span class="presidencia-tramo ${tipo}" style="height: ${altoTramo(presidente)}px"></span>
                    <div class="presidencia-lado">
                        <div class="presidencia-card ${tipo}" tabindex="0" role="button" aria-expanded="false">
                            <div class="presidencia-cabecera">
                                <span class="presidencia-retrato" role="button" tabindex="0" aria-label="Ver foto de ${nombreCompleto} en grande" data-imagen="${presidente.imagen}" data-nombre="${nombreCompleto}" data-periodo="${presidente.periodo.toString()}">
                                    <img src="${imagenCentradaDe(presidente.imagen)}" alt="${nombreCompleto}" loading="lazy">
                                </span>
                                <div class="presidencia-datos">
                                    <h3>${nombreCompleto}</h3>
                                    <div class="presidencia-meta">
                                        <span class="presidencia-periodo">${presidente.periodo.toString()}</span>
                                        <span class="presidencia-tipo">${etiquetaTipo(presidente)}</span>
                                    </div>
                                </div>
                                <span class="presidencia-chevron" aria-hidden="true">›</span>
                            </div>
                            <p class="presidencia-descripcion">${presidente.descripcion}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        timelineContainer.innerHTML = `<div class="timeline-eje"></div>${filasHTML}`;

        // Al tocar/clickear una tarjeta, queda "fijada" expandida (útil en celular,
        // donde no existe hover). En desktop además se expande solo con el mouse encima.
        timelineContainer.querySelectorAll('.presidencia-card').forEach(card => {
            const alternarExpandido = () => {
                const expandido = card.classList.toggle('esta-abierta');
                card.setAttribute('aria-expanded', expandido ? 'true' : 'false');
            };
            card.addEventListener('click', alternarExpandido);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alternarExpandido();
                }
            });
        });

        // El retrato abre el modal con la foto en grande, sin que ese click
        // también le llegue a la tarjeta (que si no, se abriría/cerraría a
        // la vez).
        timelineContainer.querySelectorAll('.presidencia-retrato').forEach(retrato => {
            const abrir = (e) => {
                e.stopPropagation();
                abrirRetratoModal(retrato.dataset.imagen, retrato.dataset.nombre, retrato.dataset.periodo, retrato);
            };
            retrato.addEventListener('click', abrir);
            retrato.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    abrir(e);
                }
            });
        });
    }

    intentarRenderizar();
}

cargarLineaDeTiempo();

// --- Título de página en presidencias.html / modos.html (".linea-tiempo-heading") ---
// "Todas las Presidencias Argentinas" es largo: en celulares angostos podía
// terminar partido en 2 o 3 líneas. Se achica la fuente hasta que entre en
// una sola línea, con un piso legible — mismo patrón que
// ajustarBadgeModoAlAncho()/ajustarModoModalTitulo() para las placas doradas.
function ajustarTituloLineaDeTiempo() {
    const titulo = document.querySelector(".linea-tiempo-heading");
    if (!titulo) return;
    titulo.style.fontSize = ""; // vuelve al tamaño base definido en CSS
    const pisoPx = 13;
    let tamanioPx = parseFloat(getComputedStyle(titulo).fontSize);
    let intentos = 0;
    while (titulo.scrollWidth > titulo.clientWidth + 1 && tamanioPx > pisoPx && intentos < 40) {
        tamanioPx -= 1;
        titulo.style.fontSize = tamanioPx + "px";
        intentos++;
    }
}
ajustarTituloLineaDeTiempo();
window.addEventListener("resize", ajustarTituloLineaDeTiempo);
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ajustarTituloLineaDeTiempo);
}

// Configurar event listeners del modal de fin de juego
agregarEventListenersModalFinJuego();

// Acción automática al llegar desde el modal de "Ver modos de juego" con
// ?modo=X&accion=jugar (el botón "Jugar" del modal es lo único que navega a
// index.html; "Configurar" se resuelve ahí mismo, sin salir de la página).
// Va al final de todo el setup: las funciones de cada modo (iniciarJuegoSopa,
// iniciarJuegoCrucigrama, etc.) usan variables "let" declaradas más abajo en
// este mismo archivo, así que llamarlas antes de que el script entero
// termine de correr una vez (aunque las funciones ya estén "hoisteadas")
// tira ReferenceError por temporal dead zone.
if (accionDesdeUrl === "jugar") {
    iniciarModoSeleccionado();
}

// Recién acá se sabe que, si esta carga venía oculta por el script inline
// del <head> (ver ahí), el juego ya está armado: se puede volver a mostrar
// la página sin que se haya visto la pantalla de inicio en el medio.
document.documentElement.removeAttribute("data-cargando-juego");
}); // ← Este es el cierre del primer DOMContentLoaded

// --- Hamburger menu toggle - FUERA del DOMContentLoaded del juego ---
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.header-nav');

    if (toggleButton && nav) {
        toggleButton.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
});
