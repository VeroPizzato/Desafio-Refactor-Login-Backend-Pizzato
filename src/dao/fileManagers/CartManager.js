const fs = require('fs')

class CartManager {

    #carts
    static #ultimoIdCart = 1

    constructor(pathname) {
        this.#carts = []
        this.path = pathname
    }

    async #readCarts() {
        try {
            const fileCarts = await fs.promises.readFile(this.path, 'utf-8')
            this.#carts = JSON.parse(fileCarts)
        }
        catch (err) {
            return []
        }
    }

    inicialize = async () => {
        this.#carts = await this.getCarts()
        CartManager.#ultimoIdCart = this.#getNuevoIdInicio()
    }

    #getNuevoIdInicio = () => {
        let mayorID = 1
        this.#carts.forEach(item => {
            if (mayorID <= item.id)
                mayorID = item.id
        });
        mayorID = mayorID + 1
        return mayorID
    }

    getCarts = async () => {
        try {
            await this.#readCarts()
            return this.#carts
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

    async #updateCarts() {
        const fileCarts = JSON.stringify(this.#carts, null, '\t')
        await fs.promises.writeFile(this.path, fileCarts)
    }

    addCart = async (products) => {
        const carrito = {
            id: this.#getNuevoId(),
            products
        }

        this.#carts.push(carrito)

        await this.#updateCarts()
    }

    getCartByCId = async (cid) => {
        const codeIndex = this.#carts.findIndex(e => e.id === cid)
        if (codeIndex === -1) {
            console.error(`Carrito con ID: ${cid} Not Found`)
            return
        } else {
            return this.#carts[codeIndex]
        }
    }

    addProductToCart = async (cid, pid, quantity) => {
        let listadoProducts = [];
        const codeIndex = this.#carts.findIndex(e => e.id === cid);
        listadoProducts = this.#carts[codeIndex].products;
        const codeProduIndex = listadoProducts.findIndex(e => e.id === pid);
        if (codeProduIndex === -1) {
            let productoNuevo = {
                id: pid,
                quantity: quantity
            }
            listadoProducts.push(productoNuevo);
        } else {
            listadoProducts[codeProduIndex].quantity += quantity;
        }
        await this.#updateCarts()
    }
}   

module.exports = CartManager;