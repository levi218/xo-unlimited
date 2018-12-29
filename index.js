// BASE SETUP
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const User = require('./public/user.js');

var clients = [];
var publicWaitingPool = [];
var privateWaitingPool = [];
var gamePool = [];
// Socket.io
function matchGame(user1,user2,pool){
  if(Math.random()<0.5)
    var game = {"user1":user1, "user2":user2};
  else
    var game = {"user1":user2, "user2":user1};
	gamePool.push(game);
	io.to(`${user1}`).emit('gameStart', game);
	io.to(`${user2}`).emit('gameStart', game);
	pool.splice(pool.indexOf(user1),1);
	pool.splice(pool.indexOf(user2),1);	
}
function matchPGame(user1,user2){
  if(Math.random()<0.5)
    var game = {"user1":user1, "user2":user2};
  else
    var game = {"user1":user2, "user2":user1};
  gamePool.push(game);
  io.to(`${user1}`).emit('gameStart', game);
  io.to(`${user2}`).emit('gameStart', game);
}
function cancelRequest(user,pool){
	if(pool.indexOf(user)!=-1){
  		pool.splice(pool.indexOf(user),1);	
  	}	
}
function tryMatchGame(){
	if(publicWaitingPool.length>1){
		matchGame(publicWaitingPool[0],publicWaitingPool[1],publicWaitingPool);
	}
}


io.on('connection', socket => { 
  	console.log(socket.id+" connected!");
    var newUser = new User(socket.id,""); 
    clients.push(newUser);
    io.emit('clientJoined',newUser);

    socket.on('playerNameChangeRequest', (name) => { 
      var existIndex = clients.findIndex(x=>x.name==name||x.id==name);
      if(existIndex==-1){
        var clIndex = clients.findIndex(x=>x.id == socket.id);
        clients[clIndex].name = name;
        socket.emit('playerNameChangeResponse',true);
        //can be improve by sending only the object, not the whole list
        io.emit('clientList',clients);         
      }else{
        socket.emit('playerNameChangeResponse',false);       
      }
    });

    socket.on('requestClientList', () => { 
      socket.emit('clientList',clients);
    });

  	socket.on('requestGame', () => { 
      if(publicWaitingPool.indexOf(socket.id)==-1){
  		  publicWaitingPool.push(socket.id);
    		tryMatchGame();
      }
  	});

  	socket.on('cancelRequest', () => {
  		cancelRequest(socket.id,publicWaitingPool);
  	});

  	socket.on('requestPrivateGame', (oppId) => {
      if(publicWaitingPool.indexOf(socket.id)==-1){
        var socketOppId = clients.findIndex(x=>(x.id==oppId||x.name==oppId))
    		if(socketOppId!=-1){
          var opp = clients[socketOppId];
  	  		io.to(`${opp.id}`).emit('privateGameInvitation', socket.id);
    		}else{
    			io.to(`${socket.id}`).emit('playerNotConnected', 'This id is not connected');
    		}
      }
  	});

    socket.on('privateGameAccepted',(oppId)=>{
      var game = {"user1":socket.id, "user2":oppId};
      matchPGame(socket.id,oppId);
    });

  	socket.on('cancelRequestPrivate',() => {
  		cancelRequest(socket.id,privateWaitingPool);
  	});
    //when 1 player leaves the game
  	socket.on('forfeit', game => {
  		var otherUser = game.user1==socket.id?game.user2:game.user1;
      io.to(`${otherUser}`).emit('gameEndedUnexpectedly',"Other player forfeited, you won!");
      io.to(`${socket.id}`).emit('gameEndedUnexpectedly',"You lost!");
  	})
  	socket.on('makeAMove', data => { 
  		console.log(data);
  		var opp;
  		if(data.game.user1==socket.id) opp = data.game.user2;
  		else opp = data.game.user1;
  		io.to(`${opp}`).emit('opponentMoved',data);
  	});
    //passing message between players
    socket.on('message',function(content,game){
      var clIndex = clients.findIndex(x=>x.id == socket.id);
      var cl = clients[clIndex];
      var mess = (cl.name!=""?cl.name:cl.id)+": "+content;
      if(game){
        io.to(`${game.user1}`).emit('message', mess);
        io.to(`${game.user2}`).emit('message', mess);
      }else{
        io.emit('message',mess);
      }
    });
  	socket.on('disconnect', () => {
  		var terminatedGame = gamePool.find(function(game) { 
		  	return game.user1==socket.id||game.user2==socket.id;
		  }); 
  		if(terminatedGame){
  			var otherUser = terminatedGame.user1==socket.id?terminatedGame.user2:terminatedGame.user1;

  			io.to(`${otherUser}`).emit('gameEndedUnexpectedly',"Other player forfeited, you won!");
  		}


			var cl = clients.splice(clients.findIndex(x=>x.id==socket.id),1);
  		console.log(socket.id+' disconnected');
      io.emit('clientLeft',socket.id);

  	});
});
//Express.js
 app.use(express.static('public'));

app.get("/", function(request, response){
   response.sendFile(__dirname + '/public/index.html');
});


var port = process.env.PORT || 80;

http.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});