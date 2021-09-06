var socket = io();
var drawing = false;
var canvas = null;
var context = null;
var interval = null;
var current = {
    color: 'black',
    lineWidth:2
};
var drawing_turn=false;
let colors = [];
$(document).ready(function(){
  $('body').on("enterKey",".user-name",function(e){
    e.preventDefault();
    let user_name = $(this).val();
    if($.trim(user_name)==""||$.trim(user_name).length<3)
    {
      alert("name must have aleast 3 characters");
    }
    else{
          socket.emit('new-user',{user_name,eye:rand_eye,mouth:rand_mouth,color:rand_color});
    }
  });
  $("body").on("keypress",".user-name",function(e){
    if(e.keyCode == 13)
    {
        $(this).trigger("enterKey");
    }
  })

  $('body').on("enterKey",".user-chat",function(e){
      e.preventDefault();
      let message = $(this).val();
      $(this).val("");
      if($.trim(message)!="")
      {
              socket.emit('on-chat',message);
      }
  })
    $("body").on("keypress",".user-chat",function(e){
    if(e.keyCode == 13)
    {
        $(this).trigger("enterKey");
    }
  })

  $("body").on("click",".play-button",function(){
    let user_name = $(".user-name").val();
    if($.trim(user_name)==""||$.trim(user_name).length<3)
    {
      alert("name must have aleast 3 characters");
    }
    else{
          socket.emit('new-user',{user_name,eye:rand_eye,mouth:rand_mouth,color:rand_color});
    }
  })

  $("body").on("click",".vote-kick",function(){
    socket.emit('vote-kick');
  })

  $("body").on("click",".kick-close",function(e){
    $(".kick-container").css("display","none");
  })
  $("body").on("scroll",function(e){
    console.log(e);
  })
  socket.on("alert",message=>{
    alert(message);
  })
  socket.on("loading",()=>{
    let loading_html = "<div class='lds-hourglass'></div>";
    $(".content").html(loading_html);
  })
  socket.on("enter",(data)=>{
    let {room,user,canvas_data} = data;
    let user_html = "";

    room.lobby.forEach((item)=>{
      let eyePos = getPosition(item.eye,-48);
      let mouthPos = getPosition(item.mouth,-48);
      let colorPos = getPosition(item.color,-48);
      user_html += `<div id="user-${item.user_id}" class="user-item"><p class="rank">#${item.rank}</p>
      <div class="user-info"><p class="user-name" style="color:${item.user_id==user.user_id?"blue":"black"}">${item.user_name}</p><p class="point">Point: ${item.point}</p></div><div class="user-avatar"><div class="user-color" style="background-size: 480px 480px;background-position:${colorPos.left} ${colorPos.top}"></div><div class="user-eyes" style="background-size: 480px 480px;background-position:${eyePos.left} ${eyePos.top}"></div><div class="user-mouth" style="background-size: 480px 480px;background-position:${mouthPos.left} ${mouthPos.top}"></div></div></div>`
    })
    let html = `<div class="word-container"><div class="time-and-round"><div class="time-container"><p class="time-text">${room.time}</p></div><p class="round">Round ${room.round}</p></div><p class="word-text">${room.word}</p></div><div class="play-container"><div class="left"><div class="users-container">${user_html}</div><div class="vote-kick">Vote Kick</div></div><div class="center"><canvas class="whiteboard"></canvas><div class="colors"><div class="color black"></div><div class="color yellow"></div><div class="color red"></div><div class="color blue"></div><div class="color green"></div><div class="color lightblue"></div><div class="color orange"></div></div></div><div class="right"><div class="messages"></div><input class="form-control user-chat"/></div></div>`;
        $(".content").html(html);
        canvas = document.getElementsByClassName("whiteboard")[0];
        context = canvas.getContext('2d');
        rect = canvas.getBoundingClientRect();
        colors = document.getElementsByClassName("color");
        canvas.addEventListener('mousedown', onMouseDown, false);
        canvas.addEventListener('mouseup', onMouseUp, false);
        canvas.addEventListener('mouseout', onMouseUp, false);
        canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
        canvas.addEventListener('touchstart', onMouseDown, false);
        canvas.addEventListener('touchend', onMouseUp, false);
        canvas.addEventListener('touchcancel', onMouseUp, false);
         canvas.addEventListener('scroll', onScroll, false);
        canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
        socket.on('drawing', onDrawingEvent);
        for (var i = 0; i < colors.length; i++){
            colors[i].addEventListener('click', onColorUpdate, false);
        }
        window.addEventListener('resize', onResize, false);
        onResize();
        canvas_data.forEach(cv=>{
          onDrawingEvent(cv);
        })
        let msg_html =`<p style="color:orange"><strong>${user.user_name}: </strong> has join lobby`;
        $(".messages").append(msg_html);
  })
  socket.on("user-chat",(data)=>{
    let {user_name,message} = data;
    let message_html = `<p><strong>${user_name}:</strong> ${message}</p>`;
    $(".messages").append(message_html);
    $(".messages").scrollTop($(".messages").height());
  })
  socket.on("join-lobby",(user)=>{
    let message_html = `<p><strong>${user.user_name}:</strong> has join lobby</p>`;
    $(".messages").append(message_html);
    $(".messages").scrollTop($(".messages").height());
    let user_html = "";
    let eyePos = getPosition(user.eye,-48);
    let mouthPos = getPosition(user.mouth,-48);
    let colorPos = getPosition(user.color,-48);
    user_html += `<div id="user-${user.user_id}" class="user-item"><p class="rank">#${user.rank}</p>
      <div class="user-info"><p class="user-name">${user.user_name}</p><p class="point">Point: ${user.point}</p></div><div class="user-avatar"><div class="user-color" style="background-size: 480px 480px;background-position:${colorPos.left} ${colorPos.top}"></div><div class="user-eyes" style="background-size: 480px 480px;background-position:${eyePos.left} ${eyePos.top}"></div><div class="user-mouth" style="background-size: 480px 480px;background-position:${mouthPos.left} ${mouthPos.top}"></div></div></div>`
    $(".users-container").append(user_html);
  })

  socket.on("correct-answer",user=>{
    let message = `<p style="color:orange">${user.user_name} has guess the word`;
    $(`#user-${user.user_id}`).css("background","orange");
    $(".messages").append(message);
  })
  socket.on("new-round",round=>{
    $(".center-overlay").remove();
    let html = `<div class="center-overlay"><p class="center-message">Round ${round}</p></div>`
    $(".round").text(`Round ${round}`);
    $(".center").append(html);
  })

  socket.on("choose-word",(words)=>{
    let word_modal = '<div class="words-modal">';
    words.forEach(word=>{
      word_modal +=`<div class="word">${word}</div>`;
    })
    word_modal +="</div>";
    $(".content").append(word_modal);
    $("body").on("click",".word",function(){
      let word = $(this).text();
      socket.emit("choose-word",word);
    })
  })
  socket.on("wait-choose-word",user_name=>{
    $(".center-overlay").remove();
    let html = `<div class="center-overlay"><p class="center-message">${user_name} is choosing words</p></div>`
    $(".center").append(html);
  })
  socket.on("guess-word",(word)=>{
    $(".vote-kick").css("display","block");
    let time = 31;
    let hide = "";
    $(".word-text").text(word);
    $(".center-overlay").remove();
     interval =  setInterval(() => {
      time--;
      $(".time-text").text(time);
      if(time==0)
      {
          clearInterval(interval);
      }
    }, 1000)
  })
  socket.on("draw-word",word=>{
    let time = 31;
    drawing_turn=true;
    $(".colors").css("display","flex");
    $(".word-text").text(word);
    $(".words-modal").remove();
    $(".center-overlay").remove();
    $(".word-text").text(word);
    interval =  setInterval(() => {
      time--;
      $(".time-text").text(time);
      if(time==0)
      {
        clearInterval(interval);
      }
    }, 1000)
  })
  socket.on("clear-canvas",()=>{
    context.clearRect(0, 0, canvas.width, canvas.height);
  })
  socket.on("round-result",result=>{
    clearInterval(interval);
    drawing_turn=false;
    $(".vote-kick").css("display","none");
    $(".colors").css("display","none");
    $(".user-item").css("background-color","white");
    $(".center-overlay").remove();
    let score_html = "";
    result.place.forEach(item=>{
      score_html += `<div class="result-score-item"><p class="user-name" style="color:${item.user_id==socket.id?"lightblue":"black"}">${item.user_name}</p><p class="plus">+${item.plus}</div>`
    })
    result.lobby.forEach(item=>{
        $(`#user-${item.user_id}`).find(".rank").text(`#${item.rank}`);
        $(`#user-${item.user_id}`).find(".point").text(`point: ${item.point}`);
    })
    let html = `<div class="center-overlay"><div class="round-result"><p class="result-word">The answer is ${result.word}</p><div class="result-scores">${score_html}</div></div></div>`
    $(".center").append(html);
  })

  socket.on("game-result",lobby=>{
    let top_html="";
    let bottom_html = "";
    lobby.map((user,index)=>{
      let eyePos = getPosition(user.eye,-48);
      let mouthPos = getPosition(user.mouth,-48);
      let colorPos = getPosition(user.color,-48);
      if(index<3)
      {
        top_html+=`<div class="top-user"><p class="top-rank">#${user.rank}</p><div class="top-user-info"><div="user-avatar"><div class="user-color" style="background-size: 480px 480px;background-position:${colorPos.left} ${colorPos.top}"></div><div class="user-eyes" style="background-size: 480px 480px;background-position:${eyePos.left} ${eyePos.top}"></div><div class="user-mouth" style="background-size: 480px 480px;background-position:${mouthPos.left} ${mouthPos.top}"></div></div><p class="top-user-name">${user.user_name}</p></div></div>`
      }
      else{
        bottom_html+=`<div class="bottom-user"><p class="bottom-rank">#${user.rank}</p><div class="bottom-user-info"><div="user-avatar"><div class="user-color" style="background-size: 480px 480px;background-position:${colorPos.left} ${colorPos.top}"></div><div class="user-eyes" style="background-size: 480px 480px;background-position:${eyePos.left} ${eyePos.top}"></div><div class="user-mouth" style="background-size: 480px 480px;background-position:${mouthPos.left} ${mouthPos.top}"></div></div><p class="bottom-user-name">${user.user_name}</p></div></div>`
      }
    })
    let result_html = `<div class="center-overlay"><div class="game-result-container"><div class="top-users">${top_html}</div><div class="bottom-users">${bottom_html}</div></div></div>`
    $(".center").append(result_html);
  })

  socket.on("close-word",(word)=>{
    let message_html = `<p style="color:orange">${word} is close</p>`;
    $(".messages").append(message_html);
  })
  socket.on("vote-kick",(data)=>{
      let {user_name,votes,votes_need} = data;
      let message_html = `<p style="color:orange">${user_name} vote kick (${votes}/${votes_need})<p>`;
      $(".messages").append(message_html);
  })
  socket.on("kicked",(user_name)=>{
    let html=`<div class="user-form"><input class="user-name form-control" type="text" value="${user_name}"><button class="btn btn-primary play-button">Play!</button></div>`
    $(".content").html(html);
    let kick_message = `<div class="kick-container"><p class="kick-message">Connection lost or you have been kicked</p><i class="fa fa-times kick-close"></i></div>`
    $(".content").append(kick_message);
  })

  socket.on("kick-success",(user)=>{
    $(`#user-${user.user_id}`).remove();
    let message_html = `<p style="color:orange">${user.user_name} has been kick</p>`;
    $(".messages").append(message_html);
  })

  socket.on("disconnected",(user)=>{
      let message = `${user.user_name} left room`;
      $(".messages").append(message);
      $(`#user-${user.user_id}`).remove();
  })
})

function drawLine(x0, y0, x1, y1, color,lineWidth, emit){
        let x2 = x0 - rect.left;
        let y2 = y0 - rect.top;
        let x3 = x1 - rect.left;
        let y3 = y1 - rect.top;
        context.translate(0.5, 0.5);
        context.beginPath();
        context.moveTo(x2, y2);
        context.lineTo(x3, y3);
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke();
        context.closePath();
        context.translate(-0.5, -0.5);
        if (!emit) { return; }
        var w = canvas.width;
        var h = canvas.height;
        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            lineWidth:lineWidth,
            color: color
        });
  }
  function onMouseDown(e){
    if(drawing_turn)
    {
      drawing = true;
      current.x = e.pageX||e.touches[0].pageX;
      current.y = e.pageY||e.touches[0].pageY;
    }
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.pageX||e.touches[0].pageX, e.pageY||e.touches[0].pageY, current.color,current.lineWidth, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.pageX||e.touches[0].pageX, e.pageY||e.touches[0].pageY, current.color,current.lineWidth, true);
    current.x = e.pageX||e.touches[0].pageX;
    current.y = e.pageY||e.touches[0].pageY;
  }
  function onScroll(e){
    console.log("ASdasd");
    console.log(e);
  }
  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();
      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color,data.lineWidth);
  }
  // make the canvas fill its parent
  function onResize() { 
    rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }