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

	parsePokemon( address ) {
		// https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_III)
		var pokemon = {};
		var mem = this.gba.mmu;
		pokemon.personality_value = this.loadU32( mem , address );
		pokemon.OTID = this.loadU32( mem , address + 4 );
		var nickname = "";
		for ( var i = 0 ; i < 10 ; i++ ) {
			nickname += this.hexToChar( mem.loadU8( address + 8 + i ) );
		}
		pokemon.nickname = nickname;
		pokemon.language = this.languageParser( mem.loadU16( address + 18 ) );
		var OTname = "";
		for ( var i = 0 ; i < 7 ; i++ ) {
			OTname += this.hexToChar( mem.loadU8( address + 20 + i ) );
		}
		pokemon.OTname = OTname;
		pokemon.markings = mem.loadU8( address + 27 );
		pokemon.checksum = mem.loadU16( address + 28 );
		// DATA HERE
		this.parseSubstructureData( address + 32 , pokemon , mem );
		// STATUS CONDITION HERE
		//
		pokemon.level = mem.loadU8( address + 84 );
		pokemon.pokerus = mem.loadU8( address + 85 );
		pokemon.currentHP = mem.loadU16( address + 86 );
		pokemon.totalHP = mem.loadU16( address + 88 );
		pokemon.attack = mem.loadU16( address + 90 );
		pokemon.defense = mem.loadU16( address + 92 );
		pokemon.speed = mem.loadU16( address + 94 );
		pokemon.sp_attack = mem.loadU16( address + 96 );
		pokemon.sp_defense  = mem.loadU16( address + 98 );

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
				pokemon.species = ( first_four & 0x0000ffff );
				pokemon.item = ( first_four & 0xffff0000 ) >> 16;
				pokemon.exp = second_four;
				pokemon.pp_bonuses = ( third_four & 0x000000ff );
				pokemon.friendship = ( third_four & 0x0000ff00 ) >> 8;
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
				pokemon.moves.push( { id : move1 , pp : pp1 } );
				pokemon.moves.push( { id : move2 , pp : pp2 } );
				pokemon.moves.push( { id : move3 , pp : pp3 } );
				pokemon.moves.push( { id : move4 , pp : pp4 } );
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
				pokemon.pokerus_status = ( first_four & 0x000000ff );
				pokemon.met_location = ( first_four & 0x0000ff00 ) >> 8;
				pokemon.origins_info = ( first_four & 0xffff0000 ) >> 16;
				pokemon.iv_egg_ability = second_four;
				pokemon.ribbons_obedience = third_four;
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

module.exports = MemoryReader
