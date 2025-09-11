document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const body = document.querySelector("body");
    const buttonSection = document.querySelector(".button-section");
    const rulesSection = document.querySelector(".rules-section");
    const botonIniciar = document.querySelector(".iniciar-juego-button");
    const botonConfiguracion = document.querySelector(".configuracion-button");

    // --- Estado de configuración por defecto ---
    let configuracionJuego = {
        tiempo: 10, // minutos
        eliminarDeFacto: false,
        eliminarMenosDeUnAnio: false
    };

    let configuracionTemporal = {}; // Para snapshot temporal al abrir modal

    // --- Elementos del modal ---
    const slider = document.getElementById("sliderTiempo");
    const valorRango = document.getElementById("valorRango");
    const botonGuardar = document.querySelector(".guardar");
    const botonCancelar = document.querySelector(".cancelar");
    const checkboxes = document.querySelectorAll('.checkbox-input');

    // --- DATOS DE PRESIDENTES ---
    const listaPresidentes = [
        new Presidente("Bernardino", "", "Rivadavia", new Periodo(new Date("1826-02-08"), new Date("1827-06-27")), false, "images/presidentes/rivadavia.jpg"),
        new Presidente("Vicente", "", "López", new Periodo(new Date("1827-07-07"), new Date("1827-08-18")), false, "images/presidentes/vicentelopez.jpg"),
        new Presidente("Bartolomé", "", "Mitre", new Periodo(new Date("1862-10-12"), new Date("1868-10-12")), false, "images/presidentes/mitre.jpg"),
        new Presidente("Domingo", "Faustino", "Sarmiento", new Periodo(new Date("1868-10-12"), new Date("1874-10-12")), false, "images/presidentes/sarmiento.jpg"),
        new Presidente("Nicolás", "Remigio Aurelio", "Avellaneda", new Periodo(new Date("1874-10-12"), new Date("1880-10-12")), false, "images/presidentes/avellaneda.jpg"),
        new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1880-10-12"), new Date("1886-10-12")), false, "images/presidentes/roca1.jpg"),
        new Presidente("Miguel", "Ángel", "Juárez Celman", new Periodo(new Date("1886-10-12"), new Date("1890-08-06")), false, "images/presidentes/juarezcelman.jpg"),
        new Presidente("Carlos", "Enrique José", "Pellegrini", new Periodo(new Date("1890-08-06"), new Date("1892-10-12")), false, "images/presidentes/pellegrini.jpg"),
        new Presidente("Luis", "", "Sáenz Peña", new Periodo(new Date("1892-10-12"), new Date("1895-01-22")), false, "images/presidentes/luissaenzpena.jpg"),
        new Presidente("José", "Evaristo", "Uriburu", new Periodo(new Date("1895-01-23"), new Date("1898-10-12")), false, "images/presidentes/joseevaristouriburu.jpg"),
        new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1898-10-12"), new Date("1904-10-12")), false, "images/presidentes/roca2.jpg"),
        new Presidente("Manuel", "Pedro", "Quintana", new Periodo(new Date("1904-10-12"), new Date("1906-03-12")), false, "images/presidentes/quintana.jpg"),
        new Presidente("José", "", "Figueroa Alcorta", new Periodo(new Date("1906-03-12"), new Date("1910-10-12")), false, "images/presidentes/figueroaalcorta.jpg"),
        new Presidente("Roque", "", "Sáenz Peña", new Periodo(new Date("1910-10-12"), new Date("1914-08-09")), false, "images/presidentes/roquesaenzpena.jpg"),
        new Presidente("Victorino", "", "de la Plaza", new Periodo(new Date("1914-08-09"), new Date("1916-10-12")), false, "images/presidentes/delaplaza.jpg"),
        new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1916-10-12"), new Date("1922-10-12")), false, "images/presidentes/yrigoyen1.jpg"),
        new Presidente("Marcelo", "Torcuato", "de Alvear", new Periodo(new Date("1922-10-12"), new Date("1928-10-12")), false, "images/presidentes/alvear.jpg"),
        new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1928-10-12"), new Date("1930-09-06")), false, "images/presidentes/yrigoyen2.jpg"),
        new Presidente("José", "Félix", "Uriburu", new Periodo(new Date("1930-09-06"), new Date("1932-02-20")), true, "images/presidentes/uriburu.jpg"),
        new Presidente("Agustín", "Pedro", "Justo", new Periodo(new Date("1932-02-20"), new Date("1938-02-20")), false, "images/presidentes/justo.jpg"),
        new Presidente("Roberto", "Marcelino", "Ortiz", new Periodo(new Date("1938-02-20"), new Date("1942-06-26")), false, "images/presidentes/ortiz.jpg"),
        new Presidente("Ramón", "", "Castillo", new Periodo(new Date("1942-06-26"), new Date("1943-06-04")), false, "images/presidentes/castillo.jpg"),
        new Presidente("Arturo", "Franklin", "Rawson", new Periodo(new Date("1943-06-04"), new Date("1943-06-07")), true, "images/presidentes/rawson.jpg"),
        new Presidente("Pedro", "Pablo", "Ramírez", new Periodo(new Date("1943-06-07"), new Date("1944-02-24")), true, "images/presidentes/pabloramirez.jpg"),
        new Presidente("Edelmiro", "Julián", "Farrell", new Periodo(new Date("1944-02-24"), new Date("1946-06-04")), true, "images/presidentes/farrell.jpg"),
        new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1946-06-04"), new Date("1952-06-04")), false, "images/presidentes/peron1.jpg"),
        new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1952-06-04"), new Date("1955-09-21")), false, "images/presidentes/peron2.jpg"),
        new Presidente("Eduardo", "Ernesto", "Lonardi", new Periodo(new Date("1955-09-23"), new Date("1955-11-13")), true, "images/presidentes/lonardi.jpg"),
        new Presidente("Pedro", "Eugenio", "Aramburu", new Periodo(new Date("1955-11-13"), new Date("1958-05-01")), true, "images/presidentes/aramburu.jpg"),
        new Presidente("Arturo", "", "Frondizi", new Periodo(new Date("1958-05-01"), new Date("1962-03-29")), false, "images/presidentes/frondizi.jpg"),
        new Presidente("José", "María", "Guido", new Periodo(new Date("1962-03-29"), new Date("1963-10-12")), false, "images/presidentes/guido.jpg"),
        new Presidente("Arturo", "Umberto", "Illia", new Periodo(new Date("1963-10-12"), new Date("1966-06-28")), false, "images/presidentes/illia.jpg"),
        new Presidente("Juan", "Carlos", "Onganía", new Periodo(new Date("1966-06-28"), new Date("1970-06-08")), true, "images/presidentes/ongania.jpg"),
        new Presidente("Roberto", "Marcelo", "Levingston", new Periodo(new Date("1970-06-18"), new Date("1971-03-23")), true, "images/presidentes/levingston.jpg"),
        new Presidente("Alejandro", "Agustín", "Lanusse", new Periodo(new Date("1971-03-23"), new Date("1973-05-25")), true, "images/presidentes/lanusse.jpg"),
        new Presidente("Héctor", "José", "Cámpora", new Periodo(new Date("1973-05-25"), new Date("1973-07-13")), false, "images/presidentes/campora.jpg"),
        new Presidente("Raúl", "Alberto", "Lastiri", new Periodo(new Date("1973-07-13"), new Date("1973-10-12")), false, "images/presidentes/lastiri.jpg"),
        new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1973-10-12"), new Date("1974-07-01")), false, "images/presidentes/peron3.jpg"),
        new Presidente("María", "Estela", "Martínez", new Periodo(new Date("1974-07-01"), new Date("1976-03-24")), false, "images/presidentes/isabel.jpg"),
        new Presidente("Jorge", "Rafael", "Videla", new Periodo(new Date("1976-03-29"), new Date("1981-03-29")), true, "images/presidentes/videla.jpg"),
        new Presidente("Roberto", "Eduardo", "Viola", new Periodo(new Date("1981-03-29"), new Date("1981-12-11")), true, "images/presidentes/viola_roberto.jpg"),
        new Presidente("Carlos", "Alberto", "Lacoste", new Periodo(new Date("1981-12-11"), new Date("1981-12-22")), true, "images/presidentes/lacoste.jpg"),
        new Presidente("Leopoldo", "Fortunato", "Galtieri", new Periodo(new Date("1981-12-22"), new Date("1982-06-18")), true, "images/presidentes/galtieri.jpg"),
        new Presidente("Reynaldo", "Benito", "Bignone", new Periodo(new Date("1982-07-01"), new Date("1983-12-10")), true, "images/presidentes/bignone.jpg"),
        new Presidente("Raúl", "Ricardo", "Alfonsín", new Periodo(new Date("1983-12-10"), new Date("1989-07-08")), false, "images/presidentes/alfonsin.jpg"),
        new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1989-07-08"), new Date("1995-07-08")), false, "images/presidentes/menem1.jpg"),
        new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1995-07-08"), new Date("1999-12-10")), false, "images/presidentes/menem2.jpg"),
        new Presidente("Fernando", "", "De La Rúa", new Periodo(new Date("1999-12-10"), new Date("2001-12-20")), false, "images/presidentes/delarua.jpeg"),
        new Presidente("Federico", "Ramón", "Puerta", new Periodo(new Date("2001-12-20"), new Date("2001-12-22")), false, "images/presidentes/puerta.jpg"),
        new Presidente("Adolfo", "", "Rodríguez Saá", new Periodo(new Date("2001-12-22"), new Date("2001-12-30")), true, "images/presidentes/rodriguezsaa.jpg"),
        new Presidente("Eduardo", "Oscar", "Camaño", new Periodo(new Date("2001-12-31"), new Date("2002-01-01")), true, "images/presidentes/camano.jpg"),
        new Presidente("Eduardo", "Alberto", "Duhalde", new Periodo(new Date("2002-01-02"), new Date("2003-05-25")), false, "images/presidentes/duhalde.jpg"),
        new Presidente("Néstor", "Carlos", "Kirchner", new Periodo(new Date("2003-05-25"), new Date("2007-12-10")), false, "images/presidentes/kirchner.jpg"),
        new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2007-12-10"), new Date("2011-12-10")), false, "images/presidentes/cristinafernandez1.jpg"),
        new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2011-12-10"), new Date("2015-12-10")), false, "images/presidentes/cristinafernandez2.jpg"),
        new Presidente("Mauricio", "", "Macri", new Periodo(new Date("2015-12-10"), new Date("2019-12-10")), false, "images/presidentes/macri.jpg"),
        new Presidente("Alberto", "Ángel", "Fernández", new Periodo(new Date("2019-12-10"), new Date("2023-12-10")), false, "images/presidentes/albertofernandez.jpg"),
        new Presidente("Javier", "Gerardo", "Milei", new Periodo(new Date("2023-12-10"), null), false, "images/presidentes/milei.jpg")
    ];

    function normalizarTexto(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // --- Filtrar presidentes según configuración ---
    function filtrarPresidentes(){
        return listaPresidentes.filter(p => {
            if(configuracionJuego.eliminarDeFacto && p.esDeFacto()) return false;
            if(configuracionJuego.eliminarMenosDeUnAnio && !p.estuvoMasDeUnAnio()) return false;
            return true;
        });
    }

    // --- Generar tabla HTML ---
    function generarTablaHTML(presidentesFiltrados) {
        const filasTabla = presidentesFiltrados.map((presidente, index) => `
            <tr data-id="${index}" data-periodo="${presidente.periodo.toString()}">
                <td>
                    <div class="imagen-presidente-desconocido-container">
                        <img src="images/presidente-desconocido.png" alt="Presidente desconocido">
                    </div>
                </td>
                <td class="presidente-card">
                    <div class="nombre-presidente-cell"></div>
                    <div class="periodo-presidente-cell">${presidente.periodo}</div>
                </td>
            </tr>
        `).join('');

        return `
            <div class="tabla-container">
                <table class="tabla" border="1" cellspacing="0" cellpadding="5">
                    <tbody>
                        ${filasTabla}
                    </tbody>
                </table>
                <div class="input-container">
                    <div id="temporizador" class="temporizador">${configuracionJuego.tiempo.toString().padStart(2,'0')}:00</div>
                    <div class="input-container-first-row">
                        <div id="contador-presidentes" class="contador">
                            0 / ${presidentesFiltrados.length}
                        </div>
                        <input type="text" id="input-presidente" placeholder="Ingrese el apellido...">
                        <div class="pluma-image-container">
                            <img src="images/pluma-oligarca.png" alt="" class="pluma-image">
                        </div>
                    </div>
                    <button class="rendirse-button" type="button">RENDIRSE</button>
                </div>
            </div>
        `;
    }

    // --- Verificar respuestas ---
    let aciertos = 0;

    function verificarRespuestaTiempoReal(inputElement) {
        const textoIngresado = normalizarTexto(inputElement.value);
        if (textoIngresado.length < 3) return;

        window.listaFiltrada.forEach((presidente, index) => {
            const fila = document.querySelector(`tr[data-id="${index}"]`);
            if (!fila) return;

            const apellido = normalizarTexto(presidente.apellido);
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
            opcionesValidas.add(`${primerNombre} ${apellido}`);
            segundosNombres.forEach(seg => opcionesValidas.add(`${seg} ${apellido}`));
            opcionesValidas.add(nombreCompleto);

            if (opcionesValidas.has(textoIngresado)) {
                const celdaNombre = fila.querySelector('.nombre-presidente-cell');
                const imagen = fila.querySelector('img');
                const checkIcon = "<svg class='check-icon' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><title>check-bold</title><path d='M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z' /></svg>"

                const nombreParaMostrar = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                    .filter(Boolean).join(" ");

                if (celdaNombre.textContent === "") {
                    imagen.src = presidente.imagen;
                    imagen.alt = nombreParaMostrar;
                    celdaNombre.innerHTML = `${checkIcon} <span class="nombre-presidente-texto">${nombreParaMostrar}</span>`;

                    aciertos++;
                    const contador = document.getElementById("contador-presidentes");
                    if (contador) contador.textContent = `${aciertos} / ${window.listaFiltrada.length}`;

                    fila.classList.add('acierto-animacion');
                    setTimeout(() => fila.classList.remove('acierto-animacion'), 2000);

                    inputElement.value = "";
                    fila.scrollIntoView({ behavior: 'auto', block: 'center' });
                } else {
                    inputElement.value = "";
                    fila.scrollIntoView({ behavior: 'auto', block: 'center' });
                    fila.classList.add('ya-adivinado');
                    setTimeout(() => fila.classList.remove('ya-adivinado'), 2000);
                }
            }
        });

        if (aciertos === window.listaFiltrada.length) {
            clearInterval(window.temporizadorInterval);
            const inputContainer = document.querySelector(".input-container");
            if (inputContainer) {
                inputContainer.innerHTML = `
                    <div class="felicitaciones">
                        🎉 FELICITACIONES 🎉<br>
                        ERES UN VERDADERO CONOCEDOR DE LOS PRESIDENTES ARGENTINOS
                    </div>
                `;
            }
        }
    }

    // --- Iniciar juego ---
    function iniciarJuego() {
        buttonSection.remove();
        rulesSection.remove();

        body.style.justifyContent = "flex-start";
        body.style.gap = "2rem";

        const presidentesFiltrados = filtrarPresidentes();
        const contenidoDelJuego = generarTablaHTML(presidentesFiltrados);
        body.insertAdjacentHTML("beforeend", contenidoDelJuego);

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
        let tiempoRestante = configuracionJuego.tiempo * 60;
        const temporizadorDiv = document.getElementById("temporizador");

        const temporizadorInterval = setInterval(() => {
            const minutos = String(Math.floor(tiempoRestante / 60)).padStart(2, '0');
            const segundos = String(tiempoRestante % 60).padStart(2, '0');
            temporizadorDiv.textContent = `${minutos}:${segundos}`;

            if (tiempoRestante <= 0) {
                clearInterval(temporizadorInterval);
                rendirse();
            }

            tiempoRestante--;
        }, 1000);

        window.temporizadorInterval = temporizadorInterval;
    }
    botonIniciar.addEventListener("click", iniciarJuego);

    // --- Botón Configuración ---
    function abrirConfig() {
        configuracionTemporal = { ...configuracionJuego };

        slider.value = configuracionJuego.tiempo;
        valorRango.textContent = configuracionJuego.tiempo + " minutos";

        checkboxes[0].checked = configuracionJuego.eliminarDeFacto;
        checkboxes[1].checked = configuracionJuego.eliminarMenosDeUnAnio;

        document.getElementById("configOverlay").style.display = "flex";
    }

    function cerrarConfig() {
        document.getElementById("configOverlay").style.display = "none";
    }

    function guardarConfig() {
        configuracionJuego.tiempo = parseInt(slider.value);
        configuracionJuego.eliminarDeFacto = checkboxes[0].checked;
        configuracionJuego.eliminarMenosDeUnAnio = checkboxes[1].checked;

        cerrarConfig();
    }

    function cancelarConfig() {
        slider.value = configuracionTemporal.tiempo;
        valorRango.textContent = configuracionTemporal.tiempo + " minutos";
        checkboxes[0].checked = configuracionTemporal.eliminarDeFacto;
        checkboxes[1].checked = configuracionTemporal.eliminarMenosDeUnAnio;

        cerrarConfig();
    }

    botonConfiguracion.addEventListener("click", abrirConfig);
    botonGuardar.addEventListener("click", guardarConfig);
    botonCancelar.addEventListener("click", cancelarConfig);

    slider.addEventListener("input", () => {
        valorRango.textContent = slider.value + " minutos";
    });

    // --- Función rendirse ---
    function rendirse() {
        clearInterval(window.temporizadorInterval);

        window.listaFiltrada.forEach((presidente, index) => {
            const fila = document.querySelector(`tr[data-id="${index}"]`);
            if (fila) {
                const celdaNombre = fila.querySelector('.nombre-presidente-cell');
                if (celdaNombre.textContent === "") {
                    celdaNombre.textContent = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                        .filter(Boolean).join(" ");
                    fila.querySelector('img').src = presidente.imagen;
                    fila.querySelector('img').alt = celdaNombre.textContent;
                    fila.style.backgroundColor = "rgba(255,0,0,0.3)";
                }
            }
        });

        //Bloquear input
        const inputPresidente = document.getElementById("input-presidente");
        if (inputPresidente) { 
            inputPresidente.disabled = true;
            inputPresidente.placeholder = "Juego terminado";
        }

        // Cambiar boton a  "JUEGO TERMINADO"
        if (botonRendirse) {
            botonRendirse.textContent = "JUEGO TERMINADO";
            botonRendirse.disabled = true;
            botonRendirse.style.backgroundColor = "gray";
            botonRendirse.style.cursor = "not-allowed";
        }
    }

    const toggleButton = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.header-nav');

    toggleButton.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

});
