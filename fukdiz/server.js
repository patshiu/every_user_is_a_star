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

var time = new Date().getTime();
console.log(time);
var name = 'people-'+time;
var db = useDatabase(name);
var links = [];

var url = 'https://www.facebook.com/directory/people/';

var rootListings = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25"];
var lastIndex = rootListings.length;

//track progress
var currentLevel = 0;
var currentLetter;
var currentIndex = 0;


var o = {
	"level" : currentLevel,
	"directories" :  [
		//"directoryName" : "A", // A
		//"listings" : []
		]
}

currentLetter = rootListings[currentIndex];

addDirectory(currentLetter);


function addDirectory(dirName){
	//Create new directory object and add to databas
	var currentDirectory = {
		"directoryName" : dirName,
		"listings" : []
	}
	o.directories.push(currentDirectory);

	var options = {
		url: 'https://www.facebook.com/directory/people/'+currentLetter,
		headers: {
			'User-Agent': 'google-analytics',
			'encoding': 'utf8'
		}
	}
	request(options, handleData); //DONE
}

function handleData(error, response, body){
	if (error) console.log(error); //Log Errors
	$ = cheerio.load(body);

	$('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(){
		var u = $(this).find('a').attr('href');
		var t = $(this).text();

			// console.log('text:',t);
			// console.log('url:', u);

			var currentObject = {
				"title" : t,
				"url" : u
			}

			//this would temporarily save to the database
			o.directories[o.directories.length-1].listings.push(currentObject);
			// console.log('Added listing:', o);
	});

	//move on to the next index
	currentIndex++;
	currentLetter = rootListings[currentIndex];

	if(currentIndex < lastIndex){//if we still have indexes to find, keep scraping
	//if(currentIndex < 2){
		console.log('calling letter',currentLetter);
		addDirectory(currentLetter);
	}else{ //else write to database
		writeToDatabase();
	}
		
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