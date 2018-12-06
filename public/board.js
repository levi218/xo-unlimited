class Board{
	constructor(size){
		this.boardSize = size;
		this.cellH = 50;
		this.cellW = 50;
		this.worldLocation = createVector(-this.cellW*this.boardSize/2,-this.cellH*this.boardSize/2);
    	this.worldScale = 1.0;
    	this.isInGame = false;
	}

	drawBoard(){
		background(0);
		translate(this.worldLocation.x, this.worldLocation.y);
	    scale(this.worldScale);
	  	stroke(255);
	  	strokeWeight(1);
	  	for(var i = 1;i<this.boardSize;i++){
			line(0,i*this.cellH,this.cellH*this.boardSize,i*this.cellH);  		
			line(i*this.cellW,0,i*this.cellW,this.cellW*this.boardSize);  		
	  	}
	}
	drawMarks(){
		textSize(min(this.cellW,this.cellH));
		textAlign(CENTER, CENTER);
		fill(222);
	  	for(var i = 0; i<this.boardSize;i++){
	  		for(var j = 0;j<this.boardSize;j++){
	  			if(i==this.lastMove.x&&j==this.lastMove.y){
	  				fill(200,0,0);
	  			}else{
	  				fill(222);
	  			}
	  			if(this.board[j][i]==1) {
	  				text("X",(i+0.5)*this.cellW,(j+0.5)*this.cellH);
	  			}
	  			if(this.board[j][i]==2) {
	  				text("O",(i+0.5)*this.cellW,(j+0.5)*this.cellH);
	  			}
	  		}
	  	}
	}
	makeAMove(x,y,player){
		if(x<this.boardSize&&y<this.boardSize&&x>=0&&y>=0&&this.board[y][x]==0){
			this.board[y][x]=player;
			this.lastMove = createVector(x,y);
			this.turn ++;
			return true;
		}
		return false;
	}
	newGame(){
		this.board = createArray(this.boardSize,this.boardSize);	
		this.isInGame = true; 
		this.turn = 0;
		this.lastMove = createVector(-1,-1);
		this.worldLocation = createVector(-this.cellW*this.boardSize/2,-this.cellH*this.boardSize/2);
	    this.worldScale = 1.0;
	}
	isStreak(x,y,dirX,dirY,player){
		var winLen = this.boardSize<5?this.boardSize:5;
		if(y+dirY*winLen<0||
			y+dirY*winLen>=this.boardSize||
			x+dirX*winLen<0||
			x+dirX*winLen>=this.boardSize){
			return false;
		}
		for(var k = 0;k<winLen;k++){
			if(this.board[y+dirY*k][x+dirX*k]!=player){
				return false;
			}
		}	
		// special case: when one checked 5 in a rows but both side blocked by opponent (eg: O-X-X-X-X-X-O)
		if((x-dirX)>=0&&(x-dirX)<this.boardSize
			&&(y-dirY)>=0&&(y-dirY)<this.boardSize
			&&this.board[y-dirY][x-dirX]!=0
			&&this.board[y-dirY][x-dirX]!=player
			&&(x+winLen*dirX)>=0&&(x+winLen*dirX)<this.boardSize
			&&(y+winLen*dirY)>=0&&(y+winLen*dirY)<this.boardSize
			&&this.board[y+winLen*dirY][x+winLen*dirX]!=0
			&&this.board[y+winLen*dirY][x+winLen*dirX]!=player
			) return false;

		return true;
	}
	isWon(player){
		for(var i = 0;i<this.boardSize;i++){
			for(var j = 0;j<this.boardSize;j++){
				if(this.isStreak(j,i,1,0,player)||
				this.isStreak(j,i,1,1,player)||
				this.isStreak(j,i,0,1,player)||
				this.isStreak(j,i,-1,1,player)) return true;
				
			}		
		}
		return false;
	}
	localToGlobal(x,y){
    	var result = createVector((x-this.worldLocation.x)/this.worldScale,(y-this.worldLocation.y)/this.worldScale)
	    return result;
	}
	isInBoard(x,y){
		var anchor1 = this.localToGlobal(0,0);
		var anchor2 = this.localToGlobal(width,height);
		var location = this.localToGlobal(x,y);
		if(location.x<anchor1.x||location.y<anchor1.y||location.x>=anchor2.x||location.y>=anchor2.y)
		{
			return false;
		}
		return true;
	}

}