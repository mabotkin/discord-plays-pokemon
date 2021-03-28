var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var Discord = require('discord.js');
var GameBoyAdvance = require('gbajs');
var gba_yukky = require('./public/gba_yukky.js');

require("dotenv").config();
var ANONYMOUS_MODE = ( process.env.ANONYMOUS_MODE == "1" );
var DISCORD_ADMIN_IDS = process.env.DISCORD_ADMIN_IDS;
var DISCORD_TOKEN = process.env.DISCORD_TOKEN;
var DISCORD_GUILD_ID = parseInt( process.env.DISCORD_GUILD_ID );
var DISCORD_CHANNEL_ID = parseInt( process.env.DISCORD_CHANNEL_ID );
var FRAMERATE = Math.min(Math.max( parseInt( process.env.FRAMERATE ), 1 ), 60 );
var PORT = parseInt( process.env.PORT );
var ROMNAME = process.env.ROM_NAME;
var SAVE_DIR = process.env.SAVE_DIR;

var current_save_index = parseInt( process.env.SAVE_SLOT_DEFAULT );

var gba = new GameBoyAdvance();
var global_draw_interval = undefined;
 
gba.logLevel = gba.LOG_ERROR;

function save( gba, file ) {
    console.log("save called to file: ", file);
	var data = gba_yukky.encodeBase64(gba.mmu.save.view);
	fs.writeFileSync( file, data , "utf8" );
}

function load( gba, file ) {
    console.log("load called to file: ", file);
	var data = fs.readFileSync( file , "utf8" );
	gba.setSavedata( gba_yukky.decodeBase64( data ) );
	gba.runStable();
}

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
	pngToDataURL( gba.screenshot() , true );
});
 
var biosBuf = fs.readFileSync('./node_modules/gbajs/resources/bios.bin');
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
			load( gba , SAVE_DIR + "save_state_" + save_index + ".sav" );
		}
        gba.runStable();
        global_draw_interval = setInterval( function() {
            pngToDataURL( gba.screenshot() );
        }, 1000.0/FRAMERATE);
    });
}

loadRom( current_save_index );

app.use(express.static('public'))

http.listen(PORT , function () {
	console.log('Discord Plays Pokemon running on port ' + PORT + '.');
});

var client = new Discord.Client();
client.once('ready', () => {
	console.log('Discord connection ready!');
});
client.login( DISCORD_TOKEN );

var keypad = gba.keypad;
var legal_buttons = {
	"A" : keypad.A,
	"B" : keypad.B,
	"SELECT" : keypad.SELECT,
	"START" : keypad.START,
	"RIGHT" : keypad.RIGHT,
	"LEFT" : keypad.LEFT,
	"UP" : keypad.UP,
	"DOWN" : keypad.DOWN,
	"R" : keypad.R,
	"L" : keypad.L
}

client.on('message', message => {
	if ( message.guild == DISCORD_GUILD_ID && message.channel == DISCORD_CHANNEL_ID )
	{
		var m = message.content.trim().toUpperCase();
		if ( m in legal_buttons ) {
			keypad.press( legal_buttons[ m ] );
			//
			var displayMessage = { "author" : message.author.username , "input" : message.content }
			if ( ANONYMOUS_MODE ) {
				displayMessage = { "author" : "" , "input" : message.content }
			}
			io.emit( "input" , displayMessage );
		}

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
				save( gba, SAVE_DIR + file + ".sav" );
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
					loadRom( file );
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

		if ( m.startsWith( "--HELP" ) ) {
			var embed = new Discord.MessageEmbed()
				.setColor('#ee1515')
				.setTitle('Discord Plays Pokemon!')
				.setURL('https://github.com/mabotkin/discord-plays-pokemon')
				.setDescription('Discord Plays Pokemon allows for users in a Discord channel to send inputs to a GBA emulator, and the output is rendered on a web server.')
				.addFields(
					{ name: 'GBA Inputs', value: Object.keys( legal_buttons ).join( "\n" ) , inline: true },
					{ name: 'Commands', value: '--SAVE\n--LOAD\n--INFO\n--HELP', inline: true },
				)
				.setTimestamp()
				.setFooter('Made by Alex, Anoop, and David.');

			message.channel.send( embed );
		}
	}
});
