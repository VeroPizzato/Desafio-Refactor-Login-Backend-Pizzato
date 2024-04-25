document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("btn-addCart")
    btn.addEventListener("click", function () {
        // Muestro mensaje alerta que se agrego producto al carrito
        Swal.fire({
            icon: "success",
            title: 'Compra confirmada',
            text: 'Producto agregado al carrito exitosamente!',
            timer: 5000 
        })
    })
})
