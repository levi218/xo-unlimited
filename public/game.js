var board;
var boardSize = 12;
var cellH;
var cellW;
var turn = 0;
var isInGame = false;
var thisPlayer;
var currentGame;
var socket = io("http://opensurvey.website/xo-unlimited");
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
			socket.emit('forfeit');
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
			socket.emit('forfeit');
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
	txtStatus = createElement('span','Welcome to x-o unlimited ');
	txtStatus.style('margin','20px');
	txtStatus.parent(divStatus);


	var canvas = createCanvas(600,600);
	canvas.style('border','2px solid #FFF');
	canvas.style('margin-bottom','15px');

	divGameHolder.child(divId);
	divGameHolder.child(divFind);
	divGameHolder.child(divStatus);
	divGameHolder.child(canvas);
	divGameHolder.parent('game_holder');


	cellH = height/boardSize;
	cellW = width/boardSize;
	drawBoard();
	
    setupSocket();
}

function setupSocket(){
	socket.on('gameStart', function (game) {
	    console.log(game);
	    currentGame = game;
	    console.log(currentGame.user1);
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
		board[data.y][data.x]=player;
		if(isWon(player)){
			redraw();
			fill(color(255,255,255,80));
			rect(0,0,width,height);

			stroke(123);
			strokeWeight(4);
			textSize(min(cellW,cellH));
			textAlign(CENTER, CENTER);
			fill(255);
  			text("Player: "+player+" won!",width/2,height/2);

  			isInGame = false;

		}
		turn ++;
		updateTurnStatus();
	});

	socket.on('playerNotConnected', function (msg) {
		alert(msg);
	});
	socket.on('gameEndedUnexpectedly', function (msg) {
		fill(color(255,255,255,80));
		rect(0,0,width,height);

		stroke(123);
		strokeWeight(4);
		textSize(min(cellW,cellH));
		textAlign(CENTER, CENTER);
		fill(255);
		text(msg);
		isInGame = false;
	});
}
function updateTurnStatus(){
	var player = turn%2+1;
	if(player == thisPlayer){
		txtStatus.html('Your turn');
	}else{
		txtStatus.html('Wait for your opponent');
	}
}
function newGame(){
	board = createArray(boardSize,boardSize);	
	isInGame = true; 
	turn = 0;

}
function drawBoard(){
	background(0);
  	stroke(255);
  	strokeWeight(1);
  	for(var i = 1;i<boardSize;i++){
		line(0,i*cellH,width,i*cellH);  		
		line(i*cellW,0,i*cellW,height);  		
  	}
}
function draw() {
  	if(isInGame){
		drawBoard();

		textSize(min(cellW,cellH));
		textAlign(CENTER, CENTER);
		fill(255);
	  	for(var i = 0; i<boardSize;i++){
	  		for(var j = 0;j<boardSize;j++){
	  			if(board[j][i]==1) {
	  				text("X",(i+0.5)*cellW,(j+0.5)*cellH);
	  			}
	  			if(board[j][i]==2) {
	  				text("O",(i+0.5)*cellW,(j+0.5)*cellH);
	  			}
	  		}
	  	}
	}
}

function mousePressed(){
	var player = turn%2+1;
	if(isInGame&&thisPlayer==player){
		var x = floor(mouseX/cellW);
		var y = floor(mouseY/cellH);
		if(x<boardSize&&y<boardSize&&x>=0&&y>=0&&board[y][x]==0){
			board[y][x]=player;
			socket.emit('makeAMove',
				{
					'game':currentGame,
					'x':x,
					'y':y
				}
			);
			if(isWon(player)){
				redraw();
				fill(color(255,255,255,80));
				rect(0,0,width,height);

				stroke(123);
				strokeWeight(4);
				textSize(min(cellW,cellH));
				textAlign(CENTER, CENTER);
				fill(255);
	  			text("Player "+player+" won!",width/2,height/2);

	  			isInGame = false;

			}
			turn ++;
			updateTurnStatus();
			
		}
	}
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