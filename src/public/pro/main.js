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
var playerX = -1;
var playerY = -1;
function clearEnemyPokemon() {
	enemy_pokemon_cards = [];
	document.getElementById( 'party-enemy' ).innerHTML = "";
}
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
	/*
	if ( data.playerX != playerX || data.playerY != playerY ) {
		// trigger out of battle
		clearEnemyPokemon();
		data.playerX = playerX;
		data.playerY = playerY;
	}
	*/
	/*
	var partyCards = document.getElementById('party');
	partyCards.innerHTML = '';
	for(var i = 0; i < data.partyPokemon.length; i++) {
		var p = data.partyPokemon[i];
		var card = document.createElement('poke-card');
		card.setAttribute('no', p.info.pokedex_id);
		card.setAttribute('nickname', p.info.nickname);
		card.setAttribute('type',JSON.stringify( p.info.type ));
		partyCards.appendChild(card);
	}
	*/
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
