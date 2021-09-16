var socket = io();
var drawing = false;
var filling = false;
var canvas = null;
var context = null;
var interval = null;
var current = {
    tool:'pen',
    color: '#000000',
    lineWidth:10
};
var color_mapping = {
  0:"#FFF",1:"#000",2:"#C1C1C1",3:"#AC4C4C",4:"#EF130B",5:"#740B07",6:"#FF7100",7:"#C23800",8:"#FFE400",9:"#E8A200",10:"#00CC00",11:"#005510",12:"#00B2FF",13:"#00569E",14:"#231FD3",15:"#0E0865",16:"#A300BA",17:"#550069",18:"#D37CAA",19:"#A75574",20:"#A0522D",21:"#63300D"
}
var drawing_turn=false;
let colors = [];
var colorLayer = [];

$(document).ready(function(){
    //Event
    $('body').on("enterKey",".user-name",function(e){
    e.preventDefault();
    let user_name = $(this).val();
    if($.trim(user_name)==""||$.trim(user_name).length<3)
    {
      alert("name must have aleast 3 characters");
    }
    else if($.trim(user_name).length>20)
    {
      alert("name must have less than 20 characters");
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
    else if($.trim(user_name).length>20)
    {
      alert("name must have less than 20 characters");
    }
    else{
          socket.emit('new-user',{user_name,eye:rand_eye,mouth:rand_mouth,color:rand_color});
    }
  })

  $("body").on("click",".vote-kick",function(e){
        e.preventDefault();
    socket.emit('vote-kick');
  })

  $("body").on("click",".kick-close",function(e){
        e.preventDefault();
    $(".kick-container").css("display","none");
  })

  $("body").on("click",".thumb-up",function(e){
    e.preventDefault();
    socket.emit("thumb-up");
  })

  $("body").on("click",".thumb-down",function(e){
    e.preventDefault();
    socket.emit("thumb-down");
  })

  $("body").on("click",".clear-material",function(e){
    e.preventDefault();
    socket.emit("clear-canvas");
  })

  $("body").on("click",".eraser-material",function(e){
    e.preventDefault();
    current.tool = "eraser";
  })

  $("body").on("click",".pen-material",function(e){
    e.preventDefault();
    current.tool = "pen";
  })

  $("body").on("click",".fill-material",function(e){
    e.preventDefault();
    current.tool = "fill";
  })

  $("body").on("click",".line-size",function(e){
      let size = $(this).data("size");
      current.lineWidth=size;
  })

  //Socket
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
    let scores = room.scores;
    let player_drawing = null;

    room.lobby.map((item,index)=>{
      let eyePos = getPosition(item.eye,-48);
      let mouthPos = getPosition(item.mouth,-48);
      let colorPos = getPosition(item.color,-48);
      user_html += 
      `<div id="user-${item.user_id}" class="user-item ${scores.indexOf(item.user_id)!=-1?"correct-user":""}" style="background-color:${index%2==0?"white":"cyan"}">
          <p class="rank">#${item.rank}</p>
          <div class="user-info">
              <p class="user-name" style="color:${item.user_id==user.user_id?"blue":"black"}">${item.user_name.length>10?item.user_name.slice(0,8)+"...":item.user_name}</p>
              <p class="point">Points: ${item.point}</p>
          </div>
          <div class="user-avatar">
              <div class="user-color" style="background-size: 480px 480px;background-position:${colorPos.left} ${colorPos.top}"></div>
              <div class="user-eyes" style="background-size: 480px 480px;background-position:${eyePos.left} ${eyePos.top}"></div>
              <div class="user-mouth" style="background-size: 480px 480px;background-position:${mouthPos.left} ${mouthPos.top}"></div>
          </div>
          <div class="user-message">
              <div class="chat-message-container">
                  <div class="arrow"></div>
                  <div class="chat-message-sub">
                      <p class="chat-message"></p>
                      <div class="thumb-up-message"></div>
                      <div class="thumb-down-message"></div>
                  </div>
              </div>
          </div>
          ${item.drawing?"<div class='pen'></div>":""}</div>`
    })
    let html = 
    `<div class="word-container">
        <div class="time-and-round">
            <div class="timer-container">
                <div class="timer">${room.time}</div>
            </div>
            <p class="round">Round ${room.round} of ${room.total_round}</p>
        </div>
        <p class="word-text">${room.word}</p>
      </div>
      <div class="play-container">
          <div class="left">
              <div class="users-container">${user_html}</div>
              <div class="vote-kick">Vote Kick</div>
          </div>
          <div class="center">
              <canvas class="whiteboard"></canvas>
              <div class="material"><div class="pick-color"></div><div class="colors">
                  <div class="color-line">
                    <div class="color" data-color=0 style="background-color:#FFF"></div>
                    <div class="color" data-color=2 style="background-color:#C1C1C1"></div>
                    <div class="color" data-color=4 style="background-color:#EF130B"></div>
                    <div class="color" data-color=6 style="background-color:#FF7100"></div>
                    <div class="color" data-color=8 style="background-color:#FFE400"></div>
                    <div class="color" data-color=10 style="background-color:#00CC00"></div>
                    <div class="color" data-color=12 style="background-color:#00B2FF"></div>
                    <div class="color" data-color=14 style="background-color:#231FD3"></div>
                    <div class="color" data-color=16 style="background-color:#A300BA"></div>
                    <div class="color" data-color=18 style="background-color:#D37CAA"></div>
                    <div class="color" data-color=20 style="background-color:#A0522D"></div>
                  </div>
                  <div class="color-line">
                    <div class="color" data-color=1 style="background-color:#000"></div>
                    <div class="color" data-color=3 style="background-color:#AC4C4C"></div>
                    <div class="color" data-color=5 style="background-color:#740B07"></div>
                    <div class="color" data-color=7 style="background-color:#C23800"></div>
                    <div class="color" data-color=9 style="background-color:#E8A200"></div>
                    <div class="color" data-color=11 style="background-color:#005510"></div>
                    <div class="color" data-color=13 style="background-color:#00569E"></div>
                    <div class="color" data-color=15 style="background-color:#0E0865"></div>
                    <div class="color" data-color=17 style="background-color:#550069"></div>
                    <div class="color" data-color=19 style="background-color:#A75574"></div>
                    <div class="color" data-color=21 style="background-color:#63300D"></div>
                  </div>
                </div>
                  <div class="pen-material item-material"><div class="pen-img"></div></div>
                  <div class="fill-material item-material"><div class="fill-img"></div></div>
                  <div class="eraser-material item-material"><div class="eraser-img"></div></div>
                  <div class="clear-material item-material"><div class="clear-img"></div></div>
                  <div class="line-size-container">
                      <div class="line-size small-line" data-size=4><div class="small-line-dot"></div></div>
                      <div class="line-size normal-line" data-size=10><div class="normal-line-dot"></div></div>
                      <div class="line-size large-line" data-size=16><div class="large-line-dot"></div></div>
                      <div class="line-size huge-line" data-size=24><div class="huge-line-dot"></div></div>
                  </div>
              </div>
          </div>
          <div class="right">
              <div class="messages"></div>
              <input class="form-control user-chat"/>
          </div>
    </div>`;
        $(".content").html(html);
        canvas = document.getElementsByClassName("whiteboard")[0];
        context = canvas.getContext('2d');
        rect = canvas.getBoundingClientRect();
        colors = document.getElementsByClassName("color");
        canvas.addEventListener('mousedown', onMouseDown, false);
        canvas.addEventListener('mouseup', onMouseUp, false);
        canvas.addEventListener('mouseout', onMouseUp, false);
        canvas.addEventListener('mousemove', onMouseMove, false);
        canvas.addEventListener('touchstart', onMouseDown, false);
        canvas.addEventListener('touchend', onMouseUp, false);
        canvas.addEventListener('touchcancel', onMouseUp, false);
        canvas.addEventListener('mousewheel', onScroll, false);
        canvas.addEventListener('touchmove', onMouseMove, false);
        socket.on('drawing', onDrawingEvent);
        for (var i = 0; i < colors.length; i++){
            colors[i].addEventListener('click', onColorUpdate, false);
        }
        window.addEventListener('resize', onResize, false);
        onResize();
        canvas_data.forEach(cv=>{
          if(cv.tool=="fill")
          {
              context.putImageData(cv.colorLayer, 0, 0);
          }
          else{
          onDrawingEvent(cv);
          }
        })
        let msg_html =`<p style="color:orange"><strong>${user.user_name}: </strong> has join lobby`;
        $(".messages").append(msg_html);
        if(room.start && room.word)
        {
          let time = room.time;
          $(".vote-kick").css("display","block");
          let thumb_html = 
          `<div class='thumb-container'>
              <div class='thumb-up'></div>
              <div class='thumb-down'></div>
            </div>`;
          $('.center').append(thumb_html);
          interval = setInterval(() => {
            time--;
            $(".timer").text(time);
            if(time==0)
            {
              clearInterval(interval);
            }
          }, 1000) 
        }
  })
  socket.on("user-chat",(data)=>{
    let {user_id,user_name,message} = data;
    let message_html = `<p><strong>${user_name}:</strong> ${message}</p>`;
    $(".messages").append(message_html);
    $(".messages").scrollTop($(".messages").height());
    let user_message =  $(`#user-${user_id}`).find(".chat-message-container");
    let user_text = user_message.find(".chat-message");
    if(message.length>30)
    {
     message = message.splice(0,30)+"...";
    }
    user_text.text(message);
    user_text.css("display","block");
    user_message.css("display","flex");
    if(user_id == socket.id)
    {
    $('.thumb-container').css("display","none");
    setTimeout(()=>{
      user_message.css("display","none");
      user_text.css("display","none");
      $(".thumb-container").css("display","flex");
    },3000)
    }
    else{
      setTimeout(()=>{
        user_message.css("display","none");
        user_text.css("display","none");
      },3000)
    }
  })
  socket.on("join-lobby",(user)=>{
    let message_html = `<p><strong>${user.user_name}:</strong> has join lobby</p>`;
    $(".messages").append(message_html);
    $(".messages").scrollTop($(".messages").height());
    let user_html = "";
    let eyePos = getPosition(user.eye,-48);
    let mouthPos = getPosition(user.mouth,-48);
    let colorPos = getPosition(user.color,-48);
    let users_count = $(".user-item").length;
    user_html += 
    `<div id="user-${user.user_id}" class="user-item" style="background-color:${users_count%2==0?"white":"cyan"}">
        <p class="rank">#${user.rank}</p>
        <div class="user-info">
            <p class="user-name">${user.user_name.length>10?item.user_name.slice(0,8)+"...":user.user_name}</p>
            <p class="point">Points: ${user.point}</p>
        </div>
        <div class="user-avatar">
            <div class="user-color" style="background-size: 480px 480px;background-position:${colorPos.left} ${colorPos.top}"></div>
            <div class="user-eyes" style="background-size: 480px 480px;background-position:${eyePos.left} ${eyePos.top}">
            </div><div class="user-mouth" style="background-size: 480px 480px;background-position:${mouthPos.left} ${mouthPos.top}"></div>
        </div>
      <div class="user-message">
          <div class="chat-message-container">
              <div class="arrow"></div>
              <div class="chat-message-sub">
              <p class="chat-message"></p>
              <div class="thumb-up-message"></div>
              <div class="thumb-down-message"></div>
          </div>
      </div>
    </div>
    </div>`
    $(".users-container").append(user_html);
  })

  socket.on("correct-answer",user=>{
    let message = `<p style="color:orange">${user.user_name} has guess the word`;
    $(`#user-${user.user_id}`).addClass("correct-user");
    $(".messages").append(message);
  })

  socket.on("new-round",round=>{
    $(".center-overlay").remove();
    let html = 
    `<div class="center-overlay">
        <p class="center-message">Round ${round}</p>
    </div>`
    $(".round").text(`Round ${round}`);
    $(".center").append(html);
    $(".whiteboard").css("background-color","#232223");

  })

  socket.on("choose-word",(words)=>{
    let word_modal = '<div class="words-modal">';
    words.forEach(word=>{
      word_modal +=`<div class="word">${word}</div>`;
    })
    word_modal +="</div>";
    $(".center").append(word_modal);
    $("body").on("click",".word",function(){
      let word = $(this).text();
      socket.emit("choose-word",word);
    })

  })
  socket.on("wait-choose-word",user_name=>{
    $(".center-overlay").remove();
    let html = 
    `<div class="center-overlay">
        <p class="center-message">${user_name} is choosing words</p>
    </div>`
    $(".center").append(html);
    $(".whiteboard").css("background-color","#232223");
  })
  socket.on("guess-word",(word)=>{
    $(".vote-kick").css("display","block");
    let thumb_html = 
    `<div class='thumb-container'>
        <div class='thumb-up'></div>
        <div class='thumb-down'></div>
      </div>`;
    $('.center').append(thumb_html);
    $(".word-text").text(word);
    $(".center-overlay").remove();
    $(".whiteboard").css("background-color","white");
  })
  socket.on("draw-word",word=>{
    drawing_turn=true;
    $(".material").css("display","flex");
    $(".pick-color").css("background-color",current.color);
    $(".words-modal").remove();
    $(".center-overlay").remove();
    $(".whiteboard").css("background-color","white");
    $(".word-text").text(word);
    $(".vote-kick").css("display","none");
    $(".thumb-container").css("display","none");
  })
  socket.on("round-start",({time,user_draw_id})=>{
    $(".pen").remove();
    let pen_html = `<div class="pen"></div>`
    $(`#user-${user_draw_id}`).append(pen_html);
    context.clearRect(0, 0, canvas.width, canvas.height);
    interval =  setInterval(() => {
      time--;
      $(".timer").text(time);
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
    $(".material").css("display","none");
    $(".user-item").removeClass("correct-user");
    $(".center-overlay").remove();
    $(".whiteboard").css("background-color","white");
    $(".thumb-container").remove();
    let score_html = "";
    result.place.forEach(item=>{
      score_html += 
      `<div class="result-score-item">
          <p class="user-name" style="color:${item.user_id==socket.id?"lightblue":"black"}">${item.user_name}</p>
          <p class="plus">+${item.plus}</p>
      </div>`
    })
    result.lobby.forEach(item=>{
        $(`#user-${item.user_id}`).find(".rank").text(`#${item.rank}`);
        $(`#user-${item.user_id}`).find(".point").text(`point: ${item.point}`);
    })
    let html = 
    `<div class="center-overlay">
        <div class="round-result">
            <p class="result-word">The answer is ${result.word}</p>
            <div class="result-scores">${score_html}</div>
        </div>
      </div>`
    $(".center").append(html);
    $(".whiteboard").css("background-color","#232223");
  })

  socket.on("game-result",lobby=>{
    let top_html="";
    let bottom_html = "";
    lobby.map((user,index)=>{
      if(index<3)
      {
        let size = "720px 720px";
        let eyePos = getPosition(user.eye,-72);
        let mouthPos = getPosition(user.mouth,-72);
        let colorPos = getPosition(user.color,-72);
        top_html+=
        `<div class="top-user">
            <p class="top-rank">#${user.rank}</p>
            <div class="top-user-info">
                <div class="top-user-avatar">
                    <div class="user-color" style="background-size: ${size};background-position:${colorPos.left} ${colorPos.top}"></div>
                    <div class="user-eyes" style="background-size: ${size};background-position:${eyePos.left} ${eyePos.top}"></div>
                    <div class="user-mouth" style="background-size: ${size};background-position:${mouthPos.left} ${mouthPos.top}"></div>
                </div>
                <p class="top-user-name">${user.user_name}</p>
            </div>
          </div>`
      }
      else{
        let size = "480px 480px";
        let eyePos = getPosition(user.eye,-48);
        let mouthPos = getPosition(user.mouth,-48);
        let colorPos = getPosition(user.color,-48);
        bottom_html+=
        `<div class="bottom-user">
            <p class="bottom-rank">#${user.rank}</p>
            <div class="bottom-user-info">
                <div class="bottom-user-avatar">
                    <div class="user-color" style="background-size: ${size};background-position:${colorPos.left} ${colorPos.top}"></div>
                    <div class="user-eyes" style="background-size: ${size};background-position:${eyePos.left} ${eyePos.top}"></div>
                    <div class="user-mouth" style="background-size: ${size};background-position:${mouthPos.left} ${mouthPos.top}"></div>
                </div>
                <p class="bottom-user-name">${user.user_name}</p>
            </div>
        </div>`
      }
    })
    let result_html = 
    `<div class="center-overlay">
        <div class="game-result-container">
            <div class="top-users">${top_html}</div>
            <div class="bottom-users">${bottom_html}</div>
        </div>
      </div>`
    $(".center").append(result_html);
    $(".whiteboard").css("background-color","#232223");
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
    let html=
    `<div class="user-form">
        <input class="user-name form-control" type="text" value="${user_name}">
        <button class="btn btn-primary play-button">Play!</button>
      </div>`
    $(".content").html(html);
    let kick_message = 
    `<div class="kick-container">
        <p class="kick-message">Connection lost or you have been kicked</p>
        <i class="fa fa-times kick-close"></i>
      </div>`
    $(".content").append(kick_message);
  })

  socket.on("kick-success",(user)=>{
    $(`#user-${user.user_id}`).remove();
    let message_html = `<p style="color:orange">${user.user_name} had been kick</p>`;
    $(".messages").append(message_html);
  })

  socket.on("thumb-up",(user_id)=>{
    let user_message = $(`#user-${user_id}`).find(".chat-message-container");
    let user_thumb_up =  user_message.find(".thumb-up-message");
    user_message.css("display","flex");
    user_thumb_up.css("display","block");
    if(user_id == socket.id)
    {
    $('.thumb-container').css("display","none");
    setTimeout(()=>{
      user_message.css("display","none");
      user_thumb_up.css("display","none");
      $(".thumb-container").css("display","flex");
    },3000)
    }
    else{
      setTimeout(()=>{
        user_message.css("display","none");
        user_thumb_up.css("display","none");
      },3000)
    }
  })

  socket.on("thumb-down",(user_id)=>{
    let user_message =  $(`#user-${user_id}`).find(".chat-message-container");
    let user_thumb_down =  user_message.find(".thumb-down-message");
    user_message.css("display","flex");
    user_thumb_down.css("display","block");
    $('.thumb-container').css("display","none");
    if(user_id == socket.id)
    {
      $('.thumb-container').css("display","none");
      setTimeout(()=>{
      user_message.css("display","none");
      user_thumb_down.css("display","none");
      $(".thumb-container").css("display","flex");
      },3000)
    }
    else{
      setTimeout(()=>{
        user_message.css("display","none");
        user_thumb_down.css("display","none");
      },3000)
    }
  })
  socket.on("fill",(colorLayer)=>{
    context.putImageData(colorLayer, 0, 0);
  })

  socket.on("disconnected",(user)=>{
      let message = `${user.user_name} left room`;
      $(".messages").append(message);
      $(`#user-${user.user_id}`).remove();
  })
})



//Draw

function drawLine(x0, y0, x1, y1, color,lineWidth,tool, emit){
        if(tool=="eraser")
        {
          color = "#fff";
        }
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineCap = "round";
        context.lineWidth = lineWidth;
        context.stroke();
        context.closePath();
        if (!emit) { return; }
        var w = canvas.width;
        var h = canvas.height;
        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            lineWidth:lineWidth,
            color: color,
            tool: tool
    });
}
  function onMouseDown(e){
    e.preventDefault();
    if(drawing_turn)
    {
    if(current.tool=="fill")
    {
        if(filling)
        {
          return;
        }
        filling = true;
        let color = current.color.substr(1,current.color.length);
        let {r,g,b} = hexToRgb(color);
        let canvasWidth  = canvas.width;
        let canvasHeight = canvas.height;
        colorLayer =context.getImageData(0, 0, canvasWidth,canvasHeight);
        let x0 =  e.pageX - this.offsetLeft;
        let y0 = e.pageY- this.offsetTop;
        let pixelStack = [[x0,y0]];
        let startColor = context.getImageData(x0, y0,1,1);
        startR = startColor.data[0];
        startG = startColor.data[1];
        startB = startColor.data[2];
        //let pixelPos = Math.round((yPos*canvasWidth + xPos) * 4);
       while(pixelStack.length)
          {
          let newPos, x, y, pixelPos, reachLeft, reachRight;
          newPos = pixelStack.pop();
          x = newPos[0];
          y = newPos[1];
          pixelPos = (y*canvasWidth + x) * 4;
          while(y-- >= 0 && matchStartColor(pixelPos,startR,startG,startB))
          {
            pixelPos -= canvasWidth * 4;
          }
          pixelPos += canvasWidth * 4;
          ++y;
          reachLeft = false;
          reachRight = false;
          while(y++ < canvasHeight-1 && matchStartColor(pixelPos,startR,startG,startB))
          {
            colorPixel(pixelPos,r,g,b);
            if(x > 0)
            {
              if(matchStartColor(pixelPos - 4,startR,startG,startB))
              {
                if(!reachLeft){
                  pixelStack.push([x - 1, y]);
                  reachLeft = true;
                }
              }
              else if(reachLeft)
              {
                reachLeft = false;
              }
            }
          
            if(x < canvasWidth-1)
            {
              if(matchStartColor(pixelPos + 4,startR,startG,startB))
              {
                if(!reachRight)
                {
                  pixelStack.push([x + 1, y]);
                  reachRight = true;
                }
              }
              else if(reachRight)
              {
                reachRight = false;
              }
            }
          
            pixelPos += canvasWidth * 4;
          }
        }
        context.putImageData(colorLayer, 0, 0);
        socket.emit("fill",colorLayer);
        setTimeout(()=>{
               filling= false;
        },500)
    }
    else{
      drawing = true;
      current.x = e.pageX - this.offsetLeft;
      current.y = e.pageY- this.offsetTop;
    }
    }
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    let newX = e.pageX - this.offsetLeft;
    let newY = e.pageY - this.offsetTop;
    drawLine(current.x, current.y, newX, newY, current.color,current.lineWidth,current.tool, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    if(current.tool!=="fill")
    {
    let newX = e.pageX - this.offsetLeft;
    let newY = e.pageY - this.offsetTop;
    drawLine(current.x, current.y,newX, newY, current.color,current.lineWidth,current.tool, true);
    current.x = newX;
    current.y = newY;
    }
  }

  function onScroll(e){
    e.preventDefault();
    // img = new Image;
    // img.src = "/storage/img/cursor.png";
    // if (e.wheelDelta > 0) {
    //   if(current.lineWidth<40)
    //   {
    //     current.lineWidth += 0.5;
    //     img.width = current.lineWidth*20;
    //     img.height =  current.lineWidth*20;
    //   }
    // } else {
    //     if(current.lineWidth>2)
    //     {
    //       current.lineWidth -= 0.5;
    //       img.width = current.lineWidth*20;
    //       img.height =  current.lineWidth*20;
    //     }
    // }
  }
  function onColorUpdate(e){
    let color = e.target.getAttribute("data-color");
    color = color_mapping[color];
    current.color=color;
    $(".pick-color").css("background-color",color);
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color,data.lineWidth,data.tool);
  }


  function onResize() { 
    rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    // $(".whiteboard").attr("width",rect.width);
    // $(".whiteboard").attr("height",rect.height);
  }
  function hexToRgb(hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return {r,g,b};
  }

  function matchStartColor(pixelPos,startR,startG,startB)
  {
    let r = colorLayer.data[pixelPos];  
    let g = colorLayer.data[pixelPos+1];  
    let b = colorLayer.data[pixelPos+2];
    return (r == startR && g == startG && b == startB);
  }

  function colorPixel(pixelPos,fillColorR,fillColorG,fillColorB)
  {
    colorLayer.data[pixelPos] = fillColorR;
    colorLayer.data[pixelPos+1] = fillColorG;
    colorLayer.data[pixelPos+2] = fillColorB;
    colorLayer.data[pixelPos+3] = 255;
  }