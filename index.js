var express = require('express');
var app = express();

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.listen(1151, function () {
	console.log('Test app on 1151 running!');
});
