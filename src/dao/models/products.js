const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const productCollection = 'products';

const productSchema = new mongoose.Schema({   
    id: {
       type: Number,
       required: true,
       unique: true
    }, 
    title: {
        type: String,
        required: true,
    },     
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },     
    thumbnail: Array,
    code: {
        type: String,
        unique: true
    },
    stock: {
        type: Number,
        required: true,
    },     
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    category: {
        type: String,
        required: true,
    }
});
productSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Product', productSchema, productCollection);
