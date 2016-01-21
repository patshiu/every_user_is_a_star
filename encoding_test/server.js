// https://www.npmjs.com/package/encoding
// npm install encoding
var encoding = require("encoding");

// FORMAT: var resultBuffer = encoding.convert(text, toCharset, fromCharset);
//var result = encoding.convert("ÕÄÖÜ", "Latin_1");
var result = encoding.convert("ÕÄÖÜ", "UTF-8");
console.log(result); //<Buffer d5 c4 d6 dc>

