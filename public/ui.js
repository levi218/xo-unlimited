var btnRequestGame;
var txtFriendId;
var btnRequestPrivateGame;
var txtStatus;
var txtName;
var lastMove;
var divClients;
var clients = [];

function setupUI(){
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
		if(board.isInGame){
			socket.emit('forfeit',currentGame);
		}
		socket.emit('requestGame');	
		txtStatus.html('Finding game...');
	});
	divFind.child(btnRequestGame);
	divFind.child(createElement('span','    OR    '));

	var divGoPrivate = createElement('span');
	
	btnRequestPrivateGame = createButton('Go Private Game');
	btnRequestPrivateGame.mousePressed(()=>{
		if(board.isInGame){
			socket.emit('forfeit',currentGame);
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
function displayMessageOverlay(msg){
	scale(1/board.worldScale);
	translate(-board.worldLocation.x,-board.worldLocation.y);
		fill(color(255,255,255,80));
		rect(0,0,width,height);

		stroke(123);
		strokeWeight(4);
		textSize(min(board.cellW,board.cellH));
		textAlign(CENTER, CENTER);
		fill(255);
		text(msg,50,0,width-25,height);	
}
function updateTurnStatus(){
	if(board.isInGame){
		var player = board.turn%2+1;
		if(player == thisPlayer){
			txtStatus.html('Your turn');
		}else{
			txtStatus.html('Wait for your opponent');
		}
	}else{
		txtStatus.html('Welcome to X-O Unlimited');
	}
}