var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var Discord = require('discord.js');
var GameBoyAdvance = require('gbajs');

require("dotenv").config();
var ANONYMOUS_MODE = ( process.env.ANONYMOUS_MODE == "1" );
var DISCORD_TOKEN = process.env.DISCORD_TOKEN;
var DISCORD_GUILD_ID = parseInt( process.env.DISCORD_GUILD_ID );
var DISCORD_CHANNEL_ID = parseInt( process.env.DISCORD_CHANNEL_ID );
var FRAMERATE = Math.min(Math.max( parseInt( process.env.FRAMERATE ), 1 ), 60 );
var PORT = parseInt( process.env.PORT );
var ROMNAME = process.env.ROM_NAME;
var SAVE_DIR = process.env.SAVE_DIR;

var gba = new GameBoyAdvance();
 
gba.logLevel = gba.LOG_ERROR;

function save( gba, file ) {
	var data = gba.encodeBase64(gba.mmu.save.view);
	fs.writeFile( file, data );
}

function load( gba, file ) {
	var data = fs.readFileSync( file );
	gba.decodeSaveData( data );
}

var prevFrame = "";
function pngToDataURL( png ) {	
	png.pack();
	var chunks = [];
	png.on('data', function(chunk) {
		chunks.push(chunk);
	});
	png.on('end', function() {
		var result = Buffer.concat(chunks);
		var ans = result.toString('base64');
		//socket.emit("canvasData", ans );
		if ( ans != prevFrame ) {
			io.emit("canvasData", ans );
			prevFrame = ans;
		}
	});
}
 
var biosBuf = fs.readFileSync('./node_modules/gbajs/resources/bios.bin');
gba.setBios(biosBuf);
gba.setCanvasMemory();
 
gba.loadRomFromFile('roms/' + ROMNAME, function (err, result) {
	if (err) {
		console.error('loadRom failed:', err);
		process.exit(1);
	}
	//gba.loadSavedataFromFile('/path/to/game.sav');
	gba.runStable();
	setInterval( function() {
		pngToDataURL( gba.screenshot() );
	}, 1000.0/FRAMERATE);
});

/*
app.get('/', function (req, res) {
	res.sendFile(__dirname + "/public/index.html");
});
*/
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
		var m = message.content.trim();
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
			var file = words[1];
			console.log( "saving: " + file );
			save( gba, SAVE_DIR + file + ".sav" );
		}

		if ( m.startsWith( "--LOAD" ) ) {
			var words = m.split( " " );
			var file = words[1];
			console.log("loading: " + file );
			load( gba, SAVE_DIR + file + ".sav" );
		}

		if ( m.startsWith( "--HELP" ) ) {
			//const attachment = new Discord.MessageAttachment('public/pokeball.png', 'pokeball');
			var embed = new Discord.MessageEmbed()
				.attachFiles(attachment)
				.setColor('#ee1515')
				.setTitle('Discord Plays Pokemon!')
				.setURL('https://github.com/mabotkin/discord-plays-pokemon')
				//.setAuthor('Alex, Anoop, and David', 'attachment://pokeball', 'https://github.com/mabotkin/discord-plays-pokemon')
				.setDescription('Discord Plays Pokemon allows for users in a Discord channel to send inputs to a GBA emulator, and the output is rendered on a web server.')
				//.setThumbnail('attachment://pokeball')
				.addFields(
					{ name: 'GBA Inputs', value: Object.keys( legal_buttons ).join( "\n" ) , inline: true },
					{ name: 'Commands', value: '--SAVE\n--LOAD\n--HELP', inline: true },
				)
				//.setImage('attachment://pokeball')
				.setTimestamp()
				.setFooter('Made by Alex, Anoop, and David.')//, 'attachment://pokeball');

			message.channel.send( embed );
		}
		//console.log( message.author.username + ": " + message.content );
	}
});
