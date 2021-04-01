var pokemon_index = require('./lookup/pokemon.js').pokemon_index;
var moves_index = require('./lookup/moves.js').moves_index;

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

        return beegData;
    }

    // Returns a Party object
    getPartyPokemonData( address ) {
        return [...Array(6).keys()]
            .map( i => address + i * 100 )
            .map( address => this.parsePokemon( address ) );
    }

	parsePokemon( address ) {
		// https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_III)
		var pokemon = {};
		var mem = this.gba.mmu;
		pokemon.misc = {};
		pokemon.stats = {};
		pokemon.info = {};
		pokemon.personality_value = this.loadU32( mem , address );
		pokemon.OTID = this.loadU32( mem , address + 4 );
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
		pokemon.OTname = OTname;
		pokemon.misc.markings = mem.loadU8( address + 27 );
		pokemon.misc.checksum = mem.loadU16( address + 28 );
		// DATA HERE
		this.parseSubstructureData( address + 32 , pokemon , mem );
		// STATUS CONDITION HERE
		//
		pokemon.stats.level = mem.loadU8( address + 84 );
		pokemon.misc.pokerus = mem.loadU8( address + 85 );
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
		var decryption_key = pokemon.personality_value ^ pokemon.OTID;
		var order = substructure_order[ ( ( pokemon.personality_value % 24 ) + 24 ) % 24 ];
		for ( var i = 0 ; i < 4 ; i++ ) {
			var block_address = address + 12*i;
			var first_four = this.loadU32( mem , block_address ) ^ decryption_key;
			var second_four = this.loadU32( mem , block_address + 4 ) ^ decryption_key;
			var third_four = this.loadU32( mem , block_address + 8 ) ^ decryption_key;
			if ( order[ i ] == "G" ) {
				pokemon.info.species = ( first_four & 0x0000ffff );
				pokemon.info.species_name = pokemon_index[ pokemon.info.species ];
				pokemon.stats.item = ( first_four & 0xffff0000 ) >> 16;
				pokemon.stats.exp = second_four;
				pokemon.stats.pp_bonuses = ( third_four & 0x000000ff );
				pokemon.stats.friendship = ( third_four & 0x0000ff00 ) >> 8;
			} else if ( order[ i ] == "A" ) {
				var move1 = ( first_four & 0x0000ffff );
				var move2 = ( first_four & 0xffff0000 ) >> 16;
				var move3 = ( second_four & 0x0000ffff );
				var move4 = ( second_four & 0xffff0000 ) >> 16;
				var pp1 = ( third_four & 0x000000ff );
				var pp2 = ( third_four & 0x0000ff00 ) >> 8;
				var pp3 = ( third_four & 0x00ff0000 ) >> 16;
				var pp4 = ( third_four & 0xff000000 ) >> 24;
				pokemon.moves = [];
				pokemon.moves.push( { name : moves_index[ move1 ] , id : move1 , pp : pp1 } );
				pokemon.moves.push( { name : moves_index[ move2 ] , id : move2 , pp : pp2 } );
				pokemon.moves.push( { name : moves_index[ move3 ] , id : move3 , pp : pp3 } );
				pokemon.moves.push( { name : moves_index[ move4 ] , id : move4 , pp : pp4 } );
			} else if ( order[ i ] == "E" ) {
				pokemon.EVs = {};
				pokemon.conditions = {};
				pokemon.EVs.HP = ( first_four & 0x000000ff );
				pokemon.EVs.attack = ( first_four & 0x0000ff00 ) >> 8;
				pokemon.EVs.defense = ( first_four & 0x00ff0000 ) >> 16;
				pokemon.EVs.speed = ( first_four & 0xff000000 ) >> 24;
				pokemon.EVs.sp_attack = ( second_four & 0x000000ff );
				pokemon.EVs.sp_defense = ( second_four & 0x0000ff00 ) >> 8;
				pokemon.conditions.coolness = ( second_four & 0x00ff0000 ) >> 16;
				pokemon.conditions.beauty = ( second_four & 0xff000000 ) >> 24;
				pokemon.conditions.cuteness = ( third_four & 0x000000ff );
				pokemon.conditions.smartness = ( third_four & 0x0000ff00 ) >> 8;
				pokemon.conditions.toughness = ( third_four & 0x00ff0000 ) >> 16;
				pokemon.conditions.feel = ( third_four & 0xff000000 ) >> 24;
			} else if ( order[ i ] == "M" ) {
				// TODO: parse more thoroughly
				pokemon.misc.pokerus_status = ( first_four & 0x000000ff );
				pokemon.misc.met_location = ( first_four & 0x0000ff00 ) >> 8;
				pokemon.misc.origins_info = ( first_four & 0xffff0000 ) >> 16;
				pokemon.misc.iv_egg_ability = second_four;
				pokemon.misc.ribbons_obedience = third_four;
			}
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
}

module.exports = {
    MemoryConfig: MemoryConfig,
    MemoryReader: MemoryReader
}
