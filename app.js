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
//const lobby = [];
const rooms = {data:[]};
const mapping = {};
const users_colors = ["black","orange","lightblue","red","lightgreen","#232223","cyan","grey"];
const users_images = ["player-1.gif","player-1.gif","player-1.gif","player-1.gif","player-1.gif","player-1.gif","player-1.gif","player-1.gif"];
const words = ["bird","dog","cat","bat","lion","pencil","smile","sleep","fly","optopus","shoe","mask","punch","ice cream","fox","toilet","penquin","chicken","plane","winter","sun","mountain","fish","butter","baseball","soccer","swimming","pillow","jacket","window","cry","cloud","Statue of Liberty","Eiffel Tower","Table Tennis"];
io.on('connection', (socket) => {
  let socket_id = socket.id;
  socket.on("on-chat",message=>{
    let user = users[socket_id];
    let room_id = mapping[socket_id];
    let correct_word = "";
    rooms.data.forEach(room=>{
      if(room.id==room_id)
      {
        correct_word = room.word;
      }
    })
    if(message==correct_word)
    {
      io.to(room_id).emit('correct-answer',user);
    }
    else{
      io.to(room_id).emit('user-chat',{user_name:user.user_name,message});
    }
  })
  socket.on("new-user",async(data)=>{
    io.to(socket_id).emit('loading'); 
    let user_name = data.name;
    let message = `${user_name} has join lobby`;
    let flag = 0;
    let room_id = "";
    let lobby = [];
    let index = Object.keys(users).length;
    let user = {user_id:socket_id,user_name,color:users_colors[index],image:users_images[index],point:0};
    let start=false;
    rooms.data.forEach(room=>{
      if(room.lobby.length<9)
      {
        start = room.start;
        flag = 1;
        room_id = room.id;
        room.lobby.push(user);
        lobby=room.lobby;
        return;
      }
    })
    if(!flag)
    {
      room_id = randomId();
      lobby = [user];
      rooms.data.push({id:room_id,start:false,lobby});
    }
    lobby= userRank(lobby);
    socket.join(room_id);
    mapping[socket_id]=room_id;
    users[socket_id] = user;   
    io.to(socket_id).emit('enter'); 
    io.to(room_id).emit("join-lobby",{user,lobby});
    if(lobby.length>0)
    {
      let room_master = lobby[0];
      io.to(room_master.user_id).emit("get-canvas",socket_id);
    }
    // lobby.push(user); 
   

    // io.emit("join-lobby",{user,lobby});
    if(lobby.length>1&&!start)
    {
      start = true;
      let words_clone = [...words];
      let choose = [];
      for(let i = 1;i<=3 ;i++)
      {
        let word = words_clone[Math.floor(Math.random()*words_clone.length)];
        choose.push(word);
        words_clone.splice(words_clone.indexOf(word),1);
      }
      //io.emit("start-game");
      let user_draw = lobby[lobby.length-1];
      io.to(user_draw.user_id).emit("choose-word",choose);
      io.to(room_id).emit("wait-choose-word",user_draw.user_name);
    }
  })
  socket.on("choose-word",word=>{
    let room_id = mapping[socket_id];
    let space = [];
    for(let i =0;i<word.length;i++)
    {
      if(word[i]==" ")
      {
        space.push(i);
      }
    }
    rooms.data.forEach(room=>{
      if(room.id==room_id)
      {
        room.word= word;
        return;
      }
    })
    io.to(socket_id).emit("draw-word",word);
    socket.broadcast.to(room_id).emit("guess-word",{word_length:word.length,space});
  })

  socket.on("send-canvas",data=>{
    let {user_id,canvasUrl} = data;
    io.to(user_id).emit("receive-canvas",canvasUrl);
  })
  socket.on('drawing', (data) => {
    let room_id = mapping[socket_id];
    socket.broadcast.to(room_id).emit('drawing', data);
  });

  socket.on("disconnect",function(socket){
    let user = users[socket_id];
    let room_id = mapping[socket_id];
    delete mapping[socket_id];
    rooms.data.forEach(room=>{
      if(room.id==room_id)
      {
        room.lobby.splice(room.lobby.indexOf(user),1);
        return;
      }
    })
    delete users[socket_id];
    //io.emit("disconnected",`${user.user_name} has left the room`);
     io.to(room_id).emit("disconnected",socket_id);
  })
});

function userRank(lobby){
  let rank = 1;
  let lobby2 = [...lobby];
  while(lobby2.length>0)
  {
    let rank_arr = [];
    let max = 0;
    lobby2.forEach(user=>{
      if(user.point>max)
      {
        max = user.point;
        rank_arr=[user];
      }
      else if(user.point==max)
      {
        rank_arr.push(user);
      }
    })
    rank_arr.forEach(user=>{
      let index1 = lobby.indexOf(user);
      let index2 = lobby2.indexOf(user);
      lobby[index1].rank=rank;
      lobby2.splice(index2,1);
    })
    rank++;
  }
  return lobby;
}

function randomId(){
  return Math.random().toString(36).substr(2, 5);
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}


const PORT = process.env.PORT || 8797;

server.listen(PORT,()=>{
    console.log(`server listen in port ${PORT}`);
})

module.exports = app;
