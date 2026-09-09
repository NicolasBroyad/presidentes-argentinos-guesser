document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const body = document.querySelector("body");
    const buttonSection = document.querySelector(".button-section");
    const rulesSection = document.querySelector(".rules-section");
    const botonIniciar = document.querySelector(".iniciar-juego-button");
    const botonConfiguracion = document.querySelector(".configuracion-link");
    const main = document.querySelector(".main");
    const h1 = document.querySelector("h1");
    const kicker = document.querySelector(".kicker");

    // --- Sonido de acierto ---
    // Sintetizado con Web Audio API: un "thump" grave de cuerpo + un tono
    // cálido corto por encima (mucho más grave que la versión "sparkle"
    // anterior). Se llama a reproducirSonidoAcierto() desde cada modo de
    // juego (clásico, imagen, sopa de letras, crucigrama) justo cuando se
    // confirma una respuesta correcta.
    const SONIDO_ACIERTO_KEY = "pag-sonido-acierto";
    let sonidoAciertoActivado = localStorage.getItem(SONIDO_ACIERTO_KEY) !== "off";
    let audioCtxAcierto = null;

    function reproducirSonidoAcierto() {
        if (!sonidoAciertoActivado) return;
        try {
            if (!audioCtxAcierto) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                audioCtxAcierto = new AudioCtx();
            }
            if (audioCtxAcierto.state === "suspended") audioCtxAcierto.resume();

            const ahora = audioCtxAcierto.currentTime;
            const duracion = 0.27;

            // "Thump" grave: le da cuerpo/peso al golpe, sin llegar a sonar
            // como un bajo. Cae rápido, es solo el "impacto" inicial.
            const thump = audioCtxAcierto.createOscillator();
            const gananciaThump = audioCtxAcierto.createGain();
            thump.type = "sine";
            thump.frequency.setValueAtTime(180, ahora);
            thump.frequency.exponentialRampToValueAtTime(90, ahora + 0.11);
            gananciaThump.gain.setValueAtTime(0.28, ahora);
            gananciaThump.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.13);
            thump.connect(gananciaThump).connect(audioCtxAcierto.destination);
            thump.start(ahora);
            thump.stop(ahora + 0.14);

            // Tono cálido por encima del thump: un salto corto de 440Hz a
            // 660Hz (quinta justa), bastante más grave que un "sparkle" agudo.
            const osc = audioCtxAcierto.createOscillator();
            const ganancia = audioCtxAcierto.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, ahora + 0.02);
            osc.frequency.exponentialRampToValueAtTime(660, ahora + 0.15);
            ganancia.gain.setValueAtTime(0.0001, ahora + 0.02);
            ganancia.gain.exponentialRampToValueAtTime(0.22, ahora + 0.06);
            ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);
            osc.connect(ganancia).connect(audioCtxAcierto.destination);
            osc.start(ahora + 0.02);
            osc.stop(ahora + duracion + 0.02);
        } catch (e) {
            // Web Audio no disponible en este navegador: fallamos en silencio.
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
            const audio = new Audio("sonido-boton.wav");
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
            const titulo = card.querySelector(".modo-de-juego-seleccionado");
            const descripcion = card.querySelector(".modo-card-texto p");
            if (modoModalIcono && icono) modoModalIcono.innerHTML = icono.innerHTML;
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
    function ajustarBadgeModoAlAncho() {
        const heading = document.querySelector(".jugando-modo-heading");
        if (!heading) return;
        heading.style.fontSize = ""; // vuelve al tamaño base definido en CSS
        if (!window.matchMedia("(max-width: 768px)").matches) return;
        const nombreModo = heading.querySelector(".modo-de-juego-seleccionado");
        const desborda = () =>
            heading.scrollWidth > heading.clientWidth + 1 ||
            (nombreModo && nombreModo.scrollWidth > nombreModo.clientWidth + 1);
        const pisoPx = 9;
        let tamanioPx = parseFloat(getComputedStyle(heading).fontSize);
        while (desborda() && tamanioPx > pisoPx) {
            tamanioPx -= 1;
            heading.style.fontSize = tamanioPx + "px";
        }
    }
    window.addEventListener("resize", ajustarBadgeModoAlAncho);

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
            if (sonidoAciertoActivado) reproducirSonidoAcierto();
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
        tiempoImagen: 5, // minutos (modo "Adivina la imagen")
        eliminarDeFacto: false,
        // El filtro de "gobiernos de menos de 1 año" tiene un default distinto
        // por modo: en clásico se incluyen (como siempre), en "Adivina la
        // imagen" se descartan por defecto (son más difíciles de reconocer
        // por foto al haber gobernado tan poco tiempo).
        eliminarMenosDeUnAnioClasico: false,
        eliminarMenosDeUnAnioImagen: true,
        eliminarMenosDeUnAnioSopa: true,
        tiempoSopa: 4, // minutos (modo "Sopa de letras")
        cantidad: 10 // presidentes por partida (solo modo "Adivina la imagen")
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
        clasico: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="rgb(var(--blue-strong))" fill-opacity="0.3"><circle cx="8.6" cy="17.2" r="8.6"/><rect x="25" y="8.6" width="75" height="17.2" rx="5.2"/><circle cx="8.6" cy="82.8" r="8.6"/><rect x="25" y="74.2" width="75" height="17.2" rx="5.2"/></g><g fill="rgb(var(--blue-strong))"><circle cx="8.6" cy="50" r="8.6"/><rect x="25" y="41.4" width="75" height="17.2" rx="5.2"/></g></svg>`,
        imagen: `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="15" y="4" width="70" height="67" rx="11" fill="rgb(var(--blue-strong))" fill-opacity="0.22"/><g fill="rgb(var(--blue-strong))"><circle cx="50" cy="30.5" r="11.5"/><path d="M28 71V60a22 22 0 0 1 44 0v11z"/></g><rect x="15" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--gold))"/><rect x="34" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--blue-strong))" fill-opacity="0.34"/><rect x="53" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--blue-strong))" fill-opacity="0.34"/><rect x="71.3" y="85" width="13.7" height="6.4" rx="3.2" fill="rgb(var(--blue-strong))" fill-opacity="0.34"/></svg>`,
        sopa: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="rgb(var(--blue-strong))" fill-opacity="0.34"><rect x="0" y="0" width="16" height="16" rx="3"/><rect x="21" y="0" width="16" height="16" rx="3"/><rect x="42" y="0" width="16" height="16" rx="3"/><rect x="63" y="0" width="16" height="16" rx="3"/><rect x="84" y="0" width="16" height="16" rx="3"/><rect x="21" y="21" width="16" height="16" rx="3"/><rect x="42" y="21" width="16" height="16" rx="3"/><rect x="63" y="21" width="16" height="16" rx="3"/><rect x="84" y="21" width="16" height="16" rx="3"/><rect x="0" y="42" width="16" height="16" rx="3"/><rect x="42" y="42" width="16" height="16" rx="3"/><rect x="63" y="42" width="16" height="16" rx="3"/><rect x="84" y="42" width="16" height="16" rx="3"/><rect x="0" y="63" width="16" height="16" rx="3"/><rect x="21" y="63" width="16" height="16" rx="3"/><rect x="63" y="63" width="16" height="16" rx="3"/><rect x="84" y="63" width="16" height="16" rx="3"/><rect x="0" y="84" width="16" height="16" rx="3"/><rect x="21" y="84" width="16" height="16" rx="3"/><rect x="42" y="84" width="16" height="16" rx="3"/><rect x="84" y="84" width="16" height="16" rx="3"/></g><g fill="#a78bfa"><rect x="0" y="21" width="16" height="16" rx="3"/><rect x="21" y="42" width="16" height="16" rx="3"/><rect x="42" y="63" width="16" height="16" rx="3"/><rect x="63" y="84" width="16" height="16" rx="3"/></g></svg>`,
        crucigrama: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="rgb(var(--blue-strong))" fill-opacity="0.34"><rect x="21" y="0" width="16" height="16" rx="3"/><rect x="63" y="0" width="16" height="16" rx="3"/><rect x="21" y="42" width="16" height="16" rx="3"/><rect x="63" y="42" width="16" height="16" rx="3"/><rect x="0" y="63" width="16" height="16" rx="3"/><rect x="21" y="63" width="16" height="16" rx="3"/><rect x="42" y="63" width="16" height="16" rx="3"/><rect x="63" y="63" width="16" height="16" rx="3"/><rect x="21" y="84" width="16" height="16" rx="3"/><rect x="63" y="84" width="16" height="16" rx="3"/></g><g fill="#8fd6a8"><rect x="0" y="21" width="16" height="16" rx="3"/><rect x="21" y="21" width="16" height="16" rx="3"/><rect x="42" y="21" width="16" height="16" rx="3"/><rect x="63" y="21" width="16" height="16" rx="3"/><rect x="84" y="21" width="16" height="16" rx="3"/></g></svg>`
    };

    const MODOS = {
        clasico: {
            badge: 'CLÁSICO',
            nombre: 'Clásico',
            descripcion: 'Completá la lista de presidencias con el apellido de cada presidente, a contrarreloj.'
        },
        imagen: {
            badge: 'ADIVINA LA IMAGEN',
            nombre: 'Adiviná la imagen',
            descripcion: 'Reconocé al presidente de la foto y escribí su apellido, uno tras otro.'
        },
        sopa: {
            badge: 'SOPA DE LETRAS',
            nombre: 'Sopa de letras',
            descripcion: 'Marcá en la grilla los apellidos escondidos, guiándote por la foto y los años de mandato.'
        },
        crucigrama: {
            badge: 'CRUCIGRAMA',
            nombre: 'Crucigrama',
            descripcion: 'Un crucigrama nuevo cada día: cada pista es un período y la respuesta, el apellido.'
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

    const botonesModo = document.querySelectorAll(".modo-de-juego-button");

    // --- Elementos del modal ---
    const slider = document.getElementById("sliderTiempo");
    const valorRango = document.getElementById("valorRango");
    const sliderCantidad = document.getElementById("sliderCantidad");
    const valorCantidad = document.getElementById("valorCantidad");
    const contenedorTemporizador = document.querySelector(".configuracion-temporizador-container");
    const contenedorCantidad = document.querySelector(".configuracion-cantidad-container");
    const contenedorFiltros = document.querySelector(".filtros-container");
    const botonGuardar = document.querySelector(".guardar");
    const botonCancelar = document.querySelector(".cancelar");
    const checkboxes = document.querySelectorAll('.checkbox-input');

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
    new Presidente("Bernardino", "", "Rivadavia", new Periodo(new Date("1826-02-08"), new Date("1827-06-27")), false, "images/presidentes/rivadavia.jpg", "Político y educador; primer presidente de las Provincias Unidas del Río de la Plata. Promovió reformas liberales y la creación de instituciones educativas, pero su proyecto centralista y la guerra con Brasil provocaron su renuncia."),
    new Presidente("Vicente", "", "López", new Periodo(new Date("1827-07-07"), new Date("1827-08-18")), false, "images/presidentes/vicentelopez.jpg", "Político y jurista que asumió provisionalmente en 1827. Su breve mandato se enmarca en la inestabilidad política posterior a Rivadavia."),
    new Presidente("Bartolomé", "", "Mitre", new Periodo(new Date("1862-10-12"), new Date("1868-10-12")), false, "images/presidentes/mitre.jpg", "Militar, político e historiador; primer presidente de la Argentina unificada. Impulsó la consolidación institucional y la modernización del Estado y la educación."),
    new Presidente("Domingo", "Faustino", "Sarmiento", new Periodo(new Date("1868-10-12"), new Date("1874-10-12")), false, "images/presidentes/sarmiento.jpg", "Educador y escritor; presidente famoso por su impulso a la educación pública y la modernización del país. Promovió escuelas, bibliotecas y la inmigración europea para el desarrollo."),
    new Presidente("Nicolás", "Remigio Aurelio", "Avellaneda", new Periodo(new Date("1874-10-12"), new Date("1880-10-12")), false, "images/presidentes/avellaneda.jpg", "Estadista y economista; presidente que enfrentó crisis económicas y promovió la reorganización financiera del Estado. Fomentó la colonización agrícola y la modernización del sistema educativo."),
    new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1880-10-12"), new Date("1886-10-12")), false, "images/presidentes/roca1.jpg", "Militar y político; su primer mandato consolidó la autoridad nacional y promovió políticas de expansión territorial y modernización del país, aunque con controvertidas campañas en la Patagonia."),
    new Presidente("Miguel", "Ángel", "Juárez Celman", new Periodo(new Date("1886-10-12"), new Date("1890-08-06")), false, "images/presidentes/juarezcelman.jpg", "Político ligado al modelo exportador; su presidencia terminó con la crisis del '89 y su renuncia tras protestas populares y descontento por corrupción y manejo económico."),
    new Presidente("Carlos", "Enrique José", "Pellegrini", new Periodo(new Date("1890-08-06"), new Date("1892-10-12")), false, "images/presidentes/pellegrini.jpg", "Economista y político; asumió tras la crisis de 1890 y estabilizó la economía. Impulsó medidas financieras para recuperar la confianza y sentó bases para el crecimiento posterior."),
    new Presidente("Luis", "", "Sáenz Peña", new Periodo(new Date("1892-10-12"), new Date("1895-01-22")), false, "images/presidentes/luissaenzpena.jpg", "Político conservador; su gobierno continuó el desarrollo institucional previo, en un período de consolidación del modelo agroexportador y de las élites tradicionales."),
    new Presidente("José", "Evaristo", "Uriburu", new Periodo(new Date("1895-01-23"), new Date("1898-10-12")), false, "images/presidentes/joseevaristouriburu.jpg", "Militar y político; presidente en una etapa de estabilidad relativa. Su gestión se centró en la continuidad del orden político y el crecimiento económico agroexportador."),
    new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1898-10-12"), new Date("1904-10-12")), false, "images/presidentes/roca2.jpg", "En su segundo mandato Roca continuó políticas modernizadoras y la consolidación del Estado; su figura es clave en la política argentina de fines del siglo XIX y principios del XX."),
    new Presidente("Manuel", "Pedro", "Quintana", new Periodo(new Date("1904-10-12"), new Date("1906-03-12")), false, "images/presidentes/quintana.jpg", "Político conservador; su breve período se caracterizó por la continuidad de la élite gobernante y la estabilidad institucional, con foco en la administración pública."),
    new Presidente("José", "", "Figueroa Alcorta", new Periodo(new Date("1906-03-12"), new Date("1910-10-12")), false, "images/presidentes/figueroaalcorta.jpg", "Juez y político que asumió la presidencia y es recordado por promover la liberalización económica y reformas institucionales en un contexto de crecimiento."),
    new Presidente("Roque", "", "Sáenz Peña", new Periodo(new Date("1910-10-12"), new Date("1914-08-09")), false, "images/presidentes/roquesaenzpena.jpg", "Político y expresidente; su presidencia preparó el terreno para la histórica Ley Sáenz Peña, que luego ampliaría el sufragio secreto y obligatorio, transformando el sistema político."),
    new Presidente("Victorino", "", "de la Plaza", new Periodo(new Date("1914-08-09"), new Date("1916-10-12")), false, "images/presidentes/delaplaza.jpg", "Asumió tras la renuncia de Sáenz Peña; su gobierno enfrentó los efectos de la Primera Guerra Mundial y mantuvo la administración estatal en un contexto difícil."),
    new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1916-10-12"), new Date("1922-10-12")), false, "images/presidentes/yrigoyen1.jpg", "Líder radical y presidente tras la Ley Sáenz Peña; impulsó políticas sociales y laborales, y marcó la entrada de nuevas fuerzas políticas al poder tradicional."),
    new Presidente("Marcelo", "Torcuato", "de Alvear", new Periodo(new Date("1922-10-12"), new Date("1928-10-12")), false, "images/presidentes/alvear.jpg", "Político conservador moderado; su gobierno consolidó instituciones democráticas y fomentó el desarrollo cultural y la estabilidad relativa de la década de 1920."),
    new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1928-10-12"), new Date("1930-09-06")), false, "images/presidentes/yrigoyen2.jpg", "Reelecto en 1928, su segundo mandato fue marcado por la crisis económica global y terminó con su derrocamiento por un golpe militar en 1930."),
    new Presidente("José", "Félix", "Uriburu", new Periodo(new Date("1930-09-06"), new Date("1932-02-20")), true, "images/presidentes/uriburu.jpg", "General que encabezó el primer golpe de Estado de la era moderna argentina; gobernó de facto e instauró un régimen conservador que inició la llamada 'Década Infame'."),
    new Presidente("Agustín", "Pedro", "Justo", new Periodo(new Date("1932-02-20"), new Date("1938-02-20")), false, "images/presidentes/justo.jpg", "Presidente civil elegido en un clima de fraude electoral; su gobierno implementó políticas de estabilidad económica y acuerdos con sectores conservadores durante la 'Década Infame'."),
    new Presidente("Roberto", "Marcelino", "Ortiz", new Periodo(new Date("1938-02-20"), new Date("1942-06-26")), false, "images/presidentes/ortiz.jpg", "Militar y presidente preocupada por la corrupción y el fraude; intentó restaurar la legalidad y combatir prácticas fraudulentas, pero su salud y presiones políticas condicionaron su mandato."),
    new Presidente("Ramón", "", "Castillo", new Periodo(new Date("1942-06-26"), new Date("1943-06-04")), false, "images/presidentes/castillo.jpg", "Presidente conservador elegido en un contexto de fraude y crisis; su gobierno terminó con el golpe militar de 1943 que abriría un nuevo ciclo político."),
    new Presidente("Arturo", "Franklin", "Rawson", new Periodo(new Date("1943-06-04"), new Date("1943-06-07")), true, "images/presidentes/rawson.jpg", "Militar que asumió brevemente tras el golpe de 1943; su mandato duró solo unos días antes de ser reemplazada por la Junta militar, en un período convulso."),
    new Presidente("Pedro", "Pablo", "Ramírez", new Periodo(new Date("1943-06-07"), new Date("1944-02-24")), true, "images/presidentes/pabloramirez.jpg", "General que presidió la junta de 1943–1944; bajo su gobierno se dieron cambios en el escenario político que propiciaron la aparición del peronismo."),
    new Presidente("Edelmiro", "Julián", "Farrell", new Periodo(new Date("1944-02-24"), new Date("1946-06-04")), true, "images/presidentes/farrell.jpg", "Militar que gobernó como jefe de la junta y luego presidente de facto; durante su mandato emergió la figura de Juan Domingo Perón, quien ejerció gran influencia política y ministerial."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1946-06-04"), new Date("1952-06-04")), false, "images/presidentes/peron1.jpg", "Líder popular y fundador del peronismo; primer mandato presidencial con fuerte protagonismo en políticas sociales, laborales e industrialización por sustitución de importaciones."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1952-06-04"), new Date("1955-09-21")), false, "images/presidentes/peron2.jpg", "Segundo mandato marcado por tensiones políticas y polarización; terminó con el derrocamiento de Perón en 1955 por la llamada 'Revolución Libertadora'."),
    new Presidente("Eduardo", "Ernesto", "Lonardi", new Periodo(new Date("1955-09-23"), new Date("1955-11-13")), true, "images/presidentes/lonardi.jpg", "Militar que encabezó el golpe que depuso a Perón; su breve gobierno propuso una reconciliación nacional, aunque fue reemplazado por sectores más duros del antiperonismo."),
    new Presidente("Pedro", "Eugenio", "Aramburu", new Periodo(new Date("1955-11-13"), new Date("1958-05-01")), true, "images/presidentes/aramburu.jpg", "Presidente de facto que proscribió el peronismo y reorganizó el sistema político; su gobierno intentó estabilizar el país tras la caída de Perón."),
    new Presidente("Arturo", "", "Frondizi", new Periodo(new Date("1958-05-01"), new Date("1962-03-29")), false, "images/presidentes/frondizi.jpg", "Presidente conocido por promover la industrialización y la atracción de inversiones; su mandato fue interrumpido por presiones militares y terminó con su derrocamiento."),
    new Presidente("José", "María", "Guido", new Periodo(new Date("1962-03-29"), new Date("1963-10-12")), false, "images/presidentes/guido.jpg", "Asumió como presidente provisional tras la crisis de 1962; su gobierno administró la transición hasta nuevas elecciones en un clima político convulso."),
    new Presidente("Arturo", "Umberto", "Illia", new Periodo(new Date("1963-10-12"), new Date("1966-06-28")), false, "images/presidentes/illia.jpg", "Médico y político que presidió con un enfoque en la ética pública y la recuperación democrática; su gobierno fue derrocado por un golpe militar en 1966."),
    new Presidente("Juan", "Carlos", "Onganía", new Periodo(new Date("1966-06-28"), new Date("1970-06-08")), true, "images/presidentes/ongania.jpg", "General que encabezó la dictadura autodenominada 'Revolución Argentina', suspendió partidos políticos y reformas estructurales que cambiaron la vida institucional del país."),
    new Presidente("Roberto", "Marcelo", "Levingston", new Periodo(new Date("1970-06-18"), new Date("1971-03-23")), true, "images/presidentes/levingston.jpg", "Militar que lideró la junta entre 1970 y 1971; su corto mandato se enmarcó en la inestabilidad política y en intentos de reorganización del poder militar."),
    new Presidente("Alejandro", "Agustín", "Lanusse", new Periodo(new Date("1971-03-23"), new Date("1973-05-25")), true, "images/presidentes/lanusse.jpg", "Último presidente de facto de la dictadura de 1966–1973; dirigió el regreso a un proceso electoral que culminó con la elección de Perón en 1973."),
    new Presidente("Héctor", "José", "Cámpora", new Periodo(new Date("1973-05-25"), new Date("1973-07-13")), false, "images/presidentes/campora.jpg", "Militante peronista y presidente breve en 1973; su gobierno buscó la apertura política que permitió el retorno de Juan Domingo Perón a la presidencia."),
    new Presidente("Raúl", "Alberto", "Lastiri", new Periodo(new Date("1973-07-13"), new Date("1973-10-12")), false, "images/presidentes/lastiri.jpg", "Asumió provisionalmente en 1973 como presidente interino; su mandato fue breve en el complejo contexto del regreso del peronismo al poder."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1973-10-12"), new Date("1974-07-01")), false, "images/presidentes/peron3.jpg", "Tercer mandato tras su regreso del exilio; su gobierno enfrentó una creciente polarización política y problemas de salud que condicionaron su última etapa."),
    new Presidente("María", "Estela", "Martínez", new Periodo(new Date("1974-07-01"), new Date("1976-03-24")), false, "images/presidentes/isabel.jpg", "Conocida como Isabel Perón; su presidencia estuvo marcada por crisis política y económica, que culminaron en el golpe militar de 1976."),
    new Presidente("Jorge", "Rafael", "Videla", new Periodo(new Date("1976-03-29"), new Date("1981-03-29")), true, "images/presidentes/videla.jpg", "General que encabezó la dictadura militar responsable de la represión, violaciones a los derechos humanos y la llamada 'guerra sucia'."),
    new Presidente("Roberto", "Eduardo", "Viola", new Periodo(new Date("1981-03-29"), new Date("1981-12-11")), true, "images/presidentes/viola_roberto.jpg", "Militar que sucedió a Videla en la junta; su corto gobierno buscó gobernabilidad pero fue desplazado por sectores militares internos."),
    new Presidente("Carlos", "Alberto", "Lacoste", new Periodo(new Date("1981-12-11"), new Date("1981-12-22")), true, "images/presidentes/lacoste.jpg", "Breve presidente de facto durante la dictadura; ejerció funciones interinas en un período de transición interna dentro de las Fuerzas Armadas."),
    new Presidente("Leopoldo", "Fortunato", "Galtieri", new Periodo(new Date("1981-12-22"), new Date("1982-06-18")), true, "images/presidentes/galtieri.jpg", "General cuyo gobierno impulsó la guerra de Malvinas en 1982, conflicto que precipitó la crisis y debilitamiento del régimen militar."),
    new Presidente("Reynaldo", "Benito", "Bignone", new Periodo(new Date("1982-07-01"), new Date("1983-12-10")), true, "images/presidentes/bignone.jpg", "Último presidente de la última dictadura; encabezó la transición hacia el regreso de la democracia y la convocatoria a elecciones en 1983."),
    new Presidente("Raúl", "Ricardo", "Alfonsín", new Periodo(new Date("1983-12-10"), new Date("1989-07-08")), false, "images/presidentes/alfonsin.jpg", "Abogado y líder de la UCR; presidente que restauró la democracia, promovió juicios por violaciones a los derechos humanos y enfrentó severas crisis económicas."),
    new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1989-07-08"), new Date("1995-07-08")), false, "images/presidentes/menem1.jpg", "Político peronista; primer mandato centrado en políticas neoliberales y reformas económicas que incluyeron privatizaciones y apertura de mercados."),
    new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1995-07-08"), new Date("1999-12-10")), false, "images/presidentes/menem2.jpg", "Segundo mandato que continuó las reformas de mercado; su legado incluye transformaciones económicas y debates sobre impacto social y institucional."),
    new Presidente("Fernando", "", "De La Rúa", new Periodo(new Date("1999-12-10"), new Date("2001-12-20")), false, "images/presidentes/delarua.jpeg", "Abogado y político de la UCR; su presidencia terminó en crisis y renuncia masiva en diciembre de 2001 tras la grave crisis económica y social."),
    new Presidente("Federico", "Ramón", "Puerta", new Periodo(new Date("2001-12-20"), new Date("2001-12-22")), false, "images/presidentes/puerta.jpg", "Asumió interinamente como presidente del Senado y ejerció la presidencia de manera transitoria durante dos días en la convulsa crisis de diciembre de 2001."),
    new Presidente("Adolfo", "", "Rodríguez Saá", new Periodo(new Date("2001-12-22"), new Date("2001-12-30")), true, "images/presidentes/rodriguezsaa.jpg", "Asumió como presidente interino en plena debacle de 2001; su breve gestión se caracterizó por la incertidumbre política y su dimisión tras pocos días."),
    new Presidente("Eduardo", "Oscar", "Camaño", new Periodo(new Date("2001-12-31"), new Date("2002-01-01")), true, "images/presidentes/camano.jpg", "Diputado que ejerció brevemente la presidencia interina en la sucesión de 2001; su rol fue transitorio en la búsqueda de estabilidad institucional."),
    new Presidente("Eduardo", "Alberto", "Duhalde", new Periodo(new Date("2002-01-02"), new Date("2003-05-25")), false, "images/presidentes/duhalde.jpg", "Designado por el Congreso en 2002 para normalizar el país post-crisis; su gobierno implementó medidas para la recuperación económica y la reestructuración social."),
    new Presidente("Néstor", "Carlos", "Kirchner", new Periodo(new Date("2003-05-25"), new Date("2007-12-10")), false, "images/presidentes/kirchner.jpg", "Político peronista; presidente que impulsó la recuperación económica tras la crisis, políticas de derechos humanos y una fuerte centralización política en la Casa Rosada."),
    new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2007-12-10"), new Date("2011-12-10")), false, "images/presidentes/cristinafernandez1.jpg", "Primera etapa presidencial con énfasis en políticas sociales, presencia estatal en la economía y fortalecimiento del proyecto político iniciado en la presidencia de Kirchner."),
    new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2011-12-10"), new Date("2015-12-10")), false, "images/presidentes/cristinafernandez2.jpg", "Segundo mandato caracterizado por mayor intervención estatal, programas sociales ampliados y debates sobre transparencia y manejo económico."),
    new Presidente("Mauricio", "", "Macri", new Periodo(new Date("2015-12-10"), new Date("2019-12-10")), false, "images/presidentes/macri.jpg", "Empresario y líder de coalición; presidente que impulsó reformas pro-mercado, apertura internacional y endeudamiento para estabilizar la economía, con resultados mixtos en crecimiento y pobreza."),
    new Presidente("Alberto", "Ángel", "Fernández", new Periodo(new Date("2019-12-10"), new Date("2023-12-10")), false, "images/presidentes/albertofernandez.jpg", "Presidente que enfrentó desafíos económicos, renegociación de deuda y la gestión de la pandemia; su gobierno formó parte de una coalición peronista heterogénea."),
    new Presidente("Javier", "Gerardo", "Milei", new Periodo(new Date("2023-12-10"), null), false, "images/presidentes/milei.jpg", "Economista y figura política de perfil liberal radical; asumió en 2023 con un programa de reformas económicas y discurso anti-establishment, generando amplio debate político y social.")
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
                    descripcion: p.descripcion,
                    imagenes: [p.imagen],
                    periodos: [p.periodo]
                });
            } else {
                const u = mapa.get(clave);
                u.imagenes.push(p.imagen);
                u.periodos.push(p.periodo);
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
        return presidentesUnicos.filter(u => {
            if (configuracionJuego.eliminarDeFacto && u.deFacto) return false;
            if (configuracionJuego.eliminarMenosDeUnAnioImagen && !u.periodos.some(periodoDuroMasDeUnAnio)) return false;
            return true;
        });
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
            return true;
        });
    }

    // --- Generar tabla HTML ---
    function generarTablaHTML(presidentesFiltrados) {
        const filasTabla = presidentesFiltrados.map((presidente, index) => `
            <tr data-id="${index}" data-periodo="${presidente.periodo.toString()}">
                <td class="imagen-presidente-cell">
                    <div class="imagen-presidente-desconocido-container">
                        <img src="images/presidente-desconocido.png" alt="Presidente desconocido">
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
                <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado">CLÁSICO</span></h4>
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
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado">CLÁSICO</span></h4>
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
            mostrarFinJuego('victoria');
        }
    }

    // --- Iniciar juego ---
    function iniciarJuego() {
        modoActual = 'clasico';
        buttonSection.remove();
        rulesSection.remove();
        h1.remove();
        if (kicker) kicker.remove();
        main.classList.add("juego-activo");
        // En cualquier modo, jugando: sin footer y sin scroll de página.
        body.classList.add("juego-activo");

        const presidentesFiltrados = filtrarPresidentes();
        const contenidoDelJuego = generarTablaHTML(presidentesFiltrados);
        main.insertAdjacentHTML("beforeend", contenidoDelJuego);

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
    // Elegir un modo NO arranca la partida: solo actualiza el badge
    // "MODO DE JUEGO SELECCIONADO", las tarjetas de reglas y qué botón
    // queda resaltado. La partida arranca recién con "Iniciar Juego".
    function htmlReglas(modo) {
        const datos = MODOS[modo];
        return `
            <div class="modo-actual-card">
                <div class="modo-card-logo">${logoModo[modo]}</div>
                <div class="modo-card-text">
                    <h3>${datos.nombre}</h3>
                    <p>${datos.descripcion}</p>
                </div>
            </div>
        `;
    }

    // La tarjeta de reglas no debe cambiar de tamaño ni correr el separador
    // central al cambiar de modo. En vez de adivinar cuántas líneas puede
    // llegar a ocupar el texto más largo (frágil: se rompe cada vez que se
    // agrega un modo o se edita el texto), medimos en el DOM la altura real
    // que necesita CADA modo y usamos la más alta como piso para todos.
    function igualarAlturaReglas() {
        const contenedorReglas = document.querySelector(".rules-container");
        const heading = document.querySelector(".modo-de-juego-seleccionado-heading");
        const fila = document.querySelector(".modo-selector-fila");
        const badge = document.querySelector(".modo-selector-actual");
        if (!contenedorReglas) return;

        contenedorReglas.style.minHeight = "";
        contenedorReglas.style.width = "";
        if (heading) heading.style.width = "";

        // 1) Ancho: lo define el contenido real de "MODO DE JUEGO
        // SELECCIONADO" (la placa del modo + la rosquita de configurar, no
        // el texto del label ni el de las reglas), más el padding propio
        // del heading, para que no quede espacio libre de más a los
        // costados. El ancho de la placa cambia según el largo del nombre
        // de cada modo, así que se mide con los 4 y se usa el más ancho;
        // el contenedor de reglas de abajo se ajusta a ese mismo ancho.
        let maxAnchoFila = 0;
        Object.keys(MODOS).forEach(modo => {
            if (badge) badge.textContent = MODOS[modo].badge;
            if (fila) maxAnchoFila = Math.max(maxAnchoFila, fila.getBoundingClientRect().width);
        });
        // Un poco de aire extra además del padding propio del heading: sin
        // esto, la descripción de los modos con nombres más largos (p. ej.
        // "Crucigrama") queda tan angosta al lado del logo que el texto
        // envuelve palabra por palabra.
        const AIRE_EXTRA_ANCHO = 96;
        let maxAncho = maxAnchoFila;
        if (heading) {
            const estilosHeading = getComputedStyle(heading);
            maxAncho = maxAnchoFila + parseFloat(estilosHeading.paddingLeft) + parseFloat(estilosHeading.paddingRight) + AIRE_EXTRA_ANCHO;
        }
        contenedorReglas.style.width = `${maxAncho}px`;
        if (heading) heading.style.width = `${maxAncho}px`;

        // 2) Alto: con el ancho ya fijo (así el texto de cada modo envuelve
        // igual que en producción), se mide la altura real que necesita
        // cada modo y se usa la más alta como piso para todos.
        let maxAltura = 0;
        Object.keys(MODOS).forEach(modo => {
            contenedorReglas.innerHTML = htmlReglas(modo);
            maxAltura = Math.max(maxAltura, contenedorReglas.getBoundingClientRect().height);
        });
        contenedorReglas.style.minHeight = `${maxAltura}px`;

        contenedorReglas.innerHTML = htmlReglas(modoSeleccionado);
        if (badge) badge.textContent = MODOS[modoSeleccionado].badge;
    }

    function seleccionarModo(modo) {
        if (!MODOS[modo]) return;
        modoSeleccionado = modo;

        botonesModo.forEach(boton => {
            boton.classList.toggle("seleccionado", boton.dataset.modo === modo);
        });

        // Badge desplegable
        const actual = document.querySelector(".modo-selector-actual");
        if (actual) actual.textContent = MODOS[modo].badge;
        document.querySelectorAll(".modo-selector-opcion").forEach(op => {
            op.classList.toggle("seleccionado", op.dataset.modo === modo);
        });

        const contenedorReglas = document.querySelector(".rules-container");
        if (contenedorReglas) {
            contenedorReglas.innerHTML = htmlReglas(modo);
        }

        // El contador de "se reinicia en..." solo tiene sentido para los
        // modos del día (Sopa de letras / Crucigrama); el texto lo pinta
        // actualizarContadoresReinicioDiario() en su próximo tick. Se oculta
        // con visibility (no con "hidden"/display:none) para que la tarjeta
        // de reglas reserve siempre esa línea y no cambie de altura al
        // pasar de un modo con contador a uno sin él.
        const contadorReinicio = document.getElementById("contadorReinicioDiario");
        if (contadorReinicio) {
            contadorReinicio.style.visibility = (modo === 'sopa' || modo === 'crucigrama') ? 'visible' : 'hidden';
        }

        // Sopa de letras y Crucigrama no tienen nada configurable.
        if (botonConfiguracion) {
            botonConfiguracion.style.display = modoTieneConfiguracion(modo) ? "" : "none";
        }
    }

    botonesModo.forEach(boton => {
        boton.addEventListener("click", () => seleccionarModo(boton.dataset.modo));
    });

    // --- Badge desplegable "MODO DE JUEGO SELECCIONADO" ---
    const modoSelectorTrigger = document.querySelector(".modo-selector-trigger");
    const modoSelectorMenu = document.querySelector(".modo-selector-menu");

    function cerrarModoSelector() {
        if (!modoSelectorMenu) return;
        modoSelectorMenu.hidden = true;
        if (modoSelectorTrigger) modoSelectorTrigger.setAttribute("aria-expanded", "false");
    }

    if (modoSelectorTrigger && modoSelectorMenu) {
        modoSelectorTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            reproducirSonidoBoton();
            const abrir = modoSelectorMenu.hidden;
            modoSelectorMenu.hidden = !abrir;
            modoSelectorTrigger.setAttribute("aria-expanded", String(abrir));
        });
        document.querySelectorAll(".modo-selector-opcion").forEach(op => {
            op.addEventListener("click", () => {
                seleccionarModo(op.dataset.modo);
                cerrarModoSelector();
            });
        });
        document.addEventListener("click", (e) => {
            if (!modoSelectorMenu.hidden && !e.target.closest(".modo-selector")) {
                cerrarModoSelector();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") cerrarModoSelector();
        });
    }

    seleccionarModo(modoSeleccionado);
    igualarAlturaReglas();

    // La tipografía (Cinzel, vía @import de Google Fonts) carga en forma
    // asíncrona. Si igualarAlturaReglas() mide antes de que esté lista, el
    // texto todavía está en la fuente de reemplazo (más angosta) y el
    // resultado queda corto. Recalculamos apenas terminan de cargar las
    // fuentes para corregir esa medición inicial.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(igualarAlturaReglas);
    }

    // Recalcular ante cambios de tamaño de ventana (rotar el celular, cambiar
    // de mobile a desktop, etc.), ya que el ancho/alto afecta cuántas líneas
    // ocupa cada texto de regla.
    let resizeReglasTimeout = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeReglasTimeout);
        resizeReglasTimeout = setTimeout(igualarAlturaReglas, 150);
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

        buttonSection.remove();
        rulesSection.remove();
        h1.remove();
        if (kicker) kicker.remove();
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
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado">IMAGEN</span></h4>
            <div class="juego-imagen-container">
                <div class="juego-imagen-foto-col">
                    <div class="juego-imagen-card">
                        <img class="juego-imagen-foto" src="images/presidente-desconocido.png" alt="¿Quién es este presidente?">
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
    //  arrastrando sobre la grilla (horizontal, vertical o diagonal ↘). Al
    //  encontrarlo se tacha la pista y se revela el nombre. Se gana al
    //  encontrar todos los apellidos antes de que se acabe el tiempo.
    //  Reutiliza: presidentesUnicos, mezclarArray, normalizarTexto,
    //  nombreCompletoPresidente, mostrarFinJuego (vía window.listaFiltrada +
    //  la variable aciertos).

    // Direcciones de colocación (v1 "fácil": sin palabras invertidas). [df, dc]
    const SOPA_DIRECCIONES = [
        [0, 1],   // horizontal  →
        [1, 0],   // vertical    ↓
        [1, 1]    // diagonal    ↘
    ];
    const SOPA_LETRAS_RELLENO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Un color por presidente hallado, para distinguir las palabras en la grilla.
    // El rojo queda reservado para las que NO se encontraron al terminar.
    const SOPA_COLORES = [
        "#3fb56b", "#e6b043", "#1bbef1", "#e67e22",
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

    // Apellido "sopeable": una sola palabra, sin tildes, en MAYÚSCULAS.
    function palabraSopaDe(u) {
        return normalizarTexto(u.apellido).replace(/[^a-z]/g, "").toUpperCase();
    }

    // Presidentes elegibles: apellido de una sola palabra y de largo razonable
    // para que entre en la grilla y sea reconocible. Igual para todos (como el
    // crucigrama): NO se aplican los filtros de configuración, la del día es fija.
    function presidentesSopaDisponibles(maxLargo) {
        return presidentesUnicos.filter(u => {
            if (u.apellido.trim().includes(" ")) return false; // apellidos compuestos afuera
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
    function intentarColocarSopa(grilla, palabra, tam, rng, intentos = 150) {
        for (let t = 0; t < intentos; t++) {
            const [df, dc] = SOPA_DIRECCIONES[Math.floor(rng() * SOPA_DIRECCIONES.length)];
            const maxR = df ? tam - palabra.length : tam - 1;
            const maxC = dc ? tam - palabra.length : tam - 1;
            const r0 = Math.floor(rng() * (maxR + 1));
            const c0 = Math.floor(rng() * (maxC + 1));
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
        buttonSection.remove();
        rulesSection.remove();
        h1.remove();
        if (kicker) kicker.remove();
        main.classList.add("juego-activo");
        body.classList.add("juego-activo");

        sopaTerminado = false;
        sopaArrastrando = false;
        sopaCeldaInicio = null;
        sopaCeldasMarcadas = [];

        const hoyISO = fechaHoyISO();
        sopaResultadoOficial = lsLeer(SOPA_LS_RES(hoyISO));
        sopaEsRejugada = !!sopaResultadoOficial;
        const racha = rachaVigente(SOPA_LS_STREAK, hoyISO);

        // Igual para todos: toda la generación usa el PRNG sembrado con la
        // fecha, nunca la configuración del usuario ni el tamaño de pantalla.
        const rng = mulberry32(hashCadena("sopa-" + hoyISO));
        const cantidad = 5;
        const maxLargo = 12;
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
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado">SOPA</span></h4>
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
                    ${sopaEsRejugada ? `<p class="cruci-rejugada-banner">Ya jugaste la de hoy${sopaResultadoOficial.gano ? ` en ${formatoCronometro(sopaResultadoOficial.segundos)}` : " (no la resolviste)"}. La estás rejugando — no cambia tu resultado.</p>` : ""}
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
        iniciarCronometroSopa();
    }

    function wireSopaEventos() {
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
        marcarPistaSopa(sopaObjetivos.indexOf(obj), 'resuelta', obj.u, obj.color);

        aciertos++;
        reproducirSonidoAcierto();
        const cont = document.getElementById("sopa-aciertos");
        if (cont) cont.textContent = aciertos;

        if (sopaObjetivos.every(o => o.encontrada)) finalizarSopa(true);
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

    // Cronómetro sin límite (como el crucigrama): cuenta hacia arriba desde
    // cero; el tiempo que tardaste se guarda al resolverlo la primera vez del día.
    function iniciarCronometroSopa() {
        detenerTemporizadorSopa();
        sopaSegundos = 0;
        const div = document.getElementById("sopa-timer");
        if (div) div.textContent = "00:00";
        sopaTimer = setInterval(() => {
            sopaSegundos++;
            if (div) div.textContent = formatoCronometro(sopaSegundos);
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

        // El resultado del día es el de la PRIMERA vez que se completó.
        const primeraVez = !sopaResultadoOficial;
        let racha = rachaVigente(SOPA_LS_STREAK, hoyISO);
        let record = null;

        if (primeraVez) {
            sopaResultadoOficial = { segundos, aciertos: aciertosPartida, total, gano, fecha: hoyISO };
            lsGuardar(SOPA_LS_RES(hoyISO), sopaResultadoOficial);
            if (gano) {
                racha = sumarRacha(SOPA_LS_STREAK, hoyISO);
                record = evaluarRecord(SOPA_LS_RECORD, segundos, hoyISO);
            }
        }

        sopaFinInfo = {
            primeraVez, gano, segundos, aciertosPartida, total, racha, record,
            oficial: sopaResultadoOficial
        };

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

    function lsLeer(clave) {
        try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; }
    }
    function lsGuardar(clave, valor) {
        try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* modo privado, etc. */ }
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
    // página (los hay en index.html, junto al selector de modo, y en
    // modos.html, dentro de las tarjetas de Sopa de letras y Crucigrama).
    function actualizarContadoresReinicioDiario() {
        const elementos = document.querySelectorAll(".contador-reinicio-diario");
        if (!elementos.length) return;
        const texto = `Se reinicia en ${formatoCuentaRegresiva(msHastaMedianoche())}`;
        elementos.forEach(el => { el.textContent = texto; });
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

    // Apellidos aptos para el crucigrama: una sola palabra, sin tildes, 4–10
    // letras. NO se aplican los filtros de configuración (el del día es fijo).
    function poolCrucigrama() {
        const vistas = new Set();
        const pool = [];
        presidentesUnicos.forEach(u => {
            if (u.apellido.trim().includes(" ")) return;
            const palabra = normalizarTexto(u.apellido).replace(/[^a-z]/g, "").toUpperCase();
            if (palabra.length < 4 || palabra.length > 10) return;
            if (vistas.has(palabra)) return;
            vistas.add(palabra);
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
    // 6 tipos por presidente. La del día se elige con el PRNG sembrado por
    // fecha: el mismo presidente en otra fecha trae otra pista (no memorizable).
    function cruciIndicesEnLista(u) {
        const clave = normalizarTexto(nombreCompletoPresidente(u));
        const idxs = [];
        listaPresidentes.forEach((p, i) => {
            if (normalizarTexto(nombreCompletoPresidente(p)) === clave) idxs.push(i);
        });
        return idxs;
    }
    function cruciAnioAsuncion(u) {
        const inicios = u.periodos.map(p => p.inicio && p.inicio.getFullYear()).filter(Boolean);
        return inicios.length ? Math.min(...inicios) : null;
    }

    function cruciPistaMandatos(u) {
        const tramos = u.periodos.map(p => {
            const a = p.inicio ? p.inicio.getFullYear() : "?";
            const b = p.fin ? p.fin.getFullYear() : "la actualidad";
            return `${a}-${b}`;
        });
        if (tramos.length === 1) {
            const p = u.periodos[0];
            const a = p.inicio ? p.inicio.getFullYear() : "?";
            const b = p.fin ? p.fin.getFullYear() : "la actualidad";
            return `Presidente entre ${a} y ${b}`;
        }
        return `Gobernó en ${tramos.slice(0, -1).join(", ")} y ${tramos[tramos.length - 1]}`;
    }
    function cruciPistaNombrePila(u) {
        const anio = cruciAnioAsuncion(u);
        const nom = [u.nombre, u.segundoNombre].filter(Boolean).join(" ");
        if (!anio || !nom) return null;
        return `El presidente de nombre ${nom} que asumió en ${anio}`;
    }
    function cruciPistaAntecesor(u) {
        const idxs = cruciIndicesEnLista(u);
        if (!idxs.length || idxs[0] === 0) return null;
        const ant = listaPresidentes[idxs[0] - 1];
        const anio = cruciAnioAsuncion(u);
        return `Asumió después de ${ant.apellido}${anio ? ` en ${anio}` : ""}`;
    }
    function cruciPistaSucesor(u) {
        const idxs = cruciIndicesEnLista(u);
        const ultimo = idxs[idxs.length - 1];
        if (ultimo === undefined || ultimo >= listaPresidentes.length - 1) return null;
        return `Lo sucedió en el cargo ${listaPresidentes[ultimo + 1].apellido}`;
    }
    function cruciPistaTipoGobierno(u) {
        const anio = cruciAnioAsuncion(u);
        if (!anio) return null;
        return u.deFacto
            ? `Presidente de facto que asumió en ${anio}`
            : `Presidente constitucional que asumió en ${anio}`;
    }
    function cruciPistaDescripcion(u) {
        if (!u.descripcion) return null;
        let frase = u.descripcion.split(/(?<=\.)\s+/)[0] || u.descripcion;
        [u.apellido, u.nombre, u.segundoNombre].filter(Boolean).forEach(t => {
            frase = frase.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "___");
        });
        if (frase.length > 150) frase = frase.slice(0, 147).trim() + "…";
        return frase;
    }

    const CRUCI_PISTAS = [
        cruciPistaMandatos, cruciPistaNombrePila, cruciPistaAntecesor,
        cruciPistaSucesor, cruciPistaTipoGobierno, cruciPistaDescripcion
    ];

    function pistaCrucigramaDe(u, rng) {
        const inicio = Math.floor(rng() * CRUCI_PISTAS.length);
        for (let k = 0; k < CRUCI_PISTAS.length; k++) {
            const texto = CRUCI_PISTAS[(inicio + k) % CRUCI_PISTAS.length](u);
            if (texto) return texto;
        }
        return cruciPistaMandatos(u);
    }

    // --- Cronómetro del crucigrama (cuenta hacia arriba) ---
    function formatoCronometro(s) {
        const m = Math.floor(s / 60);
        const ss = String(s % 60).padStart(2, "0");
        if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${ss}`;
        return `${String(m).padStart(2, "0")}:${ss}`;
    }
    function iniciarCronometroCrucigrama() {
        detenerCronometroCrucigrama();
        cruciSegundos = 0;
        const el = document.getElementById("cruci-timer");
        if (el) el.textContent = "00:00";
        cruciCronometro = setInterval(() => {
            cruciSegundos++;
            const t = document.getElementById("cruci-timer");
            if (t) t.textContent = formatoCronometro(cruciSegundos);
        }, 1000);
    }
    function detenerCronometroCrucigrama() {
        if (cruciCronometro) { clearInterval(cruciCronometro); cruciCronometro = null; }
    }

    function iniciarJuegoCrucigrama() {
        modoActual = 'crucigrama';
        buttonSection.remove();
        rulesSection.remove();
        h1.remove();
        if (kicker) kicker.remove();
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
        const pool = mezclarConRng(poolCrucigrama(), rng).slice(0, 11);
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
            <h4 class="jugando-modo-heading"><span class="jugando-modo-prefijo">JUGANDO MODO</span> <span class="modo-de-juego-seleccionado">CRUCIGRAMA</span></h4>
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
                    ${cruciEsRejugada ? `<p class="cruci-rejugada-banner">Ya completaste el de hoy${cruciResultadoOficial.gano ? ` en ${formatoCronometro(cruciResultadoOficial.segundos)}` : " (te rendiste)"}. Lo estás rejugando — no cambia tu resultado.</p>` : ""}
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
        iniciarCronometroCrucigrama();
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
            const objetivo = ent.celdas.find(c => {
                const i = inputCruci(c.r, c.c);
                return i && !i.value;
            }) || ent.celdas[0];
            cruciCeldaActiva = { r: objetivo.r, c: objetivo.c };
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

    function moverEnEntrada(delta, saltarLlenas) {
        if (!cruciActiva || !cruciCeldaActiva) return;
        const celdas = cruciActiva.celdas;
        const idx = celdas.findIndex(c => c.r === cruciCeldaActiva.r && c.c === cruciCeldaActiva.c);
        let next = idx + delta;
        // Al avanzar tipeando, saltear los casilleros que ya tienen letra
        // (p. ej. de una palabra cruzada ya adivinada) hasta el próximo vacío.
        if (saltarLlenas) {
            let t = idx + delta;
            while (t >= 0 && t < celdas.length && inputCruci(celdas[t].r, celdas[t].c).value) t += delta;
            if (t >= 0 && t < celdas.length) {
                next = t;
            } else {
                // No hay vacío hacia adelante: buscar el primer vacío de toda la
                // palabra; si tampoco hay, quedarse en el borde (sin trabarse).
                const v = celdas.findIndex(({ r, c }) => !inputCruci(r, c).value);
                next = v >= 0 ? v : Math.min(celdas.length - 1, Math.max(0, idx + delta));
            }
        }
        if (next < 0 || next >= celdas.length) return;
        cruciCeldaActiva = { ...celdas[next] };
        pintarCrucigrama();
        enfocarCeldaCruci(cruciCeldaActiva.r, cruciCeldaActiva.c);
    }

    function palabraLlenaYCorrecta(ent) {
        return ent.celdas.every(({ r, c }) => {
            const i = inputCruci(r, c);
            return i && i.value.toUpperCase() === cruciData.grilla[r][c].letra;
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
        const limpio = inp.value.toUpperCase().normalize("NFD")
            .replace(/[̀-ͯ]/g, "").replace(/[^A-ZÑ]/g, "");
        inp.value = limpio.slice(-1);
        inp.classList.remove("cruci-input--mal");
        refrescarEstadoCrucigrama();
        if (inp.value) {
            if (cruciActiva && palabraLlenaYCorrecta(cruciActiva)) {
                saltarSiguientePistaPendiente(); // palabra lista -> próxima pista
            } else {
                moverEnEntrada(1, true);
            }
        }
        comprobarVictoriaCrucigrama();
    }

    // Verificación en vivo: cada palabra completa y correcta se pinta de verde
    // y su pista queda tachada; si se rompe, vuelve atrás.
    function refrescarEstadoCrucigrama() {
        const okCeldas = new Set();
        const resueltasAhora = new Set();
        cruciEntradas.forEach(e => {
            const ok = e.celdas.every(({ r, c }) => {
                const inp = inputCruci(r, c);
                return inp && inp.value.toUpperCase() === cruciData.grilla[r][c].letra;
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
                if (!inp || inp.value.toUpperCase() !== cel.letra) return;
            }
        }
        finalizarCrucigrama(true);
    }

    function marcarResultadosCrucigrama() {
        aciertos = 0;
        cruciEntradas.forEach(e => {
            const ok = e.celdas.every(({ r, c }) => {
                const inp = inputCruci(r, c);
                return inp && inp.value.toUpperCase() === cruciData.grilla[r][c].letra;
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

        // El resultado del día es el de la PRIMERA vez que se completó.
        const primeraVez = !cruciResultadoOficial;
        let racha = rachaVigente(CRUCI_LS_STREAK, hoyISO);
        let record = null;

        if (primeraVez) {
            cruciResultadoOficial = { segundos, aciertos: aciertosPartida, total, gano, fecha: hoyISO };
            lsGuardar(CRUCI_LS_RES(hoyISO), cruciResultadoOficial);
            if (gano) {
                racha = sumarRacha(CRUCI_LS_STREAK, hoyISO);
                record = evaluarRecord(CRUCI_LS_RECORD, segundos, hoyISO);
            }
        }

        cruciFinInfo = {
            primeraVez, gano, segundos, aciertosPartida, total, racha, record,
            oficial: cruciResultadoOficial
        };

        if (!gano) {
            // Revelar la solución en las celdas mal o vacías
            document.querySelectorAll(".cruci-input").forEach(inp => {
                const cel = cruciData.grilla[+inp.dataset.r][+inp.dataset.c];
                if (cel && inp.value.toUpperCase() !== cel.letra) {
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

    // --- Compartir resultado (crucigrama y sopa de letras comparten el
    // mismo mecanismo de juego diario, así que también comparten esta lógica) ---
    function textoCompartirDiario() {
        const esSopa = modoActual === 'sopa';
        const of = esSopa ? (sopaResultadoOficial || sopaFinInfo) : (cruciResultadoOficial || cruciFinInfo);
        const nombreJuego = esSopa ? "Sopa de letras" : "Crucigrama";
        const claveStreak = esSopa ? SOPA_LS_STREAK : CRUCI_LS_STREAK;
        const totalDefault = esSopa ? sopaObjetivos.length : cruciEntradas.length;
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const total = of.total || totalDefault;
        const ok = of.aciertos != null ? of.aciertos : of.aciertosPartida;
        const cuadros = "🟩".repeat(ok) + "⬛".repeat(Math.max(0, total - ok));
        const linea = of.gano
            ? `✅ ${formatoCronometro(of.segundos)}`
            : `❌ ${ok}/${total}`;
        const racha = rachaVigente(claveStreak, fechaHoyISO());
        return `${nombreJuego} Presidentes Argentinos · ${dd}/${mm}\n${linea}${racha > 1 ? `  🔥 ${racha}` : ""}\n${cuadros}`;
    }

    async function compartirDiario() {
        const texto = textoCompartirDiario();
        const msg = document.getElementById("cruciFinCompartirMsg");
        try {
            if (navigator.share) { await navigator.share({ text: texto }); return; }
        } catch (e) { return; /* el usuario canceló el diálogo del sistema */ }
        try {
            await navigator.clipboard.writeText(texto);
            if (msg) { msg.textContent = "¡Copiado!"; setTimeout(() => { msg.textContent = ""; }, 2500); }
        } catch (e) {
            if (msg) msg.textContent = "No se pudo copiar";
        }
    }

    function poblarFinDiario(i) {
        const elTiempo = document.getElementById("cruciFinTiempo");
        const elRecord = document.getElementById("cruciFinRecord");
        const elRacha = document.getElementById("cruciFinRacha");
        const elMsg = document.getElementById("cruciFinCompartirMsg");
        if (elMsg) elMsg.textContent = "";

        if (i.primeraVez) {
            elTiempo.textContent = (i.gano ? "Lo completaste en " : "Te rendiste a los ")
                + formatoCronometro(i.segundos);
        } else {
            const of = i.oficial;
            const oficialTxt = of.gano ? `✅ ${formatoCronometro(of.segundos)}` : `❌ ${of.aciertos}/${of.total}`;
            elTiempo.innerHTML = `Tu resultado de hoy: <strong>${oficialTxt}</strong>`
                + `<br><span class="cruci-fin-rejugada">Esta rejugada: ${formatoCronometro(i.segundos)} (no cuenta)</span>`;
        }

        if (i.primeraVez && i.gano && i.record) {
            if (i.record.nuevo) {
                elRecord.textContent = i.record.anterior
                    ? `🏆 ¡Nuevo récord! ${formatoCronometro(i.segundos)} (antes ${formatoCronometro(i.record.anterior)})`
                    : `🏆 ¡Tu primer récord! ${formatoCronometro(i.segundos)}`;
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


    // Cuántos presidentes únicos quedan para el modo imagen según los filtros.
    function contarDisponiblesImagen(sinDeFacto, sinCortos) {
        return presidentesUnicos.filter(u => {
            if (sinDeFacto && u.deFacto) return false;
            if (sinCortos && !u.periodos.some(periodoDuroMasDeUnAnio)) return false;
            return true;
        }).length;
    }

    function refrescarMaxCantidad() {
        if (!sliderCantidad) return;
        const min = parseInt(sliderCantidad.min, 10);
        const max = Math.max(min, contarDisponiblesImagen(checkboxes[0].checked, checkboxes[1].checked));
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

    // Ídem para "eliminar gobiernos de menos de 1 año": cada modo guarda su
    // propia preferencia (en imagen arranca activado, en clásico no).
    function claveEliminarCortosActual() {
        if (modoSeleccionado === 'imagen') return 'eliminarMenosDeUnAnioImagen';
        if (modoSeleccionado === 'sopa') return 'eliminarMenosDeUnAnioSopa';
        return 'eliminarMenosDeUnAnioClasico';
    }

    // --- Botón Configuración ---
    function abrirConfig() {
        configuracionTemporal = { ...configuracionJuego };

        const minutos = configuracionJuego[claveTiempoActual()];
        slider.value = minutos;
        valorRango.textContent = minutos + " minutos";

        checkboxes[0].checked = configuracionJuego.eliminarDeFacto;
        checkboxes[1].checked = configuracionJuego[claveEliminarCortosActual()];

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
        if (contenedorTemporizador) {
            contenedorTemporizador.style.display = esModoDiario ? 'none' : '';
        }
        if (contenedorCantidad) {
            contenedorCantidad.style.display = modoSeleccionado === 'imagen' ? '' : 'none';
        }
        if (contenedorFiltros) {
            contenedorFiltros.style.display = esModoDiario ? 'none' : '';
        }

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
        configuracionJuego.eliminarDeFacto = checkboxes[0].checked;
        configuracionJuego[claveEliminarCortosActual()] = checkboxes[1].checked;
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
        checkboxes[0].checked = configuracionTemporal.eliminarDeFacto;
        checkboxes[1].checked = configuracionTemporal[claveEliminarCortosActual()];
        if (sliderCantidad) {
            sliderCantidad.value = configuracionTemporal.cantidad;
            if (valorCantidad) valorCantidad.textContent = configuracionTemporal.cantidad + " presidentes";
        }

        cerrarConfig();
    }

    if (botonConfiguracion) {
        botonConfiguracion.addEventListener("click", abrirConfig);
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
    checkboxes.forEach(cb => cb.addEventListener("change", refrescarMaxCantidad));

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
            titulo.textContent = "🎉 ¡FELICITACIONES! 🎉";
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
    
    // Panel de fin de los modos "del día" (tiempo, récord, racha, compartir):
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
        return `
            <li class="resumen-partida-item ${acierto ? 'acierto' : 'error'}">
                <img class="resumen-partida-foto" src="${imagenCentradaDe(u.imagen)}" alt="" loading="lazy">
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
            location.reload(); // Recarga la página completa
        });
    }

    // AGREGAR ESTE BLOQUE
    if (botonCerrarModal) {
        botonCerrarModal.addEventListener("click", () => {
            cerrarFinJuego();
        });
    }

    const botonCompartir = document.getElementById("cruciFinCompartir");
    if (botonCompartir) {
        botonCompartir.addEventListener("click", compartirDiario);
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

    function intentarRenderizar() {
        // window.listaPresidentes se arma en otro bloque que puede tardar
        // un instante en ejecutarse; reintentamos hasta que esté disponible.
        if (!window.listaPresidentes) {
            setTimeout(intentarRenderizar, 50);
            return;
        }

        const timelineHTML = window.listaPresidentes.map(presidente => {
            const nombreCompleto = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                .filter(Boolean).join(" ");

            const claseTipo = presidente.esDeFacto() ? "de-facto" : "constitucional";
            const tipoGobierno = presidente.esDeFacto() ? "De facto" : "Constitucional";
            const anioInicio = presidente.periodo.inicio ? presidente.periodo.inicio.getFullYear() : "";

            return `
                <div class="timeline-item ${claseTipo}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-year">${anioInicio}</div>
                    <div class="timeline-card" role="button" tabindex="0" aria-expanded="false">
                        <div class="timeline-card-main">
                            <div class="timeline-imagen">
                                <img src="${imagenCentradaDe(presidente.imagen)}" alt="${nombreCompleto}" loading="lazy">
                            </div>
                            <div class="timeline-info">
                                <h3 class="timeline-nombre">${nombreCompleto}</h3>
                                <p class="timeline-periodo">${presidente.periodo.toString()}</p>
                                <span class="timeline-tipo ${claseTipo}">${tipoGobierno}</span>
                            </div>
                        </div>
                        <p class="timeline-descripcion">${presidente.descripcion}</p>
                    </div>
                </div>
            `;
        }).join('');

        timelineContainer.innerHTML = timelineHTML;

        // Al tocar/clickear una tarjeta, queda "fijada" expandida (útil en celular,
        // donde no existe hover). En desktop además se expande solo con el mouse encima.
        timelineContainer.querySelectorAll('.timeline-card').forEach(card => {
            const alternarExpandido = () => {
                const expandido = card.classList.toggle('expandido');
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
    }

    intentarRenderizar();
}

cargarLineaDeTiempo();

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
