class PokeCard {
	constructor( pokemon ) {
		this.pokemon = pokemon;
		this.root = null;
		this.data_map = {};
	}

	/*
	Schema:
	<div id="card-div" class="card">
		<div id="sprite">
			<span class="vertical-align"></span>
			<img id="spriteimg" src="" alt="">
		</div>
		<div id="nicknamediv">
			<p id="nickname"></p>
		</div>
	</div>
	*/

	createTemplate() {
		var root = document.createElement( "div" );
		this.root = root;
		root.setAttribute( "id" , "card-div" );
		root.setAttribute( "class" , "card" );
		//
		var sprite_div = document.createElement( "div" );
		sprite_div.setAttribute( "id" , "sprite" );
		var nickname_div = document.createElement( "div" );
		nickname_div.setAttribute( "id" , "nicknamediv");
		root.appendChild( sprite_div );
		root.appendChild( nickname_div );
		//
		var align_span = document.createElement( "span" );
		align_span.setAttribute( "class" , "vertical-align" );
		var sprite_img = document.createElement( "img" );
		sprite_img.setAttribute( "id" , "spriteimg" );
		this.data_map[ "sprite" ] = sprite_img;
		sprite_div.appendChild( align_span );
		sprite_div.appendChild( sprite_img );
		//
		var nickname_p = document.createElement( "p" );
		nickname_p.setAttribute( "id" , "nickname" );
		nickname_div.appendChild( nickname_p );
		this.data_map[ "nickname" ] = nickname_p;
		//
		this.data_map[ "color" ] = root;
	}

	initialRender() {
		this.createTemplate();
		this.setAlive( false );
		if ( ! ( this.pokemon === undefined ) ) {
			this.updateSprite( this.pokemon );
			this.updateNickname( this.pokemon );
			this.updateColor( this.pokemon );
			this.setAlive( true );
		}
		return this.root;
	}

	setAlive( alive ) {
		if ( alive ) {
			this.root.style.visibility = "visible";
		} else {
			this.root.style.visibility = "hidden";
		}
	}

	update( newPokemon ) {
		if ( newPokemon === undefined ) {
			this.setAlive( false );
			return;
		}
		this.setAlive( true );
		var shortCircuit = ( this.pokemon === undefined );
		if ( shortCircuit || ( this.pokemon.info.pokedex_id != newPokemon.info.pokedex_id ) ) {
			this.updateSprite( newPokemon );
		}
		if ( shortCircuit || ( this.pokemon.info.nickname != newPokemon.info.nickname ) ) {
			this.updateNickname( newPokemon );
		}
		if ( shortCircuit || ( this.pokemon.info.pokedex_id != newPokemon.info.pokedex_id ) ) {
			this.updateColor( newPokemon );
		}
		this.pokemon = newPokemon;
	}

	updateSprite( newPokemon ) {
		var sprite = this.data_map[ "sprite" ];
		sprite.onload = function() {
			this.style.width = this.width * 0.75
			this.style.height = 'auto'
		}
		sprite.src = '../assets/sprites/' + (newPokemon.info.pokedex_id + "").padStart(3, '0') + '.gif';
	}

	updateNickname( newPokemon ) {
		var nickname = this.data_map[ "nickname" ];
		nickname.innerHTML = newPokemon.info.nickname;
	}

	updateColor( newPokemon ) {
		var type = newPokemon.info.type;
		var div = this.data_map[ "color" ];
		if ( type.length == 2 ) {
			div.style.backgroundColor = this.colorLookup( type[0] ); // for browsers that dont support gradients
			div.style.backgroundImage = "linear-gradient( to bottom right , " + this.colorLookup( type[0] ) + " , " + this.colorLookup( type[1] ) + " )";
		} else if ( type.length == 1 ) {
			div.style.backgroundColor = this.colorLookup( type[0] );
			div.style.backgroundImage = "";
		}
	}

	colorLookup( type ) {
		var table = {
			"Normal" : "#A8A878",
			"Fighting" : "#C03028",
			"Flying" : "#A890F0",
			"Poison" : "#A040A0",
			"Ground" : "#E0C068",
			"Rock" : "#A8B820",
			"Bug" : "#A8B820",
			"Ghost" : "#705898",
			"Steel" : "#B8B8D0",
			"Fire" : "#F08030",
			"Water" : "#6890F0",
			"Grass" : "#78C850",
			"Electric" : "#F8D030",
			"Psychic" : "#F85888",
			"Ice" : "#98D8D8",
			"Dragon" : "#7038F8",
			"Dark" : "#705848",
			"???" : "#68A090"
		}
		if ( type in table ) {
			return table[ type ];
		} else {
			return "#FFFFFF";
		}
	}

}
