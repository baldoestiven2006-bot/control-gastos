// ==========================================
// CONTROL DE GASTOS - SCRIPT.JS
// ==========================================

// Elementos principales
const formulario = document.getElementById("formMovimiento");
const lista = document.getElementById("listaMovimientos");
const botonEliminarTodo = document.getElementById("eliminarTodo");

// Cargar movimientos guardados
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];

// Formato de moneda colombiana
const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// ==========================================
// GUARDAR DATOS
// ==========================================

function guardarDatos() {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

// ==========================================
// ACTUALIZAR RESUMEN
// ==========================================

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

    const totalIngresos = document.getElementById("totalIngresos");
    const totalGastos = document.getElementById("totalGastos");
    const saldo = document.getElementById("saldo");

    if (totalIngresos) {
        totalIngresos.textContent = formatoCOP.format(ingresos);
    }

    if (totalGastos) {
        totalGastos.textContent = formatoCOP.format(gastos);
    }

    if (saldo) {
        saldo.textContent = formatoCOP.format(ingresos - gastos);
    }

    actualizarCategorias();
}

// ==========================================
// RESUMEN POR CATEGORÍAS
// ==========================================

function actualizarCategorias() {

    const categorias = [
        "Alimentación",
        "Transporte",
        "Educación",
        "Servicios",
        "Otros"
    ];

    categorias.forEach(categoria => {

        const total = movimientos
            .filter(m =>
                m.tipo === "gasto" &&
                m.categoria === categoria
            )
            .reduce((suma, m) => suma + m.valor, 0);

        const elemento = document.querySelector(
            `[data-categoria="${categoria}"]`
        );

        if (elemento) {
            elemento.textContent = formatoCOP.format(total);
        }

    });
}

// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

function mostrarMovimientos() {

    if (!lista) return;

    lista.innerHTML = "";

    if (movimientos.length === 0) {

        lista.innerHTML =
            "<p>Aún no tienes movimientos registrados.</p>";

        return;
    }

    movimientos.forEach((movimiento, indice) => {

        const elemento = document.createElement("div");
        elemento.className = "movimiento";

        const informacion = document.createElement("div");

        const descripcion = document.createElement("strong");
        descripcion.textContent = movimiento.descripcion;

        const detalle = document.createElement("p");
        detalle.textContent =
            movimiento.categoria + " · " + movimiento.fecha;

        informacion.appendChild(descripcion);
        informacion.appendChild(detalle);

        const valor = document.createElement("span");

        valor.className = movimiento.tipo;

        valor.textContent =
            (movimiento.tipo === "ingreso" ? "+ " : "- ") +
            formatoCOP.format(movimiento.valor);

        const boton = document.createElement("button");

        boton.textContent = "🗑️";
        boton.type = "button";
        boton.className = "boton-eliminar";

        boton.addEventListener("click", () => {

            if (confirm("¿Deseas eliminar este movimiento?")) {

                movimientos.splice(indice, 1);

                guardarDatos();
                actualizarResumen();
                mostrarMovimientos();

            }

        });

        elemento.appendChild(informacion);
        elemento.appendChild(valor);
        elemento.appendChild(boton);

        lista.appendChild(elemento);

    });

}

// ==========================================
// REGISTRAR INGRESOS Y GASTOS
// ==========================================

if (formulario) {

    formulario.addEventListener("submit", function(evento) {

        evento.preventDefault();

        const tipo = document.getElementById("tipo").value;

        const descripcion = document
            .getElementById("descripcion")
            .value.trim();

        const categoria = document.getElementById("categoria").value;

        const valor = Number(
            document.getElementById("valor").value
        );

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

        alert("¡Movimiento registrado correctamente!");

    });

}

// ==========================================
// ELIMINAR TODO EL HISTORIAL
// ==========================================

if (botonEliminarTodo) {

    botonEliminarTodo.addEventListener("click", function() {

        if (movimientos.length === 0) {

            alert("No hay movimientos para eliminar.");

            return;
        }

        const confirmar = confirm(
            "¿Estás seguro de eliminar TODO el historial? Esta acción no se puede deshacer."
        );

        if (confirmar) {

            movimientos = [];

            guardarDatos();
            actualizarResumen();
            mostrarMovimientos();

            alert("El historial se eliminó correctamente.");

        }

    });

}

// ==========================================
// INICIAR APLICACIÓN
// ==========================================

actualizarResumen();
mostrarMovimientos();
