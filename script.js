const formulario = document.getElementById("formMovimiento");
const lista = document.getElementById("listaMovimientos");
const campoValor = document.getElementById("valor");
const botonEliminarTodo = document.getElementById("eliminarTodo");
const feedback = document.getElementById("formFeedback");

const categorias = [
  { nombre: "Alimentación", id: "alimentacion" },
  { nombre: "Transporte", id: "transporte" },
  { nombre: "Educación", id: "educacion" },
  { nombre: "Servicios", id: "servicios" },
  { nombre: "Otros", id: "otros" }
];

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

function cargarMovimientos() {
  try {
    const datos = JSON.parse(localStorage.getItem("movimientos")) || [];

    return Array.isArray(datos)
      ? datos.filter(m =>
          m &&
          (m.tipo === "ingreso" || m.tipo === "gasto") &&
          typeof m.descripcion === "string" &&
          typeof m.categoria === "string" &&
          Number.isFinite(Number(m.valor)) &&
          Number(m.valor) > 0
        ).map(m => ({
          ...m,
          valor: Number(m.valor)
        }))
      : [];
  } catch (error) {
    return [];
  }
}

let movimientos = cargarMovimientos();

function guardarDatos() {
  try {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
  } catch (error) {
    mostrarMensaje("No se pudieron guardar los datos.", true);
  }
}

function mostrarMensaje(mensaje, esError = false) {
  feedback.textContent = mensaje;
  feedback.classList.toggle("error", esError);
}

function obtenerFechaLocal() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function fechaParaMostrar(fecha) {
  if (!fecha) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  }

  return fecha;
}

// RESUMEN DE INGRESOS, GASTOS Y SALDO

function actualizarResumen() {
  let ingresos = 0;
  let gastos = 0;
  let saldo = 0;

  movimientos.forEach(movimiento => {
    const valor = Math.abs(Number(movimiento.valor));

    if (movimiento.tipo === "ingreso") {
      ingresos += valor;
      saldo += valor;
    } else if (movimiento.tipo === "gasto") {
      gastos += valor;
      saldo -= valor;
    }
  });

  document.getElementById("totalIngresos").textContent =
    formatoCOP.format(ingresos);

  document.getElementById("totalGastos").textContent =
    formatoCOP.format(gastos);

  document.getElementById("saldo").textContent =
    formatoCOP.format(saldo);

  actualizarCategorias();
}

// GASTOS POR CATEGORÍA

function actualizarCategorias() {
  const hoy = new Date();

  const mesActual =
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const gastosDelMes = movimientos.filter(m => {
    if (m.tipo !== "gasto") return false;

    if (/^\d{4}-\d{2}-\d{2}$/.test(m.fecha || "")) {
      return m.fecha.slice(0, 7) === mesActual;
    }

    const partes = String(m.fecha || "").match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    return partes &&
      Number(partes[2]) === hoy.getMonth() + 1 &&
      Number(partes[3]) === hoy.getFullYear();
  });

  const totalMes = gastosDelMes.reduce(
    (suma, m) => suma + m.valor,
    0
  );

  categorias.forEach(categoria => {
    const total = gastosDelMes
      .filter(m => m.categoria === categoria.nombre)
      .reduce((suma, m) => suma + m.valor, 0);

    const porcentaje = totalMes > 0
      ? Math.round((total / totalMes) * 100)
      : 0;

    document.getElementById(`total-${categoria.id}`).textContent =
      formatoCOP.format(total);

    document.getElementById(`barra-${categoria.id}`).style.width =
      `${porcentaje}%`;

    document.getElementById(`porcentaje-${categoria.id}`).textContent =
      `${porcentaje}%`;
  });
}

function crearCelda(texto, clase = "") {
  const celda = document.createElement("td");
  celda.textContent = texto;

  if (clase) celda.className = clase;

  return celda;
}

// MOSTRAR HISTORIAL

function mostrarMovimientos() {
  lista.innerHTML = "";

  if (movimientos.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda(
      "Aún no tienes movimientos registrados.",
      "empty-state"
    );

    celda.colSpan = 6;
    fila.appendChild(celda);
    lista.appendChild(fila);
    return;
  }

  movimientos.forEach((movimiento, indice) => {
    const fila = document.createElement("tr");

    fila.appendChild(crearCelda(fechaParaMostrar(movimiento.fecha)));
    fila.appendChild(crearCelda(movimiento.descripcion));
    fila.appendChild(crearCelda(movimiento.categoria));

    const tipoTexto =
      movimiento.tipo === "ingreso" ? "Ingreso" : "Gasto";

    fila.appendChild(crearCelda(tipoTexto, movimiento.tipo));

    const signo =
      movimiento.tipo === "ingreso" ? "+ " : "− ";

    fila.appendChild(
      crearCelda(
        signo + formatoCOP.format(movimiento.valor),
        movimiento.tipo
      )
    );

    const celdaAcciones = document.createElement("td");
    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = "delete-button";
    boton.textContent = "Eliminar";

    boton.setAttribute(
      "aria-label",
      `Eliminar movimiento: ${movimiento.descripcion}`
    );

    boton.addEventListener("click", () => {
      movimientos.splice(indice, 1);

      guardarDatos();
      actualizarResumen();
      mostrarMovimientos();

      mostrarMensaje("Movimiento eliminado.");
    });

    celdaAcciones.appendChild(boton);
    fila.appendChild(celdaAcciones);
    lista.appendChild(fila);
  });
}

// FORMATO AUTOMÁTICO DE MILES

campoValor.addEventListener("input", function () {
  const posicionAnterior =
    this.selectionStart ?? this.value.length;

  const digitosAntesDelCursor =
    this.value.slice(0, posicionAnterior).replace(/\D/g, "").length;

  const digitos = this.value.replace(/\D/g, "");

  if (!digitos) {
    this.value = "";
    return;
  }

  const valorFormateado = digitos.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );

  this.value = valorFormateado;

  let nuevaPosicion = 0;
  let encontrados = 0;

  while (
    nuevaPosicion < valorFormateado.length &&
    encontrados < digitosAntesDelCursor
  ) {
    if (/\d/.test(valorFormateado[nuevaPosicion])) {
      encontrados++;
    }

    nuevaPosicion++;
  }

  this.setSelectionRange(nuevaPosicion, nuevaPosicion);
});

// REGISTRAR MOVIMIENTOS

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const descripcion =
    document.getElementById("descripcion").value.trim();
  const categoria =
    document.getElementById("categoria").value;

  const valor = Number(campoValor.value.replace(/\D/g, ""));

  if (tipo !== "ingreso" && tipo !== "gasto") {
    mostrarMensaje("Selecciona un tipo de movimiento válido.", true);
    return;
  }

  if (
    !descripcion ||
    !Number.isSafeInteger(valor) ||
    valor <= 0
  ) {
    mostrarMensaje(
      "Escribe una descripción y un valor válido mayor que cero.",
      true
    );
    campoValor.focus();
    return;
  }

  movimientos.push({
    tipo: tipo,
    descripcion: descripcion,
    categoria: categoria,
    valor: valor,
    fecha: obtenerFechaLocal()
  });

  guardarDatos();
  actualizarResumen();
  mostrarMovimientos();

  formulario.reset();

  mostrarMensaje("¡Movimiento guardado correctamente!");
});

// ELIMINAR TODOS LOS MOVIMIENTOS

botonEliminarTodo.addEventListener("click", () => {
  if (movimientos.length === 0) {
    mostrarMensaje("No hay movimientos para eliminar.");
    return;
  }

  const confirmar = window.confirm(
    "¿Seguro que quieres eliminar todos los movimientos? Esta acción no se puede deshacer."
  );

  if (!confirmar) return;

  movimientos = [];

  guardarDatos();
  actualizarResumen();
  mostrarMovimientos();

  mostrarMensaje("Se eliminaron todos los movimientos.");
});

// INICIAR APLICACIÓN

actualizarResumen();
mostrarMovimientos();
