const gravity = new Two.Vector(0, .5);

const pWidth = 50;
const pHeight = 50;

const pJumpFactor = 30;

const pHAcc = 2;

const pMaxHSpeed = 10;

const pJumps = 2;

var players = [	//Players that are not the user
];

const server = "http://localhost";
const port = 8787;
var socketID = "";
var sock = io.connect(server + ":" + port);
sock.on("selfID", function(data){
	console.log("Received id: " + data);
	socketID = data;
});

function sendUserData(){
	sock.emit("userData", {
		xPos: players[0].pos.x,
		yPos: players[0].pos.y,
		xVel: players[0].vel.x,
		yVel: players[0].vel.y
	});
}

setInterval(sendUserData, 30);

////////

var world = {
	draw: function(){
		players[0].userPhysics();
		for(var player of players){
			player.physics();

			player.group.translation.set(player.pos.x, player.pos.y);
		}


    }
};

var two = new Two({
	type: Two.Types["svg"],
	autostart: true,
	width: 800,
	height: 600
}).appendTo(document.getElementById("canvasContainer")).bind("update", world.draw).play();
two.renderer.domElement.setAttribute("id", "canvas");


function Player(){
	this.elem = two.makeRectangle(0, 0, pWidth, pHeight);
	this.group = two.makeGroup(this.elem);

	this.elem.noStroke();

	this.pos = new Two.Vector(two.width/2, two.height/2);
	this.vel = new Two.Vector(0, 0);
	this.acc = new Two.Vector(0, 0);	//internals only

	this.jumps = pJumps;
	this.movingRight = false;
	this.movingLeft = false;

	this.userPhysics = function(){
		if(this.movingRight && !this.movingLeft){
			this.acc.x = pHAcc;
		} else if(this.movingLeft && !this.movingRight){
			this.acc.x = -pHAcc;
		} else{
			var dir = Math.sign(this.vel.x);
			this.acc.x = -pHAcc * dir;
			if(Math.abs(this.acc.x) > Math.abs(this.vel.x)){	//if it'd bounce on its own friction
				this.acc.x = 0;
				this.vel.x = 0;
			}
		}
	}

	this.physics = function(){
		this.vel.addSelf(gravity);
		this.vel.addSelf(this.acc);

		if(Math.abs(this.vel.x) > pMaxHSpeed){
			var dir = Math.sign(this.vel.x);
			this.vel.x = dir * pMaxHSpeed;
		}

		this.pos.addSelf(this.vel);

		if(this.pos.y + pHeight/2 > two.height){
			this.jumps = pJumps;
			this.vel.y = 0;
			this.pos.y = two.height - pHeight/2;
		}
		if(this.pos.y - pHeight/2 < 0){
			this.vel.y = 0;
			this.pos.y = pHeight/2;
		}
		if(this.pos.x - pWidth/2 < 0){
			this.vel.x = 0;
			this.pos.x = pWidth/2;
		}
		if(this.pos.x + pWidth/2 > two.width){
			this.vel.x = 0;
			this.pos.x = two.width - pWidth/2;
		}
	}

	this.jump = function(){
		if(!this.jumps) return;
		this.jumps--;
		this.vel.y = -pJumpFactor * gravity.y;
	}

	this.destroy = function(){
		two.remove(this.group);
		var i = players.indexOf(this);
		players.splice(i, i+1);
	}

	players.push(this);
}

////////

sock.on("playerData", function(data){
	for(var i = 1; i < players.length; i++){
		players[i].destroy();
	}
	for(var player of data){
		if(player.id === socketID){
			//We already have this user at [0]
		} else{
			var p = new Player();
			p.pos.x = player.xPos;
			p.pos.y = player.yPos;
			p.vel.x = player.xVel;
			p.vel.y = player.yVel;
		}
	}
});

////////

document.addEventListener("keydown", function(e){
	var valid = false;
	if(e.key == "a" && !e.repeat){
		players[0].movingLeft = true;
	}
	if(e.key == "d" && !e.repeat){
		players[0].movingRight = true;
	}
	if(e.key == " " && !e.repeat){
		players[0].jump();
	}
});

document.addEventListener("keyup", function(e){
	if(e.key == "a" && !e.repeat){
		players[0].movingLeft = false;
	}

	if(e.key == "d" && !e.repeat){
		players[0].movingRight = false;
	}
});

////////

new Player().elem.fill = "#ff0";
