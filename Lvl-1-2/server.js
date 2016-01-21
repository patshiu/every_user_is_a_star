var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');

// every servi application must have these 2 lines
var servi = require("servi");
var app = new servi(true);

// set the port (defaults to 3000 if you leave out this line)
port(3001);
route('/', requestHandler);
function requestHandler(request) {
    request.respond(currentPageBody);
}
start();

//track progress
var currentLevel = 1; 
var currentIndex = 0;
var currentPageBody = 'hello world';

//Load json DB
var data = require('./people-1453356599569.json');
console.log(data.directories.length);

var dirIndex = 0; 

var parentDirectoryURL = data.directories[dirIndex].listings[currentIndex].url;

var time = new Date().getTime();
//console.log(time);
var directoryURL = data.directories[dirIndex].directoryName.replace('https://www.facebook.com/directory/people/', '');
console.log(directoryURL);
var name = 'listings-lvl'+currentLevel+'-'+directoryURL+'-'+currentIndex+'-'+time;  //!!!!!
var db = useDatabase(name);


//level
//directory name (url)
//	listings
//		title
//		url
//		...

//for each listing in the json file, create a db file with all the sub listings

var o = {
	"level" : currentLevel,
	"directories" :  [
		//"directoryName" : "A", // A
		//"listings" : []
		]
}

var startingIndex = 0; 
//for each directory, create a new .db 
//then load directory url, and add all sub-directories within that directory to the db

addDirectory(parentDirectoryURL);

function addDirectory(dirName){
	//Create new directory object and add to databas
	var currentDirectory = {
		"directoryName" : dirName,
		"listings" : []
	}
	o.directories.push(currentDirectory);

	var options = {
		url: parentDirectoryURL,
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
	currentPageBody = body;


	console.log($('.fbDirectoryBoxColumn').index())
	if ($('.fbDirectoryBoxColumn').index() > -1){ //check if .fbDirectoryBoxColumn class exists
		$('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(){
			var u = $(this).find('a').attr('href');
			var t = $(this).text();

				console.log('text:',t);
				console.log('url:', u);

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
		console.log(data.directories[dirIndex].listings.length);

		if(currentIndex < data.directories[dirIndex].listings.length){//if we still have indexes to find, keep scraping
			parentDirectoryURL = data.directories[dirIndex].listings[currentIndex].url;
			console.log('adding directory #'+currentIndex+'-'+parentDirectoryURL.replace('https://www.facebook.com/directory/people/', ''));
			addDirectory(parentDirectoryURL);
		}else{ //else write to database
			writeToDatabase();
			console.log('successfully written to database #'+dirIndex+'-'+data.directories[dirIndex].directoryName.replace('https://www.facebook.com/directory/people/', ''));
			dirIndex++;
			//if(dirIndex < data.directories.length){
			if(dirIndex < 3){ //Re-Scraping A to L
				currentIndex = 0; 
				parentDirectoryURL = data.directories[dirIndex].listings[currentIndex].url;
				directoryURL = data.directories[dirIndex].directoryName.replace('https://www.facebook.com/directory/people/', '');
				name = 'listings-lvl'+currentLevel+'-'+directoryURL+'-'+currentIndex+'-'+time;
				db = useDatabase(name);
				addDirectory(parentDirectoryURL);
				console.log('finished writing to database, moving on to #'+dirIndex+'-'+data.directories[dirIndex].directoryName.replace('https://www.facebook.com/directory/people/', ''));
			} else{
				console.log('done!');
			}
		}

	} else { //if '.fbDirectoryBoxColumn' is not found, we have hit captcha. 
		console.log('We hit a CAPTCHA on loading this page: ' + parentDirectoryURL); //report current progress and pause 
		//PAUSE AND LOAD PAGE
		fs.writeFile('error_page.html', body, function (err) {
		  if (err) return console.log(err);
		  console.log('see error_page.html');
		});

	}		
}

function writeToDatabase(){
	// db.add(o);
	console.log('Added to db.');
}




