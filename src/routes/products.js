const { Router } = require('express')

const router = Router()

// Middleware para validacion de datos al agregar un producto 
async function validarNuevoProducto(req, res, next) {
    const ProductManager = req.app.get('ProductManager')
    const product = req.body
    product.price = +product.price
    product.stock = +product.stock
    product.thumbnail = [product.thumbnail]
    var boolStatus = JSON.parse(product.status)

    if (!product.title || !product.description || !product.price || !product.code || !product.stock || !product.category) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios, salvo la ruta de la imagen' })
    }
    if (isNaN(product.price) || isNaN(product.stock)) {
        res.status(400).json({ error: "Invalid number format" })
        return
    }
    if (!ProductManager.soloNumPositivos(product.price)) {
        res.status(400).json({ error: "Precio negativo" })
        return
    }
    if (!ProductManager.soloNumPositivosYcero(product.stock)) {
        res.status(400).json({ error: "Stock negativo" })
        return
    }
    if (!Array.isArray(product.thumbnail)) {
        res.status(400).json({ error: "El campo thumbnail es invalido." })
        return
    }
    else {
        let rutasValidas = true
        product.thumbnail.forEach(ruta => {
            if (typeof ruta != "string") {
                rutasValidas = false
                return
            }
        })
        if (!rutasValidas) {
            res.status(400).json({ error: "El campo thumbnail es invalido." })
            return
        }
    }
    const listadoProductos = await ProductManager.getProducts(req.query)   
    const codeIndex = listadoProductos.docs.findIndex(e => e.code === product.code)  
    if (codeIndex !== -1) {
        res.status(400).json({ error: "Codigo ya existente" })
        return
    }
    if (!ProductManager.soloNumYletras(product.code)) {
        res.status(400).json({ error: "El campo codigo identificador es invalido." })
        return
    }
    if (typeof boolStatus != "boolean") {
        res.status(400).json({ error: "El campo status es invalido." })
        return
    }
    next()
}

// Middleware para validacion de datos al actualizar un producto 
// Si algun dato es vacio no se actualiza
async function validarProdActualizado(req, res, next) {
    const ProductManager = req.app.get('ProductManager')
    const { title, description, price, thumbnail, code, stock, status, category } = req.body
    let idProd = req.params.pid

    const listadoProductos = await ProductManager.getProducts(req.query)
    const codeIndex = listadoProductos.docs.findIndex(e => e._id.toString() === idProd)
    if (codeIndex === -1) {
        res.status(400).json({ error: "Producto con ID:" + idProd + " not Found" })
        return
    }
    else {
        if (price !== '') {
            if (isNaN(price)) {
                res.status(400).json({ error: "Error. El campo precio es invalido." })
                return
            }
            if (!ProductManager.soloNumPositivos(price)) {
                res.status(400).json({ error: "Precio negativo" })
                return
            }
        }
        if (stock !== '') {
            if (isNaN(stock)) {
                res.status(400).json({ error: "El campo stock es invalido." })
                return
            }
            if (!ProductManager.soloNumPositivosYcero(stock)) {
                res.status(400).json({ error: "Precio negativo" })
                return
            }
        }
        if (!Array.isArray(thumbnail)) {
            res.status(400).json({ error: "El campo thumbnail es invalido." })
            return
        }
        else {
            let rutasValidas = true
            thumbnail.forEach(ruta => {
                if (typeof ruta != "string") {
                    rutasValidas = false
                    return
                }
            })
            if (!rutasValidas) {
                res.status(400).json({ error: "El campo thumbnail es invalido." })
                return
            }
        }
        if (code !== '') {
            if (!ProductManager.soloNumYletras(code)) {
                res.status(400).json({ error: "El campo codigo identificador es invalido." })
                return
            }
        }
        if (typeof status != "boolean") {
            res.status(400).json({ error: "El campo status es invalido." })
            return
        }
    }
    next()
}

// Middleware para validacion de datos de un producto 
async function validarProducto(req, res, next) {
    const ProductManager = req.app.get('ProductManager')    
    let prodId = req.params.pid
    // if (isNaN(prodId)) {
    //     res.status(400).json({ error: "Formato invalido." })
    //     return
    // }
    const producto = await ProductManager.getProductById(prodId)
    if (!producto) {
        res.status(404).json({ error: "Id inexistente!" })  // HTTP 404 => el ID es válido, pero no se encontró ese producto
        return
    }
    next()
}

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

router.get('/:pid', validarProducto, async (req, res) => {    
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

router.put('/:pid', validarProducto, validarProdActualizado, async (req, res) => {
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

router.delete('/:pid', validarProducto, async (req, res) => {
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

module.exports = { router, validarNuevoProducto }

