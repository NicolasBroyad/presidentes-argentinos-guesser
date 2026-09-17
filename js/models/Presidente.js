const Presidente = function(nombre, segundoNombre, apellido, periodo, deFacto, imagen, descripcion, interino) {
    this.nombre = nombre;
    this.segundoNombre = segundoNombre || "";
    this.apellido = apellido;
    this.periodo = periodo;
    this.deFacto = deFacto; //true o false
    this.imagen = imagen;
    this.descripcion = descripcion
    // Presidente interino/provisional (asumió transitoriamente por sucesión
    // o vacancia, sin ser electo ni de facto en sentido estricto). No se usa
    // todavía en ninguna funcionalidad: queda como dato disponible para
    // features futuras (ej. filtrarlos, marcarlos visualmente, etc).
    this.interino = interino || false; //true o false

    this.estuvoMasDeUnAnio = function() {
        const fechaFin = this.periodo.fin || new Date(); // si fin es null, usa hoy
        const fechaInicio = this.periodo.inicio;
        if (!fechaInicio) return false;
        
        const diferenciaMs = fechaFin - fechaInicio;
        const unAnioEnMs = 365.25 * 24 * 60 * 60 * 1000; // incluye años bisiestos
        return diferenciaMs >= unAnioEnMs;
    };


    this.esDeFacto = () => this.deFacto;
    this.esInterino = () => this.interino;
}