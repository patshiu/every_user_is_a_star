// https://github.com/cheeriojs/cheerio
// npm install cheerio

// https://github.com/request/request
// npm install request

var servi = require('servi');
var cheerio = require('cheerio');
var request = require('request');

//starting server
var app = new servi(true);
port(3000);
start();

var db = useDatabase('people');
var links = [];

var url = 'https://www.facebook.com/directory/people/';

var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "25"];
var letter_index = 0;
var current_letter = alphabet[letter_index];

//track progress
var progress_letter = current_letter;
var progress_name = 0;
var current_level = 0;

var options = {
  url: 'https://www.facebook.com/directory/people/'+current_letter,
  headers: {
    'User-Agent': 'google-analytics'
  }
};



var o = {
	"level" : current_level,
	"directories" : {
		"directory" : {
			"directoryName" : "A", // A
			"listings" : []
		}
	}
	
}

request(options, handleData);

// db.add(o);

function handleData(error, response, body){
	$ = cheerio.load(body);

	$('.fbDirectoryBoxColumnItem').each(function(){ //look up every tag that has the fbDirectoryBoxColumnItem class
		if($(this).parent().attr('class').indexOf('fbDirectoryBoxColumn') > -1){//for each of them, check if they have a parent class that is fbDirectoryBoxColumn
			//this is where we get the URL
			var u = $(this).find('a').attr('href');
			var t = $(this).text();

			// console.log('text:',t);
			// console.log('url:', u);

			var current_object = {
				"title" : t,
				"url" : u
			}


			//this would temporarily save to the database
			o.directories.directory.listings.push(current_object);

			//if the url contains Directory, then keep on request URL
			//else if it doesnt save the name and the people url
		}else{
			console.log('does not have the proper class');
		}
	});

	db.add(o);
	console.log('added!')
}

route('/', showAll);

function showAll(request){
	db.getAll(function(data){
		request.header('application/json');
		request.respond(JSON.stringify(data));
	});
}