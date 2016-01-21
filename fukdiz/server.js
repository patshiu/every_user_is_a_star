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

var rootListings = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "25"];


//track progress
var current_level = 0;
var currentLetter;
var currentIndex = 0;


var o = {
	"level" : current_level,
	"directories" : {
		"directory" : [
				//"directoryName" : "A", // A
				//"listings" : []
				]
	}
	
}



//LEVEL 0 Listings Index Iterator
//for(var i = 0; i < rootListings.length; i++){
for(var i = 0; i < 3; i++){
	current_letter = rootListings[i];
	addDirectory(current_letter);
	if (i == 2){
		writeToDatabase();
	}
}


function addDirectory(dirName){
	//Create new directory object and add to databas
	var current_directory = {
		"directoryName" : dirName,
		"listings" : []
	}
	o.directories.directory.push(current_directory);

	var options = {
		url: 'https://www.facebook.com/directory/people/'+current_letter,
		headers: {
			'User-Agent': 'google-analytics'
		}
	}
	request(options, handleData);
	console.log('Added \"' + dirName + '\" directory\'s listings. Current index: ' + currentIndex);
	currentIndex++; 
}

function handleData(error, response, body){
	if (error) console.log(error); //Log Errors
	$ = cheerio.load(body);

	$('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(){
		var u = $(this).find('a').attr('href');
		var t = $(this).text();

			// console.log('text:',t);
			// console.log('url:', u);

			var current_object = {
				"title" : t,
				"url" : u
			}

			//this would temporarily save to the database
			o.directories.directory[o.directories.directory.length-1].listings.push(current_object);
			console.log("I'm doing something.");
	});
}

function writeToDatabase(){
	db.add(o);
	console.log('Added to db.');
}


route('/', showAll);

function showAll(request){
	db.getAll(function(data){
		request.header('application/json');
		request.respond(JSON.stringify(data));
	});
}