var btnRequestGame;
var txtFriendId;
var btnRequestPrivateGame;
var txtStatus;
var txtName;
var lastMove;
var divClients;
var messageBox;
var txtMessage;
var clients = [];
var isFinding;
var currentModal;
function setupUI(){
	var divGameHolder = createDiv('');
	var divId = createDiv('');
	divId.style('margin','15px');

	var txtMyId = createElement('span',"Your id: <b>"+socket.id+"</b>");

	txtName = createInput();
	txtName.changed(()=>{
		socket.emit('playerNameChangeRequest',txtName.value());
	});
	socket.on('playerNameChangeResponse', function (status) {
		if(status==false){
			showModal("Name unavailable",()=>{removeModal();});
			txtName.value('')
		}else{
			showModal("Name changed",()=>{removeModal();});
		}
		
	});

	divId.child(txtMyId);
	divId.child(createElement('span', ' or use a nickname: '));
	divId.child(txtName);

	var divFind = createDiv(''); 

	isFinding = false;
	btnRequestGame = createButton('Find game');
	btnRequestGame.mousePressed(()=>{
		if(board.isInGame){
			// if is in game, show confirmation before ending game and find new game
			showModal(
				"Are you sure to forfeit this game?",
				()=>{
					socket.emit('forfeit',currentGame);
					socket.emit('requestGame');	
					updateFindingButton(true);
					removeModal();
					return true;
				},
				()=>{removeModal();return true;}
			);
		}else{
			// if not, check if it's finding and change button accordingly 
			if(isFinding){
				socket.emit('cancelRequest');	
				updateFindingButton(false);
			}else{
				socket.emit('requestGame',txtFriendId.value());	
				updateFindingButton(true);
			}
		}
	});
	divFind.child(btnRequestGame);
	divFind.child(createElement('span','    OR    '));

	var divGoPrivate = createElement('span');
	
	btnRequestPrivateGame = createButton('Go Private Game');
	btnRequestPrivateGame.mousePressed(()=>{
		// the procedure for requesting private game is almost the same as finding normal game
		// might not be optimal
		// Option: notify this player when other player denied the request?
		if(board.isInGame){
			// if is in game, show confirmation before ending game and find new game
			showModal(
				"Are you sure to forfeit this game?",
				()=>{
					socket.emit('forfeit',currentGame);
					socket.emit('requestPrivateGame',txtFriendId.value());	
					updateFindingButton(true);
					removeModal();
					return true;
				},
				()=>{removeModal();return true;}
			);
		}else{
			// if not, check if it's finding and change button accordingly 
			if(isFinding){
				//socket.emit('cancelRequest');	
				updateFindingButton(false);
			}else{
				socket.emit('requestPrivateGame',txtFriendId.value());	
				updateFindingButton(true);
				txtStatus.html('Waiting for partner...');
			}
		}		
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

	messageBox = select('#txt_messages');
	txtMessage = select('#txt_send');

	txtMessage.changed(()=>{
		if(keyCode==13){
			socket.emit('message',txtMessage.value());
			txtMessage.value('');
		}
	});
	socket.on('message',function(msg){
		messageBox.value(messageBox.value()+'\n'+msg);
		messageBox.elt.scrollTop = messageBox.elt.scrollHeight;
	});
}

function updateFindingButton(status){
	isFinding = status;
	btnRequestPrivateGame.elt.disabled = status;
	if(isFinding){
		btnRequestGame.html('Cancel');
		txtStatus.html('Finding game...');
	}
	else{
		btnRequestGame.html('Find game');
		txtStatus.html('Welcome');
	}
}
function updateClientList(data, view){
	var content = "<ul>";
	for(var i =0;i<data.length;i++){
		content+="<li>";
		if(data[i].name){
			content+=data[i].name+" ("+data[i].id+")";
		}else{
			content+=data[i].id;
		}
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

function showModal(content, callback1, callback2){
	if(!currentModal){
		var divModal = createDiv('');
		divModal.addClass('cus-modal');
		var divContent = createDiv('');
		divContent.addClass('cus-modal-content');
		divContent.parent(divModal);
		var spanContent = createElement('span',content);
		spanContent.style('margin-bottom','20px');
		spanContent.parent(divContent);

		if(callback1){
			var btn1 = createButton('OK');
			btn1.mouseClicked(callback1);
			btn1.parent(divContent);
		}
		if(callback2){
			var btn2 = createButton('Cancel');
			btn2.mouseClicked(callback2);
			btn2.parent(divContent);
		}
		divModal.addClass('cus-show-modal');
		currentModal = divModal;
	}
}
function removeModal(){
	currentModal.remove();
	currentModal=null;
}