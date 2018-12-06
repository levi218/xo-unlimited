
var socket = io();
var thisPlayer;
var currentGame;

let board;

function setup() {
	setupUI();

	board = new Board(24);
	board.drawBoard();
	
    setupSocket();
}

function setupSocket(){
	socket.on('clientList', function (data) {
		clients = data;
		updateClientList(clients,divClients);
	});
	socket.on('clientJoined', function (data){
		clients.push(data);
		updateClientList(clients,divClients);
	});
	socket.on('clientLeft', function (data){
		if(clients.indexOf(data)!=-1){
			clients.splice(clients.indexOf(data),1);
			updateClientList(clients,divClients);
		}
	});
	
	socket.on('gameStart', function (game) {
	    currentGame = game;
	    if(currentGame.user1 == socket.id){
	    	thisPlayer = 1;
	    	txtStatus.html('You go first!');
	    }else {
	    	thisPlayer = 2;
	    	txtStatus.html('Waiting for your opponent to go first');
	    }
	    board.newGame();
	});

	socket.on('opponentMoved', function (data) {
		var player = board.turn%2+1;

		if(board.makeAMove(data.x,data.y,player)){
			if(board.isWon(player)){
				redraw();
				displayMessageOverlay((player==1?'X':'O')+" won!");
	  			board.isInGame = false;
			}
		}
		updateTurnStatus();
	});

	socket.on('playerNotConnected', function (msg) {
		alert(msg);
	});
	socket.on('gameEndedUnexpectedly', function (msg) {
		displayMessageOverlay(msg);
		txtStatus.html('Game ended');
		board.isInGame = false;
	});

	socket.emit('requestClientList');
}
function draw() {
  	if(board.isInGame){
		board.drawBoard();
		board.drawMarks();
	}
}

function mousePressed(){
	if(mouseButton===LEFT){

		if(!board.isInBoard(mouseX,mouseY)) return true;// quit if location not in board
		var player = board.turn%2+1;
		if(board.isInGame&&thisPlayer==player){
			var mouseLocation = board.localToGlobal(mouseX,mouseY);
			var x = floor(mouseLocation.x/board.cellW);
			var y = floor(mouseLocation.y/board.cellH);

			if(board.makeAMove(x,y,player)){
				socket.emit('makeAMove',
					{
						'game':currentGame,
						'x':x,
						'y':y
					}
				);
				if(board.isWon(player)){
					redraw();
					displayMessageOverlay((player==1?'X':'O')+" won!");
		  			board.isInGame = false;
				}
				updateTurnStatus();
			}
		}
	}
}
function mouseDragged(){
	if(mouseButton===RIGHT){
		if(!board.isInBoard(mouseX,mouseY)) return true; // quit if location not in board
		board.worldLocation.x += (mouseX-pmouseX);
		board.worldLocation.y += (mouseY-pmouseY);
	}
}

function mouseWheel(event){
	board.worldScale += 0.001*event.delta;
	board.worldLocation.x-=1*mouseX*0.001*event.delta
	board.worldLocation.y-=1*mouseY*0.001*event.delta
}
