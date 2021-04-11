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

socket.on( "viewers" , ( data ) => {
	var viewers = parseInt( data );
	document.getElementById( "viewers" ).innerHTML = "Viewers: " + viewers;
});

var party_pokemon_cards = [];
var enemy_pokemon_cards = [];

socket.on( "gameData" , ( data ) => {
	console.log( data );
	// preload
	if ( party_pokemon_cards.length != 6 ) {
		var partyCards = document.getElementById('party');
		for ( var i = 0 ; i < 6 ; i++ ) {
			party_pokemon_cards.push( new PokeCard(i) );
			partyCards.appendChild( party_pokemon_cards[i].initialRender() );
		}
	}
	if ( enemy_pokemon_cards.length != 6 ) {
		var enemyCards = document.getElementById('party-enemy');
		for ( var i = 0 ; i < 6 ; i++ ) {
			enemy_pokemon_cards.push( new PokeCard(i + "-enemy" , false ) );
			enemyCards.appendChild( enemy_pokemon_cards[i].initialRender() );
		}
	}
	//
	for ( var i = 0 ; i < 6 ; i++ ) {
		party_pokemon_cards[i].update( data.partyPokemon[i] );
	}
	for ( var i = 0 ; i < 6 ; i++ ) {
		enemy_pokemon_cards[i].update( data.enemyPokemon[i] );
	}
	if ( enemy_pokemon_cards.length >= 1 && data.catchRate != 0 && !( data.catchRate === undefined ) ) {
		var catchrate_div = document.getElementById( "catchrate" );
		catchrate_div.style.visibility = "visible";
		document.getElementById( "pokeball-catchrate" ).innerHTML = data.catchRate.pokeball + " (" + ( 100 * data.catchRate.pokeball / 255.0 ).toFixed(3) + "%)";
		document.getElementById( "greatball-catchrate" ).innerHTML = data.catchRate.greatball + " (" + ( 100 * data.catchRate.greatball / 255.0 ).toFixed(3) + "%)";
		document.getElementById( "ultraball-catchrate" ).innerHTML = data.catchRate.ultraball + " (" + ( 100 * data.catchRate.ultraball / 255.0 ).toFixed(3) + "%)";
	} else {
		document.getElementById("catchrate").style.visibility = "hidden";
	}
});

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

function formatTime( time ) {
	return time.toLocaleTimeString();
}
