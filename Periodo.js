const Periodo = function(inicio, fin) {
    this.inicio = inicio;  
    this.fin = fin;      

    this.calcularTiempoEnMandato = function() {
        if (!this.inicio || !this.fin) {
            return null; 
        }
        const diferenciaMs = this.fin - this.inicio;
        const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24)); 
        return dias;
    }

    this.toString = function() {
        const opciones = { year: "numeric" };
        const inicioStr = this.inicio ? this.inicio.toLocaleDateString("es-AR", opciones) : "En curso";
        const finStr = this.fin ? this.fin.toLocaleDateString("es-AR", opciones) : "En curso";
        return `${inicioStr} – ${finStr}`;
    }
}
