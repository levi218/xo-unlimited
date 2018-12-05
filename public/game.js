var board;
var boardSize = 24;
var worldLocation;
var worldScale;
var cellH;
var cellW;
var turn = 0;
var isInGame = false;
var thisPlayer;
var currentGame;
var socket = io();
function createArray(w,h){
	var result = new Array(h);
	for(var i = 0;i<h;i++){
		result[i] = Array(w).fill(0);
	}
	return result;
}
var btnRequestGame;
var txtFriendId;
var btnRequestPrivateGame;
var txtStatus;
var txtName;
var lastMove;
var divClients;
var clients = [];
function setup() {
	var divGameHolder = createDiv('');
	var divId = createDiv('');
	divId.style('margin','15px');

	var txtMyId = createElement('span',"Your id: <b>"+socket.id+"</b>");

	txtName = createInput();
	divId.child(txtMyId);
	divId.child(createElement('span', ' or use a nickname: '));
	divId.child(txtName);

	var divFind = createDiv(''); 
	btnRequestGame = createButton('Find game');
	btnRequestGame.mousePressed(()=>{
		if(isInGame){
			socket.emit('forfeit',game);
		}
		socket.emit('requestGame');	
		txtStatus.html('Finding game...');
	});
	divFind.child(btnRequestGame);
	divFind.child(createElement('span','    OR    '));

	var divGoPrivate = createElement('span');
	
	btnRequestPrivateGame = createButton('Go Private Game');
	btnRequestPrivateGame.mousePressed(()=>{
		if(isInGame){
			socket.emit('forfeit',game);
		}
		socket.emit('requestPrivateGame',txtFriendId.value());	
		txtStatus.html('Waiting for partner...');
	});
	divGoPrivate.child(btnRequestPrivateGame);
	txtFriendId = createInput();
	divGoPrivate.child(createElement('span',' with id '));
	divGoPrivate.child(txtFriendId);

	divFind.child(divGoPrivate);
	divFind.style('margin','15px');

	var divStatus = createDiv('');
	divStatus.style('margin','20px');
	txtStatus = createElement('span','Welcome to X-O Unlimited');
	txtStatus.style('margin','20px');
	txtStatus.parent(divStatus);


	var canvas = createCanvas(600,600);
	canvas.style('border','2px solid #FFF');
	canvas.style('margin-bottom','15px');
	canvas.id('canvas');
	disableRightClickContextMenu(document.getElementById('canvas'));
	divGameHolder.child(divId);
	divGameHolder.child(divFind);
	divGameHolder.child(divStatus);
	divGameHolder.child(canvas);
	divGameHolder.parent('game_holder');

	divClients = createDiv('');
	divClients.parent('client_list');

	cellH = height/12;
	cellW = width/12;
	worldLocation = createVector(-cellW*boardSize/2,-cellH*boardSize/2);
    worldScale = 1.0;
	drawBoard();
	
    setupSocket();
}
function updateClientList(data, view){
	var content = "<ul>";
	for(var i =0;i<data.length;i++){
		content+="<li>";
		content+=data[i];
		content+="</li>";
	}
	content+="</ul>";
	view.html(content);
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
	    newGame();
	});

	socket.on('opponentMoved', function (data) {
		var player = turn%2+1;
		lastMove = createVector(data.x,data.y);
		board[data.y][data.x]=player;
		if(isWon(player)){
			redraw();
			displayMessageOverlay((player==1?'X':'O')+" won!");
  			isInGame = false;

		}
		turn ++;
		updateTurnStatus();
	});

	socket.on('playerNotConnected', function (msg) {
		alert(msg);
	});
	socket.on('gameEndedUnexpectedly', function (msg) {
		displayMessageOverlay(msg);
		txtStatus.html('Game ended');
		isInGame = false;
	});

	socket.emit('requestClientList');
}
function displayMessageOverlay(msg){
	scale(1/worldScale);
	translate(-worldLocation.x,-worldLocation.y);
		fill(color(255,255,255,80));
		rect(0,0,width,height);

		stroke(123);
		strokeWeight(4);
		textSize(min(cellW,cellH));
		textAlign(CENTER, CENTER);
		fill(255);
		text(msg,50,0,width-25,height);	
}
function updateTurnStatus(){
	if(isInGame){
		var player = turn%2+1;
		if(player == thisPlayer){
			txtStatus.html('Your turn');
		}else{
			txtStatus.html('Wait for your opponent');
		}
	}else{
		txtStatus.html('Welcome to X-O Unlimited');
	}
}
function newGame(){
	board = createArray(boardSize,boardSize);	
	isInGame = true; 
	turn = 0;
	lastMove = createVector(-1,-1);
	worldLocation = createVector(-cellW*boardSize/2,-cellH*boardSize/2);
    worldScale = 1.0;

}
function drawBoard(){
	background(0);
	translate(worldLocation.x, worldLocation.y);
    scale(worldScale);
  	stroke(255);
  	strokeWeight(1);
  	for(var i = 1;i<boardSize;i++){
		line(0,i*cellH,cellH*boardSize,i*cellH);  		
		line(i*cellW,0,i*cellW,cellW*boardSize);  		
  	}
}
function draw() {
  	if(isInGame){
		drawBoard();

		textSize(min(cellW,cellH));
		textAlign(CENTER, CENTER);
		fill(222);
	  	for(var i = 0; i<boardSize;i++){
	  		for(var j = 0;j<boardSize;j++){
	  			if(i==lastMove.x&&j==lastMove.y){
	  				fill(200,0,0);
	  			}
	  			if(board[j][i]==1) {
	  				text("X",(i+0.5)*cellW,(j+0.5)*cellH);
	  			}
	  			if(board[j][i]==2) {
	  				text("O",(i+0.5)*cellW,(j+0.5)*cellH);
	  			}
	  			if(i==lastMove.x&&j==lastMove.y){
	  				fill(222);
	  			}
	  		}
	  	}
	}
}

function mousePressed(){
	if(mouseButton===LEFT){
		var anchor1 = localToGlobal(0,0);
		var anchor2 = localToGlobal(width,height);
		var mouseLocation = localToGlobal(mouseX,mouseY);
		if(mouseLocation.x<anchor1.x
			||mouseLocation.y<anchor1.y
			||mouseLocation.x>=anchor2.x
			||mouseLocation.y>=anchor2.y)
			{
				return false;
			}
		var player = turn%2+1;
		if(isInGame&&thisPlayer==player){
			var x = floor(mouseLocation.x/cellW);
			var y = floor(mouseLocation.y/cellH);
			if(x<boardSize&&y<boardSize&&x>=0&&y>=0&&board[y][x]==0){
				board[y][x]=player;
				socket.emit('makeAMove',
					{
						'game':currentGame,
						'x':x,
						'y':y
					}
				);
				lastMove = createVector(x,y);
				if(isWon(player)){
					redraw();
					displayMessageOverlay((player==1?'X':'O')+" won!");
		  			isInGame = false;
				}
				turn ++;
				updateTurnStatus();
				
			}
		}
	}
	return false;
}
function mouseDragged(){
	if(mouseButton===RIGHT){
		worldLocation.x += (mouseX-pmouseX);
		worldLocation.y += (mouseY-pmouseY);
	}
	return false;
}

function mouseWheel(event){
	worldScale += 0.001*event.delta;
	worldLocation.x-=1*mouseX*0.001*event.delta
	worldLocation.y-=1*mouseY*0.001*event.delta
}
function isStreak(x,y,dirX,dirY,player){
	var winLen = boardSize<5?boardSize:5;
	if(y+dirY*winLen<0||
		y+dirY*winLen>=boardSize||
		x+dirX*winLen<0||
		x+dirX*winLen>=boardSize){
		return false;
	}
	for(var k = 0;k<winLen;k++){
		if(board[y+dirY*k][x+dirX*k]!=player){
			return false;
		}
	}	
	// special case: when one checked 5 in a rows but both side blocked by opponent (eg: O-X-X-X-X-X-O)
	if((x-dirX)>=0&&(x-dirX)<boardSize
		&&(y-dirY)>=0&&(y-dirY)<boardSize
		&&board[y-dirY][x-dirX]!=0
		&&board[y-dirY][x-dirX]!=player
		&&(x+winLen*dirX)>=0&&(x+winLen*dirX)<boardSize
		&&(y+winLen*dirY)>=0&&(y+winLen*dirY)<boardSize
		&&board[y+winLen*dirY][x+winLen*dirX]!=0
		&&board[y+winLen*dirY][x+winLen*dirX]!=player
		) return false;
	
	return true;
}
function isWon(player){
	for(var i = 0;i<boardSize;i++){
		for(var j = 0;j<boardSize;j++){
			if(isStreak(j,i,1,0,player)||
			isStreak(j,i,1,1,player)||
			isStreak(j,i,0,1,player)||
			isStreak(j,i,-1,1,player)) return true;
			
		}		
	}
	return false;
}

  function localToGlobal(x,y){
    var result = createVector((x-worldLocation.x)/worldScale,(y-worldLocation.y)/worldScale)
    return result;
  }

  function disableRightClickContextMenu(element) {
  element.addEventListener('contextmenu', function(e) {
    if (e.button == 2) {
      // Block right-click menu thru preventing default action.
      e.preventDefault();
    }
  });
}