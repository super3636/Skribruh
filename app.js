const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const router = require("./routes/route");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Room = require("./services/room");
const {isEmpty} = require("lodash");
require("dotenv").config();

const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const db = mongoose.connection;

dotenv.config()

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() =>{});
db.on('error', (err) => {
    console.log('DB connection error:', err.message);
})



app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.static("public"));
//app.use("/", router);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


const users = {};
io.on('connection', (socket) => {
  let socket_id = socket.id;
  socket.on("on-chat",message=>{
    let user = users[socket_id];
    io.emit('user-chat',{user_name:user.user_name,message});
  })
  socket.on("new-user",async(data)=>{
    io.to(socket_id).emit('loading'); 
    let user_name = data.name;
    let message = `${user_name} has join lobby`;
    users[socket_id] = {user_id:socket_id,user_name};    
    io.to(socket_id).emit('enter'); 
    io.emit("join-lobby",message);

    // let result = await Room.getRoomId();
    // if(isEmpty(result))
    // {
    //     let result2 = await Room.createNewRoom();
    //     let room_id = result2._id;
    //     socket.join(room_id);
    //     io.emit('join-room',room_id); 
    // }
    // else{
    //     let room_id = result[0]._id;
    //     io.emit('join-room',room_id); 
    // }
  })
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  socket.on("disconnect",function(socket){
    let user = users[socket_id];
    delete users[socket_id];
    //io.emit("disconnected",`${user.user_name} has left the room`);
     io.emit("disconnected",`has left the room`);
  })

});


const PORT = process.env.PORT || 8797;

server.listen(PORT,()=>{
    console.log(`server listen in port ${PORT}`);
})

module.exports = app;
