const express = require("express");
const socket = require("socket.io");
var app = express();
const staticDir = "./pub/";
const port = 8002;

var players = [];
function Player(id){
	this.xPos = 0;
	this.yPos = 0;
	this.xVel = 0;
	this.yVel = 0;
	this.id = id;
	this.lastSeenTime = Date.now();
}

var lastWinTime = Date.now();
var beginDelay = 1000;
var playerTimeOut = 2000;


function removePlayer(id){
	for(var i = 0; i < players.length; i++){
		if(players[i].id === id){
			players.splice(i, i+1);
		}
	}
}



var server = app.listen(port, function(){
	console.log("Stomp server started on port " + port);
});

var sockServer = socket(server);

app.use(express.static(staticDir));

sockServer.on("connection", function(socket){
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
				p.lastSeenTime = Date.now();
				break;
			}
		}
		socket.emit("playerData", players);
		
		//Check for wins
		if(Date.now() - lastWinTime > beginDelay)
		outer: for(var test of players){	//TODO: more efficent test
			for(var subj of players){
				if(Math.abs(test.xPos - subj.xPos) < 50){
					if(Math.abs(test.yPos - subj.yPos) < 50){
						if(test.yPos == subj.yPos){
						} else{
							lastWinTime = Date.now();
							var winner = (test.yPos > subj.yPos ? subj.id : test.id);
							var loser = winner == test.id ? subj.id : test.id;
							console.log("Loser: " + loser + " winner: " + winner);
							sockServer.emit("win", {
								winnerID: winner,
								loserID: loser
								
							});
							setTimeout(function(){
								sockServer.emit("begin", {});
							}, beginDelay);
							break outer;
						}
					}
				}
			}
		}
	});

	socket.on("disconnect", function(){
		console.log("Player soft disconnect");
		removePlayer(socket.id);
	});
});

process.on("SIGINT", function(){
	sockServer.emit("refresh", {});
});

setInterval(function(){
	var now = Date.now();
	//console.log(now);
	for(var p of players){
		//console.log(p.id + " " + (now - p.lastSeenTime));
		if(now - p.lastSeenTime > playerTimeOut){
			console.log("Player hard disconnect");
			removePlayer(p.id);
			break;
		}
	}
}, 500);	//TODO: Quicker check?
