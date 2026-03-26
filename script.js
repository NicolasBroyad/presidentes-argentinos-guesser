document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const body = document.querySelector("body");
    const buttonSection = document.querySelector(".button-section");
    const rulesSection = document.querySelector(".rules-section");
    const modosDeJuegoSection = document.querySelector(".modos-de-juego-section");
    const botonIniciar = document.querySelector(".iniciar-juego-button");
    const botonConfiguracion = document.querySelector(".configuracion-button");
    const main = document.querySelector(".main");
    const h1 = document.querySelector("h1");

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
    new Presidente("Bernardino", "", "Rivadavia", new Periodo(new Date("1826-02-08"), new Date("1827-06-27")), false, "images/presidentes/rivadavia.jpg", "Político y educador; primer presidente de las Provincias Unidas del Río de la Plata (1826–1827). Promovió reformas liberales y la creación de instituciones educativas, pero su proyecto centralista y la guerra con Brasil provocaron su renuncia."),
    new Presidente("Vicente", "", "López", new Periodo(new Date("1827-07-07"), new Date("1827-08-18")), false, "images/presidentes/vicentelopez.jpg", "Político y jurista que asumió provisionalmente en 1827. Su breve mandato se enmarca en la inestabilidad política posterior a Rivadavia."),
    new Presidente("Bartolomé", "", "Mitre", new Periodo(new Date("1862-10-12"), new Date("1868-10-12")), false, "images/presidentes/mitre.jpg", "Militar, político e historiador; primer presidente de la Argentina unificada (1862–1868). Impulsó la consolidación institucional y la modernización del Estado y la educación."),
    new Presidente("Domingo", "Faustino", "Sarmiento", new Periodo(new Date("1868-10-12"), new Date("1874-10-12")), false, "images/presidentes/sarmiento.jpg", "Educador y escritor; presidente (1868–1874) famoso por su impulso a la educación pública y la modernización del país. Promovió escuelas, bibliotecas y la inmigración europea para el desarrollo."),
    new Presidente("Nicolás", "Remigio Aurelio", "Avellaneda", new Periodo(new Date("1874-10-12"), new Date("1880-10-12")), false, "images/presidentes/avellaneda.jpg", "Estadista y economista; presidente (1874–1880) que enfrentó crisis económicas y promovió la reorganización financiera del Estado. Fomentó la colonización agrícola y la modernización del sistema educativo."),
    new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1880-10-12"), new Date("1886-10-12")), false, "images/presidentes/roca1.jpg", "Militar y político; su primer mandato (1880–1886) consolidó la autoridad nacional y promovió políticas de expansión territorial y modernización del país, aunque con controvertidas campañas en la Patagonia."),
    new Presidente("Miguel", "Ángel", "Juárez Celman", new Periodo(new Date("1886-10-12"), new Date("1890-08-06")), false, "images/presidentes/juarezcelman.jpg", "Político ligado al modelo exportador; su presidencia (1886–1890) terminó con la crisis del '89 y su renuncia tras protestas populares y descontento por corrupción y manejo económico."),
    new Presidente("Carlos", "Enrique José", "Pellegrini", new Periodo(new Date("1890-08-06"), new Date("1892-10-12")), false, "images/presidentes/pellegrini.jpg", "Economista y político; asumió tras la crisis de 1890 y estabilizó la economía (1890–1892). Impulsó medidas financieras para recuperar la confianza y sentó bases para el crecimiento posterior."),
    new Presidente("Luis", "", "Sáenz Peña", new Periodo(new Date("1892-10-12"), new Date("1895-01-22")), false, "images/presidentes/luissaenzpena.jpg", "Político conservador; su gobierno (1892–1895) continuó el desarrollo institucional previo, en un período de consolidación del modelo agroexportador y de las élites tradicionales."),
    new Presidente("José", "Evaristo", "Uriburu", new Periodo(new Date("1895-01-23"), new Date("1898-10-12")), false, "images/presidentes/joseevaristouriburu.jpg", "Militar y político; presidente (1895–1898) en una etapa de estabilidad relativa. Su gestión se centró en la continuidad del orden político y el crecimiento económico agroexportador."),
    new Presidente("Julio", "Argentino", "Roca", new Periodo(new Date("1898-10-12"), new Date("1904-10-12")), false, "images/presidentes/roca2.jpg", "En su segundo mandato (1898–1904) Roca continuó políticas modernizadoras y la consolidación del Estado; su figura es clave en la política argentina de fines del siglo XIX y principios del XX."),
    new Presidente("Manuel", "Pedro", "Quintana", new Periodo(new Date("1904-10-12"), new Date("1906-03-12")), false, "images/presidentes/quintana.jpg", "Político conservador; su breve período (1904–1906) se caracterizó por la continuidad de la élite gobernante y la estabilidad institucional, con foco en la administración pública."),
    new Presidente("José", "", "Figueroa Alcorta", new Periodo(new Date("1906-03-12"), new Date("1910-10-12")), false, "images/presidentes/figueroaalcorta.jpg", "Juez y político que asumió la presidencia (1906–1910) y es recordado por promover la liberalización económica y reformas institucionales en un contexto de crecimiento."),
    new Presidente("Roque", "", "Sáenz Peña", new Periodo(new Date("1910-10-12"), new Date("1914-08-09")), false, "images/presidentes/roquesaenzpena.jpg", "Político y expresidente; su presidencia (1910–1914) preparó el terreno para la histórica Ley Sáenz Peña, que luego ampliaría el sufragio secreto y obligatorio, transformando el sistema político."),
    new Presidente("Victorino", "", "de la Plaza", new Periodo(new Date("1914-08-09"), new Date("1916-10-12")), false, "images/presidentes/delaplaza.jpg", "Asumió tras la renuncia de Sáenz Peña; su gobierno (1914–1916) enfrentó los efectos de la Primera Guerra Mundial y mantuvo la administración estatal en un contexto difícil."),
    new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1916-10-12"), new Date("1922-10-12")), false, "images/presidentes/yrigoyen1.jpg", "Líder radical y presidente (1916–1922) tras la Ley Sáenz Peña; impulsó políticas sociales y laborales, y marcó la entrada de nuevas fuerzas políticas al poder tradicional."),
    new Presidente("Marcelo", "Torcuato", "de Alvear", new Periodo(new Date("1922-10-12"), new Date("1928-10-12")), false, "images/presidentes/alvear.jpg", "Político conservador moderado; su gobierno (1922–1928) consolidó instituciones democráticas y fomentó el desarrollo cultural y la estabilidad relativa de la década de 1920."),
    new Presidente("Hipólito", "", "Yrigoyen", new Periodo(new Date("1928-10-12"), new Date("1930-09-06")), false, "images/presidentes/yrigoyen2.jpg", "Reelecto en 1928, su segundo mandato (1928–1930) fue marcado por la crisis económica global y terminó con su derrocamiento por un golpe militar en 1930."),
    new Presidente("José", "Félix", "Uriburu", new Periodo(new Date("1930-09-06"), new Date("1932-02-20")), true, "images/presidentes/uriburu.jpg", "General que encabezó el primer golpe de Estado de la era moderna argentina (1930); gobernó de facto (1930–1932) e instauró un régimen conservador que inició la llamada 'Década Infame'."),
    new Presidente("Agustín", "Pedro", "Justo", new Periodo(new Date("1932-02-20"), new Date("1938-02-20")), false, "images/presidentes/justo.jpg", "Presidente civil elegido en un clima de fraude electoral (1932–1938); su gobierno implementó políticas de estabilidad económica y acuerdos con sectores conservadores durante la 'Década Infame'."),
    new Presidente("Roberto", "Marcelino", "Ortiz", new Periodo(new Date("1938-02-20"), new Date("1942-06-26")), false, "images/presidentes/ortiz.jpg", "Militar y presidente (1938–1942) preocupada por la corrupción y el fraude; intentó restaurar la legalidad y combatir prácticas fraudulentas, pero su salud y presiones políticas condicionaron su mandato."),
    new Presidente("Ramón", "", "Castillo", new Periodo(new Date("1942-06-26"), new Date("1943-06-04")), false, "images/presidentes/castillo.jpg", "Presidente conservador (1942–1943) elegido en un contexto de fraude y crisis; su gobierno terminó con el golpe militar de 1943 que abriría un nuevo ciclo político."),
    new Presidente("Arturo", "Franklin", "Rawson", new Periodo(new Date("1943-06-04"), new Date("1943-06-07")), true, "images/presidentes/rawson.jpg", "Militar que asumió brevemente tras el golpe de 1943; su mandato duró solo unos días antes de ser reemplazada por la Junta militar, en un período convulso."),
    new Presidente("Pedro", "Pablo", "Ramírez", new Periodo(new Date("1943-06-07"), new Date("1944-02-24")), true, "images/presidentes/pabloramirez.jpg", "General que presidió la junta de 1943–1944; bajo su gobierno se dieron cambios en el escenario político que propiciaron la aparición del peronismo."),
    new Presidente("Edelmiro", "Julián", "Farrell", new Periodo(new Date("1944-02-24"), new Date("1946-06-04")), true, "images/presidentes/farrell.jpg", "Militar que gobernó como jefe de la junta y luego presidente de facto; durante su mandato emergió la figura de Juan Domingo Perón, quien ejerció gran influencia política y ministerial."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1946-06-04"), new Date("1952-06-04")), false, "images/presidentes/peron1.jpg", "Líder popular y fundador del peronismo; primer mandato presidencial (1946–1952) con fuerte protagonismo en políticas sociales, laborales e industrialización por sustitución de importaciones."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1952-06-04"), new Date("1955-09-21")), false, "images/presidentes/peron2.jpg", "Segundo mandato (1952–1955) marcado por tensiones políticas y polarización; terminó con el derrocamiento de Perón en 1955 por la llamada 'Revolución Libertadora'."),
    new Presidente("Eduardo", "Ernesto", "Lonardi", new Periodo(new Date("1955-09-23"), new Date("1955-11-13")), true, "images/presidentes/lonardi.jpg", "Militar que encabezó el golpe que depuso a Perón; su breve gobierno (1955) propuso una reconciliación nacional, aunque fue reemplazado por sectores más duros del antiperonismo."),
    new Presidente("Pedro", "Eugenio", "Aramburu", new Periodo(new Date("1955-11-13"), new Date("1958-05-01")), true, "images/presidentes/aramburu.jpg", "Presidente de facto (1955–1958) que proscribió el peronismo y reorganizó el sistema político; su gobierno intentó estabilizar el país tras la caída de Perón."),
    new Presidente("Arturo", "", "Frondizi", new Periodo(new Date("1958-05-01"), new Date("1962-03-29")), false, "images/presidentes/frondizi.jpg", "Presidente (1958–1962) conocido por promover la industrialización y la atracción de inversiones; su mandato fue interrumpido por presiones militares y terminó con su derrocamiento."),
    new Presidente("José", "María", "Guido", new Periodo(new Date("1962-03-29"), new Date("1963-10-12")), false, "images/presidentes/guido.jpg", "Asumió como presidente provisional tras la crisis de 1962; su gobierno (1962–1963) administró la transición hasta nuevas elecciones en un clima político convulso."),
    new Presidente("Arturo", "Umberto", "Illia", new Periodo(new Date("1963-10-12"), new Date("1966-06-28")), false, "images/presidentes/illia.jpg", "Médico y político que presidió (1963–1966) con un enfoque en la ética pública y la recuperación democrática; su gobierno fue derrocado por un golpe militar en 1966."),
    new Presidente("Juan", "Carlos", "Onganía", new Periodo(new Date("1966-06-28"), new Date("1970-06-08")), true, "images/presidentes/ongania.jpg", "General que encabezó la dictadura autodenominada 'Revolución Argentina' (1966–1970), suspendió partidos políticos y reformas estructurales que cambiaron la vida institucional del país."),
    new Presidente("Roberto", "Marcelo", "Levingston", new Periodo(new Date("1970-06-18"), new Date("1971-03-23")), true, "images/presidentes/levingston.jpg", "Militar que lideró la junta entre 1970 y 1971; su corto mandato se enmarcó en la inestabilidad política y en intentos de reorganización del poder militar."),
    new Presidente("Alejandro", "Agustín", "Lanusse", new Periodo(new Date("1971-03-23"), new Date("1973-05-25")), true, "images/presidentes/lanusse.jpg", "Último presidente de facto de la dictadura de 1966–1973; dirigió el regreso a un proceso electoral que culminó con la elección de Perón en 1973."),
    new Presidente("Héctor", "José", "Cámpora", new Periodo(new Date("1973-05-25"), new Date("1973-07-13")), false, "images/presidentes/campora.jpg", "Militante peronista y presidente breve en 1973; su gobierno buscó la apertura política que permitió el retorno de Juan Domingo Perón a la presidencia."),
    new Presidente("Raúl", "Alberto", "Lastiri", new Periodo(new Date("1973-07-13"), new Date("1973-10-12")), false, "images/presidentes/lastiri.jpg", "Asumió provisionalmente en 1973 como presidente interino; su mandato fue breve en el complejo contexto del regreso del peronismo al poder."),
    new Presidente("Juan", "Domingo", "Perón", new Periodo(new Date("1973-10-12"), new Date("1974-07-01")), false, "images/presidentes/peron3.jpg", "Tercer mandato (1973–1974) tras su regreso del exilio; su gobierno enfrentó una creciente polarización política y problemas de salud que condicionaron su última etapa."),
    new Presidente("María", "Estela", "Martínez", new Periodo(new Date("1974-07-01"), new Date("1976-03-24")), false, "images/presidentes/isabel.jpg", "Conocida como Isabel Perón; su presidencia (1974–1976) estuvo marcada por crisis política y económica, que culminaron en el golpe militar de 1976."),
    new Presidente("Jorge", "Rafael", "Videla", new Periodo(new Date("1976-03-29"), new Date("1981-03-29")), true, "images/presidentes/videla.jpg", "General que encabezó la dictadura militar (1976–1981) responsable de la represión, violaciones a los derechos humanos y la llamada 'guerra sucia'."),
    new Presidente("Roberto", "Eduardo", "Viola", new Periodo(new Date("1981-03-29"), new Date("1981-12-11")), true, "images/presidentes/viola_roberto.jpg", "Militar que sucedió a Videla en la junta; su corto gobierno (1981) buscó gobernabilidad pero fue desplazado por sectores militares internos."),
    new Presidente("Carlos", "Alberto", "Lacoste", new Periodo(new Date("1981-12-11"), new Date("1981-12-22")), true, "images/presidentes/lacoste.jpg", "Breve presidente de facto durante la dictadura; ejerció funciones interinas en un período de transición interna dentro de las Fuerzas Armadas."),
    new Presidente("Leopoldo", "Fortunato", "Galtieri", new Periodo(new Date("1981-12-22"), new Date("1982-06-18")), true, "images/presidentes/galtieri.jpg", "General cuyo gobierno (1981–1982) impulsó la guerra de Malvinas en 1982, conflicto que precipitó la crisis y debilitamiento del régimen militar."),
    new Presidente("Reynaldo", "Benito", "Bignone", new Periodo(new Date("1982-07-01"), new Date("1983-12-10")), true, "images/presidentes/bignone.jpg", "Último presidente de la última dictadura (1982–1983); encabezó la transición hacia el regreso de la democracia y la convocatoria a elecciones en 1983."),
    new Presidente("Raúl", "Ricardo", "Alfonsín", new Periodo(new Date("1983-12-10"), new Date("1989-07-08")), false, "images/presidentes/alfonsin.jpg", "Abogado y líder de la UCR; presidente (1983–1989) que restauró la democracia, promovió juicios por violaciones a los derechos humanos y enfrentó severas crisis económicas."),
    new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1989-07-08"), new Date("1995-07-08")), false, "images/presidentes/menem1.jpg", "Político peronista; primer mandato (1989–1995) centrado en políticas neoliberales y reformas económicas que incluyeron privatizaciones y apertura de mercados."),
    new Presidente("Carlos", "Saúl", "Menem", new Periodo(new Date("1995-07-08"), new Date("1999-12-10")), false, "images/presidentes/menem2.jpg", "Segundo mandato (1995–1999) que continuó las reformas de mercado; su legado incluye transformaciones económicas y debates sobre impacto social y institucional."),
    new Presidente("Fernando", "", "De La Rúa", new Periodo(new Date("1999-12-10"), new Date("2001-12-20")), false, "images/presidentes/delarua.jpeg", "Abogado y político de la UCR; su presidencia (1999–2001) terminó en crisis y renuncia masiva en diciembre de 2001 tras la grave crisis económica y social."),
    new Presidente("Federico", "Ramón", "Puerta", new Periodo(new Date("2001-12-20"), new Date("2001-12-22")), false, "images/presidentes/puerta.jpg", "Asumió interinamente como presidente del Senado y ejerció la presidencia de manera transitoria durante dos días en la convulsa crisis de diciembre de 2001."),
    new Presidente("Adolfo", "", "Rodríguez Saá", new Periodo(new Date("2001-12-22"), new Date("2001-12-30")), true, "images/presidentes/rodriguezsaa.jpg", "Asumió como presidente interino en plena debacle de 2001; su breve gestión (diciembre 2001) se caracterizó por la incertidumbre política y su dimisión tras pocos días."),
    new Presidente("Eduardo", "Oscar", "Camaño", new Periodo(new Date("2001-12-31"), new Date("2002-01-01")), true, "images/presidentes/camano.jpg", "Diputado que ejerció brevemente la presidencia interina en la sucesión de 2001; su rol fue transitorio en la búsqueda de estabilidad institucional."),
    new Presidente("Eduardo", "Alberto", "Duhalde", new Periodo(new Date("2002-01-02"), new Date("2003-05-25")), false, "images/presidentes/duhalde.jpg", "Designado por el Congreso en 2002 para normalizar el país post-crisis; su gobierno (2002–2003) implementó medidas para la recuperación económica y la reestructuración social."),
    new Presidente("Néstor", "Carlos", "Kirchner", new Periodo(new Date("2003-05-25"), new Date("2007-12-10")), false, "images/presidentes/kirchner.jpg", "Político peronista; presidente (2003–2007) que impulsó la recuperación económica tras la crisis, políticas de derechos humanos y una fuerte centralización política en la Casa Rosada."),
    new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2007-12-10"), new Date("2011-12-10")), false, "images/presidentes/cristinafernandez1.jpg", "Primera etapa presidencial (2007–2011) con énfasis en políticas sociales, presencia estatal en la economía y fortalecimiento del proyecto político iniciado en la presidencia de Kirchner."),
    new Presidente("Cristina", "Elisabet", "Fernández", new Periodo(new Date("2011-12-10"), new Date("2015-12-10")), false, "images/presidentes/cristinafernandez2.jpg", "Segundo mandato (2011–2015) caracterizado por mayor intervención estatal, programas sociales ampliados y debates sobre transparencia y manejo económico."),
    new Presidente("Mauricio", "", "Macri", new Periodo(new Date("2015-12-10"), new Date("2019-12-10")), false, "images/presidentes/macri.jpg", "Empresario y líder de coalición; presidente (2015–2019) que impulsó reformas pro-mercado, apertura internacional y endeudamiento para estabilizar la economía, con resultados mixtos en crecimiento y pobreza."),
    new Presidente("Alberto", "Ángel", "Fernández", new Periodo(new Date("2019-12-10"), new Date("2023-12-10")), false, "images/presidentes/albertofernandez.jpg", "Presidente (2019–2023) que enfrentó desafíos económicos, renegociación de deuda y la gestión de la pandemia; su gobierno formó parte de una coalición peronista heterogénea."),
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

        return `
            <h4 class="jugando-modo-heading">JUGANDO MODO <span class="modo-de-juego-seleccionado">CLÁSICO</span></h4>
            <div class="tabla-container">
                <div class="tabla-wrapper" style="position:relative;">
                    <table class="tabla" border="1" cellspacing="0" cellpadding="5">
                        <tbody>
                            ${filasTabla}
                        </tbody>
                    </table>
                    <div class="tabla-paused-overlay" style="display:none;">Juego en pausa</div>
                </div>
                <div class="input-container">
                    <div class="input-container-first-row">
                        <svg class="restart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Volver a empezar</title><path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z" /></svg>
                        <div id="temporizador" class="temporizador">${configuracionJuego.tiempo.toString().padStart(2,'0')}:00</div>
                        <svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Pausar</title><path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>
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
                        fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        hizoScroll = true;
                    }
                } else if (!hizoScroll) {
                    // Si ya estaba adivinado, igual hacemos scroll solo al primero
                    fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

        const presidentesFiltrados = filtrarPresidentes();
        const contenidoDelJuego = generarTablaHTML(presidentesFiltrados);
        main.insertAdjacentHTML("beforeend", contenidoDelJuego);

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


        window.temporizadorInterval = temporizadorInterval;
    }
    botonIniciar.addEventListener("click", iniciarJuego);


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

    botonConfiguracion.addEventListener("click", abrirConfig);
    botonGuardar.addEventListener("click", guardarConfig);
    botonCancelar.addEventListener("click", cancelarConfig);

    slider.addEventListener("input", () => {
        valorRango.textContent = slider.value + " minutos";
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

        // Cambiar boton a  "JUEGO TERMINADO"
        const botonRendirse = document.querySelector(".rendirse-button");
        if (botonRendirse) {
            botonRendirse.textContent = "JUEGO TERMINADO";
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

// --- Función para cargar presidencias en presidencias.html ---
document.addEventListener('DOMContentLoaded', () => {
    const presidenciasContainer = document.querySelector('.presidencias-container');
    if (!presidenciasContainer) return; // Solo ejecutar si estamos en presidencias.html

    // Esperar un poco para asegurar que todas las clases estén cargadas
    setTimeout(() => {
        const presidenciasHTML = window.listaPresidentes.map(presidente => {
            const nombreCompleto = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                .filter(Boolean).join(" ");
            
            const tipoGobierno = presidente.esDeFacto() ? "De facto" : "Constitucional";
            const claseTipo = presidente.esDeFacto() ? "de-facto" : "constitucional";
            
            return `
                <div class="presidencia-card ${claseTipo}">
                    <div class="presidencia-imagen">
                        <img src="${presidente.imagen}" alt="${nombreCompleto}" loading="lazy">
                    </div>
                    <div class="presidencia-info">
                        <h3 class="presidencia-nombre">${nombreCompleto}</h3>
                        <p class="presidencia-descripcion">${presidente.descripcion}</p>
                        <p class="presidencia-periodo">${presidente.periodo.toString()}</p>
                        <span class="presidencia-tipo ${claseTipo}">${tipoGobierno}</span>
                    </div>
                </div>
            `;
        }).join('');

        presidenciasContainer.innerHTML = presidenciasHTML;
    }, 100);
});

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

// --- Función para cargar presidencias en presidencias.html ---
document.addEventListener('DOMContentLoaded', () => {
    const presidenciasContainer = document.querySelector('.presidencias-container');
    if (!presidenciasContainer) return; // Solo ejecutar si estamos en presidencias.html

    // Esperar un poco para asegurar que todas las clases estén cargadas
    setTimeout(() => {
        const presidenciasHTML = window.listaPresidentes.map(presidente => {
            const nombreCompleto = [presidente.nombre, presidente.segundoNombre, presidente.apellido]
                .filter(Boolean).join(" ");
            
            const tipoGobierno = presidente.esDeFacto() ? "De facto" : "Constitucional";
            const claseTipo = presidente.esDeFacto() ? "de-facto" : "constitucional";
            
            return `
                <div class="presidencia-card ${claseTipo}">
                    <div class="presidencia-imagen">
                        <img src="${presidente.imagen}" alt="${nombreCompleto}" loading="lazy">
                    </div>
                    <div class="presidencia-info">
                        <h3 class="presidencia-nombre">${nombreCompleto}</h3>
                        <p class="presidencia-descripcion">${presidente.descripcion}</p>
                        <p class="presidencia-periodo">${presidente.periodo.toString()}</p>
                        <span class="presidencia-tipo ${claseTipo}">${tipoGobierno}</span>
                    </div>
                </div>
            `;
        }).join('');

        presidenciasContainer.innerHTML = presidenciasHTML;
    }, 100);
});
