(() => {
  "use strict";

  const STORAGE_KEY = "movimientos";
  const categorias = ["Alimentación", "Transporte", "Educación", "Servicios", "Otros"];

  const formulario = document.getElementById("formMovimiento");
  const campoValor = document.getElementById("valor");
  const lista = document.getElementById("listaMovimientos");
  const botonEliminarTodo = document.getElementById("eliminarTodo");
  const botonVerTodos = document.getElementById("verTodos");
  const mensaje = document.getElementById("formMensaje");

  const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });

  function cargarMovimientos() {
    try {
      const guardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(guardados) ? guardados.filter(m =>
        m && (m.tipo === "ingreso" || m.tipo === "gasto") &&
        typeof m.valor === "number" && Number.isFinite(m.valor)
      ) : [];
    } catch (error) {
      return [];
    }
  }

  let movimientos = cargarMovimientos();
  let mostrarTodos = false;

  function guardarDatos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movimientos));
  }

  // Formato de miles mientras escribes.
  if (campoValor) {
    campoValor.addEventListener("input", () => {
      const digitos = campoValor.value.replace(/\D/g, "");
      campoValor.value = digitos
        ? Number(digitos).toLocaleString("en-US")
        : "";
    });
  }

  function obtenerTotales() {
    return movimientos.reduce((totales, movimiento) => {
      if (movimiento.tipo === "ingreso") {
        totales.ingresos += movimiento.valor;
      }

      if (movimiento.tipo === "gasto") {
        totales.gastos += movimiento.valor;
      }

      return totales;
    }, { ingresos: 0, gastos: 0 });
  }

  function actualizarResumen() {
    const { ingresos, gastos } = obtenerTotales();

    document.getElementById("totalIngresos").textContent =
      formatoCOP.format(ingresos);

    document.getElementById("totalGastos").textContent =
      formatoCOP.format(gastos);

    document.getElementById("saldo").textContent =
      formatoCOP.format(ingresos - gastos);

    actualizarCategorias(gastos);
  }

  // Resumen de gastos por categoría.
  function actualizarCategorias(totalGastos) {
    categorias.forEach(categoria => {

      const totalCategoria = movimientos
        .filter(m => m.tipo === "gasto" && m.categoria === categoria)
        .reduce((suma, m) => suma + m.valor, 0);

      const porcentaje = totalGastos > 0
        ? Math.round((totalCategoria / totalGastos) * 100)
        : 0;

      const valorEl = document.getElementById(`cat-${categoria}`);
      const barraEl = document.getElementById(`bar-${categoria}`);
      const porcentajeEl = document.getElementById(`pct-${categoria}`);

      if (valorEl) {
        valorEl.textContent = formatoCOP.format(totalCategoria);
      }

      if (barraEl) {
        barraEl.style.width = `${Math.min(porcentaje, 100)}%`;
      }

      if (porcentajeEl) {
        porcentajeEl.textContent = `${porcentaje}%`;
      }
    });
  }

  function crearCelda(texto, clase) {
    const td = document.createElement("td");

    if (clase) td.className = clase;

    td.textContent = texto;

    return td;
  }

  // Mostrar historial.
  function mostrarMovimientos() {
    if (!lista) return;

    lista.replaceChildren();

    const registros = mostrarTodos
      ? movimientos
      : movimientos.slice(-5).reverse();

    if (registros.length === 0) {

      const fila = document.createElement("tr");

      const celda = crearCelda(
        "Aún no tienes movimientos registrados.",
        "empty-state"
      );

      celda.colSpan = 6;

      fila.appendChild(celda);
      lista.appendChild(fila);

    } else {

      registros.forEach(movimiento => {

        const indiceReal = movimientos.indexOf(movimiento);

        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(movimiento.fecha || "—"));

        fila.appendChild(crearCelda(
          movimiento.descripcion || "Sin descripción"
        ));

        fila.appendChild(crearCelda(
          movimiento.categoria || "Otros"
        ));

        const tipo = document.createElement("td");

        const tipoSpan = document.createElement("span");

        tipoSpan.className = `type-badge ${movimiento.tipo}`;

        tipoSpan.textContent =
          movimiento.tipo === "ingreso"
            ? "⬇ Ingreso"
            : "⬆ Gasto";

        tipo.appendChild(tipoSpan);
        fila.appendChild(tipo);

        fila.appendChild(crearCelda(
          `${movimiento.tipo === "ingreso" ? "+" : "−"} ${formatoCOP.format(movimiento.valor)}`
        ));

        const acciones = document.createElement("td");

        const eliminar = document.createElement("button");

        eliminar.type = "button";
        eliminar.className = "delete-one";
        eliminar.textContent = "🗑️";

        eliminar.setAttribute(
          "aria-label",
          "Eliminar movimiento"
        );

        eliminar.addEventListener("click", () => {

          if (confirm("¿Deseas eliminar este movimiento?")) {

            movimientos.splice(indiceReal, 1);

            guardarDatos();
            actualizarResumen();
            mostrarMovimientos();

          }

        });

        acciones.appendChild(eliminar);
        fila.appendChild(acciones);

        lista.appendChild(fila);

      });

    }

    const contador = document.getElementById("contadorMovimientos");

    if (contador) {
      contador.textContent =
        `${movimientos.length} ${movimientos.length === 1 ? "movimiento" : "movimientos"}`;
    }

    if (botonVerTodos) {
      botonVerTodos.textContent =
        mostrarTodos ? "Ver menos ↑" : "Ver todos →";
    }
  }

  // Registrar movimiento.
  if (formulario) {

    formulario.addEventListener("submit", evento => {

      evento.preventDefault();

      const tipo =
        formulario.querySelector('input[name="tipo"]:checked')?.value
        || "ingreso";

      const descripcion =
        document.getElementById("descripcion").value.trim();

      const categoria =
        document.getElementById("categoria").value;

      // Eliminar las comas antes de convertir el valor.
      const valor = Number(
        campoValor.value.replace(/,/g, "")
      );

      if (
        !descripcion ||
        !Number.isSafeInteger(valor) ||
        valor <= 0
      ) {

        if (mensaje) {
          mensaje.textContent =
            "Escribe una descripción y un valor válido mayor que cero.";
        } else {
          alert("Escribe una descripción y un valor válido mayor que cero.");
        }

        return;
      }

      movimientos.push({
        tipo,
        descripcion,
        categoria,
        valor,
        fecha: new Date().toLocaleDateString("es-CO")
      });

      guardarDatos();

      actualizarResumen();
      mostrarMovimientos();

      formulario.reset();

      if (mensaje) {
        mensaje.textContent =
          "¡Movimiento registrado correctamente!";
      }

    });

  }

  // Eliminar todo el historial.
  if (botonEliminarTodo) {

    botonEliminarTodo.addEventListener("click", () => {

      if (movimientos.length === 0) {
        alert("No hay movimientos para eliminar.");
        return;
      }

      if (confirm(
        "¿Estás seguro de eliminar TODO el historial? Esta acción no se puede deshacer."
      )) {

        movimientos = [];

        guardarDatos();
        actualizarResumen();
        mostrarMovimientos();

        if (mensaje) {
          mensaje.textContent =
            "El historial se eliminó correctamente.";
        }

      }

    });

  }

  // Botón ver todos.
  if (botonVerTodos) {

    botonVerTodos.addEventListener("click", () => {

      mostrarTodos = !mostrarTodos;

      mostrarMovimientos();

      if (mostrarTodos) {
        document.getElementById("historial")
          .scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }

    });

  }

  // Cargar información al abrir la página.
  actualizarResumen();
  mostrarMovimientos();

})();
