const botonEliminarTodo = document.getElementById("eliminarTodo");

botonEliminarTodo.addEventListener("click", function() {

    if (movimientos.length === 0) {
        alert("No tienes movimientos para eliminar.");
        return;
    }

    const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar TODOS tus movimientos? Esta acción no se puede deshacer."
    );

    if (confirmar) {
        movimientos = [];

        guardarDatos();
        actualizarResumen();
        mostrarMovimientos();

        alert("Todos los movimientos fueron eliminados.");
    }

});
