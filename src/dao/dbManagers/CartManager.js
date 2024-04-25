const CartModel = require('../models/cart')

class CartManager {

    static #ultimoIdCart = 1

    constructor() { }

    inicialize = async () => {
        // No hacer nada
        // Podríamos chequear que la conexión existe y está funcionando
        if (CartModel.db.readyState !== 1) {
            throw new Error('must connect to mongodb!')
        }
        else {
            const carts = await this.getCarts()
            CartManager.#ultimoIdCart = this.#getNuevoIdInicio(carts)
        }
    }

    #getNuevoIdInicio = (carts) => {
        let mayorID = 1
        carts.forEach(item => {
            if (mayorID <= item.id)
                mayorID = item.id
        });
        mayorID = mayorID + 1
        return mayorID
    }

    getCarts = async () => {
        try {
            const carts = await CartModel.find()
            return carts.map(d => d.toObject({ virtuals: true }))
        }
        catch (err) {
            return []
        }
    }

    #getNuevoId() {
        const id = CartManager.#ultimoIdCart
        CartManager.#ultimoIdCart++
        return id
    }

    getCartByCId = async (cid) => {
        const cart = await CartModel.findOne({ _id: cid }).populate('products._id')
        if (cart){
            // console.log(JSON.stringify(cart, null, 4));
            return cart
        }
        else {
            console.error(`Carrito con ID: ${cid} Not Found`)
            return
        }
    }

    addCart = async (products) => {
        let nuevoCarrito = await CartModel.create({
            id: this.#getNuevoId(),
            products
        })       
    }

    addProductToCart = async (cid, pid, quantity) => {             
        const cart = await this.getCartByCId(cid)      
        const listadoProducts = cart.products;       
        const codeProduIndex = listadoProducts.findIndex(elem => elem._id._id.toString() === pid);        
        if (codeProduIndex === -1) {
            let productoNuevo = {
                _id: pid,
                quantity: quantity
            }
            listadoProducts.push(productoNuevo);
        } else {
            listadoProducts[codeProduIndex].quantity += quantity;
        }
        await CartModel.updateOne({ _id: cid }, cart)
    }

    updateCartProducts = async (cid, products) => {
        //obtengo el carrito
        const cart = await this.getCartByCId(cid)
        cart.products = products
        await CartModel.updateOne({ _id: cid }, cart)
    }

    deleteCart = async (cid) => {
        await CartModel.deleteOne({ _id: cid });
    }  

    clearCart = async (cid) => {
        //obtengo el carrito
        const cart = await this.getCartByCId(cid)
        cart.products = []
        await CartModel.updateOne({ _id: cid }, cart)
    }

    deleteProductCart = async (cid, pid) => {
        //obtengo el carrito
        const cart = await this.getCartByCId(cid)
        //obtengo los productos del carrito        
        const productsFromCart = cart.products
        const productIndex = productsFromCart.findIndex(item => item._id.toString() === pid)
        if (productIndex != -1) {
            //existe el producto en el carrito, puedo eliminarlo
            productsFromCart.splice(productIndex, 1)
            await CartModel.updateOne({ _id: cid }, cart)
            return true
        }
        else {
            // no existe el producto en el carito
            return false
        }
    }
}

module.exports = CartManager