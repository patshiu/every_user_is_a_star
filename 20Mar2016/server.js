var cheerio = require('cheerio');
var request = require('request');
var jsonfile = require('jsonfile');
var util = require('util');
var fs = require('fs');
var prompt = require('prompt');

var file = 'data/data.json';
var obj = {name: 'JP'};
var debugFiles = 0;


//LVL 0 - ROOT DIRECTORY NAME (Eg. A, B, C, D, E,...)
//-- LVL 1 - LISTINGS1
//---- LVL 2 - LISTING2
//------ LVL 3 - LISTINGS3
//-------- LVL 4 - LISTINGS3
//---------- LVL 5 - PROFILES (Name1, Name2, Name3, Name4, ...)


// DEPTH FIRST
// If not at lvl5, store listings, and keep diving till you hit the end of a branch
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
var currentBranch = [0,0,0,0,0,0];
var totalBranches = [0,0,0,0,0];
var currentDepth = -1;
var nextBranchUrl;


if(currentDepth == -1){ //if you're a the beginning, it's probably wise to start
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
    case -1: //TODO figure out automatic scraping per top directory later
      nextUrl = 'https://www.facebook.com/directory/people/' + currentDirectory;
      break;
    case 0:
      nextUrl = dictionary.listings[currentBranch[0]].url;
      break;
    case 1:
      nextUrl = dictionary.listings[currentBranch[0]].listings[currentBranch[1]].url;

      break;
    case 2:
      console.log("Case 2");
      nextUrl = dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].url;
      break;
    case 3:
      console.log("Case 3. currentBranch: " + currentBranch[0] + ", " + currentBranch[1] + ", " + currentBranch[2] + ", " + currentBranch[3] + ", " + currentBranch[4]);
      console.log("Case 3. totalBranches: " + totalBranches[0] + ", " + totalBranches[1] + ", " + totalBranches[2] + ", " + totalBranches[3] + ", " + totalBranches[4]);
      nextUrl = dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].url;
      break;
    case 4:
      console.log("ERROR: goDive() called at profile page level, no further levels to dive into.");
      riseAndSeekNextBranch();
      break;
    default:
      console.log("ERROR: goDive() called at" + currentDepth + "no further levels to dive into.");
      break;
  }
  //User Agent vars
  var userAgentOptions = {
    url: nextUrl,
    headers: {
      // 'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      // 'Accept-Encoding' : 'gzip, deflate',
      // 'Accept-Language' : 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4',
      // 'Cache-Control' : 'max-age=0',
      // 'Connection' : 'keep-alive',
      // 'Content-Length' : '1338',
      // 'Content-Type' : 'application/x-www-form-urlencoded',
      // 'Cookie' : 'datr=MF_wVu3e-LlMy-c8EUZPL-4Q; reg_fb_ref=https%3A%2F%2Fwww.facebook.com%2Fdirectory%2Fpeople%2FA; reg_fb_gate=https%3A%2F%2Fwww.facebook.com%2Fdirectory%2Fpeople%2FA; act=1458593623980%2F1',
       'Encoding': 'utf8',
      // 'Host' : 'www.facebook.com',
      //'Origin' : 'https://www.facebook.com',
      //'Referer' : 'https://www.facebook.com/directory/people/A',
      // 'Upgrade-Insecure-Requests' : '1',
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
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
      getAllProfilesOnPage($);
    } else if (totalBranches[currentDepth] === 0){ //If we need to get listings first
      getAllListingsOnPage($);
      goDive();
    } else { //else, pull URL up from database and go load
      //check if
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
    dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings.push(thisListing); //push to dictionary
    console.log( "PUSHING TO:" + dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].range);
    console.log( "NEW LISTING:" + dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings[0].profileName);
    console.log( "NEW LISTING:" + dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings[0].url);

  }, writeFile(dictionary));
  console.log("getAllProfilesOnPage() called, total of " + $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').length + " listings.");
  //go up a level

}

function writeFile(data){
  debugFiles++;
  file = 'data/data-' + debugFiles + "_Depth-"+ currentDepth + '.json';
  jsonfile.writeFile(file, data, {spaces: 2}, function(err) {
    var name = dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings[0].profileName;
    var url = dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings[0].url;
    console.log("PROFILE PUSHED. profileName: " + name + "  url: " + url);
    console.log("PARENT || parent range: " + dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].range + " listing's length: " + dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings[currentBranch[3]].listings.length)
    console.log("writeFile() called. at depth of " + currentDepth);
    console.log("Saved to " + file  + "\n\n\n");
    if(err){console.error(err);}
  }); //write to file after each profile-level scrape
}

function getAllListingsOnPage($){
  if(totalBranches[currentDepth] === 0){
    //totalBranches[currentDepth] = $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').length;
    totalBranches[currentDepth] = 2;
    var totalListings = 0;
    $('.fbDirectoryBoxColumn').find('.fbDirectoryBoxColumnItem').each(function(index){ //read and store each link on page
      //___ LISTING SUBJECT
      var u = $(this).find('a').attr('href');
      var t = $(this).text();
      var thisListing = {
        "range" : t,
        "url" : u,
        "listings": []
      }
      totalListings++;
      switch(currentDepth){
        case 0:
          dictionary.listings.push(thisListing);
          break;
        case 1:
          dictionary.listings[currentBranch[0]].listings.push(thisListing);
          break;
        case 2:
          dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings.push(thisListing);
          break;
        case 3:
          dictionary.listings[currentBranch[0]].listings[currentBranch[1]].listings[currentBranch[2]].listings.push(thisListing);
          break;
        case 4: //PROFILE LEVEL
          console.log("ERROR: GetAllListingsOnPage() called on profile level. currenDepth: " + currentDepth);
          break;
        default:
          console.log("ERROR: GetAllListingsOnPage() called on invalid currenDepth: " + currentDepth);
          break;
      }
    });
    //totalBranches[currentDepth] = totalListings;
  } else {
    console.log("ERROR: getAllListingsOnPage() called on a non-empty branch. currentDepth: " + currentDepth +"  currentBranch: " + currentBranch[currentDepth]);
  }
}

function riseAndSeekNextBranch(){

  console.log("riseAndSeekNextBranch() called at currentDepth " + currentDepth );
  currentBranch[currentDepth] = 0;
  currentDepth--;
  console.log("Rising up one level to " + currentDepth);

  if(currentDepth === -1){ //If at top level, and bottom level has been traversed, last write data to file and exit
    // jsonfile.writeFile(file, dictionary, {spaces: 2}, function(err) {
    //   console.error(err);
    // });
    console.log("Success and joy to all mankind. Data exported to: " + file);
    process.exit()
  }

  //At the risen depth, check if there are more listings
  if(totalBranches[currentDepth] != 0){ //if listing's were previously scraped
    if(currentBranch[currentDepth] < totalBranches[currentDepth]-1){
      currentBranch[currentDepth]++;
      console.log("Moving on to next branch.");
      console.log("currentBranch: " + currentBranch[0] + ", " + currentBranch[1] + ", " + currentBranch[2] + ", " + currentBranch[3] + ", " + currentBranch[4]);
      console.log("totalBranches: " + totalBranches[0] + ", " + totalBranches[1] + ", " + totalBranches[2] + ", " + totalBranches[3] + ", " + totalBranches[4]);
      goDive();//go load the next url
    } else {
      totalBranches[currentDepth] = 0; //We've finished traversing all branches at this level, so reset to zero before rising up.
      console.log("At last branch, rising on up again.  ");
      console.log("currentBranch: " + currentBranch[0] + ", " + currentBranch[1] + ", " + currentBranch[2] + ", " + currentBranch[3] + ", " + currentBranch[4]);
      console.log("totalBranches: " + totalBranches[0] + ", " + totalBranches[1] + ", " + totalBranches[2] + ", " + totalBranches[3] + ", " + totalBranches[4]);
      riseAndSeekNextBranch();
    }
  } else if(totalBranches[currentDepth] === 0){ //If there are no listings at the currentDepth.... which should only exist on the first run, where all totalBranches are zero, or if we hit a previously unscraped page
      console.log("This is very odd... we've arrived at a node with no branches to pursue?");
      console.log("CurrentDepth: " + currentDepth);
      console.log("currentBranch: " + currentBranch[0] + ", " + currentBranch[1] + ", " + currentBranch[2] + ", " + currentBranch[3] + ", " + currentBranch[4]);
      console.log("totalBranches: " + totalBranches[0] + ", " + totalBranches[1] + ", " + totalBranches[2] + ", " + totalBranches[3] + ", " + totalBranches[4]);
      riseAndSeeekNextBranch();
  } else if (currentDepth === 5){
      console.log("This is very odd... riseAndSeeekNextBranch() was called but we're at depth of 5.")
  }
}

function getUserResponse() {
  console.log('Hit \'x\' to abort or \'c\' to continue')
  prompt.get(['input'], function (err, result) {
    if (err) { return console.log(err); }
    if(result.input == "x".toLowerCase()){
    } else if(result.input == "c".toLowerCase()){
      goDive();
    } else {
      //console.log(result)
      getUserResponse();
    }
  });
}
