var express = require('express');
var fs = require('fs');
var GameBoyAdvance = require('gbajs');
const { createCanvas } = require('canvas');
 
var gba = new GameBoyAdvance();
 
gba.logLevel = gba.LOG_ERROR;
 
var screen = createCanvas( 240 , 160 );
var biosBuf = fs.readFileSync('./node_modules/gbajs/resources/bios.bin');
gba.setBios(biosBuf);
gba.setCanvasDirect(screen);
 
gba.loadRomFromFile('roms/pokemon_firered.gba', function (err, result) {
	if (err) {
		console.error('loadRom failed:', err);
		process.exit(1);
	}
	//gba.loadSavedataFromFile('/path/to/game.sav');
	gba.runStable();
});
 
 /*
var idx = 0;
setInterval(function () {
	var keypad = gba.keypad;
	keypad.press(keypad.A);

	setTimeout(function () {
		var png = gba.screenshot();
		png.pack().pipe(fs.createWriteStream('screenshots/gba' + idx + '.png'));
		idx++;
	}, 200);
}, 2000);
*/

var app = express();
app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.listen(1151, function () {
	console.log('Test app on 1151 running!');
});
