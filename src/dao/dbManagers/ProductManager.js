const ProductModel = require('../models/products')

class ProductManager {

    static #ultimoIdProducto = 1

    constructor() { }

    inicialize = async () => {
        // No hacer nada
        // Podríamos chequear que la conexión existe y está funcionando
        if (ProductModel.db.readyState !== 1) {
            throw new Error('must connect to mongodb!')
        }
        else {
            const products = await this.getProducts({})
            ProductManager.#ultimoIdProducto = this.#getNuevoIdInicio(products.docs)
        }
    }

    #getNuevoIdInicio = (products) => {
        let mayorID = 1
        products.forEach(item => {
            if (mayorID <= item.id)
                mayorID = item.id
        });
        mayorID = mayorID + 1
        return mayorID
    }

    getProducts = async (filters) => {
        try {
            let filteredProducts = await ProductModel.find()

            if (JSON.stringify(filters) === '{}') {  // vienen vacios los filtros            
                filteredProducts = await ProductModel.paginate({}, { limit: filteredProducts.length })
                return filteredProducts
            }

            // busqueda general, sin filtros, solo esta avanzando o retrocediendo por las paginas
            let { page, ...restOfFilters } = filters

            if (page && JSON.stringify(restOfFilters) === '{}') {
                filteredProducts = await ProductModel.paginate({}, { page: page, lean: true })
                // return filteredProducts.docs.map(d => d.toObject({ virtuals: true }))
                return filteredProducts
            }
           
            if (!page) page = 1
            const { limit, category, availability, sort } = { limit: 10, page: page, availability: 1, sort: 'asc', ...filters }
         
            if (availability == 1) {
                if (category)
                    filteredProducts = await ProductModel.paginate({ category: category, stock: { $gt: 0 } }, { limit: limit, page: page, sort: { price: sort }, lean: true })
                else
                    filteredProducts = await ProductModel.paginate({ stock: { $gt: 0 } }, { limit: limit, page: page, sort: { price: sort }, lean: true })
            }
            else {
                if (category)
                    filteredProducts = await ProductModel.paginate({ category: category, stock: 0 }, { limit: limit, page: page, sort: { price: sort }, lean: true })
                else
                    filteredProducts = await ProductModel.paginate({ stock: 0 }, { limit: limit, page: page, sort: { price: sort }, lean: true })
            }

            return filteredProducts
            // return filteredProducts.map(d => d.toObject({ virtuals: true }))
        }
        catch (err) {
            return []
        }
    }

    getProductById = async (idProd) => {
        const producto = await ProductModel.findOne({ _id: idProd })
        if (producto)
            return producto
        else {
            console.error(`Producto con ID: ${idProd} Not Found`)
            return
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
        let product = await ProductModel.create({
            id: this.#getNuevoId(),
            title,
            description,
            price,
            thumbnail,
            code,
            stock,
            status,
            category
        })
    }

    updateProduct = async (prodId, producto) => {
        await ProductModel.updateOne({ _id: prodId }, producto)
    }

    deleteProduct = async (idProd) => {
        await ProductModel.deleteOne({ _id: idProd })
    }
}

module.exports = ProductManager