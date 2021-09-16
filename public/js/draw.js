// var drawing = false;
// var current = {
//     tool:'pen',
//     color: '#000000',
//     lineWidth:10
// };

// $(document).ready(function(){
// 	 	canvas = document.getElementsByClassName("whiteboard")[0];
//     context = canvas.getContext('2d');
//     rect = canvas.getBoundingClientRect();
//           canvas.addEventListener('mousedown', onMouseDown, false);
//           canvas.addEventListener('mouseup', onMouseUp, false);
//           canvas.addEventListener('mouseout', onMouseUp, false);
//           canvas.addEventListener('mousemove',onMouseMove, 10, false);
//           canvas.addEventListener('touchstart', onMouseDown, false);
//           canvas.addEventListener('touchend', onMouseUp, false);
//           canvas.addEventListener('touchcancel', onMouseUp, false);
//           canvas.addEventListener('mousewheel', onScroll, false);
//           canvas.addEventListener('touchmove', onMouseMove, 10, false);
//           //socket.on('drawing', onDrawingEvent);
//           // for (var i = 0; i < colors.length; i++){
//           //     colors[i].addEventListener('click', onColorUpdate, false);
//           // }
//           window.addEventListener('resize', onResize, false);
//           onResize();
// })


// function drawLine(x0, y0, x1, y1, color,lineWidth,tool, emit){
//         context.beginPath();
//         context.moveTo(x0, y0);
//         context.lineTo(x1, y1);
//         context.strokeStyle = color;
//         context.lineCap = "round";
//         context.lineWidth = lineWidth;
//         context.stroke();
//         context.closePath();
// }
  
//   function onMouseDown(e){
//       drawing = true;
//       current.x = (e.pageX - this.offsetLeft);
//       current.y = (e.pageY - this.offsetTop);
// }	


//   function onMouseUp(e){
//     if (!drawing) { return; }
//     drawing = false;
//     let newX = e.pageX - this.offsetLeft;
//     let newY = e.pageY - this.offsetTop;
//     drawLine(current.x, current.y, newX, newY, current.color,current.lineWidth,current.tool, true);
//   }

//   function onMouseMove(e){
//     if (!drawing) { return; }
//     let newX = e.pageX - this.offsetLeft;
//     let newY = e.pageY - this.offsetTop;
//     console.log(this.offsetLeft); 
//     drawLine(current.x, current.y,newX, newY, current.color,current.lineWidth,current.tool, true);
//     current.x = newX;
//     current.y = newY;
//   }

//   function onScroll(e){
//     e.preventDefault();
//   }
//   function onColorUpdate(e){
//     let color = e.target.getAttribute("data-color");
//     color = color_mapping[color];
//     current.color=color;
//     $(".pick-color").css("background-color",color);
//   }


//   // function throttle(callback, delay) {
//   //   var previousCall = new Date().getTime();
//   //   return function() {
//   //     var time = new Date().getTime();
//   //     if ((time - previousCall) >= delay-100) {
//   //       previousCall = time;
//   //       callback.apply(null, arguments);
//   //     }
//   //   };
//   // }

//   function onDrawingEvent(data){
//     var w = canvas.width;
//     var h = canvas.height;
//     drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color,data.lineWidth,data.tool);
//   }
//   function onResize() { 
//     rect = canvas.getBoundingClientRect();
//     canvas.width = rect.width;
//     canvas.height = rect.height;
//   }