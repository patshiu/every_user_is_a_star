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


var time = new Date();
console.log(time);
var name = 'databases/people-'+time.getMonth()+time.getDay()+'--'+time.getHours()+'-'+time.getMinutes();
var db = useDatabase(name);
var links = [];

var url = 'https://www.facebook.com/directory/people/';

var directories = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25"];
var lastIndex = directories.length;

//track progress
var currentLevel = 1; //we start at 1 because the directories are 0
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

  console.log('directory link found: ' + ($('.fbDirectoryBoxColumn').index() > -1 ? true : false));

  if($('.fbDirectoryBoxColumn').index() > - 1){

    var totalListings = $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').length;

    $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(index){

      var u = $(this).find('a').attr('href');
      var t = $(this).text();

      var currentObject = {
        "title" : t,
        "url" : u,
        "level": currentLevel,
        "listings": []
      }

      switch(currentLevel){
        case 1:
          dictionary.listings.push(currentObject);
          break;
        case 2:
          dictionary.listings[0].listings.push(currentObject);
          break;
        case 3:
          dictionary.listings[0].listings[0].listings.push(currentObject);
          break;
        case 4:
        //gather every name at once
        $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(){
          var u = $(this).find('a').attr('href');
          var t = $(this).text();

          var name = {
            'name': t,
            'url': u
          }

          dictionary.listings[0].listings[0].listings[0].listings.push(name);
        });
        //TODO write separate child databases on every single "checkIfEnd()" == true
        writeToDatabase(); //temp just to see the structure
        //need to set currentLevel back to 0
          break;
        default:
          break;
      }

      console.log('current level - '+currentLevel);
      currentLevel++;


      if(currentLevel < 5){
        options = {
          url: u,
          headers: {
            'encoding': 'utf8',
            'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36;'
            //'User-Agent' : 'request'
          }
        }
        request(options, handleData); //HTTP request
      }else{//we're going back up one level
      //TODO FIX THIS SHIT
        // currentLevel--;
        // if(counter[currentLevel] < totalListings){
        //   counter[currentLevel] += 1; //we are now pushing to the next listing on the above level
        // } else {
        //
        // }
        // checkIfEnd()
          //if level is root, write and quit
          //if end, go to parent level
              //checkIfEnd()
              //if not, increase counter of current level

      }

      return false; //this stops the callback from going through all the URL at a given level
    });

    //TODO this is where we write to the database because we've been through all the nested for loops
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
