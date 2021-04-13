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
		var poke_rate = ( data.catchRate.pokeball / 255.0 )
		var poke_percent = ( 100 * poke_rate ).toFixed( 3 );
		var poke_ev = Math.round( 1.0 / poke_rate );
		var poke_25 = Math.round( Math.log( 1 - 0.25 ) / Math.log( 1 - poke_rate ) );
		var poke_75 = Math.round( Math.log( 1 - 0.75 ) / Math.log( 1 - poke_rate ) );
		document.getElementById( "pokeball-catchrate" ).innerHTML = "<span title='Expected: " + poke_ev + " | 25%: " + poke_25 + " | 75%: " + poke_75 + "'>" + data.catchRate.pokeball + " (" + poke_percent + "%)</span>";
		var great_rate = ( data.catchRate.greatball / 255.0 )
		var great_percent = ( 100 * great_rate ).toFixed( 3 );
		var great_ev = Math.round( 1.0 / great_rate );
		var great_25 = Math.round( Math.log( 1 - 0.25 ) / Math.log( 1 - great_rate ) );
		var great_75 = Math.round( Math.log( 1 - 0.75 ) / Math.log( 1 - great_rate ) );
		document.getElementById( "greatball-catchrate" ).innerHTML = "<span title='Expected: " + great_ev + " | 25%: " + great_25 + " | 75%: " + great_75 + "'>" + data.catchRate.greatball + " (" + great_percent + "%)</span>";
		var ultra_rate = ( data.catchRate.ultraball / 255.0 )
		var ultra_percent = ( 100 * ultra_rate ).toFixed( 3 );
		var ultra_ev = Math.round( 1.0 / ultra_rate );
		var ultra_25 = Math.round( Math.log( 1 - 0.25 ) / Math.log( 1 - ultra_rate ) );
		var ultra_75 = Math.round( Math.log( 1 - 0.75 ) / Math.log( 1 - ultra_rate ) );
		document.getElementById( "ultraball-catchrate" ).innerHTML = "<span title='Expected: " + ultra_ev + " | 25%: " + ultra_25 + " | 75%: " + ultra_75 + "'>" + data.catchRate.ultraball + " (" + ultra_percent + "%)</span>";
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
