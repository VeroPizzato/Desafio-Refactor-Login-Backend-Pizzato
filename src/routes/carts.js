const { Router } = require('express')

const router = Router()

// // Middleware para validacion de datos al agregar un carrito 
async function validarNuevoCarrito(req, res, next) {
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
}

// Middleware para validacion de carrito existente 
async function ValidarCarritoExistente(req, res, next) {
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

// Middleware para validacion de producto existente 
async function ValidarProductoExistente(req, res, next) {
    const ProductManager = req.app.get('ProductManager')
    let pId = req.params.pid
    const prod = await ProductManager.getProductById(pId)
    if (!prod) {
        res.status(400).json({ error: "Producto con ID:" + pId + " not Found" })
        return
    }

    next()
}

router.get('/', async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        const carts = await CartManager.getCarts()
        res.status(200).json(carts)  // HTTP 200 OK
        return
    }
    catch (err) {
        return res.status(400).json({
            message: err.message
        })
    }
})

router.get('/:cid', ValidarCarritoExistente, async (req, res) => {
    const CartManager = req.app.get('CartManager')
    let cidCart = req.params.cid
    let cartByCID = await CartManager.getCartByCId(cidCart)
    if (!cartByCID) {
        res.status(404).json({ error: "Id inexistente!" })  // HTTP 404 => el ID es válido, pero no se encontró ese carrito
        return
    }
    res.status(200).json(cartByCID)    // HTTP 200 OK
})


router.post('/', validarNuevoCarrito, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        let { products } = req.body
        await CartManager.addCart(products)
        res.status(201).json({ message: "Carrito agregado correctamente" })  // HTTP 201 OK      

    } catch (err) {
        return res.status(400).json({
            message: err.message
        })
    }
})

router.post('/:cid/products/:pid', ValidarCarritoExistente, ValidarProductoExistente, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        let idCart = req.params.cid;
        let idProd = req.params.pid;
        let quantity = 1;

        await CartManager.addProductToCart(idCart, idProd, quantity);

        res.status(200).json(`Se agregaron ${quantity} producto/s con ID ${idProd} al carrito con ID ${idCart}`)    // HTTP 200 OK
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
})

router.put('/:cid', ValidarCarritoExistente, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        let cartId = req.params.cid;
        const { products } = req.body;

        await CartManager.updateCartProducts(cartId, products);

        // HTTP 200 OK 
        res.status(200).json(`Los productos del carrito con ID ${cartId} se actualizaron exitosamente.`)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.put('/:cid/products/:pid', ValidarCarritoExistente, ValidarProductoExistente, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        let cartId = req.params.cid;
        let prodId = req.params.pid;
        const quantity = +req.body.quantity;        

        const result = await CartManager.addProductToCart(cartId, prodId, quantity);

        if (result)
            // HTTP 200 OK 
            res.status(200).json(`Se agregaron ${quantity} producto/s con ID ${prodId} al carrito con ID ${cartId}.`)
        else {
            //HTTP 400 
            res.status(400).json({ error: "Sintaxis incorrecta!" })
        }        
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.delete('/:cid', ValidarCarritoExistente, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        let cartId = req.params.cid;
        await CartManager.deleteCart(cid)
        res.status(200).json({ message: "Carrito eliminado correctamente" })  // HTTP 200 OK     
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
})

router.delete('/:cid/products/:pid', ValidarCarritoExistente, ValidarProductoExistente, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        let cartId = req.params.cid;
        let prodId = req.params.pid;

        const result = await CartManager.deleteProductCart(cartId, prodId);

        if (result)
            // HTTP 200 OK 
            res.status(200).json(`Se eliminó el producto con ID ${prodId} del carrito con ID ${cartId}.`)
        else {
            // HTTP 400 
            res.status(400).json({ error: "Sintaxis incorrecta!" })
        }
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

module.exports = router