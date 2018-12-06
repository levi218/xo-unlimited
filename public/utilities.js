function disableRightClickContextMenu(element) {
	element.addEventListener('contextmenu', function(e) {
		if (e.button == 2) {
			// Block right-click menu thru preventing default action.
			e.preventDefault();
		}
	});
}
function createArray(w,h){
	var result = new Array(h);
	for(var i = 0;i<h;i++){
		result[i] = Array(w).fill(0);
	}
	return result;
}