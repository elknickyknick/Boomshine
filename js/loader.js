"use strict";
var app = app || {};


window.onload = function()
{
	console.log("window.onload called");
	var img = document.querySelector("#titleimg");
	app.titlescreen.init();
	document.querySelector("#startbutton").onclick = function()
	{
		document.querySelector("#startbutton").style.display = "none";
		app.sound.init();
		app.main.sound = app.sound;
		app.main.init();
		window.onblur = function()
		{
			console.log("blur at " + Date());
			app.main.pauseGame();
		};
		window.onfocus = function()
		{
			console.log("focused at " + Date());
			app.main.resumeGame();
		};
	}
};


	