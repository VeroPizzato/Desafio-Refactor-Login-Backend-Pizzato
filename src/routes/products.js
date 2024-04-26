const { Router } = require('express')
const { validarNuevoProducto, validarProductoExistente, validarProdActualizado } = require('../middlewares/product.middleware')

const router = Router()

router.get('/', async (req, res) => {
    try {      
        const ProductManager = req.app.get('ProductManager')  
        const products = await ProductManager.getProducts(req.query)
        const result = {            
            payload: products.totalDocs,
            totalPages: products.totalPages,
            prevPage: products.prevPage,
            nextPage: products.nextPage,
            page: products.page,
            hasPrevPage: products.hasPrevPage,
            hasNextPage: products.hasNextPage,  
            prevLink: products.hasPrevPage ? `/products?page=${products.prevPage}` : null,
            nextlink: products.hasNextPage ? `/products?page=${products.nextPage}` : null
        }

        let status = 'success'
        if (products.docs.length === 0) 
            status = 'error'
        let objResult = {
            status,
            ...result
        }

        // HTTP 200 OK
        return res.status(200).json(objResult)
    }
    catch (err) {        
        return res.status(500).json({
            message: err.message
        })
    }
})

router.get('/:pid', validarProductoExistente, async (req, res) => {    
    try {        
        const ProductManager = req.app.get('ProductManager')
        const prodId  = req.params.pid        
        const producto = await ProductManager.getProductById(prodId)
        if (!producto) {
             res.status(404).json({ error: "Id inexistente!" })  // HTTP 404 => el ID es válido, pero no se encontró ese producto
             return
        }
        res.status(200).json(producto)    // HTTP 200 OK
    } catch (err) {
        return res.status(500).json({
            message: err.message 
        })
    }
})

router.post('/', validarNuevoProducto, async (req, res) => {  
    const ProductManager = req.app.get('ProductManager')   
    const { title, description, price, thumbnail, code, stock, status, category } = req.body  
    await ProductManager.addProduct(title, description, price, thumbnail, code, stock, status, category)
    return res.status(201).json({ success: true })
})

router.put('/:pid', validarProductoExistente, validarProdActualizado, async (req, res) => {
    try {
        const ProductManager = req.app.get('ProductManager')
        const prodId = req.params.pid        
        const datosAUpdate = req.body
        // if (isNaN(prodId)){
        //     res.status(400).json({ error: "Invalid number format" })
        //     return
        // }
        const producto = await ProductManager.getProductById(prodId)
        if (!producto) {
            res.status(404).json({ error: "Id inexistente!" })  // HTTP 404 => el ID es válido, pero no se encontró ese producto
            return
        }
        const result = ProductManager.updateProduct(prodId, datosAUpdate)
        return res.status(200).json(result)
    } catch (err) {
        return res.status(400).json({
            message: err.message
        })
    }
})

router.delete('/:pid', validarProductoExistente, async (req, res) => {
    try {
        const ProductManager = req.app.get('ProductManager')
        const prodId = req.params.pid       
        const producto = await ProductManager.getProductById(prodId)
        if (!producto) {
            res.status(404).json({ error: "Id inexistente!" })  // HTTP 404 => el ID es válido, pero no se encontró ese producto
            return
        }
        await ProductManager.deleteProduct(prodId)
        res.status(200).json({ message: "Producto Eliminado correctamente" })    // HTTP 200 OK
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }
})

module.exports =  router 

