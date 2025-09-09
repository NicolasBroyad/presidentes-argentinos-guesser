const Presidente = function(nombre, segundoNombre, apellido, periodo, deFacto, imagen) {
    this.nombre = nombre;
    this.segundoNombre = segundoNombre || "";
    this.apellido = apellido;
    this.periodo = periodo;
    this.deFacto = deFacto; //true o false
    this.imagen = imagen;

    this.estuvoMasDeUnAnio = function(){
        return this.periodo.calcularTiempoEnMandato() >= 365;
    }

    this.esDeFacto = () => this.deFacto;
}