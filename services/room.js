const Room = require('../models/Room');

const getRoomId = function(){
	return new Promise((res,rej)=>{
		Room.find({full:false}).limit(1).then((result) => {
    		res(result);
    	}).catch((err)=>{
        	throw(err);
    	})
	})
}

const createNewRoom = function(){
	return new Promise((res,rej)=>{
		const room = new Room({
			title:"new room",
			full:false
		})
		room.save().then((result)=>{
        	res(result);
    	}).catch((error)=>{
        	throw(err)
    	})
	})
}



module.exports = {getRoomId,createNewRoom};