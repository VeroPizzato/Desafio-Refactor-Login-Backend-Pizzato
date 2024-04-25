const fs = require('fs')

class ProductManager {

    #products
    static #ultimoIdProducto = 1

    constructor(pathname) {
        this.#products = []
        this.path = pathname
    }

    async #readProducts() {
        try {
            const fileProducts = await fs.promises.readFile(this.path, 'utf-8')
            this.#products = JSON.parse(fileProducts)

        }
        catch (err) {
            return []
        }
    }

    inicialize = async () => {
        this.#products = await this.getProducts()
        ProductManager.#ultimoIdProducto = this.#getNuevoIdInicio()
    }

    #getNuevoIdInicio = () => {
        let mayorID = 1
        this.#products.forEach(item => {
            if (mayorID <= item.id)
                mayorID = item.id
        });
        mayorID = mayorID + 1
        return mayorID
    }

    getProducts = async () => {
        try {
            await this.#readProducts()
            return this.#products
        }
        catch (err) {
            return []
        }
    }

    getProductById = (id) => {
        const codeIndex = this.#products.findIndex(e => e.id === id)
        if (codeIndex === -1) {
            console.error(`Producto con ID: ${id} Not Found`)
            return
        } else {
            return this.#products[codeIndex]
        }
    }

    #getNuevoId() {
        const id = ProductManager.#ultimoIdProducto
        ProductManager.#ultimoIdProducto++
        return id
    }

    soloNumYletras = (code) => {
        return (/^[a-z A-Z 0-9]+$/.test(code))
    }

    soloNumPositivos = (code) => {
        return (/^[0-9]+$/.test(code) && (code > 0))
    }

    soloNumPositivosYcero = (code) => {
        return (/^[0-9]+$/.test(code) && (code >= 0))
    }

    addProduct = async (title, description, price, thumbnail, code, stock, status, category) => {
        const product = {
            id: this.#getNuevoId(),
            title,
            description,
            price,
            thumbnail,
            code,
            stock,
            status,
            category
        }

        this.#products.push(product)

        await this.#updateProducts()
    }

    async #updateProducts() {
        const fileProducts = JSON.stringify(this.#products, null, '\t')
        await fs.promises.writeFile(this.path, fileProducts)
    }

    updateProduct = async (prodId, producto) => {
        const productIndex = this.#products.findIndex(e => e.id === prodId)
        const newProduct = { ...this.#products[productIndex], ...producto, id: prodId }
        this.#products[productIndex] = newProduct

        await this.#updateProducts()
    }

    deleteProduct = async (idProd) => {
        const product = this.#products.find(item => item.id === idProd)
        if (product) {
            this.#products = this.#products.filter(item => item.id !== idProd)
            await this.#updateProducts()
        }
        else {
            console.error(`Producto con ID: ${idProd} Not Found`)
            return
        }
    }
}

module.exports = ProductManager;