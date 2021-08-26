const express = require("express");
const router = express.Router();
const RoomController = require("../controllers/RoomController.js");

router.get("/", (req,res)=>{
	res.render("pages/home/index");
});


router.get("/room", RoomController.listRoom);

module.exports = router;