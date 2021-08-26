const Room = require('../models/Room');

const listRoom = function(req, res){
    Room.find().then((result) => {
    	console.log(result);
        res.json({rooms: result})
    }).catch((err)=>{
        console.log(err);
    })
}



module.exports = {listRoom};