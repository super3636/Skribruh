var rand_eye=0;
var rand_mouth=0;
var rand_color=0;
$(document).ready(function(){
	const eyes = 31;
	const colors = 18;
	const mouths = 24
	const specials = 5;
	rand_eye = Math.floor(Math.random()*eyes);
	let eyePos = getPosition(rand_eye,-96);
	$(".user-eyes").css("background-position",`${eyePos.left} ${eyePos.top}`);
	rand_color = Math.floor(Math.random()*colors);
	let colorPos = getPosition(rand_color,-96);
	$(".user-color").css("background-position",`${colorPos.left} ${colorPos.top}`);
	rand_mouth = Math.floor(Math.random()*mouths);
	let mouthPos = getPosition(rand_mouth,-96);
	$(".user-mouth").css("background-position",`${mouthPos.left} ${mouthPos.top}`);
	$("body").on("click",".avatarArrowLeft",function(){
		let index = $(this).data("index");
		if(index=="1")
		{
			rand_eye = rand_eye-1>-1?rand_eye-1:eyes-1;
			let {top,left} = getPosition(rand_eye,-96);
			$(".user-eyes").css("background-position",`${left} ${top}`);
		}
		else if(index=="2")
		{
			rand_mouth = rand_mouth-1>-1?rand_mouth-1:mouths-1;
			let {top,left} = getPosition(rand_mouth,-96);
			$(".user-mouth").css("background-position",`${left} ${top}`);
		}
		else if(index=="3")
		{
			rand_color = rand_color-1>-1?rand_color-1:colors-1;
			let {top,left} = getPosition(rand_color,-96);
			$(".user-color").css("background-position",`${left} ${top}`);
		}
	})
	$("body").on("click",".avatarArrowRight",function(){

		let index = $(this).data("index");
		if(index=="1")
		{
			rand_eye = (rand_eye+1)%eyes;
			let {top,left} = getPosition(rand_eye,-96);
			$(".user-eyes").css("background-position",`${left} ${top}`);
		}
		else if(index=="2")
		{
			rand_mouth = (rand_mouth+1)%mouths;
			console.log(rand_mouth);
			let {top,left} = getPosition(rand_mouth,-96);
			$(".user-mouth").css("background-position",`${left} ${top}`);
		}
		else if(index=="3")
		{
			rand_color = (rand_color+1)%colors;
			let {top,left} = getPosition(rand_color,-96);
			$(".user-color").css("background-position",`${left} ${top}`);
		}
	})
})

function getPosition(rad,num){
	let top = `${parseInt(rad/10)*num}px`;
	let left = `${parseInt(rad%10)*num}px`;
	return {left,top};
}