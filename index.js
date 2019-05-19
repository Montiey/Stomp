const express = require("express");
const socket = require("socket.io");
var app = express();
const staticDir = "./pub/";
const port = 8787;

var players = [];
function Player(id){
	this.xPos = 0;
	this.yPos = 0;
	this.xVel = 0;
	this.yVel = 0;
	this.id = id;
}

var server = app.listen(port, function(){
	console.log("Stop server started on port " + port);
});

var sock = socket(server);

app.use(express.static(staticDir));

sock.on("connection", function(socket){
	console.log("Got socket " + socket.id);
	socket.emit("selfID", socket.id);
	players.push(new Player(socket.id));
	console.log("Now have " + players.length + " players");

	socket.on("userData", function(data){
		// console.log("Got data [" + socket.id + "]: " + JSON.stringify(data));

		for(var p of players){
			if(p.id === socket.id){
				p.xPos = data.xPos;
				p.yPos = data.yPos;
				p.xVel = data.xVel;
				p.yVel = data.yVel;
			}
		}
		socket.emit("playerData", players);
	});

	socket.on("disconnect", function(){
		for(var i = 0; i < players.length; i++){
			if(players[i].id === socket.id){
				players.splice(i, i+1);
			}
		}
	})
});
