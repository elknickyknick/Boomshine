"use strict";
var app = app || {};

app.main = {
	//---PROPERTIES---//
    WIDTH : 640, 
    HEIGHT: 480,
    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, 
    debug: true,
	
	CIRCLE: {
		num_at_start: 5,
		num_at_end: 60,
		start_radius: 20,
		max_radius: 45,
		min_radius: 2,
		max_lifetime: 2.5,
		max_speed: 80,
		explosion_speed: 60,
		implosion_speed: 84
	},
	colors: ["#FD5B78", "#FF6037", "#FF9966", "#FFFF66", "#66FF66", "#50BFE6", "#FF6EFF", "#EE34D2"],
	CircleState: {
		NORMAL: 0, 		
		EXPLODING: 1,	
		max_size: 2,	
		IMPLODING: 3,
		DONE: 4
	},
	GameState: {
		BEGIN: 0,
		DEFAULT: 1,
		EXPLODING: 2,
		ROUND_OVER: 3,
		REPEAT_LEVEL: 4,
		END: 5
	},
	gameState: undefined,
	roundScore: 0,
	totalScore: 0,
	currentLevel: undefined,
	currentGoal: undefined,
	
	//---for sound
	sound: undefined,
	bgAudio: undefined,
	effectAudio: undefined,
	currentEffect: 0,
	currentDirection: 1,
	effectSounds: ["1.mp3","2.mp3","3.mp3","4.mp3","5.mp3","6.mp3","7.mp3","8.mp3"], 
	
	//---constants
	circles: new Array(),
	numCircles: this.circles_at_start,
	paused: false,
	animationID: 0,
	
    //---METHODS---//
	init : function() 
	{
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		this.gameState = this.GameState.BEGIN;
		
		this.currentLevel = 1;
		this.numCircles = this.CIRCLE.num_at_start;
		this.circles = this.makeCircles(this.numCircles);
		this.setGoals();
		
		//---setting up the begining sound states
		this.bgAudio = document.querySelector("#bgAudio");
		this.bgAudio.volume = 0.25;
		this.effectAudio = document.querySelector("#effectAudio");
		this.effectAudio.volume = 0.3;
		
		//---hooking up the events
		this.canvas.onmousedown = this.doMousedown.bind(this);
		// start the game loop
		this.update();
	},
	reset: function()
	{
		this.currentLevel += 1;
		this.numCircles += 5;
		this.roundScore = 0;
		this.circles = this.makeCircles(this.numCircles);
	},
	restart: function()
	{
		this.currentLevel = 1;
		this.numCircles = this.CIRCLE.num_at_start;
		this.roundScore = this.totalScore = 0;
		this.circles = this.makeCircles(this.numCircles);
	},
	repeat: function()
	{
		this.currentLevel = this.currentLevel;
		this.numCircles = this.numCircles;
		this.roundScore = 0;
		this.totalScore = this.totalScore;
		this.ctx.globalAlpha = 0.5;
		this.circles = this.makeCircles(this.numCircles);
	},
	update: function()
	{
		// 1) LOOP
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
		if(this.paused)
		{
			this.drawPauseScreen(this.ctx);
			return;
		}
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
	 	//---move circles
		this.moveCircles(dt);
	 	this.checkForCollisions();
		//5. draw
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); 
	
		// ii) draw circles
		this.ctx.globalAlpha = 0.9;
		this.drawCircles(this.ctx);
		
		// iii) draw HUD
		this.ctx.globalAlpha = 1.0;
		this.drawHUD(this.ctx);
		
		// iv) draw debug info
		if (this.debug)
		{
			this.fillText(this.ctx, "current level: " + this.currentLevel, 8, this.HEIGHT - 30, "18pt courier", "yellow");
			this.fillText(this.ctx, "current goal: " + this.currentGoal + " circles", 8, this.HEIGHT-10, "18pt courier", "yellow");
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
		
		//---6) check for cheats
		//---if we're on the start screen or round_over screen....
		if(this.gameState == this.GameState.BEGIN || this.gameState == this.GameState.ROUND_OVER)
		{
			//  ...if shift key and up-arrow are both down
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT])
			{
				this.totalScore ++;
				this.sound.playEffect();
			}
		}
		this.setGoals();
	},
	
	
	makeCircles: function(num)
	{
		var circleDraw = function(ctx)
		{
			ctx.save();
				ctx.beginPath();
					ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
				ctx.closePath();
				ctx.fillStyle = this.fillStyle;
				ctx.fill();
			ctx.restore();
		};
		//---a method to move them around
		var circleMove = function(dt)
		{
			this.x += this.xSpeed * this.speed * dt;
			this.y += this.ySpeed * this.speed * dt;
		}
		
		var array = [];
		for(var i=0; i<num; i++)
		{
			//---making a new object literal
			var c = {};
			c.x = getRandom(this.CIRCLE.start_radius*2, this.WIDTH - this.CIRCLE.start_radius*2);
			c.y = getRandom(this.CIRCLE.start_radius*2, this.HEIGHT - this.CIRCLE.start_radius*2);
			c.radius = this.CIRCLE.start_radius;
			
			var randomVector = getRandomUnitVector();
			c.xSpeed = randomVector.x;
			c.ySpeed = randomVector.y;
			
			c.speed = this.CIRCLE.max_speed;
			c.fillStyle = this.colors[i % this.colors.length];
			c.state = this.CircleState.NORMAL;
			c.lifetime = 0;
			
			c.draw = circleDraw;
			c.move = circleMove;
			Object.seal(c);
			array.push(c);
		}
		return array;
	},
	drawCircles: function(ctx)
	{
		if(this.gameState == this.GameState.ROUND_OVER || this.gameState == this.GameState.END)
		{
			this.ctx.globalAlpha = 0.25;
		}
		for(var i=0; i<this.circles.length; i++)
		{
			var c = this.circles[i];
			if(c.state == this.CircleState.DONE)
			{
				continue;
			}
			c.draw(ctx);
		}
	},
	moveCircles: function(dt)
	{
		for(var i=0; i<this.circles.length; i++)
		{
			var c = this.circles[i];
			if(c.state === this.CircleState.DONE)
			{
				continue;
			}
			if(c.state === this.CircleState.EXPLODING)
			{
				c.radius += this.CIRCLE.explosion_speed * dt;
				if(c.radius >= this.CIRCLE.max_radius)
				{
					c.state = this.CircleState.max_size;
				}
				continue;
			}
			if(c.state === this.CircleState.max_size)
			{
				c.lifetime += dt;
				if(c.lifetime >= this.CIRCLE.max_lifetime)
				{
					c.state = this.CircleState.IMPLODING;
				}
				continue;
			}
			if(c.state === this.CircleState.IMPLODING)
			{
				c.radius -= this.CIRCLE.implosion_speed * dt;
				if(c.radius <= this.CIRCLE.min_radius)
				{
					c.state = this.CircleState.DONE;
					continue;
				}
			}
			c.move(dt);
			//---checking for boundaries with other methods
			if(this.circleHitLeftRight(c))
			{
				c.xSpeed *= -1;
				c.move(dt);
			}
			if(this.circleHitTopBot(c))
			{
				c.ySpeed *= -1;
				c.move(dt);
			}
		}
	},
	checkForCollisions: function()
	{
		if(this.gameState == this.GameState.EXPLODING)
		{
			for(var i=0; i<this.circles.length; i++)
			{
				var c1 = this.circles[i];
				if(c1.state === this.CircleState.NORMAL)
				{
					continue;
				}
				if(c1.state === this.CircleState.DONE)
				{
					continue;
				}
				for(var j=0; j < this.circles.length; j++)
				{
					var c2 = this.circles[j];
					if(c1 === c2)
					{
						//---if the two circles are the same, dont check collisions
						continue;
					}
					if(c2.state != this.CircleState.NORMAL)
					{
						//---if c2 is exploding, dont check
						continue;
					}
					if(c2.state === this.CircleState.DONE)
					{
						//---if c2 is already dead, dont check
						continue;
					}
					//---actually collision checking
					if(circlesIntersect(c1,c2))
					{
						c2.state = this.CircleState.EXPLODING;
						c2.xSpeed = c2.ySpeed = 0;
						this.sound.playEffect();
						this.roundScore++;
					}
				}
				
			}
			var isOver = true;
			for(var i=0; i<this.circles.length; i++)
			{
				var c = this.circles[i];
				if(c.state != this.CircleState.NORMAL && c.state != this.CircleState.DONE)
				{
					isOver = false;
					break;
				}
			}
			if(isOver)
			{
				this.stopBGAudio();
				if(this.roundScore >= this.currentGoal)
				{
					this.gameState = this.GameState.ROUND_OVER;
					this.totalScore += this.roundScore;
					
				}
				if(this.roundScore < this.currentGoal)
				{
					this.gameState = this.GameState.REPEAT_LEVEL;
					this.totalScore = this.totalScore;
				}
				if(this.numCircles >= this.CIRCLE.num_at_end)
				{
					this.gameState = this.GameState.END;
					//this.gameState = this.GameState.REPEAT_LEVEL;
				}
			}
		}
	},
	//---circle bounding boxes
	circleHitLeftRight: function(c)
	{
		if(c.x < c.radius || c.x > this.WIDTH - c.radius)
		{
			return true;
		}
	},
	circleHitTopBot: function(c)
	{
		if(c.y < c.radius || c.y > this.HEIGHT - c.radius)
		{
			return true;
		}
	},
	
	drawPauseScreen: function(ctx)
	{
		ctx.save();
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "... PAUSED ... ", this.WIDTH/2, this.HEIGHT/2, "40pt courier", "white");
		ctx.restore();
	},
	pauseGame: function()
	{
		this.paused = true;
		//---stops the animation from going on
		cancelAnimationFrame(this.animationID);
		//---this update only calls the pause BECAUSE PAUSE IS NOW TRUE
		this.stopBGAudio();
		this.update();
	},
	resumeGame: function()
	{
		cancelAnimationFrame(this.animationID);
		this.paused = false;
		this.sound.playBGAudio();
		this.update();
	},
	
	doMousedown: function(e)
	{
		this.sound.playBGAudio();
		if(this.paused)
		{
			this.paused = false;
			this.update();
			return;
		};
		if(this.gameState == this.GameState.EXPLODING)
		{
			return;
		}
		if(this.gameState == this.GameState.ROUND_OVER)
		{
			this.gameState = this.GameState.DEFAULT;
			this.reset();
			return;
		}
		if(this.gameState == this.GameState.REPEAT_LEVEL)
		{
			this.gameState = this.GameState.DEFAULT;
			this.repeat();
			return;
		}
		if(this.gameState == this.GameState.END)
		{
			this.gameState = this.GameState.DEFAULT;
			this.restart();
			return;
		}
		var mouse = getMouse(e);
		this.checkCircleClick(mouse);
	},
	checkCircleClick: function(mouse)
	{
		for(var i = this.circles.length -1; i>=0; i--)
		{
			var c = this.circles[i];
			if(pointInsideCircle(mouse.x, mouse.y, c))
			{
				c.xSpeed = c.ySpeed = 0;
				c.state = this.CircleState.EXPLODING;
				this.gameState = this.GameState.EXPLODING;
				this.roundScore++;
				this.sound.playEffect();
				break;
			}
		}
	},
	
	drawHUD: function(ctx)
	{
		ctx.save();
			this.fillText(this.ctx, "This round: " + this.roundScore + " of " + this.numCircles, 20, 20, "14pt courier", "#dddddd");
			this.fillText(this.ctx, "Total score: " + this.totalScore, this.WIDTH - 200, 20, "14pt courier", "#dddddd"); 
		
			if(this.gameState == this.GameState.BEGIN)
			{
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				this.fillText(this.ctx, "To begin, click a circle.", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "white");
			}
			if(this.gameState == this.GameState.ROUND_OVER)
			{
				ctx.save();
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					this.fillText(this.ctx, "Round Over", this.WIDTH/2, this.HEIGHT/2 - 40, "30pt courier", "red");
					this.fillText(this.ctx, "Click to Continue", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");
					this.fillText(this.ctx, "Next round, there are " + (this.numCircles + 5) + " circles", this.WIDTH/2, this.HEIGHT/2+40, "20pt courier", "white");
			}
			if(this.gameState == this.GameState.REPEAT_LEVEL)
			{
				ctx.save();
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					this.fillText(this.ctx, "Goal was not met...", this.WIDTH/2, this.HEIGHT/2-22, "30pt courier", "white");
					this.fillText(this.ctx, "Click to restart level.", this.WIDTH/2, this.HEIGHT/2 + 15, "25pt courier", "white");
			}
			if(this.gameState == this.GameState.END)
			{
				ctx.save();
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					this.fillText(this.ctx, "GAME OVER", this.WIDTH/2, this.HEIGHT/2-86, "36pt courier", "red");
					this.fillText(this.ctx, "Score: " + this.totalScore, this.WIDTH/2, (this.HEIGHT/2)-50, "30pt courier", "white");
					this.fillText(this.ctx, "Click to restart game.", this.WIDTH/2, this.HEIGHT/2 + 40, "23pt courier", "white");
			}		
		ctx.restore();
	},
	fillText: function(ctx, string, x, y, css, color)
	{
		ctx.save();
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function()
	{
		var now,fps;
		now = (+new Date); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	
	stopBGAudio: function()
	{
		this.sound.stopBGAudio();
	},
	playEffect: function()
	{
		this.effectAudio.src = "media/" + this.effectSounds[this.currentEffect];
		this.effectAudio.play();
		
		this.currentEffect += this.currentDirection;
		if(this.currentEffect == this.effectSounds.length || this.currentEffect == -1)
		{
			this.currentDirection *= -1;
			this.currentEffect += this.currentDirection;
		}
	},
	
	toggleDebug: function()
	{
		if(this.debug)
		{
			this.debug = false;
		}
		else
		{
			this.debug = true;
		}
	},
	setGoals: function()
	{
		if(this.currentLevel >= 1)
		{
			this.currentGoal = Math.floor(this.numCircles/5);
		}
		if(this.currentLevel >= 4)
		{
			this.currentGoal = Math.floor(this.numCircles/2);
		}
		if(this.currentLevel >= 8)
		{
			this.currentGoal = Math.floor(this.numCircles - 10);
		}
		if(this.currentLevel >= 11)
		{
			this.currentGoal = Math.floor(this.numCircles);
		}
	}
}; // end app.main