var pokemon_index = require('./lookup/pokemon_index.js').pokemon_index;
var pokemon_pokedex = require('./lookup/pokemon_pokedex.js').pokemon_pokedex;
var moves = require('./lookup/moves.js').moves;
var locations_index = require('./lookup/locations.js').locations_index;
var pokemon_types = require('./lookup/pokemon_types.js').pokemon_types;
var catchrates = require('./lookup/catchrate.js').catchrates;

class MemoryConfig {
    // Stores relevant memory addresses for a particular game

    constructor() {
        this.partyPokemonAddress = 0x02024284;
        this.enemyPokemonAddress = 0x0202402C;
    }

    // Load a memory config object from a config file
    loadFromFile( configFile ) {
    }
}

class MemoryReader {

	constructor( gba , memconfig ) {
		this.gba = gba;
		this.memconfig = memconfig;
	}

	loadU32( mem , address ) {
		var ans = mem.load32( address );
		if ( ans < 0 ) { ans += 2**32; }
		return ans;
	}

    // Returns a beegData object containing all relevant information
    getAllData() {
        var beegData = {};

        beegData.partyPokemon = this.getPartyPokemonData( this.memconfig.partyPokemonAddress );
		var enemyPokemon = this.parsePokemon( this.memconfig.enemyPokemonAddress );
		if ( this.isNotZeroPokemon( enemyPokemon ) ) {
			//beegData.enemyPokemon = enemyPokemon;
			beegData.catchRate = this.getCatchRate( beegData.enemyPokemon );
		}

        return beegData;
    }

	// check if pokemon is really the zero pokemon
	isNotZeroPokemon( pokemon ) {
		return pokemon.info.species != 0;
	}

    // Returns a Party object
    getPartyPokemonData( address ) {
        return [...Array(6).keys()]
            .map( i => address + i * 100 )
            .map( address => this.parsePokemon( address ) )
			.filter( this.isNotZeroPokemon );
    }

	parsePokemon( address ) {
		// https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_III)
		var pokemon = {};
		var mem = this.gba.mmu;
		pokemon.misc = {};
		pokemon.stats = {};
		pokemon.info = {};
		pokemon.personality_value = this.loadU32( mem , address );
		pokemon.OT = {};
		pokemon.OT.OTID = this.loadU32( mem , address + 4 );
		var nickname = "";
		for ( var i = 0 ; i < 10 ; i++ ) {
			nickname += this.hexToChar( mem.loadU8( address + 8 + i ) );
		}
		pokemon.info.nickname = nickname;
		pokemon.misc.language = this.languageParser( mem.loadU16( address + 18 ) );
		var OTname = "";
		for ( var i = 0 ; i < 7 ; i++ ) {
			OTname += this.hexToChar( mem.loadU8( address + 20 + i ) );
		}
		pokemon.OT.OTname = OTname;
		pokemon.misc.markings = mem.loadU8( address + 27 );
		pokemon.misc.checksum = mem.loadU16( address + 28 );
		// DATA HERE
		this.parseSubstructureData( address + 32 , pokemon , mem );
		// STATUS CONDITION HERE
		pokemon.stats.status = {};
		var status_byte = mem.loadU8( address + 80 );
		pokemon.stats.status.sleep = ( status_byte & 0x07 );
		pokemon.stats.status.poison = ( ( ( status_byte & 0x08 ) >>> 3 ) == 1 );
		pokemon.stats.status.burn = ( ( ( status_byte & 0x10 ) >>> 4 ) == 1 );
		pokemon.stats.status.freeze = ( ( ( status_byte & 0x20 ) >>> 5 ) == 1 );
		pokemon.stats.status.paralysis = ( ( ( status_byte & 0x40 ) >>> 6 ) == 1 );
		pokemon.stats.status.bad_poison = ( ( ( status_byte & 0x80 ) >>> 7 ) == 1 );
		//
		pokemon.stats.level = mem.loadU8( address + 84 );
		pokemon.misc.pokerus.remaining = mem.loadU8( address + 85 );
		pokemon.stats.currentHP = mem.loadU16( address + 86 );
		pokemon.stats.totalHP = mem.loadU16( address + 88 );
		pokemon.stats.attack = mem.loadU16( address + 90 );
		pokemon.stats.defense = mem.loadU16( address + 92 );
		pokemon.stats.speed = mem.loadU16( address + 94 );
		pokemon.stats.sp_attack = mem.loadU16( address + 96 );
		pokemon.stats.sp_defense  = mem.loadU16( address + 98 );

		return pokemon;
	}

	parseSubstructureData( address , pokemon , mem ) {
		const substructure_order = [
			"GAEM", "GAME", "GEAM", "GEMA", "GMAE", "GMEA",
			"AGEM", "AGME", "AEGM", "AEMG", "AMGE", "AMEG",
			"EGAM", "EGMA", "EAGM", "EAMG", "EMGA", "EMAG",
			"MGAE", "MGEA", "MAGE", "MAEG", "MEGA", "MEAG"
		];
		var decryption_key = pokemon.personality_value ^ pokemon.OT.OTID;
		var order = substructure_order[ ( ( pokemon.personality_value % 24 ) + 24 ) % 24 ];
		var pp_bonus_cache = [];
		for ( var i = 0 ; i < 4 ; i++ ) {
			var block_address = address + 12*i;
			var first_four = this.loadU32( mem , block_address ) ^ decryption_key;
			var second_four = this.loadU32( mem , block_address + 4 ) ^ decryption_key;
			var third_four = this.loadU32( mem , block_address + 8 ) ^ decryption_key;
			if ( order[ i ] == "G" ) {
				pokemon.info.species = ( first_four & 0x0000ffff );
				pokemon.info.species_name = pokemon_index[ pokemon.info.species ];
				pokemon.info.pokedex_id = pokemon_pokedex[ pokemon.info.species ];
				pokemon.info.type = pokemon_types[ pokemon.info.pokedex_id ];
				pokemon.stats.item = ( first_four & 0xffff0000 ) >>> 16;
				pokemon.stats.exp = second_four;
				var pp_bonuses = ( third_four & 0x000000ff );
				pp_bonus_cache.push( pp_bonuses & 0x03 );
				pp_bonus_cache.push( ( pp_bonuses & 0x0C ) >>> 2 );
				pp_bonus_cache.push( ( pp_bonuses & 0x30 ) >>> 4 );
				pp_bonus_cache.push( ( pp_bonuses & 0xC0 ) >>> 6 );
				pokemon.stats.friendship = ( third_four & 0x0000ff00 ) >>> 8;
			} else if ( order[ i ] == "A" ) {
				var move1 = ( first_four & 0x0000ffff );
				var move2 = ( first_four & 0xffff0000 ) >>> 16;
				var move3 = ( second_four & 0x0000ffff );
				var move4 = ( second_four & 0xffff0000 ) >>> 16;
				var pp1 = ( third_four & 0x000000ff );
				var pp2 = ( third_four & 0x0000ff00 ) >>> 8;
				var pp3 = ( third_four & 0x00ff0000 ) >>> 16;
				var pp4 = ( third_four & 0xff000000 ) >>> 24;
				pokemon.moves = [];
				pokemon.moves.push( { movedata : moves[ move1 ] , id : move1 , pp : pp1 } );
				pokemon.moves.push( { movedata : moves[ move2 ] , id : move2 , pp : pp2 } );
				pokemon.moves.push( { movedata : moves[ move3 ] , id : move3 , pp : pp3 } );
				pokemon.moves.push( { movedata : moves[ move4 ] , id : move4 , pp : pp4 } );
			} else if ( order[ i ] == "E" ) {
				pokemon.EVs = {};
				pokemon.conditions = {};
				pokemon.EVs.HP = ( first_four & 0x000000ff );
				pokemon.EVs.attack = ( first_four & 0x0000ff00 ) >>> 8;
				pokemon.EVs.defense = ( first_four & 0x00ff0000 ) >>> 16;
				pokemon.EVs.speed = ( first_four & 0xff000000 ) >>> 24;
				pokemon.EVs.sp_attack = ( second_four & 0x000000ff );
				pokemon.EVs.sp_defense = ( second_four & 0x0000ff00 ) >>> 8;
				pokemon.conditions.coolness = ( second_four & 0x00ff0000 ) >>> 16;
				pokemon.conditions.beauty = ( second_four & 0xff000000 ) >>> 24;
				pokemon.conditions.cuteness = ( third_four & 0x000000ff );
				pokemon.conditions.smartness = ( third_four & 0x0000ff00 ) >>> 8;
				pokemon.conditions.toughness = ( third_four & 0x00ff0000 ) >>> 16;
				pokemon.conditions.feel = ( third_four & 0xff000000 ) >>> 24;
			} else if ( order[ i ] == "M" ) {
				// TODO: parse more thoroughly
				var pokerus_status = ( first_four & 0x000000ff );
				pokemon.misc.pokerus = {};
				pokemon.misc.pokerus.days_until_cured = ( pokerus_status & 0x0f );
				pokemon.misc.pokerus.strain = ( pokerus_status & 0xf0 ) >>> 4;
				pokemon.misc.met_location = ( first_four & 0x0000ff00 ) >>> 8 ;
				pokemon.misc.met_location_name = locations_index[ pokemon.misc.met_location ];
				//
				var origins_info = ( first_four & 0xffff0000 ) >>> 16;
				pokemon.misc.origins = {};
				pokemon.misc.origins.level_met = ( origins_info & 0x007F );
				pokemon.misc.origins.game_of_origin = this.gameOfOrigin( ( origins_info & 0x0780 ) >>> 7  );
				pokemon.misc.origins.pokeball = this.pokeballLookup( ( origins_info & 0x7800 ) >>> 11  );
				pokemon.OT.gender = ( ( ( origins_info & 0x8000 ) >>> 15 ) ? "Female" : "Male" );
				//
				var iv_egg_ability = second_four;
				pokemon.IVs = {};
				pokemon.IVs.HP = ( iv_egg_ability & 0x0000001F );
				pokemon.IVs.attack = ( iv_egg_ability & 0x000003E0 ) >>> 5;
				pokemon.IVs.defense = ( iv_egg_ability & 0x00007C00 ) >>> 10;
				pokemon.IVs.speed = ( iv_egg_ability & 0x000F8000 ) >>> 15;
				pokemon.IVs.sp_attack = ( iv_egg_ability & 0x01F00000 ) >>> 20;
				pokemon.IVs.sp_defense = ( iv_egg_ability & 0x3E000000 ) >>> 25;
				pokemon.misc.is_egg = ( ( iv_egg_ability & 0x40000000 ) >>> 30 ) == 1;
				pokemon.misc.ability = ( ( iv_egg_ability & 0x80000000 ) >>> 31 ) + 1;
				//
				var ribbons_obedience = third_four;
				pokemon.ribbons = {};
				pokemon.ribbons.cool = this.ribbonLookup( ribbons_obedience & 0x00000007 );
				pokemon.ribbons.beauty = this.ribbonLookup( ( ribbons_obedience & 0x00000038 ) >>> 3 );
				pokemon.ribbons.cute = this.ribbonLookup( ( ribbons_obedience & 0x000001C0 ) >>> 6 );
				pokemon.ribbons.smart = this.ribbonLookup( ( ribbons_obedience & 0x00000E00 ) >>> 9 );
				pokemon.ribbons.tough = this.ribbonLookup( ( ribbons_obedience & 0x00007000 ) >>> 12 );
				pokemon.ribbons.champion = !!( ( ribbons_obedience & 0x00008000 ) >>> 15 );
				pokemon.ribbons.winning = !!( ( ribbons_obedience & 0x00010000 ) >>> 16 );
				pokemon.ribbons.victory = !!( ( ribbons_obedience & 0x00020000 ) >>> 17 );
				pokemon.ribbons.artist = !!( ( ribbons_obedience & 0x00040000 ) >>> 18 );
				pokemon.ribbons.effort = !!( ( ribbons_obedience & 0x00080000 ) >>> 19 );
				pokemon.ribbons.special = {};
				pokemon.ribbons.special.sp1 = !!( ( ribbons_obedience & 0x00100000 ) >>> 20 );
				pokemon.ribbons.special.sp2 = !!( ( ribbons_obedience & 0x00200000 ) >>> 21 );
				pokemon.ribbons.special.sp3 = !!( ( ribbons_obedience & 0x00400000 ) >>> 22 );
				pokemon.ribbons.special.sp4 = !!( ( ribbons_obedience & 0x00800000 ) >>> 23 );
				pokemon.ribbons.special.sp5 = !!( ( ribbons_obedience & 0x01000000 ) >>> 24 );
				pokemon.ribbons.special.sp6 = !!( ( ribbons_obedience & 0x04000000 ) >>> 26 );
				pokemon.misc.obedience = !!( ( ribbons_obedience & 0x80000000 ) >>> 31 );
			}
		}
		for ( var i  = 0 ; i < pokemon.moves.length ; i++ ) {
			pokemon.moves[i].pp_bonus = pp_bonus_cache[i];
		}
	}

	ribbonLookup( val ) {
		var table = {
			0 : false,
			1 : "Normal",
			2 : "Super",
			3 : "Hyper",
			4 : "Master",
		}
		if ( val in table ) {
			return table[ val ];
		} else {
			return "???";
		}
	}

	pokeballLookup( val ) {
		var table = {
			1 : "Master Ball",
			2 : "Ultra Ball",
			3 : "Great Ball",
			4 : "PokéBall",
			5 : "Safari Ball",
			6 : "Net Ball",
			7 : "Dive Ball",
			8 : "Nest Ball",
			9 : "Repeat Ball",
			10 : "Timer Ball",
			11 : "Luxury Ball",
			12 : "Premier Ball"
		}
		if ( val in table ) {
			return table[ val ];
		} else {
			return "???";
		}
	}
	
	gameOfOrigin( val ) {
		var table = {
			0 : "Colosseum Bonus Disc",
			1 : "Sapphire",
			2 : "Ruby",
			3 : "Emerald",
			4 : "Fire Red",
			5 : "Leaf Green",
			15 : "Colosseum or XD"
		}
		if ( val in table ) {
			return table[ val ];
		} else {
			return "???";
		}
	}

	languageParser( val ) {
		var langs = {
			513 : "Japanese",
			514 : "English",
			515 : "French",
			516 : "Italian",
			517 : "German",
			518 : "Korean",
			519 : "Spanish"
		}
		if ( val in langs ) {
			return langs[ val ];
		} else {
			return "???";
		}
	}

	hexToChar( num ) {
		// TODO: include entire char table
		// https://bulbapedia.bulbagarden.net/wiki/Character_encoding_(Generation_III)
		while ( num < 0 ) {
			num += 256;
		}
		while ( num > 255 ) {
			num -= 256;
		}

		var exceptions = {
			0 : " ",
			171 : "!",
			172 : "?",
			173 : ".",
			174 : "-",
			255 : ""
		};
		if ( num >= 187 && num <= 212 ) {
			return String.fromCharCode( num - 187 + 65 );
		} else if ( num >= 213 && num <= 238 ) {
			return String.fromCharCode( num - 213 + 97 );
		} else if ( num >= 161 && num <= 170 ) {
			return ( (num - 161) + "" );
		} else if ( num in exceptions ) {
			return exceptions[ num ];
		} else {
			return "?";
		}
	}

	getCatchRate( pokemon ) {
		var rate = catchrates[ pokemon.info.pokedex_id ];
		var statusBonus = 1;
		if ( pokemon.stats.status.sleep > 0 || pokemon.stats.status.freeze ) {
			statusBonus = 2;
		} else if ( pokemon.stats.status.paralysis || pokemon.stats.status.poison || pokemon.stats.status.burn ) {
			statusBonus = 1.5;
		}
		var base = ( 3 * pokemon.stats.totalHP - 2 * pokemon.stats.currentHP ) * rate ;
		var ans = {};
		ans.pokeball = this.catchRateHelper( base , 1 , pokemon.stats.totalHP , statusBonus );
		ans.greatball = this.catchRateHelper( base , 1.5 , pokemon.stats.totalHP , statusBonus );
		ans.ultraball = this.catchRateHelper( base , 2 , pokemon.stats.totalHP , statusBonus );
		ans.masterball = 255;
		var netball = 1;
		if ( pokemon.info.type.includes( "Water" ) || pokemon.info.type.includes( "Bug" ) ) {
			netball = 3.5;
		}
		ans.netball = this.catchRateHelper( base , netball , pokemon.stats.totalHP , statusBonus );
		var nestball = 1;
		if ( pokemon.stats.level >= 1 && pokemon.stats.level <= 29 ) {
			var val = (41 - pokemon.stats.level) / 10.0;
			nestball = val;
		}
		ans.nestball = this.catchRateHelper( base , nestball , pokemon.stats.totalHP , statusBonus );

		return ans;
	}

	catchRateHelper( base , ball , totalHP , statusBonus ) {
		var x = Math.floor( base * ball );
		x = Math.floor( x / ( 3 * totalHP ) );
		x *= statusBonus;
		return Math.min( Math.floor( x ) , 255 );
	}
}

module.exports = {
    MemoryConfig: MemoryConfig,
    MemoryReader: MemoryReader
}
