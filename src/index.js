require('module-alias/register');
var path = require('path');
var appDir = path.dirname(require.main.filename);
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http, {
  pingTimeout: 2000,
  pingInterval: 2000
});;
var fs = require('fs');
var Discord = require('discord.js');
var GameBoyAdvance = require('gbajs');

var gbaUtil = require('@util/gbaUtil.js');
var { createActionQueue } = require('@src/ActionQueue.js');
var { getActions } = require('@src/MessageParser.js');
var { MemoryConfig, MemoryReader } = require("@src/MemoryReader.js");

require("dotenv").config();
var ANONYMOUS_MODE = ( process.env.ANONYMOUS_MODE == "1" );
var DISCORD_ADMIN_IDS = process.env.DISCORD_ADMIN_IDS;
var DISCORD_TOKEN = process.env.DISCORD_TOKEN;
var DISCORD_GUILD_ID = parseInt( process.env.DISCORD_GUILD_ID );
var DISCORD_CHANNEL_ID = parseInt( process.env.DISCORD_CHANNEL_ID );
var FRAMERATE = Math.min(Math.max( parseInt( process.env.FRAMERATE ), 1 ), 60 );
var MAX_REPEAT = parseInt( process.env.MAX_REPEAT );
var MAX_ACTIONS_QUEUED = parseInt( process.env.MAX_ACTIONS_QUEUED );
var PORT = parseInt( process.env.PORT );
var ACTION_INTERVAL = parseInt( process.env.ACTION_INTERVAL);
var ROMNAME = process.env.ROM_NAME;
var SAVE_DIR = process.env.SAVE_DIR;

var current_save_index = parseInt( process.env.SAVE_SLOT_DEFAULT );

var gba = new GameBoyAdvance();
var keypad = gba.keypad;
var global_draw_interval = undefined;
var actionInterval = undefined;

var connected_addresses = [];
 
gba.logLevel = gba.LOG_ERROR;

var prevFrame = "";
function pngToDataURL( png , override=false ) {	
	png.pack();
	var chunks = [];
	png.on('data', function(chunk) {
		chunks.push(chunk);
	});
	png.on('end', function() {
		var result = Buffer.concat(chunks);
		var ans = result.toString('base64');
		//socket.emit("canvasData", ans );
		if ( ans != prevFrame || override ) {
			io.emit("canvasData", ans );
			prevFrame = ans;
		}
	});
}

io.on('connection', (socket) => {
    var address = socket.request.connection.remoteAddress;
    //var address = socket.handshake.headers['x-forwarded-for'].split(',')[0];
    if ( connected_addresses.includes( address ) ) {
        socket.disconnect();
        return;
    }
    socket.on('disconnect', () => {
        connected_addresses = connected_addresses.filter( function( add ) { return add !== address } );
		io.emit( "viewers" , connected_addresses.length );
    });

    connected_addresses.push( address );

	io.emit( "gameData" , gameData );
	io.emit( "viewers" , connected_addresses.length );
	pngToDataURL( gba.screenshot() , true );
});

var biosBuf = fs.readFileSync(`${appDir}/../node_modules/gbajs/resources/bios.bin`);
gba.setBios(biosBuf);
gba.setCanvasMemory();
 
function loadRom( save_index ) {
    gba.loadRomFromFile('roms/' + ROMNAME, function (err, result) {
        if (err) {
            console.error('loadRom failed:', err);
            process.exit(1);
        }
		if ( !fs.existsSync( SAVE_DIR + "save_state_" + save_index + ".sav" ) ) {
			console.log( "Load " + save_index + " does not exist, loading empty state." );
		}
		else {
			gbaUtil.load( gba , SAVE_DIR + "save_state_" + save_index + ".sav" );
		}
        gba.runStable();

        global_draw_interval = setInterval( function() {
            pngToDataURL( gba.screenshot() );
        }, 1000.0/FRAMERATE);

        actionQueue = createActionQueue( MAX_ACTIONS_QUEUED , MAX_REPEAT );
        actionInterval = setInterval( () => {
            if( actionQueue.hasAction() ) {
                action = actionQueue.getAction()
                keypad.press( action["action"] );
                var displayMessage = { "author" : action["owner"] , "input" : action["message"] }
                if ( ANONYMOUS_MODE ) {
                    displayMessage = { "author" : "" , "input" : action["message"] }
                }
                io.emit( "input" , displayMessage );

            }
        }, ACTION_INTERVAL );
    });
}

loadRom( current_save_index );

var config = new MemoryConfig();
var mr = new MemoryReader( gba , config );
var prevGameData = undefined;
var gameData = undefined;
setInterval( function() {
	gameData = mr.getAllData();
	if ( JSON.stringify( prevGameData ) != JSON.stringify( gameData ) ) {
		io.emit( "gameData" , gameData );
		prevGameData = gameData;
	}
}, 1000 );

// this kinda sucks
app.use(express.static('./src/public'))

http.listen(PORT , function () {
	console.log('Discord Plays Pokemon running on port ' + PORT + '.');
});

var client = new Discord.Client();
client.once('ready', () => {
	console.log('Discord connection ready!');
});
client.login( DISCORD_TOKEN );

var legal_buttons = {
	"A" : keypad.A,
	"B" : keypad.B,
	"SELECT" : keypad.SELECT,
	"START" : keypad.START,
	"RIGHT" : keypad.RIGHT,
	"LEFT" : keypad.LEFT,
	"UP" : keypad.UP,
	"DOWN" : keypad.DOWN,
	"R" : keypad.RIGHT,
	"L" : keypad.LEFT,
	"U" : keypad.UP,
	"D" : keypad.DOWN,
	">" : keypad.RIGHT,
	"<" : keypad.LEFT,
	"^" : keypad.UP,
	"V" : keypad.DOWN,
	"RT" : keypad.R,
	"LT" : keypad.L
};

client.on('message', message => {
	if ( message.guild == DISCORD_GUILD_ID && message.channel == DISCORD_CHANNEL_ID )
	{
		var m = message.content.trim().toUpperCase();
        if ( m.startsWith( "--" ) ) {
            // Commands
            if ( m.startsWith( "--SAVE" ) ) {
                var words = m.split( " " );
                var save_index = current_save_index
                var file = "save_state_" + save_index;
                if ( words.length <= 1 && current_save_index < 0 ) {
                    message.channel.send("No save slot selected, must save to a slot.");
                    file = "";
                }
                if ( words.length > 1 )
                {
                    save_index = parseInt(words[1]);
                    if ( !DISCORD_ADMIN_IDS.includes( message.author.id ) ) {
                        message.channel.send( "You don't have admin privileges to save to other slots." )
                        file = "";
                    }
                    else if ( [0,1,2,3,4,5,6,7,8,9].includes(save_index) ) {
                        file = "save_state_" + save_index;
                    } else {
                        message.channel.send( "Save index invalid. Expecting a number from 0-9, or no index for default." );
                        console.log("Save index " + save_index + " invalid");
                        file = "";
                    }
                }
                if ( file != "" ) {
                    console.log( "saving: " + file );
                    message.channel.send( "Saving to slot " + save_index + "..." );
                    gbaUtil.save( gba, SAVE_DIR + file + ".sav" );
                    message.channel.send( "Game saved." );
                    current_save_index = save_index;
                }
            }

            if ( m.startsWith( "--LOAD" ) ) {
                if ( !DISCORD_ADMIN_IDS.includes( message.author.id ) ) {
                    message.channel.send( "You don't have admin privileges to load savefiles." )
                }
                else {
                    var words = m.split( " " );
                    var file = "save_state_" + current_save_index;
                    var save_index = current_save_index;
                    if ( words.length < 2 ) {
                        file = "placeholder_DNE";
                        save_index = -1;
                    }
                    else {
                        save_index = parseInt(words[1]);
                        if ( [0,1,2,3,4,5,6,7,8,9].includes(save_index) ) {
                            file = "save_state_" + save_index;
                            if ( !fs.existsSync( SAVE_DIR + file + ".sav" ) ) {
                                message.channel.send( "Load " + save_index + " does not exist." );
                                file = "";
                            }
                        } else {
                            message.channel.send( "Load index invalid. Expecting a number from 0-9, or no index for blank slate." );
                            file = "";
                        }
                    }
                    if ( file != "" ) {
                        console.log("loading: " + file );
                        if ( save_index >= 0 ) {
                            message.channel.send( "Loading slot " + save_index + "..." );
                        }
                        else {
                            message.channel.send( "Loading blank slot..." );
                        }
                        clearInterval( global_draw_interval );
                        clearInterval( actionInterval );
                        loadRom( save_index );
                        if ( save_index >= 0 ) {
                            message.channel.send( "Loaded slot " + save_index + "." );
                        }
                        else {
                            message.channel.send( "Loaded blank slot." );
                        }
                        current_save_index = save_index;
                    }
                }
            }

            if ( m.startsWith( "--INFO" ) ) {
                var slot = "Slot " + current_save_index;
                if ( current_save_index == -1 ) {
                    slot = "No slot selected.";
                }
                var embed = new Discord.MessageEmbed()
                    .setColor('#ee1515')
                    .setTitle('Emulator Information')
                    .addFields(
                        { name: 'ROM Name', value: ROMNAME , inline: true },
                        { name: 'Save Slot', value: slot , inline: true },
                    )
                    .setTimestamp()
                    .setFooter('Use \"--INFO\" to get this message.');

                message.channel.send( embed );
            }

            if ( m.startsWith( "--PARTY" ) ) {
                var words = m.split( " " );
                if ( words.length == 1 ) {
                    var partyData = gameData.partyPokemon.map( ( pokemon , index ) => {
                        var body_1 = pokemon.info.species_name + " lvl " + pokemon.stats.level;
                        var body_2 = pokemon.stats.currentHP + "/" + pokemon.stats.totalHP + " HP";
                        var body = body_1 + "\n" + body_2;
                        return { name: "#" + (index+1) + " " + pokemon.info.nickname , value : body , inline: true };
                    });
                    while ( partyData.length < 6 ) {
                        partyData.push( { name: '\u200B', value: '\u200B' , inline : true } )
                    }
                    var embed = new Discord.MessageEmbed()
                        .setColor('#ee1515')
                        .setTitle('Party Data')
                        .addFields( partyData )
                        .setTimestamp()
                        .setFooter('Displays party data.');

                    message.channel.send( embed );
                } else {
                    pokeslot = parseInt(words[1]);
                    if ( [...Array( gameData.partyPokemon.length ).keys()].map( (x) => { return x+1 } ).includes( pokeslot ) )
                    {
                        pokemon = gameData.partyPokemon[ pokeslot - 1 ];
                        var body_1 = pokemon.info.species_name + " lvl " + pokemon.stats.level;
                        var body_2 = pokemon.stats.currentHP + "/" + pokemon.stats.totalHP + " HP";
                        var body = body_1 + "\n" + body_2;
                        var moveData = pokemon.moves.map( ( move ) => {
                            if ( move.name != "" ) {
                                return { name : move.name , value: "PP: " + move.pp , inline : true }
                            } else {
                                return { name : "No move learned" , value: "Empty slot" , inline : true }
                            }
                        });
                        moveData.splice( 2 , 0 , { name: '\u200B', value: '\u200B' , inline : true } );
                        moveData.push( { name: '\u200B', value: '\u200B' , inline : true } );

                        var embed = new Discord.MessageEmbed()
                            .setColor('#ee1515')
                            .setTitle('#' + pokeslot + " " + pokemon.info.nickname)
                            .setDescription( body )
                            .addFields( moveData )
                            .setTimestamp()
                            .setFooter('Displays Pokemon data.');

                        message.channel.send( embed );
                    }
                    else
                    {
                        message.channel.send("Invalid slot.  Choose a pokemon slot that exists.");
                    }
                }
            }

            if ( m.startsWith( "--HELP" ) ) {
                var embed = new Discord.MessageEmbed()
                    .setColor('#ee1515')
                    .setTitle('Discord Plays Pokemon!')
                    .setURL('https://github.com/mabotkin/discord-plays-pokemon')
                    .setDescription('Discord Plays Pokemon allows for users in a Discord channel to send inputs to a GBA emulator, and the output is rendered on a web server.')
                    .addFields(
                        { name: 'GBA Inputs', value: Object.keys( legal_buttons ).join( "\n" ) , inline: true },
                        { name: 'Commands', value: '--PARTY\n--SAVE\n--LOAD\n--INFO\n--HELP', inline: true },
                    )
                    .setTimestamp()
                    .setFooter('Made by Alex, Anoop, and David.');

                message.channel.send( embed );
            }
        } else {
            var {messages, actions} = getActions( m , legal_buttons );
            actionQueue.addActions( actions, messages, message.author.username );
        }
	}
});
