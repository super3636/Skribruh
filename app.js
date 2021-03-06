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

// mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() =>{});
// db.on('error', (err) => {
//     console.log('DB connection error:', err.message);
// })

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.static("public"));
//app.use("/", router);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


//const lobby = [];
const rooms = {};
const mapping = {};
const words = ["bird","dog","cat","bat","lion","pencil","sleep","optopus","shoe","mask","punch","ice cream","fox","toilet","penquin","chicken","plane","sun","mountain","fish","butter","baseball","soccer","swimming","jacket","window","cry","cloud","Statue of Liberty","Eiffel Tower","Table Tennis","apple","banana","cherry","kite","towel","beach","bench","library","book","net","map","art","internet","president","math","police","fire fighter","surfing","waiter","rose","rain","clock","battery","night","video game","eraser","bomb","santa","guitar","bass","drum","keyboard","piano","calculator","egg","donut","crossline","chocolate","sugar","schedule","snack","picnic","letter","tv show","coffee","river","tent","fishing","rock","fire","wine","magic","snail","candy","jelly fish","whale","finding nemo","dragon","phoenix","beer","spoon","blushes","bill","remote","bear","lock","chess","virus","glass","glass","short","larva","dolphin","mango","tomato","duck","rabbit","cage","lose","win","cooler","mabel","eagle","owl","judge","zebra"];
io.on('connection', (socket) => {
  let socket_id = socket.id;
  socket.on("on-chat",message=>{
    let room_id = mapping[socket_id];
    let room = rooms[room_id];
    let scores = room.scores;
    let user = findUser(room,socket_id);
    let correct_word = rooms[room_id].word;
    if(user.drawing)
    {
       io.to(socket_id).emit('user-chat',{user_id:user.user_id,user_name:user.user_name,message:`Cannot chat when drawing`}); 
    }
    else{
    if(message.toLowerCase()==correct_word.toLowerCase()&&correct_word!="")
    {
      let exists = false;
      scores.forEach(item=>{
        if(item.user_id == user.user_id)
        {
          exists = true;
          return;
        }
      })
      if(!exists)
      { 
          scores.push(user.user_id);
          let place = scores.length;
          io.to(room_id).emit('correct-answer',user);
          if(room.lobby.length==place+1)
          {
            room.round_end=true;
            roundResult(room_id,io);
          }
      }
    }
    else{
      if(message.length==correct_word.length)
      {
        if(isClose(message.toLowerCase(),correct_word.toLowerCase()))
        {
           io.to(socket_id).emit('close-word',message);
        }
      }
      else{
        io.to(room_id).emit('user-chat',{user_id:user.user_id,user_name:user.user_name,message});
      }
    }
  }
  })
  
  socket.on("new-user",(user_info)=>{
    let {user_name,eye,mouth,color} = user_info;
    if(user_name.trim()==""||user_name.trim().length<3)
    {
      io.to(socket_id).emit("alert","name must have aleast 3 characters");
      return;
    }
    else if(user_name.trim().length>20)
    {
      io.to(socket_id).emit("alert","name must have less than 20 characters");
      return;
    }
    io.to(socket_id).emit('loading'); 
    let flag = 0;
    let user = {user_id:socket_id,user_name,eye,mouth,color,point:0,drawing:false};
    let room = {};
    for(let key in rooms)
    {
      let room_item = rooms[key];
      if(room_item.lobby&&room_item.lobby.length<8)
      {
        user.rank = userRank(room_item.lobby);
        room_item.lobby.push(user);
        room=room_item;
      }
    }
    if(isEmpty(room))
    {
      room_id = randomId();
      lobby = [{...user,rank:1}];
      room = {id:room_id,time:"80",round:"1",canvas:[],scores:[],word:"",lobby,start:false,vote_kick:[],total_round:3};
      rooms[room_id]=room;
    }
    //room.lobby= lobbyRank(room.lobby);
    socket.join(room.id);
    mapping[socket_id]=room.id;  
    let canvas_data = room.canvas;
    let word = room.word.replace(/[a-zA-Z0-9]/g,"-");
    io.to(socket_id).emit('enter',{room:{...room,word},user,canvas_data});
    if(room.start&&room.word=="")
    {
      let user_draw = findUserDrawing(room.id);
      io.to(socket_id).emit("wait-choose-word",user_draw.user_name);
    }
    socket.broadcast.to(room.id).emit("join-lobby",user);
    startGame(room,io);
  })
  socket.on("choose-word",word=>{      
    let room_id = mapping[socket_id];
    startDrawing(room_id,socket_id,word,io);
  })

  socket.on('drawing', (data) => {
    let room_id = mapping[socket_id];
    let room = rooms[room_id]
    let user = findUser(room,socket_id);
    if(isEmpty(user))
    {
      return;
    }
    if(user.drawing)
    {
      room.canvas.push(data);
      socket.broadcast.to(room_id).emit('drawing', data);
    }
  });

  socket.on('vote-kick',()=>{
    let room_id = mapping[socket_id];
    let room = rooms[room_id];
    let user = findUser(room,socket_id);
    if(!user.drawing)
    {
      let vote_kick = room.vote_kick;
      if(vote_kick.indexOf(user.user_id)==-1)
      {
        vote_kick.push(user.user_id);
        let room_length = room.lobby.length;
        let votes_need = Math.ceil((room_length/2)+0.5);
        io.to(room.id).emit("vote-kick",{user_name:user.user_name,votes:vote_kick.length,votes_need});
        if(vote_kick.length>=votes_need)
        {
          let user_drawing = findUserDrawing(room.id);
          let index = room.lobby.indexOf(user_drawing);
          io.to(user_drawing.user_id).emit("kicked",user_drawing.user_name);
          io.to(room.id).emit("kick-success",user_drawing);
          delete mapping[user_drawing.user_id];
          room.lobby.splice(room.lobby.indexOf(user_drawing),1);
          switchTurn(room.id,index,io);
        }
      }
    }
  })

  socket.on("thumb-up",function(){
    let room_id = mapping[socket_id];
    let room = rooms[room_id];
    let user = findUser(room,socket_id);
    if(!user.drawing)
    {
    io.to(room_id).emit("thumb-up",socket_id);
    }
  })



  socket.on("thumb-down",function(){
    let room_id = mapping[socket_id];
    let room = rooms[room_id];
    let user = findUser(room,socket_id);
    if(!user.drawing)
    {
    io.to(room_id).emit("thumb-down",socket_id);
    }
  })

  socket.on("clear-canvas",function(){
     let room_id = mapping[socket_id];
    io.to(room_id).emit("clear-canvas");

  })
  socket.on("fill",function(colorLayer){
    let room_id = mapping[socket_id];
    let room = rooms[room_id];
    if(isEmpty(room_id))
    {
      return;
    }
    room.canvas.push({tool:"fill",colorLayer});
    socket.broadcast.to(room_id).emit("fill",colorLayer);
  })
  socket.on("disconnect",function(socket){
    let room_id = mapping[socket_id];
    if(isEmpty(room_id))
    {
      return;
    }
    let room = rooms[room_id];
    let user = findUser(room,socket_id);
    let index = room.lobby.indexOf(user);
    room.lobby.splice(index,1);
    if(room.lobby.length==1)
    {
      gameResult(room_id,io);
    }
    else if(user.drawing)
    {
      if(room.word)
      {
        roundResult(room_id,io);
      }
      else{
          switchTurn(room_id,index,io);
      }
    }
    delete mapping[socket_id];
    if(room.lobby.length==0)
    {
      delete rooms[room_id];
    }
    io.to(room_id).emit("disconnected",user);
  })
});

const isClose = (word1,word2)=>{
  let count = 0;
  for(let i =0;i<word1.length;i++){
    if(word1[i]!=word2[i])
    {
      count++;
    }
    if(count==2)
    {
      return false;
    }
  }
  return true;
}


const startDrawing = (room_id,socket_id,word,io)=>{
    let room = rooms[room_id];
    room.vote_kick=[];
    room.word=word;
    room.choose_word= true;
    room.time=80;
    room.round_end = false;
    io.to(room_id).emit("round-start",{time:room.time,user_draw_id:socket_id});
    let word2 =word.replace(/[a-z0-9A-Z]/g,"-");
    io.to(room_id).emit("guess-word",word2);
    io.to(socket_id).emit("draw-word",word);
    let interval = setInterval(()=>{
      let room2 = rooms[room_id];
      if(isEmpty(room2))
      {
        clearInterval();
      }
      else{
      let time2 = room2.time;
      room2.time = time2 - 1;
      if(room2.round_end)
      {
        clearInterval(interval);
      }
      if(room2.time==0)
      {
        clearInterval(interval);
        roundResult(room_id,io);
      }
      }
    },1000)
}


const findUser = (room,user_id) =>{
  let usr = {};
  if(!room)
  {
    return;
  }
  room.lobby.forEach(user=>{
    if(user.user_id == user_id)
    {
      usr = user;
      return;
    }
  })
  return usr;
}

const findUserDrawing = (room_id) =>{
  let room = rooms[room_id]
  let usr = {};
  room.lobby.forEach(user=>{
    if(user.drawing)
    {
      usr = user;
      return;
    }
  })
  return usr;
}



const roundResult = (room_id,io)=>{
  let room = rooms[room_id];
  let word = room.word;
  let scores = room.scores;
  let max = 300;
  let result = {word,place:[]};
  let drawing_index = -1;
  room.lobby.map((user,i)=>{
    let index = scores.indexOf(user.user_id)+1;
    let plus=0;
    if(index!=0)
    {
        plus = max-(index*30);
        user.point+=max-(index*30);
    }else if(user.drawing)
    {
      plus = scores.length*30;
      user.point+=plus;
      drawing_index = i
      user.drawing=false;
    }
    result.place.push({user_id:user.user_id,user_name:user.user_name,plus});
  })
  result.place.sort((a,b)=>a.plus<b.plus?1:a.plus>b.plus?-1:0);
  let lobby_rank = lobbyRank(room.lobby);
  result.lobby = lobby_rank;
  room.lobby = lobby_rank;
  room.scores = [];
  io.to(room_id).emit("round-result",result);
  setTimeout(()=>{
        switchTurn(room_id,drawing_index,io);
  },6000)
}



const startGame = async(room,io)=>{
  let room_id = room.id;
  let lobby =room.lobby;
  if(!room.start&&room.lobby.length>1)
  {
    room.start = true;
    room.words = [...words];
    room.vote_kick=[];
    await newRound(room,io);
    let user_draw = lobby[lobby.length-1];
    chooseWord(room,user_draw,io)
  }
}

const switchTurn = async(room_id,index,io)=>{
  let room = rooms[room_id];
  if(isEmpty(room))
  {
    return;
  }
  room.scores = [];
  room.canvas= [];
  if(index==0&&room.round==3)
  {
    gameResult(room_id,io);
  }
  else if(index==0&&room.round<3)
  {
    room.round++;
    next_user = room.lobby[room.lobby.length-1];
    await newRound(room,io);
    chooseWord(room,next_user,io);
  }
  else{
    next_user = room.lobby[index-1];
    chooseWord(room,next_user,io);
  }
}

const gameResult = (room_id,io)=>{
  let room = rooms[room_id];
  let lobby = room.lobby;
  lobby = lobbyRank(room.lobby);
  lobby = sortRank(lobby);
  io.to(room_id).emit("game-result",lobby);
    setTimeout(()=>{
      room.start=false;
      room.round=1;
      room.lobby.forEach(item=>{
        item.point=0;
        item.rank=1;
      })
      room.start=false;
      room.word = "";
      room.words = words;
      startGame(room,io);
    },7000)
}

const chooseWord = (room,user,io)=>{
  room.word="";
  room.choose_word=false;
  user.drawing=true;
  let room_id = room.id;
  let words = room.words;
  let choose = [];
  for(let i = 1;i<=3 ;i++)
  {
        let word = words[Math.floor(Math.random()*words.length)];
        choose.push(word);
        words.splice(words.indexOf(word),1);
  }
  room.words = words;
  io.to(user.user_id).emit("choose-word",choose);
  io.to(room_id).emit("wait-choose-word",user.user_name);
  // let time = room.time;
  let timer = 7;
  let interval = setInterval(()=>{
    timer--;
    let room2 = rooms[room_id];
    if(isEmpty(room2))
    {
      return;
    }
    if(room2.choose_word){
      clearInterval(interval);
    }
    else if(timer==0&&!room2.choose_word)
    {
      let word = choose[0];
      startDrawing(room_id,user.user_id,word,io);
      clearInterval(interval);
    }
  },1000)
}

const newRound = (room,io)=>{
  let round =room.round;
  let room_id = room.id;
  io.to(room_id).emit("new-round",round);
  return new Promise((res,rej)=>{
    setTimeout(()=>{
      res(true);
    },2000);
  })
}

function lobbyRank(lobby){
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

function sortRank(lobby){
  return lobby.sort((a,b)=>a.rank>b.rank?1:a.rank<b.rank?-1:0);
}

const userRank = (lobby)=>{
  let rank = 1;
  let lowest_player = lobby[0];
  if(isEmpty(lowest_player))
  {
    return rank;
  }
  lobby.forEach(item=>{
    if(item.point<lowest_player.point)
    {
      lowest_player=item;
    }
  })
  if(lowest_player.point==0)
  {
    return lowest_player.rank;
  }
  else{
    return lowest_player.rank+1;
  }
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
