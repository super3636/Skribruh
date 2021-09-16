var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;
var curColor = "#cb3594";
var clickColor = new Array();
var clickSize = new Array();
var curSize = 5;
var clickSize = new Array();
var curTool = "Crayon";

$(document).ready(function(){
	var canvasDiv = document.getElementById('canvasDiv');
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', 500);
	canvas.setAttribute('height', 300);
	canvas.setAttribute('id', 'canvas');
	canvasDiv.appendChild(canvas);
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas = G_vmlCanvasManager.initElement(canvas);
	}
	context = canvas.getContext("2d");
	rect = canvas.getBoundingClientRect();
	$('#canvas').mousedown(function(e){
  	var mouseX = e.pageX - this.offsetLeft;
  	var mouseY = e.pageY - this.offsetTop;	
  	paint = true;
  	addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
  	redraw();
	});
	$('#canvas').mousedown(function(e){
	  var mouseX = e.pageX - this.offsetLeft;
	  var mouseY = e.pageY - this.offsetTop;
	  paint = true;
	  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	  redraw();
	});
	$('#canvas').mousemove(function(e){
	  if(paint){
	    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
	    redraw();
	  }
	})
	$('#canvas').mouseup(function(e){
  		paint = false;
	});
	$('#canvas').mouseleave(function(e){
	  paint = false;
	});
	$("body").on("click",".color",function(e){
		let color = $(this).data("color");
		curColor = color;
	})
	$("body").on("click",".size-button",function(e){
		let size = $(this).data("size");
		curSize = size;
	})
	$("body").on("click",".tool-button",function(e){
		let size = $(this).data("tool");
		curTool = size;
	})
})

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
  //clickColor.push(curColor);
  clickSize.push(curSize);
  if(curTool == "eraser"){
    clickColor.push("white");
  }else{
    clickColor.push(curColor);
  }
}

function redraw(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  context.lineJoin = "round";
  for(var i=0; i < clickX.length; i++) {		
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.strokeStyle = clickColor[i];
     context.lineWidth = clickSize[i];
     context.stroke();
  }
}