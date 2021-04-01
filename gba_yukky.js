function atob(a) {
    return Buffer.from( a, "base64" ).toString( "binary" );
}

function btoa(str) {
    var buffer;

    if ( str instanceof Buffer ) {
        buffer = str;
    } else {
        buffer = new Buffer( str.toString(), "binary" );
    }

    return buffer.toString( "base64" );
}

function decodeBase64(string) {
    //console.log("decoding base 64 string: ", string);
    var length = (string.length * 3 / 4);
    if (string[string.length - 2] == '=') {
        length -= 2;
    } else if (string[string.length - 1] == '=') {
        length -= 1;
    }
    var buffer = new ArrayBuffer(length);
    var view = new Uint8Array(buffer);
    var bits = string.match(/..../g);
    for (var i = 0; i + 2 < length; i += 3) {
        var s = atob(bits.shift());
        view[i] = s.charCodeAt(0);
        view[i + 1] = s.charCodeAt(1);
        view[i + 2] = s.charCodeAt(2);
    }
    if (i < length) {
        var s = atob(bits.shift());
        view[i++] = s.charCodeAt(0);
        if (s.length > 1) {
            view[i++] = s.charCodeAt(1);
        }
    }

    //console.log("decoded base 64 value: ", buffer);
    return buffer;
};

function encodeBase64( view ) {
    //console.log("encoding base 64 view: ", view);
    var data = [];
    var b;
    var wordstring = [];
    var triplet;
    for (var i = 0; i < view.byteLength; ++i) {
        b = view.getUint8(i, true);
        wordstring.push(String.fromCharCode(b));
        while (wordstring.length >= 3) {
            triplet = wordstring.splice(0, 3);
            data.push(btoa(triplet.join('')));
        }
    };
    if (wordstring.length) {
    data.push(btoa(wordstring.join('')));
    }
    //console.log("encoded base 64 value: ", data.join(''));
    return data.join('');
};

module.exports = {
   decodeBase64,
   encodeBase64
}
