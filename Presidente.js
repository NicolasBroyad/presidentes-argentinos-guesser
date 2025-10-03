const Presidente = function(nombre, segundoNombre, apellido, periodo, deFacto, imagen, descripcion) {
    this.nombre = nombre;
    this.segundoNombre = segundoNombre || "";
    this.apellido = apellido;
    this.periodo = periodo;
    this.deFacto = deFacto; //true o false
    this.imagen = imagen;
    this.descripcion = descripcion

    this.estuvoMasDeUnAnio = function() {
        const fechaFin = this.periodo.fin || new Date(); // si fin es null, usa hoy
        const fechaInicio = this.periodo.inicio;
        if (!fechaInicio) return false;
        
        const diferenciaMs = fechaFin - fechaInicio;
        const unAnioEnMs = 365.25 * 24 * 60 * 60 * 1000; // incluye años bisiestos
        return diferenciaMs >= unAnioEnMs;
    };


    this.esDeFacto = () => this.deFacto;
}