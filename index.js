var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var Discord = require('discord.js');
var GameBoyAdvance = require('gbajs');
var gba_yukky = require('gba_yukky.js');

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
    console.log("save called to file: ", file);
	var data = gba_yukky.encodeBase64(gba.mmu.save.view);
	fs.writeFile( file, data );
}

function load( gba, file ) {
    console.log("load called to file: ", file);
	var data = fs.readFileSync( file );
	gba.setSaveData( gba_yukky.decodeBase64( data ) );
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

app.get('/', function (req, res) {
	res.sendFile(__dirname + "/public/index.html");
});

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
			console.log("saving: " + file );
			save( gba, SAVE_DIR + file + ".sav" );
		}

        if ( m.startsWith( "--LOAD-LIST" ) ) {
            console.log( "displaying load list" );
            fs.readdirSync( SAVE_DIR ).forEach( file => {
                // do some discord action
                console.log( file );
            } );
        } else if ( m.startsWith( "--LOAD" ) ) {
			var words = m.split( " " );
			var file = words[1];
			console.log("loading: " + file );
			load( gba, SAVE_DIR + file + ".sav" );
		}
		//console.log( message.author.username + ": " + message.content );
	}
});
