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


var time = new Date().getTime();
console.log(time);
var name = 'databases/people-'+time;
var db = useDatabase(name);
var links = [];

var url = 'https://www.facebook.com/directory/people/';

var directories = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25"];
var lastIndex = directories.length;

//track progress
var currentLevel = 0;
var currentDirectory;
var currentIndex = 0;
var currentPageBody = 'Hello World';

currentDirectory = directories[currentIndex];

var dictionary = {
  "letter" : currentDirectory,
  "listings" :  [
  ]
}

addDirectory(currentDirectory);

function addDirectory(dirName){

  var options = {
    url: 'https://www.facebook.com/directory/people/'+currentDirectory,
    headers: {
      'encoding': 'utf8',
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36;'
      //'User-Agent' : 'request'
    }
  }

  request(options, handleData); //HTTP request
}

function handleData(error, response, body){
  if (error) console.log(error); //Log Errors

  $ = cheerio.load(body);
  currentPageBody = body;

  console.log('index: ' + $('.fbDirectoryBoxColumn').index());

  if($('.fbDirectoryBoxColumn').index() > - 1){
    $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(){

      if(currentLevel < 4){
        var u = $(this).find('a').attr('href');
        var t = $(this).text();

        var currentObject = {
          "title" : t,
          "url" : u,
          "level": currentLevel
        }

        currentLevel++;
        console.log('current level - '+currentLevel);

        dictionary.listings.push(currentObject);

        options = {
          url: u,
          headers: {
            'encoding': 'utf8',
            'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36;'
            //'User-Agent' : 'request'
          }
        }

        request(options, handleData); //HTTP request
      }else{//we have reached the individual names
        // var u = $(this).find('a').attr('href');
        // var t = $(this).text();
        //
        // var currentObject = {
        //   "title" : t,
        //   "url" : u,
        //   "level": currentLevel
        // }
        // currentLevel++;
        //
        // dictionary.listings.push(currentObject);
        //
        // writeToDatabase();
      }
      return false; //this stops the callback from going through all the URL at a given level
    });

    // this is a remnant of bfs
    //
    // //move on to the next index
    // currentIndex++;
    // currentDirectory = directories[currentIndex];
    //
    // if(currentIndex < lastIndex){//if we still have indexes to find, keep scraping
    // //if(currentIndex < 2){
    // 	console.log('calling letter',currentDirectory);
    // 	//SET TIMEOUT HERE
    // 	setTimeout(function () {
    // 		addDirectory(currentDirectory);
    // 	}, Math.random()*1500+2000);
    //
    // }else{ //else write to database
    // 	writeToDatabase();
    // }
  }else if(currentLevel == 4){
    console.log('reached the names');

    var u = $(this).find('a').attr('href');
    var t = $(this).text();

    var currentObject = {
      "title" : t,
      "url" : u,
      "level": currentLevel
    }
    currentLevel++;

    dictionary.listings.push(currentObject);

    writeToDatabase();
  }else{
    console.log('We hit a CAPTCHA on loading this page: ' + 'https://www.facebook.com/directory/people/'+currentDirectory); //report current progress and pause
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
      addDirectory(currentDirectory);
    } else {
      //console.log(result)
      getUserResponse();
    }
  });
}

function writeToDatabase(){
  db.add(dictionary);
  console.log('Added to db.');
}


route('/', showAll);

function showAll(request){
  db.getAll(function(data){
    request.header('application/json');
    request.respond(JSON.stringify(data));
  });
}
