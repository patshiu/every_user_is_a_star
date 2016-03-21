var cheerio = require('cheerio');
var request = require('request');
var jsonfile = require('jsonfile');
var util = require('util');
var fs = require('fs');
var prompt = require('prompt');

var file = 'data/data.json';
var obj = {name: 'JP'};


//LVL 0 - ROOT DIRECTORY NAME (Eg. A, B, C, D, E,...)
//-- LVL 1 - LISTINGS1
//---- LVL 2 - LISTING2
//------ LVL 3 - LISTINGS3
//-------- LVL 4 - PROFILES 4 (Name1, Name2, Name3, Name4, ...)


// DEPTH FIRST
// If not at lvl3, store listings, and keep diving till you hit the end of a branch
  //request a page,
  //check it for listings
  //save all listings and their links
    //dive a level deeper?
     //if possible:
      //save all listing and their links — these are profiles, so write to file
    //else:
      //go one level up, increment to the next listing?
        //if possible:
          //dive in and save all.
            //can you dive deeper?
        //else
          //go one level up

var root = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25"];
var dictionary;


//Tree navigation vars
var currentBranch = [0,0,0,0,0];
var totalBranches = [0,0,0,0];
var currentDepth = 0;
var nextBranchUrl;


if(currentDepth == 0){ //if you're a the beginning, it's probably wise to start
  goDive();
}


function goDive(){
  //Initialize the root URL & dictionary
  var currentDirectory = root[currentBranch[0]]; //TODO hard coded for now to test.
  if(dictionary == null){
    dictionary = {
      "section" : currentDirectory,
      "listings" :  []
    }
  }
  //Grab URL and database
  var nextUrl;
  switch(currentDepth){
    case 0:
      nextUrl = 'https://www.facebook.com/directory/people/' + currentDirectory;
      break;
    case 1:
      nextUrl = dictionary.listings[currentBranch[1]].url;
      break;
    case 2:
      nextUrl = dictionary.listings[currentBranch[1]].listings[currentBranch[2]].url;
      break;
    case 3:
      nextUrl = dictionary.listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].url;
      break;
    case 4:
      console.log("ERROR: goDive() called at profile page level, no further levels to dive into.");
      break;
    default:
      console.log("ERROR: goDive() called at" + currentDepth + "no further levels to dive into.");
      break;
  }
  //User Agent vars
  var userAgentOptions = {
    url: nextUrl,
    headers: {
      'encoding': 'utf8',
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36;'
      //'User-Agent' : 'request'
    }
  }
  console.log("Requesting page: " + nextUrl);
  request(userAgentOptions, processPageData); //And make a HTTP request for the page
}



function processPageData(error, response, body){
  //Util: Report if page loaded
  if (error) console.log(error); //Log Errors
  $ = cheerio.load(body);
  console.log('directory link found: ' + ($('.fbDirectoryBoxColumn').index() > -1 ? true : false));
  //If page is not captcha, get to werkwerkwaerkwaerkwaerk...
  if($('.fbDirectoryBoxColumn').index() > - 1){ //Listings found
    currentDepth++; //we've gone a level in
    if(currentDepth === 4){
      getAllProfilesOnPage();
    } else if (totalBranches[currentDepth] == 0){ //If we need to get listings first
      getAllListingsOnPage();
      goDive();
    } else { //else, pull URL up from database and go load
      goDive();
    }
  } else {
    //PAUSE AND LOAD PAGE
    fs.writeFile('error_page.html', body, function (err) {
      if (err) return console.log(err);
      console.log('see error_page.html');
      getUserResponse();
    });
    console.log("ERROR: lol lol captchas.");
  }
}

function getAllProfilesOnPage($){
  $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(index){ //read and store each link on page
    var u = $(this).find('a').attr('href');
    var t = $(this).text();
    var thisListing = {
      "profileName" : t,
      "url" : u
    };
    dictionary.listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings.push(thisListing); //push to dictionary
  });

  jsonfile.writeFile(file, dictionary, {spaces: 2}, function(err) {
    console.error(err);
  }); //write to file after each profile-level scrape
  //go up a level
  riseAndSeekNextBranch();
}

function getAllListingsOnPage($){
  if(totalBranch[curentDepth] == 0){
    //totalBranches[currentDepth] = $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').length;
    totalBranches[currentDepth] = 3;
    $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(index){ //read and store each link on page
      //___ LISTING SUBJECT
      var u = $(this).find('a').attr('href');
      var t = $(this).text();
      var thisListing = {
        "range" : t,
        "url" : u,
        "listings": []
      }
      switch(currentDepth){
        case 1:
          dictionary.listings.push(thisListing);
          break;
        case 2:
          dictionary.listings[currentBranch[1]].listings.push(thisListing);
          break;
        case 3:
        dictionary.listings[currentBranch[1]].listings[currentBranch[2]].listings.push(thisListing);
          break;
        default:
          console.log("ERROR: GetAllListingsOnPage() called on invalid currenDepth: " + currentDepth);
          break;
      }
    });
  } else {
    console.log("ERROR: getAllListingsOnPage() called on a non-empty branch. currentDepth: " + currentDepth +"  currentBranch: " + currentBranch[currentDepht]);
  }
}

function riseAndSeekNextBranch(){
  currentDepth--;
  if(currentDepth < 0){
    console.log("ERROR: currentDepth is at the impossible value of: " + currentDepth);
    process.exit();
  }
  if(currentDepth === 0 && totalBranch[3] != 0){ //If at top level, and bottom level has been traversed, last write data to file and exit
    jsonfile.writeFile(file, dictionary, {spaces: 2}, function(err) {
      console.error(err);
    });
    console.log("Success and joy to all mankind. Data exported to: " + file);
    process.exit();
  } else if (currentBranch[currentDepth] < totalBranches[currentDepth]-1){ //Else, proceed to the next branch at the level...
    currentBranch[currentDepth]++;
    currentBranch[currentDepth+1] = 0; //RESET THE NEXT LEVEL TOTALBRANCHES TO REPOPULATE
    //proceed to process next branch
    goDive();
  } else { //Else, you're at the last branch of this level rise and seek next branch to process
    riseAndSeekNextBranch();
  }
}

function getUserResponse() {
  console.log('Hit \'x\' to abort or \'c\' to continue')
  prompt.get(['input'], function (err, result) {
    if (err) { return console.log(err); }
    if(result.input == "x".toLowerCase()){
      process.exit();
    } else if(result.input == "c".toLowerCase()){
      goDive();
    } else {
      //console.log(result)
      getUserResponse();
    }
  });
}
