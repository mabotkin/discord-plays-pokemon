class PokeCard {
	constructor( uuid="no-uuid" , mirror=false ) {
		this.pokemon = undefined;
		this.root = null;
		this.data_map = {};
		this.uuid = uuid;
		this.mirrorSuffix = ( mirror ? "-mirror" : "" );

		this.update_protocols = {
			"sprite" : [ (p) => [ p.info.pokedex_id ] , (x) => this.updateSprite(x) ] ,
			"nickname" : [ (p) => [ p.info.nickname ] , (x) => this.updateNickname(x) ] ,
			"color" : [ (p) => [ p.info.pokedex_id ] , (x) => this.updateColor(x) ] ,
			"speciesLvl" : [ (p) => [ p.info.species_name , p.stats.level ] , (x) => this.updateSpeciesLvl(x) ]
		};
	}

	/*
	Schema:
	<div id="card-div-#" class="card">
		<div id="sprite-#" class="sprite">
			<span class="vertical-align"></span>
			<img id="spriteimg-#" class="spriteimg" src="" alt="">
		</div>
		<div id="nicknamediv-#" class="nicknamediv">
			<p id="nickname-#"></p>
			<p id="species-lvl-#"></p>
		</div>
	</div>
	*/

	makeIdUnique( id ) {
		return id + "-" + this.uuid;
	}

	createTemplate() {
		var root = document.createElement( "div" );
		this.root = root;
		root.setAttribute( "id" , this.makeIdUnique( "card-div" ) );
		root.setAttribute( "class" , "card" );
		//
		var sprite_div = document.createElement( "div" );
		sprite_div.setAttribute( "id" , this.makeIdUnique( "sprite" ) );
		sprite_div.setAttribute( "class" , "sprite" + this.mirrorSuffix );
		var nickname_div = document.createElement( "div" );
		nickname_div.setAttribute( "id" , this.makeIdUnique( "nicknamediv" ) );
		nickname_div.setAttribute( "class" , "nicknamediv" + this.mirrorSuffix );
		root.appendChild( sprite_div );
		root.appendChild( nickname_div );
		//
		var align_span = document.createElement( "span" );
		align_span.setAttribute( "class" , "vertical-align" );
		var sprite_img = document.createElement( "img" );
		sprite_img.setAttribute( "id" , this.makeIdUnique( "spriteimg" ) );
		sprite_img.setAttribute( "class" , "spriteimg" );
		this.data_map[ "sprite" ] = sprite_img;
		sprite_div.appendChild( align_span );
		sprite_div.appendChild( sprite_img );
		//
		var nickname_p = document.createElement( "p" );
		nickname_p.setAttribute( "id" , this.makeIdUnique( "nickname" ) );
		nickname_div.appendChild( nickname_p );
		this.data_map[ "nickname" ] = nickname_p;
		var species_lvl_p = document.createElement( "p" );
		species_lvl_p.setAttribute( "id" , this.makeIdUnique( "species_lvl" ) );
		nickname_div.appendChild( species_lvl_p );
		this.data_map[ "species_lvl" ] = species_lvl_p;
		//
		this.data_map[ "color" ] = root;
	}

	initialRender() {
		this.createTemplate();
		this.setAlive( false );
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
		//
		var shortCircuit = ( this.pokemon === undefined );
		for ( var protocol in this.update_protocols ) {
			var protocol_data = this.update_protocols[ protocol ];
			if ( shortCircuit || ( protocol_data[0]( this.pokemon ) != protocol_data[0]( newPokemon ) ) ) {
				protocol_data[1]( newPokemon );
			}
		}
		this.pokemon = newPokemon;
		/*
		if ( shortCircuit || ( this.pokemon.info.pokedex_id != newPokemon.info.pokedex_id ) ) {
			this.updateSprite( newPokemon );
		}
		if ( shortCircuit || ( this.pokemon.info.nickname != newPokemon.info.nickname ) ) {
			this.updateNickname( newPokemon );
		}
		if ( shortCircuit || ( this.pokemon.info.pokedex_id != newPokemon.info.pokedex_id ) ) {
			this.updateColor( newPokemon );
		}
		if ( shortCircuit || ( this.pokemon.info.species_name != newPokemon.info.species_name ) || ( this.pokemon.stats.level != newPokemon.stats.level ) ) {
			this.updateSpeciesLvl( newPokemon );
		}
		*/
	}

	updateSprite( newPokemon ) {
		var sprite = this.data_map[ "sprite" ];
		/*
		sprite.onload = function() {
			this.style.width = this.width * 0.75;
			this.style.height = 'auto';
		}
		*/
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

	updateSpeciesLvl( newPokemon ) {
		var elt = this.data_map[ "species_lvl" ];
		elt.innerHTML = newPokemon.info.species_name + " lvl. " + newPokemon.stats.level;
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
