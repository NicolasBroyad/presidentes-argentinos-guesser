document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const body = document.querySelector("body");
    const buttonSection = document.querySelector(".button-section");
    const rulesSection = document.querySelector(".rules-section");
    const modosDeJuegoSection = document.querySelector(".modos-de-juego-section");
    const botonIniciar = document.querySelector(".iniciar-juego-button");
    const botonConfiguracion = document.querySelector(".configuracion-link");
    const main = document.querySelector(".main");
    const h1 = document.querySelector("h1");
    const kicker = document.querySelector(".kicker");

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

    // Inicializar valor del rango inmediatamente
    if (valorRango && slider) {
        valorRango.textContent = slider.value + " minutos";
    }

    // --- Íconos ---
    const iconoPausa = `
        <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(10, 34, 53)"><title>Pausar</title>
        <path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>`;

    const iconoPlay = `
        <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(10, 34, 53)"><title>Activar</title>
        <path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>`;

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
                <h4 class="jugando-modo-heading">JUGANDO MODO <span class="modo-de-juego-seleccionado">CLÁSICO</span></h4>
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
            <h4 class="jugando-modo-heading">JUGANDO MODO <span class="modo-de-juego-seleccionado">CLÁSICO</span></h4>
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
                    imagen.src = presidente.imagen;
                    imagen.alt = nombreParaMostrar;
                    celdaNombre.innerHTML = `${checkIcon} <span class="nombre-presidente-texto">${nombreParaMostrar}</span>`;
                    presidenteCard.style.backgroundColor = "rgb(27, 190, 241)";
                    const presidenteTexto = fila.querySelector('.nombre-presidente-texto');
                    presidenteTexto.style.border = "none";
                    presidenteTexto.style.marginBottom = "0";
                    presidenteTexto.style.color = "rgb(10, 34, 53)";

                    aciertos++;
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
        buttonSection.remove();
        rulesSection.remove();
        modosDeJuegoSection.remove();
        h1.remove();
        if (kicker) kicker.remove();
        main.classList.add("juego-activo");

        const presidentesFiltrados = filtrarPresidentes();
        const contenidoDelJuego = generarTablaHTML(presidentesFiltrados);
        main.insertAdjacentHTML("beforeend", contenidoDelJuego);

        // El header compacto (hamburguesa + modo + tema en una sola franja,
        // sin footer) es solo para mobile; en desktop queda todo como estaba.
        if (window.matchMedia('(max-width: 768px)').matches) {
            body.classList.add("juego-activo");
            const navToggleEl = document.querySelector(".nav-toggle");
            const jugandoModoHeading = document.querySelector(".jugando-modo-heading");
            if (navToggleEl && jugandoModoHeading) {
                navToggleEl.insertAdjacentElement("afterend", jugandoModoHeading);
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
    if (botonIniciar) {
        botonIniciar.addEventListener("click", iniciarJuego);
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
        aciertos = 0;
        pausado = false;

        // Eliminar tabla anterior
        const tabla = document.querySelector(".tabla-container");
        const headingModo = document.querySelector(".jugando-modo-heading");
        if (tabla) tabla.remove();
        if (headingModo) headingModo.remove();

        // Volver a iniciar
        iniciarJuego();
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


    // --- Botón Configuración ---
    function abrirConfig() {
        configuracionTemporal = { ...configuracionJuego };

        slider.value = configuracionJuego.tiempo;
        valorRango.textContent = configuracionJuego.tiempo + " minutos";

        checkboxes[0].checked = configuracionJuego.eliminarDeFacto;
        checkboxes[1].checked = configuracionJuego.eliminarMenosDeUnAnio;

        document.getElementById("configDialog").showModal(); // Cambio aquí
    }

    function cerrarConfig() {
        document.getElementById("configDialog").close(); // Cambio aquí
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
                    fila.querySelector('img').src = presidente.imagen;
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
    
    dialog.showModal();
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
                                <img src="${presidente.imagen}" alt="${nombreCompleto}" loading="lazy">
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
