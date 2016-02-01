// https://github.com/cheeriojs/cheerio
// npm install cheerio

// https://github.com/request/request
// npm install request

var servi = require('servi');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var prompt = require('prompt');

//starting server
var app = new servi(true);

port(3001);
route('/', requestHandler);
function requestHandler(request) {
    request.respond(currentPageBody);
}
start();

var o = {
	"level" : currentLevel,
	"directories" :  [
		//"directoryName" : "A", // A
		//"listings" : []
		]
}

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
var currentPageBody = 'Hello World';


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
			'encoding': 'utf8',
			'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36;'
			//'User-Agent' : 'request'
		}
	}
	request(options, handleData); //DONE
}

function handleData(error, response, body){
	if (error) console.log(error); //Log Errors
	$ = cheerio.load(body);

	currentPageBody = body;
	console.log($('.fbDirectoryBoxColumn').index())
	if(console.log($('.fbDirectoryBoxColumn').index()) > - 1){
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
			//SET TIMEOUT HERE
			setTimeout(function () {
				addDirectory(currentLetter);
			}, Math.random()*1500+2000);
			
		}else{ //else write to database
			writeToDatabase();
		}
	} else {
		console.log('We hit a CAPTCHA on loading this page: ' + 'https://www.facebook.com/directory/people/'+currentLetter); //report current progress and pause 
		//PAUSE AND LOAD PAGE
		fs.writeFile('error_page.html', body, function (err) {
		  if (err) return console.log(err);
		  console.log('see error_page.html');
		  getUserResponse();
		});

	}
	
		
}

function getUserResponse() {
	console.log('Hit \'x\' to abort or \'c\' to continue')
	prompt.get(['input'], function (err, result) {
		if (err) { return console.log(err); }
		if(result.input == "x".toLowerCase()){
			process.exit();
		} else if(result.input == "c".toLowerCase()){
			addDirectory(currentLetter);
		} else {
			//console.log(result)
			getUserResponse();
		}
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