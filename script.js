document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const body = document.querySelector("body");
    const buttonSection = document.querySelector(".button-section");
    const rulesSection = document.querySelector(".rules-section");
    const botonIniciar = document.querySelector(".iniciar-juego-button");

    // --- DATOS DE PRESIDENTES ---
    // (Se asume que la clase Presidente ya está cargada desde Presidente.js)
    const listaPresidentes = [
        new Presidente("Bernardino", "Rivadavia", "1826 - 1827", "images/presidentes/rivadavia.jpg"),
        new Presidente("Vicente", "López", "1827 - 1827", "images/presidentes/vicentelopez.jpg"),
        new Presidente("Justo José de", "Urquiza", "1854 - 1860", "images/presidentes/urquiza.jpg"),
        new Presidente("Santiago", "Derqui", "1860 - 1861", "images/presidentes/derqui.jpg"),
        new Presidente("Juan Esteban", "Pedernera", "1861 - 1861", "images/presidentes/pedernera.jpg"),
        new Presidente("Bartolomé", "Mitre", "1862 - 1868", "images/presidentes/mitre.jpg"),
        new Presidente("Domingo Faustino", "Sarmiento", "1868 - 1874", "images/presidentes/sarmiento.jpg"),
        new Presidente("Nicolás", "Avellaneda", "1874 - 1880", "images/presidentes/avellaneda.jpg"),
        new Presidente("Julio Argentino", "Roca", "1880 - 1886", "images/presidentes/roca1.jpg"),
        new Presidente("Miguel Juárez", "Celman", "1886 - 1890", "images/presidentes/juarezcelman.jpg"),
        new Presidente("Carlos", "Pellegrini", "1890 - 1892", "images/presidentes/pellegrini.jpg"),
        new Presidente("Luis", "Sáenz Peña", "1892 - 1895", "images/presidentes/luissaenzpena.jpg"),
        new Presidente("José Evaristo", "Uriburu", "1895 - 1898", "images/presidentes/uriburu.jpg"),
        new Presidente("Julio Argentino", "Roca", "1898 - 1904", "images/presidentes/roca2.jpg"),
        new Presidente("Manuel", "Quintana", "1904 - 1906", "images/presidentes/quintana.jpg"),
        new Presidente("José", "Figueroa Alcorta", "1906 - 1910", "images/presidentes/figueroaalcorta.jpg"),
        new Presidente("Roque", "Sáenz Peña", "1910 - 1914", "images/presidentes/roquesaenzpena.jpg"),
        new Presidente("Victorino", "de la Plaza", "1914 - 1916", "images/presidentes/delaplaza.jpg"),
        new Presidente("Hipólito", "Yrigoyen", "1916 - 1922", "images/presidentes/yrigoyen1.jpg"),
        new Presidente("Marcelo T. de", "Alvear", "1922 - 1928", "images/presidentes/alvear.jpg"),
        new Presidente("Hipólito", "Yrigoyen", "1928 - 1930", "images/presidentes/yrigoyen2.jpg"),
        new Presidente("José Félix", "Uriburu", "1930 - 1932", "images/presidentes/uriburu.jpg"),
        new Presidente("Agustín P.", "Justo", "1932 - 1938", "images/presidentes/justo.jpg"),
        new Presidente("Roberto M.", "Ortiz", "1938 - 1942", "images/presidentes/ortiz.jpg"),
        new Presidente("Ramón", "Castillo", "1942 - 1943", "images/presidentes/castillo.jpg"),
        new Presidente("Arturo", "Rawson", "1943 - 1944", "images/presidentes/rawson.jpg"),
        new Presidente("Pedro Pablo", "Ramírez", "1943 - 1944", "images/presidentes/pabloramirez.jpg"),
        new Presidente("Edelmiro Julián", "Farrell", "1944 - 1946", "images/presidentes/farrell.jpg"),
        new Presidente("Juan Domingo", "Perón", "1946 - 1952", "images/presidentes/peron1.jpg"),
        new Presidente("Juan Domingo", "Perón", "1952 - 1955", "images/presidentes/peron2.jpg"),
        new Presidente("Eduardo", "Lonardi", "1955 - 1955", "images/presidentes/lonardi.jpg"),
        new Presidente("Pedro E.", "Aramburu", "1955 - 1958", "images/presidentes/aramburu.jpg"),
        new Presidente("Arturo", "Frondizi", "1958 - 1962", "images/presidentes/frondizi.jpg"),
        new Presidente("José María", "Guido", "1962 - 1963", "images/presidentes/guido.jpg"),
        new Presidente("Arturo Humberto", "Illia", "1963 - 1966", "images/presidentes/illia.jpg"),
        new Presidente("Juan Carlos", "Onganía", "1966 - 1970", "images/presidentes/ongania.jpg"),
        new Presidente("Roberto M.", "Levingston", "1970 - 1971", "images/presidentes/levingston.jpg"),
        new Presidente("Alejandro A.", "Lanusse", "1971 - 1973", "images/presidentes/lanusse.jpg"),
        new Presidente("Héctor José", "Cámpora", "1973 - 1973", "images/presidentes/campora.jpg"),
        new Presidente("Raúl Alberto", "Lastiri", "1973 - 1973", "images/presidentes/lastiri.jpg"),
        new Presidente("Juan Domingo", "Perón", "1973 - 1974", "images/presidentes/peron3.jpg"),
        new Presidente("María E.", "Martínez", "1974 - 1976", "images/presidentes/isabel.jpg"),
        new Presidente("Jorge Rafael", "Videla", "1976 - 1981", "images/presidentes/videla.jpg"),
        new Presidente("Roberto E.", "Viola", "1981 - 1981", "images/presidentes/viola_roberto.jpg"),
        new Presidente("Carlos Alberto", "Lacoste", "1981 - 1981", "lacoste.jpg"),
        new Presidente("Leopoldo F.", "Galtieri", "1981 - 1982", "images/presidentes/galtieri.jpg"),
        new Presidente("Reynaldo", "Bignone", "1982 - 1983", "images/presidentes/bignone.jpg"),
        new Presidente("Raúl Ricardo", "Alfonsín", "1983 - 1989", "images/presidentes/alfonsin.jpg"),
        new Presidente("Carlos Saúl", "Menem", "1989 - 1995", "images/presidentes/menem1.jpg"),
        new Presidente("Carlos Saúl", "Menem", "1995 - 1999", "images/presidentes/menem2.jpg"),
        new Presidente("Fernando", "De La Rúa", "1999 - 2001", "images/presidentes/delarua.jpeg"),
        new Presidente("Federico Ramón", "Puerta", "2001 - 2001", "images/presidentes/puerta.jpg"),
        new Presidente("Adolfo", "Rodríguez Saá", "2001 - 2001", "images/presidentes/rodriguezsaa.jpg"),
        new Presidente("Eduardo O.", "Camaño", "2001 - 2002", "images/presidentes/camano.jpg"),
        new Presidente("Eduardo A.", "Duhalde", "2002 - 2003", "images/presidentes/duhalde.jpg"),
        new Presidente("Néstor C.", "Kirchner", "2003 - 2007", "images/presidentes/kirchner.jpg"),
        new Presidente("Cristina E.", "Fernández", "2007 - 2011", "images/presidentes/cristinafernandez1.jpg"),
        new Presidente("Cristina E.", "Fernández", "2011 - 2015", "images/presidentes/cristinafernandez2.jpg"),
        new Presidente("Mauricio", "Macri", "2015 - 2019", "images/presidentes/macri.jpg"),
        new Presidente("Alberto A.", "Fernández", "2019 - 2023", "images/presidentes/albertofernandez.jpg"),
        new Presidente("Javier G.", "Milei", "2023 - ...........", "images/presidentes/milei.jpg")
    ];


    function normalizarTexto(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // --- Generar tabla con data-id único ---
    function generarTablaHTML() {
        const filasTabla = listaPresidentes.map((presidente, index) => `
            <tr data-id="${index}" data-periodo="${presidente.periodo}">
                <td>
                    <div class="imagen-presidente-desconocido-container">
                        <img src="images/presidente-desconocido.png" alt="Presidente desconocido">
                    </div>
                    ${presidente.periodo}
                </td>
                <td class="nombre-presidente-cell"></td>
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
                  <div class="input-container-first-row">
                    <div id="contador-presidentes" class="contador">
                        0 / ${listaPresidentes.length}
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

    // --- Verificar respuesta ---
    let aciertos = 0;
    function verificarRespuestaTiempoReal(inputElement) {
        const apellidoIngresado = normalizarTexto(inputElement.value);

        if (apellidoIngresado.length < 3) return;

        let acierto = false;

        listaPresidentes.forEach((presidente, index) => {
            if (normalizarTexto(presidente.apellido) === apellidoIngresado) {
                const fila = document.querySelector(`tr[data-id="${index}"]`);

                if (fila) {
                    const celdaNombre = fila.querySelector('.nombre-presidente-cell');

                    if (celdaNombre && celdaNombre.textContent === "") {
                        const imagen = fila.querySelector('img');

                        imagen.src = presidente.imagen;
                        imagen.alt = `${presidente.nombre} ${presidente.apellido}`;
                        celdaNombre.textContent = `${presidente.nombre} ${presidente.apellido}`;

                        aciertos++;
                        const contador = document.getElementById("contador-presidentes");
                        if (contador) {
                            contador.textContent = `${aciertos} / ${listaPresidentes.length}`;
                        }

                        fila.classList.add('acierto-animacion');
                        setTimeout(() => fila.classList.remove('acierto-animacion'), 2000);

                        acierto = true;
                        inputElement.value = "";
                        fila.scrollIntoView({ behavior: 'auto', block: 'center' });
                    }
                }
            }
        });

        if (acierto) inputElement.value = "";

        if (aciertos === listaPresidentes.length) {
            const inputContainer = document.querySelector(".input-container");
            if (inputContainer) {
                inputContainer.innerHTML = `
                    <div class="felicitaciones">
                        🎉 FELICITACIONES 🎉<br>
                        ERES UN VERDADERO CONOCEDOR DE LOS PRESIDENTES ARGENTINOS
                    </div>
                `;
            }

            document.querySelectorAll("tr").forEach(fila => {
                fila.classList.add("destello-verde");
                setTimeout(() => fila.classList.remove("destello-verde"), 2000);
            });
        }
    }

    // --- Iniciar juego ---
    function iniciarJuego() {
        buttonSection.remove();
        rulesSection.remove();

        body.style.justifyContent = "flex-start";
        body.style.gap = "2rem";

        const contenidoDelJuego = generarTablaHTML();
        body.insertAdjacentHTML("beforeend", contenidoDelJuego);

        const inputPresidente = document.getElementById("input-presidente");
        if (inputPresidente) {
            inputPresidente.addEventListener("input", (event) => {
                verificarRespuestaTiempoReal(event.target);
            });
            inputPresidente.focus();
        }

        const botonRendirse = document.querySelector(".rendirse-button");
        if (botonRendirse) {
          botonRendirse.addEventListener("click", rendirse);
        }
    }
    botonIniciar.addEventListener("click", iniciarJuego);

    // --- Función Rendirse ---
  function rendirse() {
    listaPresidentes.forEach((presidente, index) => {
        const fila = document.querySelector(`tr[data-id="${index}"]`);
        if (fila) {
            const celdaNombre = fila.querySelector('.nombre-presidente-cell');
            const imagen = fila.querySelector('img');

            if (celdaNombre && celdaNombre.textContent === "") {
                // ❌ No adivinado → mostrar y marcar en rojo
                imagen.src = presidente.imagen;
                imagen.alt = `${presidente.nombre} ${presidente.apellido}`;
                celdaNombre.textContent = `${presidente.nombre} ${presidente.apellido}`;
                fila.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
            }
        }
    });

    // Bloquear input
    const inputPresidente = document.getElementById("input-presidente");
    if (inputPresidente) {
        inputPresidente.disabled = true;
        inputPresidente.placeholder = "Juego terminado";
    }

    // Cambiar botón a "JUEGO TERMINADO"
    const botonRendirse = document.querySelector(".rendirse-button");
    if (botonRendirse) {
        botonRendirse.disabled = true;
        botonRendirse.textContent = "JUEGO TERMINADO";
    }
}

});