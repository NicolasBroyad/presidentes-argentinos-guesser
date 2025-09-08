class Presidente {
    constructor(nombre, segundoNombre, apellido, periodo, imagen) {
        this.nombre = nombre;
        this.segundoNombre = segundoNombre || "";
        this.apellido = apellido;
        this.periodo = periodo;
        this.imagen = imagen;
    }
}