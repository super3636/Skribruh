const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomSchema = new Schema({
	title:{type: String, required: true}
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;