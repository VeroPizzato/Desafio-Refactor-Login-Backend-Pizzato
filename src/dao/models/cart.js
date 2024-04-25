const mongoose = require('mongoose')

const cartCollection = 'carts';

const cartSchema = new mongoose.Schema({
    id: {
        type: Number,
        require: true,
        unique: true
    },
    products: {
        type: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    require: true,
                    ref: 'Product'
                },
                quantity: {
                    type: Number,
                    require: true,
                    default: 0
                },
            }
        ],
        default: []
    }
});

module.exports = mongoose.model('Cart', cartSchema, cartCollection);