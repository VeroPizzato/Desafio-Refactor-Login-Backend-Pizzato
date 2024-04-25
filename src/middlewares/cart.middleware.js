module.exports = {
    // Middleware para validacion de datos al agregar un carrito 
    validarNuevoCarrito: async (req, res, next) => {
        const ProductManager = req.app.get('ProductManager')
        const { products } = req.body
        products.forEach(async producto => {
            const prod = await ProductManager.getProductById(producto._id)
            if (!prod) {
                res.status(400).json({ error: "Producto con ID:" + producto._id + " not Found" })
                return
            }
            if (isNaN(producto.quantity) || (!ProductManager.soloNumPositivos(producto.quantity))) {
                res.status(400).json({ error: "Invalid quantity format" })
                return
            }
        })
        next()
    },

    // Middleware para validacion de carrito existente 
    validarCarritoExistente: async (req, res, next) => {
        const CartManager = req.app.get('CartManager')
        let cId = req.params.cid
        // if (isNaN(cId)) {
        //     res.status(400).json({ error: "Invalid number format" })
        //     return
        // }
        const cart = await CartManager.getCartByCId(cId)
        if (!cart) {
            res.status(400).json({ error: "Carrito con ID:" + cId + " not Found" })
            return
        }

        next()
    }
    
}