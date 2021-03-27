var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

require("dotenv").config();

var GameBoyAdvance = require('gbajs');

var FRAMERATE = Math.min(Math.max( parseInt( process.env.FRAMERATE ), 1 ), 60 );
var PORT = parseInt( process.env.PORT );
var ROMNAME = process.env.ROM_NAME;

var gba = new GameBoyAdvance();
 
gba.logLevel = gba.LOG_ERROR;

function pngToDataURL( socket , png ) {	
	png.pack();
	var chunks = [];
	png.on('data', function(chunk) {
		chunks.push(chunk);
	});
	png.on('end', function() {
		var result = Buffer.concat(chunks);
		socket.emit("canvasData", result.toString('base64') );
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
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + "/public/index.html");
});

io.on('connection', (socket) => {
	setInterval( function() {
		pngToDataURL( socket , gba.screenshot() );
	}, 1000.0/FRAMERATE);
});

http.listen(PORT , function () {
	console.log('Discord Plays Pokemon running on port ' + PORT + '.');
});
