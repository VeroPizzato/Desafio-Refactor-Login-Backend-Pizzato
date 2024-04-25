const { Router } = require('express')
const { validarNuevoCarrito, validarCarritoExistente } = require('../middlewares/cart.middleware')
const { validarProductoExistente } = require('../middlewares/product.middleware')

const router = Router()

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

router.get('/:cid', validarCarritoExistente, async (req, res) => {
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

router.post('/:cid/products/:pid', validarCarritoExistente, validarProductoExistente, async (req, res) => {
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

router.put('/:cid', validarCarritoExistente, async (req, res) => {
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

router.put('/:cid/products/:pid', validarCarritoExistente, validarProductoExistente, async (req, res) => {
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

router.delete('/:cid', validarCarritoExistente, async (req, res) => {
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

router.delete('/:cid/products/:pid', validarCarritoExistente, validarProductoExistente, async (req, res) => {
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