var socket = io();
document.addEventListener('DOMContentLoaded', function() {
	if ( !socket.connected ) {
		document.getElementById( "viewers" ).innerHTML = "You are disconnected from the server.  Only one instance is allowed to connect per IP.  If you believe this is a mistake, please wait 5 seconds and refresh.";
	}
}, false);
socket.on( "canvasData" , ( data ) => { 
	var canvas = document.getElementById('screen');
	var context = canvas.getContext('2d');
	var img = new Image();
	img.onload = function() {
	  context.drawImage(this, 0, 0, canvas.width, canvas.height);
	}
	img.src = "data:image/png;base64," + data;
});
socket.on( "input" , ( data ) => {
	ul = document.getElementById( "inputs" );
	ul.appendChild( makeli( data ) );
	if ( ul.childNodes.length > 100 ) {
		ul.removeChild( ul.children[0] );
	}
	ul.scrollTop = ul.scrollHeight;
});
socket.on( "emote" , ( data ) => {
	ul = document.getElementById( "inputs" );
	ul.appendChild( makeli_emote( data ) );
	if ( ul.childNodes.length > 100 ) {
		ul.removeChild( ul.children[0] );
	}
	ul.scrollTop = ul.scrollHeight;
});
socket.on( "viewers" , ( data ) => {
	var viewers = parseInt( data );
	document.getElementById( "viewers" ).innerHTML = "Viewers: " + viewers;
});
/*
socket.on( "gameData" , ( data ) => {
	//console.log( data );
});
*/
function makeli( data ) {
	var li = document.createElement("li");
	var now = new Date();
	var message = "Input: " + data["input"];
	if ( data["author"] != "" ) {
		var message = data["author"] + ": " + data["input"];
	}
	li.appendChild( document.createTextNode( "(" + formatTime( now ) + ") " + message ) );
	li.setAttribute('class', 'pokebullet');
	return li;
}
function makeli_emote( data ) {
	var li = document.createElement("li");
	var img = document.createElement("img");
	img.src = "/assets/emotes/" + data["emote"];
	img.setAttribute('class', 'emote-img');
	img.setAttribute('title', data["name"]);
	var now = new Date();
	var message = "Emote: ";
	if ( data["author"] != "" ) {
		var message = data["author"] + ": ";
	}
	li.appendChild( document.createTextNode( "(" + formatTime( now ) + ") " + message ) );
	li.appendChild( img );
	li.setAttribute('class', 'pokebullet');
	return li;
}
function formatTime( time ) {
	return time.toLocaleTimeString();
}
