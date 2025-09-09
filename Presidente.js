const Presidente = function(nombre, segundoNombre, apellido, periodo, imagen) {
    this.nombre = nombre;
    this.segundoNombre = segundoNombre || "";
    this.apellido = apellido;
    this.periodo = periodo;
    this.imagen = imagen;

    this.estuvoMasDeUnAnio = function(){
        return this.periodo.calcularTiempoEnMandato() >= 365;
    }
}