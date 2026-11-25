const formulario = document.getElementById("formMovimiento");
const lista = document.getElementById("listaMovimientos");

let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];

const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

function guardarDatos() {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

function actualizarResumen() {
    let ingresos = 0;
    let gastos = 0;

    movimientos.forEach(movimiento => {
        if (movimiento.tipo === "ingreso") {
            ingresos += movimiento.valor;
        } else {
            gastos += movimiento.valor;
        }
    });

    document.getElementById("totalIngresos").textContent =
        formatoCOP.format(ingresos);

    document.getElementById("totalGastos").textContent =
        formatoCOP.format(gastos);

    document.getElementById("saldo").textContent =
        formatoCOP.format(ingresos - gastos);
}

function mostrarMovimientos() {
    lista.innerHTML = "";

    if (movimientos.length === 0) {
        lista.innerHTML = "<p>Aún no tienes movimientos registrados.</p>";
        return;
    }

    movimientos.forEach((movimiento, indice) => {
        const elemento = document.createElement("div");
        elemento.className = "movimiento";

        const informacion = document.createElement("div");

        const descripcion = document.createElement("strong");
        descripcion.textContent = movimiento.descripcion;

        const detalle = document.createElement("p");
        detalle.textContent = movimiento.categoria + " · " + movimiento.fecha;

        informacion.appendChild(descripcion);
        informacion.appendChild(detalle);

        const valor = document.createElement("span");
        valor.className = movimiento.tipo;
        valor.textContent =
            (movimiento.tipo === "ingreso" ? "+ " : "- ") +
            formatoCOP.format(movimiento.valor);

        const boton = document.createElement("button");
        boton.textContent = "Eliminar";
        boton.type = "button";

        boton.addEventListener("click", () => {
            movimientos.splice(indice, 1);
            guardarDatos();
            actualizarResumen();
            mostrarMovimientos();
        });

        elemento.appendChild(informacion);
        elemento.appendChild(valor);
        elemento.appendChild(boton);

        lista.appendChild(elemento);
    });
}

formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value;
    const valor = Number(document.getElementById("valor").value);

    if (!descripcion || !Number.isSafeInteger(valor) || valor <= 0) {
        alert("Por favor, ingresa una descripción y un valor válido.");
        return;
    }

    const movimiento = {
        tipo: tipo,
        descripcion: descripcion,
        categoria: categoria,
        valor: valor,
        fecha: new Date().toLocaleDateString("es-CO")
    };

    movimientos.push(movimiento);

    guardarDatos();
    actualizarResumen();
    mostrarMovimientos();

    formulario.reset();
});

actualizarResumen();
mostrarMovimientos();
