const mongoose = require('mongoose')

const chatCollection = 'messages';

const chatSchema = new mongoose.Schema({
    user: String,
    text: String,
});

module.exports = mongoose.model(chatCollection, chatSchema);


