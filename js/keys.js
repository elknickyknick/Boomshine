"use strict";
var myKeys = {};

myKeys.KEYBOARD = Object.freeze({
	"KEY_LEFT": 37, 
	"KEY_UP": 38, 
	"KEY_RIGHT": 39, 
	"KEY_DOWN": 40,
	"KEY_SPACE": 32,
	"KEY_SHIFT": 16
});
myKeys.keydown = [];


// event listeners
window.addEventListener("keydown",function(e){
	myKeys.keydown[e.keyCode] = true;
});
	
window.addEventListener("keyup",function(e){
	myKeys.keydown[e.keyCode] = false;
	
	// pausing and resuming
	var char = String.fromCharCode(e.keyCode);
	if (char == "p" || char == "P")
	{
		if (app.main.paused){
			app.main.resumeGame();
		} else {
			app.main.pauseGame();
		}
	}
	if(char == "d" || char =="D")
	{
		app.main.toggleDebug();
	}
});