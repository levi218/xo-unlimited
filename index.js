// BASE SETUP
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var clients = [];
var publicWaitingPool = [];
var privateWaitingPool = [];
var gamePool = [];
// Socket.io
function matchGame(user1,user2,pool){
	var game = {"user1":user1, "user2":user2};
	gamePool.push(game);
	io.to(`${user1}`).emit('gameStart', game);
	io.to(`${user2}`).emit('gameStart', game);
	pool.splice(pool.indexOf(user1),1);
	pool.splice(pool.indexOf(user2),1);	
}
function cancelRequest(user,pool){
	if(pool.indexOf(user)!=-1){
  		pool.splice(pool.indexOf(user),1);	
  	}	
}
function tryMatchGame(){
	if(publicWaitingPool.length>1){
		// var game = {"user1":publicWaitingPool[0], "user2":publicWaitingPool[1]};
		// gamePool.push(game);
		// io.to(`${publicWaitingPool[0]}`).emit('gameStart', game);
		// io.to(`${publicWaitingPool[1]}`).emit('gameStart', game);
		// publicWaitingPool.splice(0,2);

		matchGame(publicWaitingPool[0],publicWaitingPool[1],publicWaitingPool);

	}
}



io.on('connection', socket => { 
	console.log(socket.id+" connected!");
	clients.push(socket.id);

  	socket.on('requestGame', () => { 
		publicWaitingPool.push(socket.id);
		tryMatchGame();
		console.log(publicWaitingPool.length+"   "+clients.length+"   "+gamePool.length);
  	});

  	socket.on('cancelRequest', () => {
  		cancelRequest(socket.id,publicWaitingPool);
  	});

  	socket.on('requestPrivateGame', (oppId) => {

  		if(clients.indexOf(oppId)!=-1){
	  		if(privateWaitingPool.indexOf(oppId)!=-1){
	  			matchGame(socket.id,oppId,privateWaitingPool);
	  		}else{
	  			privateWaitingPool.push(socket.id);
	  		}
  		}else{
  			io.to(`${socket.id}`).emit('playerNotConnected', 'This id is not connected');
  		}
  	});

  	socket.on('cancelRequestPrivate',() => {
  		cancelRequest(socket.id,privateWaitingPool);
  	});

  	socket.on('forfeit', game => {
  		var otherUser = game.user1==socket.id?game.user1:game.user2;
  		io.to(`${otherUser}`).emit('gameEndedUnexpectedly',"Other player forfeited, you won!");
  	})
  	socket.on('makeAMove', data => { 
  		console.log(data);
  		var opp;
  		if(data.game.user1==socket.id) opp = data.game.user2;
  		else opp = data.game.user1;
  		io.to(`${opp}`).emit('opponentMoved',data);
  	});

  	socket.on('disconnect', () => {
  		var terminatedGame = gamePool.find(function(game) { 
		  	return game.user1==socket.id||game.user2==socket.id;
		}); 
		if(terminatedGame){
			var otherUser = terminatedGame.user1==socket.id?terminatedGame.user1:terminatedGame.user2;

			io.to(`${otherUser}`).emit('gameEndedUnexpectedly',"Other player forfeited, you won!");
		}
		//publicWaitingPool.push(userWait);
		//tryMatchGame();
  		clients.splice(clients.indexOf(socket.id),1);
  		console.log(socket.id+' disconnected');

  	});
});
//Express.js
 app.use(express.static('public'));

app.get("/a", function(request, response){
   response.sendFile(__dirname + '/public/index.html');
});


var port = process.env.PORT || 3000;

http.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});