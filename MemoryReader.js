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

	constructor( gba , memconfig, gen=3 ) {
		this.gba = gba;
		this.memconfig = memconfig;
		if ( gen != 3 ) { throw "Only Generation 3 memory format is currently supported."; }
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
		pokemon.personality_value = mem.load32( address );
		pokemon.OTID = mem.load32( address + 4 );
		var nickname = "";
		for ( var i = 0 ; i < 10 ; i++ ) {
			nickname += this.hexToChar( mem.load8( address + 8 + i ) );
		}
		pokemon.nickname = nickname;
		pokemon.language = this.languageParser( mem.load16( address + 18 ) );
		var OTname = "";
		for ( var i = 0 ; i < 7 ; i++ ) {
			OTname += this.hexToChar( mem.load8( address + 20 + i ) );
		}
		pokemon.OTname = OTname;
		pokemon.markings = mem.load8( address + 27 );
		pokemon.checksum = mem.load16( address + 28 );
		// DATA HERE

		// STATUS CONDITION HERE
		//
		pokemon.level = mem.load8( address + 84 );
		pokemon.pokerus = mem.load8( address + 85 );
		pokemon.currentHP = mem.load16( address + 86 );
		pokemon.totalHP = mem.load16( address + 88 );
		pokemon.attack = mem.load16( address + 90 );
		pokemon.defense = mem.load16( address + 92 );
		pokemon.speed = mem.load16( address + 94 );
		pokemon.sp_attack = mem.load16( address + 96 );
		pokemon.sp_defense  = mem.load16( address + 98 );

		return pokemon;
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
			174 : "-"
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
