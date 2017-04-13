"use script";
var app = app || {};

app.titlescreen = {
	WIDTH : 640, 
    HEIGHT: 480,
	canvas: undefined,
	ctx: undefined,
		
	init: function()
	{
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		var img = document.querySelector("#titleimg");
		app.titlescreen.ctx.fillStyle = img;
		this.ctx.drawImage(img, 0, 0);
	}
};