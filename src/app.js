const express = require('express')
// const handlebars = require('express-handlebars')
const handlebarsExpress = require('express-handlebars')
const viewsRouter = require('./routes/views')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const sessionRouter = require('./routes/session')

const cartsRouter = require('./routes/carts')
// const { router: productsRouter, productsManager } = require('./routes/products')
const { router: productsRouter } = require('./routes/products')

const chatModel = require('./dao/models/chat')

const FilesProductManager = require('./dao/fileManagers/ProductManager')
const DbProductManager = require('./dao/dbManagers/ProductManager')

const FilesCartManager = require('./dao/fileManagers/CartManager')
const DbCartManager = require('./dao/dbManagers/CartManager')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(`${__dirname}/../public`))

// configuramos handlebars 
const handlebars = handlebarsExpress.create({
    defaultLayout: "main",
    handlebars: require("handlebars"),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true
    }
})
app.engine("handlebars", handlebars.engine)
app.set("views" , `${__dirname}/views`)
app.set("view engine", "handlebars")

app.use('/products/detail', express.static(`${__dirname}/../public`));  // para encontrar la carpeta public
app.use('/carts', express.static(`${__dirname}/../public`));

app.use(session({
    store: MongoStore.create({
        dbName: 'ecommerce',
        mongoUrl: 'mongodb+srv://verizzato:Mavepi76@codercluster.wmmycws.mongodb.net/?retryWrites=true&w=majority&appName=CoderCluster', 
        ttl: 60
    }),
    secret: 'secretCoder',
    resave: true,
    saveUninitialized: true
}));

app.use('/api/products', productsRouter)
app.use('/api/carts', cartsRouter)
app.use('/', viewsRouter)
app.use('/session', sessionRouter)

const main = async () => {

    await mongoose.connect('mongodb+srv://verizzato:Mavepi76@codercluster.wmmycws.mongodb.net/?retryWrites=true&w=majority&appName=CoderCluster',
        {
            dbName: 'ecommerce'
        })

    const ProductManager = new DbProductManager()
    await ProductManager.inicialize()
    app.set('ProductManager', ProductManager)

    const CartManager = new DbCartManager()
    await CartManager.inicialize()
    app.set('CartManager', CartManager)
    
    // const filenameProd = `${__dirname}/../productos.json`    
    // const ProductManager = new FilesProductManager(filenameProd)
    // await ProductManager.inicialize()
    // app.set('ProductManager', ProductManager)

    // const filenameCart = `${__dirname}/../carrito.json`  
    // const CartManager = new FilesCartManager(filenameCart)
    // await CartManager.inicialize()
    // app.set('CartManager', CartManager)

    const httpServer = app.listen(8080, () => {
        console.log('Servidor listo!!')
    })

    // creando un servidor para ws
    const io = new Server(httpServer)
    app.set('ws', io)

    let messagesHistory = []

    io.on('connection', (clientSocket) => {
        console.log(`Cliente conectado con id: ${clientSocket.id}`)

        // enviar todos los mensajes hasta ese momento
        for (const data of messagesHistory) {
            clientSocket.emit('message', data)
        }

        clientSocket.on('message', async data => {
            messagesHistory.push(data)

            try {
                const { user, text } = data
                const chatMessage = new chatModel({
                    user,
                    text
                })

                // Se persiste en Mongo
                const result = await chatMessage.save()

                console.log(`Mensaje de ${user} persistido en la base de datos.`)
            } catch (error) {
                console.error('Error al persistir el mensaje:', error)
            }

            io.emit('message', data)
        })

        clientSocket.on('authenticated', data => {
            clientSocket.broadcast.emit('newUserConnected', data)  // notificar a los otros usuarios que se conecto
        })

        // Escucho el evento 'deleteProduct' emitido por el cliente
        clientSocket.on('deleteProduct', async (productId) => {
            try {             
                await ProductManager.deleteProduct(productId);
                // Emitir evento 'productDeleted' a los clientes
                io.emit('productDeleted', productId);
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        })

    })
}


main()