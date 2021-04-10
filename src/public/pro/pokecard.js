function colorLookup( type ) {
	var table = {
		"Normal" : "#A8A878",
		"Fighting" : "#C03028",
		"Flying" : "#A890F0",
		"Poison" : "#A040A0",
		"Ground" : "#E0C068",
		"Rock" : "#B8A038",
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

class PokeCard {
	constructor( uuid="no-uuid" , mirror=false ) {
		this.pokemon = undefined;
		this.root = null;
		this.data_map = {};
		this.uuid = uuid;
		this.mirrorSuffix = ( mirror ? "-mirror" : "" );
		this.moves = [];

		this.update_protocols = {
			"sprite" : [ (p) => [ p.info.pokedex_id ] , (x) => this.updateSprite(x) ] ,
			"name" : [ (p) => [ p.info.nickname , p.info.species_name , p.stats.level ] , (x) => this.updateName(x) ] ,
			"color" : [ (p) => [ p.info.pokedex_id ] , (x) => this.updateColor(x) ] ,
			"hp" : [ (p) => [ p.stats.currentHP , p.stats.totalHP ] , (x) => this.updateHP(x) ] ,
			"moves" : [ (p) => [ this.moveHash( p.moves ) ] , (x) => this.updateMoves(x) ]
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
			<p id="name-#"></p>
		</div>
		<div class="hp-border">
			<div id="hp-text-#" class="hp-text"></div>
			<div id="hp-bar-#" class="hp-bar"></div>
		</div>
		<div class="move-wrapper">
		</div>
	</div>
	*/

	makeIdUnique( id ) {
		return id + "-" + this.uuid;
	}

	moveHash( moves ) {
		var ans = [];
		for ( var i  = 0 ; i < moves.length ; i++ ) {
			ans.push( moves[i].id );
			ans.push( moves[i].pp );
			ans.push( moves[i].pp_bonus );
		}
		return moves;
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
		//
		var nickname_div = document.createElement( "div" );
		nickname_div.setAttribute( "id" , this.makeIdUnique( "nicknamediv" ) );
		nickname_div.setAttribute( "class" , "nicknamediv" + this.mirrorSuffix );
		//
		var hp_border = document.createElement( "div" );
		hp_border.setAttribute( "class" , "hp-border" );
		//
		var move_wrapper = document.createElement( "div" );
		move_wrapper.setAttribute( "class" , "move-wrapper" );
		this.data_map[ "move-wrapper" ] = move_wrapper;
		//
		root.appendChild( sprite_div );
		root.appendChild( nickname_div );
		root.appendChild( hp_border );
		root.appendChild( move_wrapper );
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
		var name_p = document.createElement( "p" );
		name_p.setAttribute( "id" , this.makeIdUnique( "name" ) );
		name_p.style.margin = "0px";
		this.data_map[ "name" ] = name_p;
		nickname_div.appendChild( name_p );
		//
		var hp_text = document.createElement( "div" );
		hp_text.setAttribute("id" , this.makeIdUnique( "hp-text" ) );
		hp_text.setAttribute("class" , "hp-text");
		this.data_map[ "hp-text" ] = hp_text;
		hp_border.appendChild( hp_text );
		var hp_bar = document.createElement( "div" );
		hp_bar.setAttribute("id" , this.makeIdUnique( "hp-bar" ) );
		hp_bar.setAttribute("class" , "hp-bar");
		this.data_map[ "hp-bar" ] = hp_bar;
		hp_border.appendChild( hp_bar );
		//
		this.data_map[ "color" ] = root;
	}

	initialRender() {
		this.createTemplate();
		this.setAlive( false );
		for ( var i = 0 ; i < 4 ; i++ ) {
			this.moves.push( new PokeMoveCard( this.uuid + "-move" ) );
			this.data_map[ "move-wrapper" ].appendChild( this.moves[i].initialRender() );
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

	updateName( newPokemon ) {
		var name = this.data_map[ "name" ];
		name.innerHTML = newPokemon.info.nickname + " &#9830;&#9830;&#9830; " + newPokemon.info.species_name + " lvl. " + newPokemon.stats.level;;
	}

	updateHP( newPokemon ) {
		var hp_bar = this.data_map[ "hp-bar" ];
		var hp_text = this.data_map[ "hp-text" ];
		var hp_percent = (newPokemon.stats.currentHP ) / newPokemon.stats.totalHP;
		var color = "";
		if ( hp_percent > 0.5 ) {
			color = "#32CD32";
		}
		else if ( hp_percent <= 0.2 ) {
			color = "#B22222";
		}
		else {
			color = "#FFD700";
		}
		var healthbar_text = newPokemon.stats.currentHP + "/" + newPokemon.stats.totalHP;
		if ( newPokemon.stats.currentHP == 0 ) {
			color = "#C0C0C0";
			hp_percent = 1;
			healthbar_text = "FNT";
		}
		hp_bar.style.backgroundColor = color;
		hp_bar.style.width = 'calc( ' + hp_percent.toString() + ' * (100% - 45px) )';
		//
		hp_text.innerHTML = healthbar_text;
	}

	updateColor( newPokemon ) {
		var type = newPokemon.info.type;
		var div = this.data_map[ "color" ];
		if ( type.length == 2 ) {
			div.style.backgroundColor = colorLookup( type[0] ); // for browsers that dont support gradients
			div.style.backgroundImage = "linear-gradient( to bottom right , " + colorLookup( type[0] ) + " , " + colorLookup( type[1] ) + " )";
		} else if ( type.length == 1 ) {
			div.style.backgroundColor = colorLookup( type[0] );
			div.style.backgroundImage = "";
		}
	}

	updateMoves( newPokemon ) {
		for ( var i = 0 ; i < this.moves.length ; i++ ) {
			this.moves[i].update( newPokemon.moves[i] );
		}
	}


}

class PokeMoveCard {
	constructor( uuid="-no-uuid" ) {
		this.move = undefined;
		this.root = null;
		this.data_map = {};
		this.uuid = uuid;

		this.update_protocols = {
			"name" : [ (m) => [ m.movedata.name ] , (x) => this.updateName(x) ],
			"pp" : [ (m) => [ m.movedata.pp ] , (x) => this.updatePP(x) ],
			"color" : [ (m) => [ m.movedata.type ] , (x) => this.updateColor(x) ]
		};
	}

	makeIdUnique( id ) {
		return id + "-" + this.uuid;
	}

	createTemplate() {
		var root = document.createElement( "div" );
		this.root = root;
		root.setAttribute( "id" , this.makeIdUnique( "move-div" ) );
		root.setAttribute( "class" , "move-div" );
		this.data_map[ "color" ] = root;
		//
		var move_name_div = document.createElement( "div" );
		move_name_div.setAttribute( "id" , this.makeIdUnique( "move-name-div" ) );
		move_name_div.setAttribute( "class" , "move-name-div" );
		root.appendChild( move_name_div );
		this.data_map[ "move-name-div" ] = move_name_div;
		//
		var move_pp_div = document.createElement( "div" );
		move_pp_div.setAttribute( "id" , this.makeIdUnique( "move-pp-div" ) );
		move_pp_div.setAttribute( "class" , "move-pp-div" );
		root.appendChild( move_pp_div );
		this.data_map[ "move-pp-div" ] = move_pp_div;
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

	update( newMove ) {
		if ( newMove === undefined ) {
			this.setAlive( false );
			return;
		}
		this.setAlive( true );
		//
		var shortCircuit = ( this.move === undefined );
		for ( var protocol in this.update_protocols ) {
			var protocol_data = this.update_protocols[ protocol ];
			if ( shortCircuit || ( protocol_data[0]( this.move ) != protocol_data[0]( newMove ) ) ) {
				protocol_data[1]( newMove );
			}
		}
		this.move = newMove;
	}

	updateName( newMove ) {
		var name_div = this.data_map[ "move-name-div" ];
		name_div.innerHTML = newMove.movedata.name;
	}

	updatePP( newMove ) {
		var pp_div = this.data_map[ "move-pp-div" ];
		var cur_pp = newMove.pp;
		var max_pp = Math.floor( newMove.movedata.pp * (1 + 0.2*newMove.pp_bonus) );
		pp_div.innerHTML = cur_pp + "/" + max_pp + " PP"
	}

	updateColor( newMove ) {
		var color_div = this.data_map[ "color" ];
		var type = newMove.movedata.type;
		color_div.style.backgroundColor = colorLookup( type );
	}
}
