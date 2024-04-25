const { Router } = require('express')
const router = Router()
const { validarNuevoProducto } = require('./products')
const User = require('../dao/models/user')
const { userIsLoggedIn, userIsNotLoggedIn, userIsAdmin }= require('../middlewares/auth.middleware')

router.get('/', (req, res) => {
    const isLoggedIn = ![null, undefined].includes(req.session.user)

    res.render('index', {
        title: 'Inicio',
        isLoggedIn,
        isNotLoggedIn: !isLoggedIn,
    })
})

router.get('/login', userIsNotLoggedIn,  (_, res) => {
    // middleware userIsNotLoggedIn: sólo se puede acceder si no está logueado
    res.render('login', {
        title: 'Login'
    })
})

router.get('/register', userIsNotLoggedIn, (_, res) => {
    // middleware userIsNotLoggedIn: sólo se puede acceder si no está logueado
    res.render('register', {
        title: 'Register'
    })
})

router.get('/products', userIsLoggedIn, async (req, res) => {
    try {
        const ProductManager = req.app.get('ProductManager')
        let products = await ProductManager.getProducts(req.query)
        let user = req.session.user     

        res.render('home', {
            title: 'Home',
            styles: ['styles.css'],
            products, 
            user
        })
    } catch (error) {
        console.error('Error al al cargar los productos:', error)
    }
})

router.get('/products/detail/:pid', userIsLoggedIn, async (req, res) => {
    try {
        const ProductManager = req.app.get('ProductManager')

        const prodId = req.params.pid
        const product = await ProductManager.getProductById(prodId)

        let data = {
            title: 'Product Detail',
            scripts: ['productoDetail.js'],
            useSweetAlert: true,
            styles: ['productos.css'],
            useWS: false,
            product
        }

        res.render('detailProduct', data)
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.get('/products/addCart/:pid', userIsLoggedIn,  async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')        
        const prodId = req.params.pid        
        //agrego una unidad del producto al primer carrito que siempre existe
        const carts = await CartManager.getCarts()
        // console.log(JSON.stringify(carts, null, '\t'))    
        await CartManager.addProductToCart(carts[0]._id.toString(), prodId, 1); 
        //res.redirect(`/products/detail/${prodId}`)  
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.get('/carts/:cid', userIsLoggedIn, async (req, res) => {
    try {
        const CartManager = req.app.get('CartManager')
        const cartId = req.params.cid
        const cart = await CartManager.getCartByCId(cartId)             

        let data = {
            title: 'Cart Detail',          
            styles: ['styles.css'],
            useWS: false,
            cart
        }
        
        res.render('detailCart', data)        
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

router.get('/realtimeproducts', userIsLoggedIn, userIsAdmin, async (req, res) => {
    try {
        const ProductManager = req.app.get('ProductManager')
        const products = await ProductManager.getProducts(req.query)
        res.render('realTimeProducts', {
            title: 'Productos en tiempo real',
            styles: ['styles.css'],
            products,
            useWS: true,
            scripts: [
                'realTimeProducts.js'
            ]
        })
    } catch (error) {
        console.error('Error al al cargar los productos en tiempo real:', error)
    }
})

router.post('/realtimeproducts', validarNuevoProducto, userIsLoggedIn, userIsAdmin, async (req, res) => {
    try {
        const ProductManager = req.app.get('ProductManager')
        const product = req.body
        // Agregar el producto en el ProductManager
        // Convertir el valor status "true" o "false" a booleano        
        var boolStatus = JSON.parse(product.status)
        product.thumbnail = ["/images/" + product.thumbnail]
        product.price = +product.price
        product.stock = +product.stock
        await ProductManager.addProduct(
            product.title,
            product.description,
            +product.price,
            product.thumbnail,
            product.code,
            +product.stock,
            boolStatus,
            product.category)
        // Notificar a los clientes mediante WS que se agrego un producto nuevo             
        req.app.get('ws').emit('newProduct', product)
        res.redirect('/realtimeproducts')
        // res.status(201).json({ message: "Producto agregado correctamente" })
    } catch (error) {
        console.error('Error al agregar el producto:', error)
    }
})

router.get('/newProduct', userIsLoggedIn, userIsAdmin, async (_, res) => {
    res.render('newProduct', {
        title: 'Nuevo Producto',
    })
})

router.get('/chat', (_, res) => {
    res.render('chat', {
        title: 'Aplicación de chat',
        useWS: true,
        useSweetAlert: true,
        scripts: [
            'chat.js'
        ]
    })
})


module.exports = router