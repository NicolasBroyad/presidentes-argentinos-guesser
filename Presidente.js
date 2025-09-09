const Presidente = function(nombre, segundoNombre, apellido, periodo, deFacto, imagen) {
    this.nombre = nombre;
    this.segundoNombre = segundoNombre || "";
    this.apellido = apellido;
    this.periodo = periodo;
    this.deFacto = deFacto; //true o false
    this.imagen = imagen;

    this.estuvoMasDeUnAnio = function() {
        const fechaFin = this.periodo.fin || new Date(); // si fin es null, usa hoy
        const tiempoEnDias = (fechaFin - this.periodo.inicio) / (1000 * 60 * 60 * 24);
        return tiempoEnDias >= 365;
    };


    this.esDeFacto = () => this.deFacto;
}