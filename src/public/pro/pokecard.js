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

function statusColor( s ) {
	var table = {
		"SLP" : "#C0C0C0",
		"FRZ" : "#87E0ED",
		"BRN" : "#F08030",
		"PAR" : "#DAE673",
		"PSN" : "#914DBF",
		"BAD PSN" : "#914DBF",
	}
	if ( s in table ) {
		return table[ s ];
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
		this.movesdetail = [];

		this.update_protocols = {
			"sprite" : [ (p) => [ p.info.pokedex_id ] , (x) => this.updateSprite(x) ] ,
			"name" : [ (p) => [ p.info.nickname , p.info.species_name , p.stats.level ] , (x) => this.updateName(x) ] ,
			"color" : [ (p) => [ p.info.pokedex_id ] , (x) => this.updateColor(x) ] ,
			"hp" : [ (p) => [ p.stats.currentHP , p.stats.totalHP ] , (x) => this.updateHP(x) ] ,
			"moves" : [ (p) => [ this.moveHash( p.moves ) ] , (x) => this.updateMoves(x) ] ,
			"status" : [ (p) => [ p.stats.status ] , (x) => this.updateStatus(x) ] ,
			"stats" : [ (p) => [ this.statsHash( p ) ] , (x) => this.updateStats(x) ] ,
			"eviv" : [ (p) => [ p.EVs , p.IVs ] , (x) => this.updateEVIV(x) ] ,
			"misc" : [ (p) => [ this.miscHash( p ) ] , (x) => this.updateMisc(x) ] ,
			"movedetail" : [ (p) => [ this.moveHash( p.moves ) ] , (x) => this.updateMovesDetail(x) ]
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
			<div id="status-div-#"></div>
		</div>
		<div class="hp-border">
			<div id="hp-text-#" class="hp-text"></div>
			<div id="hp-bar-#" class="hp-bar"></div>
		</div>
		<div class="move-wrapper">
		</div>
		<div id="tab-wrapper-#" class="tab-wrapper">
			<div id="tab-buttons-#" class="tab-buttons">
			</div>
			<div id="tab-stats-# class="tab-stats">
			</div>
			<div id="tab-eviv-# class="tab-eviv">
			</div>
			<div id="tab-moves-# class="tab-moves">
			</div>
			<div id="tab-misc-# class="tab-misc">
			</div>
		</div>
	</div>
	*/

	makeIdUnique( id ) {
		return id + "-" + this.uuid;
	}

	statsHash( p ) {
		var ans = [];
		ans.push( p.stats.attack );
		ans.push( p.stats.defense );
		ans.push( p.stats.sp_attack );
		ans.push( p.stats.sp_defense );
		ans.push( p.stats.speed );
		ans.push( p.stats.totalHP );
		return ans;
	}

	miscHash( p ) {
		var ans = [];
		ans.push( p.stats.exp );
		ans.push( p.stats.friendship );
		ans.push( p.misc.met_location );
		ans.push( p.info.ability );
		ans.push( p.info.nature );
		ans.push( p.personality_value );
		ans.push( p.info.exp_type );
		return ans;
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
		var tab_wrapper = document.createElement( "div" );
		tab_wrapper.setAttribute( "id" , this.makeIdUnique( "tab-wrapper" ) );
		tab_wrapper.setAttribute( "class" , "tab-wrapper" );
		//
		root.appendChild( sprite_div );
		root.appendChild( nickname_div );
		root.appendChild( hp_border );
		root.appendChild( move_wrapper );
		root.appendChild( tab_wrapper );
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
		var status_div = document.createElement( "span" );
		status_div.setAttribute( "id" , this.makeIdUnique( "status-div" ) );
		status_div.setAttribute( "class" , "status-div" );
		this.data_map[ "status" ] = status_div;
		nickname_div.appendChild( status_div );
		//
		var hp_text = document.createElement( "div" );
		hp_text.setAttribute( "id" , this.makeIdUnique( "hp-text" ) );
		hp_text.setAttribute( "class" , "hp-text" );
		this.data_map[ "hp-text" ] = hp_text;
		hp_border.appendChild( hp_text );
		var hp_bar = document.createElement( "div" );
		hp_bar.setAttribute( "id" , this.makeIdUnique( "hp-bar" ) );
		hp_bar.setAttribute( "class" , "hp-bar");
		this.data_map[ "hp-bar" ] = hp_bar;
		hp_border.appendChild( hp_bar );
		//
		var tab_buttons = document.createElement( "div" );
		tab_buttons.setAttribute( "id" , this.makeIdUnique( "tab-buttons" ) );
		tab_buttons.setAttribute( "class" , "tab-buttons" );
		//
		var self = this;
		var button_stats = document.createElement( "button" );
		button_stats.setAttribute( "id" , this.makeIdUnique( "tab-button-stats" ) );
		button_stats.setAttribute( "class" , "tab-button" );
		button_stats.innerHTML = "Stats";
		button_stats.onclick = function() { self.openTab( "stats" ) };
		this.data_map[ "stats-button"] = button_stats;
		var button_eviv = document.createElement( "button" );
		button_eviv.setAttribute( "id" , this.makeIdUnique( "tab-button-eviv" ) );
		button_eviv.setAttribute( "class" , "tab-button" );
		button_eviv.innerHTML = "EVs & IVs";
		button_eviv.onclick = function() { self.openTab( "eviv" ) };
		this.data_map[ "eviv-button"] = button_eviv;
		var button_moves = document.createElement( "button" );
		button_moves.setAttribute( "id" , this.makeIdUnique( "tab-button-moves" ) );
		button_moves.setAttribute( "class" , "tab-button" );
		button_moves.innerHTML = "Moves";
		button_moves.onclick = function() { self.openTab( "moves" ) };
		this.data_map[ "moves-button"] = button_moves;
		var button_misc = document.createElement( "button" );
		button_misc.setAttribute( "id" , this.makeIdUnique( "tab-button-misc" ) );
		button_misc.setAttribute( "class" , "tab-button" );
		button_misc.innerHTML = "Misc";
		button_misc.onclick = function() { self.openTab( "misc" ) };
		this.data_map[ "misc-button"] = button_misc;
		tab_buttons.appendChild( button_stats );
		tab_buttons.appendChild( button_eviv );
		tab_buttons.appendChild( button_moves );
		tab_buttons.appendChild( button_misc );
		//
		var tab_stats = document.createElement( "div" );
		tab_stats.setAttribute( "id" , this.makeIdUnique( "tab-stats" ) );
		tab_stats.setAttribute( "class" , "tab-stats" );
		this.data_map[ "stats" ] = tab_stats;
		//
		button_stats.classList.add( "tab-button-selected" );
		//
		var tab_eviv = document.createElement( "div" );
		tab_eviv.setAttribute( "id" , this.makeIdUnique( "tab-eviv" ) );
		tab_eviv.setAttribute( "class" , "tab-eviv" );
		this.data_map[ "eviv" ] = tab_eviv;
		//
		var tab_eviv_ev = document.createElement( "div" );
		var tab_eviv_iv = document.createElement( "div" );
		tab_eviv_ev.setAttribute( "id" , this.makeIdUnique( "tab-eviv-ev" ) );
		tab_eviv_iv.setAttribute( "id" , this.makeIdUnique( "tab-eviv-iv" ) );
		tab_eviv_ev.setAttribute( "class" , "tab-eviv-ev" );
		tab_eviv_iv.setAttribute( "class" , "tab-eviv-iv" );
		this.data_map[ "eviv-ev" ] = tab_eviv_ev;
		this.data_map[ "eviv-iv" ] = tab_eviv_iv;
		tab_eviv.appendChild( tab_eviv_ev );
		tab_eviv.appendChild( tab_eviv_iv );
		//
		var tab_moves = document.createElement( "div" );
		tab_moves.setAttribute( "id" , this.makeIdUnique( "tab-moves" ) );
		tab_moves.setAttribute( "class" , "tab-moves" );
		this.data_map[ "moves" ] = tab_moves;
		//
		var tab_misc = document.createElement( "div" );
		tab_misc.setAttribute( "id" , this.makeIdUnique( "tab-misc" ) );
		tab_misc.setAttribute( "class" , "tab-misc" );
		this.data_map[ "misc" ] = tab_misc;
		//
		tab_wrapper.appendChild( tab_buttons );
		tab_wrapper.appendChild( tab_stats );
		tab_wrapper.appendChild( tab_eviv );
		tab_wrapper.appendChild( tab_moves );
		tab_wrapper.appendChild( tab_misc );
		//
		this.data_map[ "color" ] = root;
	}

	initialRender() {
		this.createTemplate();
		this.setAlive( false );
		for ( var i = 0 ; i < 4 ; i++ ) {
			this.moves.push( new PokeMoveCard( this.uuid + "-move-" + i ) );
			this.data_map[ "move-wrapper" ].appendChild( this.moves[i].initialRender() );
			this.movesdetail.push( new PokeMoveCardDetail( this.uuid + "-movedetail-" + i ) );
			this.data_map[ "moves" ].appendChild( this.movesdetail[i].initialRender() );
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

	openTab( tab ) {
		this.data_map[ "stats" ].style.display = "none";
		this.data_map[ "eviv" ].style.display = "none";
		this.data_map[ "moves" ].style.display = "none";
		this.data_map[ "misc" ].style.display = "none";
		this.data_map[ "stats-button" ].classList.remove( "tab-button-selected" );
		this.data_map[ "eviv-button" ].classList.remove( "tab-button-selected" );
		this.data_map[ "moves-button" ].classList.remove( "tab-button-selected" );
		this.data_map[ "misc-button" ].classList.remove( "tab-button-selected" );
		this.data_map[ tab ].style.display = "block";
		this.data_map[ tab + "-button" ].classList.add( "tab-button-selected" );
	}

	update( newPokemon ) {
		if ( newPokemon === undefined ) {
			this.setAlive( false );
			this.pokemon = newPokemon;
			return;
		}
		this.setAlive( true );
		//
		var shortCircuit = ( this.pokemon === undefined );
		for ( var protocol in this.update_protocols ) {
			var protocol_data = this.update_protocols[ protocol ];
			if ( shortCircuit || ( JSON.stringify( protocol_data[0]( this.pokemon ) ) != JSON.stringify( protocol_data[0]( newPokemon ) ) ) ) {
				protocol_data[1]( newPokemon );
			}
		}
		this.pokemon = newPokemon;
	}

	updateSprite( newPokemon ) {
		var sprite = this.data_map[ "sprite" ];
		sprite.src = '../assets/sprites/' + (newPokemon.info.pokedex_id + "").padStart(3, '0') + '.gif';
	}

	updateName( newPokemon ) {
		var name = this.data_map[ "name" ];
		var egg = " ";
		if ( newPokemon.misc.is_egg ) {
			egg = " (Egg)";
		}
		name.innerHTML = newPokemon.info.nickname + " &#9830;&#9830;&#9830; " + newPokemon.info.species_name + " lvl. " + newPokemon.stats.level + egg;
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

	updateMovesDetail ( newPokemon ) {
		for ( var i = 0 ; i < this.movesdetail.length ; i++ ) {
			this.movesdetail[i].update( newPokemon.moves[i] , newPokemon );
		}
	}

	updateStatus( newPokemon ) {
		var status_div = this.data_map[ "status" ];
		var stat = newPokemon.stats.status;
		var status_message = "";
		var color = "";
		if ( stat.sleep != 0 ) {
			status_message = "SLP (" + stat.sleep + ")";
			color = statusColor( "SLP" );
		} else {
			if ( stat.burn ) {
				status_message = "BRN";
				color = statusColor( "BRN" );
			} else if ( stat.freeze ) {
				status_message = "FRZ";
				color = statusColor( "FRZ" );
			} else if ( stat.paralysis ) {
				status_message = "PAR";
				color = statusColor( "PAR" );
			} else if ( stat.poison ) {
				status_message = "PSN";
				color = statusColor( "PSN" );
			} else if ( stat.bad_poison ) {
				status_message = "BAD PSN";
				color = statusColor( "BAD PSN" );
			}
		}
		if ( status_message != "" ) {
			status_div.style.visibility = "inherit";
			status_div.style.backgroundColor = color;
			status_div.innerHTML = status_message;
		} else {
			status_div.style.visibility = "hidden";
		}
	}

	updateStats( newPokemon ) {
		var div = this.data_map[ "stats" ];
		div.innerHTML = "";
		var canvas = document.createElement( "canvas" );
		canvas.setAttribute( "id" , this.makeIdUnique( "stats-bar" ) );
		canvas.setAttribute( "class" , "stats-bar-canvas" );
		const data = {
		labels: [
			'HP',
			'Attack',
			'Defense',
			'Sp. Atk',
			'Sp. Def',
			'Speed'
		],
		datasets: [{
			data: [ 
				newPokemon.stats.totalHP ,
				newPokemon.stats.attack , 
				newPokemon.stats.defense , 
				newPokemon.stats.sp_attack , 
				newPokemon.stats.sp_defense ,
				newPokemon.stats.speed
			],
			backgroundColor: [
				"#FF0000",
				"#F08030",
				"#F8D030",
				"#6890F0",
				"#78C850",
				"#F85888"
			],
			borderColor: "#000000",
			borderWidth: 1
		}]
		};
		const config = {
			type: 'bar',
			data: data,
			options: {
				indexAxis : "y" ,
				maintainAspectRatio: false ,
				scales: {
					x: {
						beginAtZero: true,
						ticks: {
							color: "#FFFFFF",
							textStrokeColor: "#000000",
							textStrokeWidth: 2
						}
					},
					y: {
						ticks: {
							color: "#FFFFFF",
							textStrokeColor: "#000000",
							textStrokeWidth: 2
						}
					}
				},
				layout: {
					padding: 10
				},
				plugins: {
					legend: {
						display: false
					}
				}
			}
		};
		div.appendChild( canvas );
		var myChart = new Chart(
			canvas ,
			config
		);
	}

	updateEVIV( newPokemon ) {
		var div_ev = this.data_map[ "eviv-ev" ];
		var div_iv = this.data_map[ "eviv-iv" ];
		div_ev.innerHTML = "";
		div_iv.innerHTML = "";
		var canvas_ev = document.createElement( "canvas" );
		var canvas_iv = document.createElement( "canvas" );
		canvas_ev.setAttribute( "id" , this.makeIdUnique( "ev-radar" ) );
		canvas_iv.setAttribute( "id" , this.makeIdUnique( "iv-radar" ) );
		canvas_ev.setAttribute( "class" , "ev-radar-canvas" );
		canvas_iv.setAttribute( "class" , "iv-radar-canvas" );
		//
		const ev_data = {
		labels: [
			'HP',
			'Attack',
			'Defense',
			'Speed',
			'Sp. Def',
			'Sp. Atk'
		],
		datasets: [{
			data: [
				newPokemon.EVs.HP ,
				newPokemon.EVs.attack ,
				newPokemon.EVs.defense ,
				newPokemon.EVs.speed ,
				newPokemon.EVs.sp_defense ,
				newPokemon.EVs.sp_attack
			],
			fill: true,
			backgroundColor: 'rgba( 0 , 0 , 0 , 0.2 )',
			borderColor: 'rgb( 0 , 0 , 0 )',
			borderWidth: 1,
			pointBackgroundColor: [
				"#FF0000",
				"#F08030",
				"#F8D030",
				"#F85888",
				"#78C850",
				"#6890F0"
			],
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: [
				"#FF0000",
				"#F08030",
				"#F8D030",
				"#F85888",
				"#78C850",
				"#6890F0"
			]
		}]
		};
		const config_ev = {
			type: 'radar',
			data: ev_data,
			options: {
				maintainAspectRatio: false,
				layout: {
					padding: {
						left: 10,
					}
				},
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: true,
						color: "#FFFFFF",
						position: "right",
						text: "EVs"
					}
				},
				scales: {
					r: {
						min: 0,
						//max: 256,
						ticks: {
							showLabelBackdrop: false,
							color: "#FFFFFF"
						//	stepSize: 64
						},
						pointLabels : {
							color: "#FFFFFF"
						}
					}
				}
			}
		};
		div_ev.appendChild( canvas_ev );
		var myChart_ev = new Chart(
			canvas_ev ,
			config_ev
		);
		//
		const iv_data = {
		labels: [
			'HP',
			'Attack',
			'Defense',
			'Speed',
			'Sp. Def',
			'Sp. Atk'
		],
		datasets: [{
			data: [
				newPokemon.IVs.HP ,
				newPokemon.IVs.attack ,
				newPokemon.IVs.defense ,
				newPokemon.IVs.speed ,
				newPokemon.IVs.sp_defense ,
				newPokemon.IVs.sp_attack
			],
			fill: true,
			backgroundColor: 'rgba( 0 , 0 , 0 , 0.2 )',
			borderColor: 'rgb( 0 , 0 , 0 )',
			borderWidth: 1,
			pointBackgroundColor: [
				"#FF0000",
				"#F08030",
				"#F8D030",
				"#F85888",
				"#78C850",
				"#6890F0"
			],
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: [
				"#FF0000",
				"#F08030",
				"#F8D030",
				"#F85888",
				"#78C850",
				"#6890F0"
			]
		}]
		};
		const config_iv = {
			type: 'radar',
			data: iv_data,
			options: {
				maintainAspectRatio: false,
				layout: {
					padding: {
						left: 10
					}
				},
				plugins: {
					legend: {
						display: false
					},
					title: {
						display: true,
						color: "#FFFFFF",
						position: "left",
						text: "IVs"
					}
				},
				scales: {
					r: {
						min: 0,
						max: 32,
						pointLabels : {
							color: "#FFFFFF"
						},
						ticks: {
							showLabelBackdrop: false,
							stepSize: 8,
							color: "#FFFFFF"
						}
					}
				}
			}
		};
		div_iv.appendChild( canvas_iv );
		var myChart_iv = new Chart(
			canvas_iv ,
			config_iv
		);
	}

	updateMisc( newPokemon ) {
		var div = this.data_map[ "misc" ];
		div.innerHTML = "";
		var left_div = document.createElement( "div" );
		left_div.setAttribute( "id" , this.makeIdUnique( "misc-left-div" ) );
		left_div.setAttribute( "class" , "misc-left-div" );
		var right_div = document.createElement( "div" );
		right_div.setAttribute( "id" , this.makeIdUnique( "misc-right-div" ) );
		right_div.setAttribute( "class" , "misc-right-div" );
		//
		var left_table = document.createElement( "table" );
		left_table.setAttribute( "id" , this.makeIdUnique( "misc-left_table" ) );
		left_table.setAttribute( "class" , "misc-table" );
		var right_table = document.createElement( "table" );
		right_table.setAttribute( "id" , this.makeIdUnique( "misc-right_table" ) );
		right_table.setAttribute( "class" , "misc-table" );
		//
		var friendship = "Friendship:";
		if ( newPokemon.misc.is_egg ) {
			friendship = "Egg Cycles Remaining:";
		}
		var type = newPokemon.info.type[0];
		if ( newPokemon.info.type.length == 2 ) {
			type = newPokemon.info.type[0] + " / " + newPokemon.info.type[1];
		}
		left_table.appendChild( this.makeRow( "Type:" , type ) );
		left_table.appendChild( this.makeRow( "Nature:" , newPokemon.info.nature ) );
		left_table.appendChild( this.makeRow( "Met Location:" , newPokemon.misc.met_location_name ) );
		left_table.appendChild( this.makeRow( friendship , newPokemon.stats.friendship ) );
		left_table.appendChild( this.makeRow( "Personality Value:" , newPokemon.personality_value ) );
		//
		right_table.appendChild( this.makeRow( "Exp Bar:" , 
			"<progress id='" + this.makeIdUnique( "exp-bar" ) + "' value='" + newPokemon.stats.exp_level + "' max='" + ( newPokemon.stats.exp_next + newPokemon.stats.exp_level ) + "'></progress>"
		) );
		right_table.appendChild( this.makeRow( "Total Exp:" , newPokemon.stats.exp + " (" +  newPokemon.stats.exp_level + "/" + ( newPokemon.stats.exp_next + newPokemon.stats.exp_level )+ ")" ) );
		right_table.appendChild( this.makeRow( "Exp Type:" , newPokemon.stats.exp_type ) );
		right_table.appendChild( this.makeRow( "Ability:" , newPokemon.info.ability ) );
		right_table.appendChild( this.makeRow( "Ability Effect:" , "<div id='" + this.makeIdUnique( "ability-effect" ) + "' class='ability-effect-div'>" + newPokemon.info.ability_effect + "</div>" ) );
		//
		left_div.appendChild( left_table );
		right_div.appendChild( right_table );
		div.appendChild( left_div );
		div.appendChild( right_div );
	}

	makeRow( key , val ) {
		var row = document.createElement( "tr" );
		var k = document.createElement( "td" );
		var v = document.createElement( "td" );
		k.setAttribute( "class" , "table-col-left" );
		v.setAttribute( "class" , "table-col-right" );
		k.innerHTML = key;
		v.innerHTML = val;
		row.appendChild( k );
		row.appendChild( v );
		return row;
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
			"pp" : [ (m) => [ m.pp ] , (x) => this.updatePP(x) ],
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
			this.root.style.visibility = "inherit";
		} else {
			this.root.style.visibility = "hidden";
		}
	}

	update( newMove ) {
		if ( newMove.id == 0 ) {
			this.setAlive( false );
			this.move = newMove;
			return;
		}
		this.setAlive( true );
		//
		var shortCircuit = ( ( this.move === undefined ) || ( this.move.id == 0 ) );
		for ( var protocol in this.update_protocols ) {
			var protocol_data = this.update_protocols[ protocol ];
			if ( shortCircuit || ( JSON.stringify( protocol_data[0]( this.move ) ) != JSON.stringify( protocol_data[0]( newMove ) ) ) ) {
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

class PokeMoveCardDetail {
	constructor( uuid="-no-uuid" ) {
		this.move = undefined;
		this.root = null;
		this.data_map = {};
		this.uuid = uuid;

		this.update_protocols = {
			"name" : [ (m) => [ m.movedata.name ] , (x) => this.updateName(x) ],
			"pp" : [ (m) => [ m.pp ] , (x) => this.updatePP(x) ],
			"type" : [ (m) => [ m.movedata.type ] , (x) => this.updateType(x) ],
			"power" : [ (m) => [ m.movedata.power ] , (x) => this.updatePower(x) ],
			"accuracy" : [ (m) => [ m.movedata.accuracy ] , (x) => this.updateAccuracy(x) ],
			"effect" : [ (m) => [ m.movedata.effect ] , (x) => this.updateEffect(x) ],
			"stab" : [ (m) => [ m.movedata.type , this.type ] , (x) => this.updateStab(x) ]
		};
	}

	makeIdUnique( id ) {
		return id + "-" + this.uuid;
	}

	createTemplate() {
		var root = document.createElement( "div" );
		this.root = root;
		root.setAttribute( "id" , this.makeIdUnique( "move-detail-div" ) );
		root.setAttribute( "class" , "move-detail-div" );
		this.data_map[ "color" ] = root;
		//
		var move_type = document.createElement( "img" );
		move_type.setAttribute( "id" , this.makeIdUnique( "move-type" ) );
		move_type.setAttribute( "class" , "move-type" );
		root.appendChild( move_type );
		this.data_map[ "move-type" ] = move_type;
		//
		var move_name_div = document.createElement( "div" );
		move_name_div.setAttribute( "id" , this.makeIdUnique( "move-detail-name-div" ) );
		move_name_div.setAttribute( "class" , "move-detail-name-div" );
		root.appendChild( move_name_div );
		this.data_map[ "move-detail-name-div" ] = move_name_div;
		//
		var move_pp_div = document.createElement( "div" );
		move_pp_div.setAttribute( "id" , this.makeIdUnique( "move-detail-pp-div" ) );
		move_pp_div.setAttribute( "class" , "move-detail-pp-div" );
		root.appendChild( move_pp_div );
		this.data_map[ "move-detail-pp-div" ] = move_pp_div;
		//
		var move_pwr_acc_div = document.createElement( "div" );
		move_pwr_acc_div.setAttribute( "id" , this.makeIdUnique( "move-pwr-acc-div" ) );
		move_pwr_acc_div.setAttribute( "class", "move-pwr-acc-div" );
		root.appendChild( move_pwr_acc_div );
		this.data_map[ "move-pwr-acc-div" ] = move_pwr_acc_div;
		//
		var move_pwr = document.createElement( "div" );
		move_pwr.setAttribute( "id" , this.makeIdUnique( "move-pwr" ) );
		move_pwr.setAttribute( "class", "move-detail-element" );
		move_pwr_acc_div.appendChild( move_pwr );
		this.data_map[ "move-pwr" ] = move_pwr;
		//
		var move_acc = document.createElement( "div" );
		move_acc.setAttribute( "id" , this.makeIdUnique( "move-acc" ) );
		move_acc.setAttribute( "class", "move-detail-element" );
		move_pwr_acc_div.appendChild( move_acc );
		this.data_map[ "move-acc" ] = move_acc;
		//
		var move_stab = document.createElement( "div" );
		move_stab.setAttribute( "id" , this.makeIdUnique( "move-stab" ) );
		move_stab.setAttribute( "class", "move-detail-element" );
		move_pwr_acc_div.appendChild( move_stab );
		this.data_map[ "move-stab" ] = move_stab;
		//
		var effect_div = document.createElement( "div" );
		effect_div.setAttribute( "id", this.makeIdUnique( "effect-div" ) );
		effect_div.setAttribute( "class", "effect-div" );
		root.appendChild( effect_div );
		this.data_map[ "effect-div" ] = effect_div;
	}

	initialRender() {
		this.createTemplate();
		this.setAlive( false );
		return this.root;
	}

	setAlive( alive ) {
		if ( alive ) {
			this.root.style.visibility = "inherit";
		} else {
			this.root.style.visibility = "hidden";
		}
	}

	update( newMove , newPokemon ) {
		if ( newMove.id == 0 ) {
			this.setAlive( false );
			this.move = newMove;
			return;
		}
		this.setAlive( true );
		this.type = newPokemon.info.type;
		//
		var shortCircuit = ( ( this.move === undefined ) || ( this.move.id == 0 ) );
		for ( var protocol in this.update_protocols ) {
			var protocol_data = this.update_protocols[ protocol ];
			if ( shortCircuit || ( JSON.stringify( protocol_data[0]( this.move ) ) != JSON.stringify( protocol_data[0]( newMove ) ) ) ) {
				protocol_data[1]( newMove );
			}
		}
		this.move = newMove;
	}

	updateName( newMove ) {
		var name_div = this.data_map[ "move-detail-name-div" ];
		name_div.innerHTML = newMove.movedata.name;
	}

	updatePP( newMove ) {
		var pp_div = this.data_map[ "move-detail-pp-div" ];
		var cur_pp = newMove.pp;
		var max_pp = Math.floor( newMove.movedata.pp * (1 + 0.2*newMove.pp_bonus) );
		pp_div.innerHTML = cur_pp + "/" + max_pp + " PP"
	}

	updateType( newMove ) {
		var type = newMove.movedata.type;

		var type_img = this.data_map[ "move-type" ];
		type_img.src = '../assets/type/' + (type + "").toLowerCase() + '.svg';
		type_img.title = type;

		var color_div = this.data_map[ "color" ];
		color_div.style.backgroundColor = colorLookup( type );
	}

	updatePower( newMove ) {
		var power = newMove.movedata.power;
		if ( power == -1 ) {
			power = "&mdash;";
		}
		var move_pwr = this.data_map[ "move-pwr" ];
		move_pwr.innerHTML = "PWR: " + power;
	}

	updateAccuracy( newMove ) {
		var accuracy = newMove.movedata.accuracy;
		if ( accuracy == -1 ) {
			accuracy = "&mdash;";
		} else {
			accuracy += "%";
		}
		var move_acc = this.data_map[ "move-acc" ];
		move_acc.innerHTML = "ACC: " + accuracy;
	}

	updateStab( newMove ) {
		var type = newMove.movedata.type;
		var move_stab = this.data_map[ "move-stab" ];
		if ( this.type.includes( type ) ) {
			move_stab.innerHTML = "STAB";
		} else {
			move_stab.innerHTML = "";
		}
	}

	updateEffect( newMove ) {
		var effect = newMove.movedata.effect;
		var effect_div = this.data_map[ "effect-div" ];
		effect_div.innerHTML = effect;
	}
}
