// https://github.com/cheeriojs/cheerio
// npm install cheerio

// https://github.com/request/request
// npm install request

// example page: http://itp.nyu.edu/sigs/program/?sortby=tier&semesteryear=Spring%202015

var cheerio = require('cheerio');
var request = require('request');

var url = 'https://www.facebook.com/directory/people/';
request(url, function(err, resp, body) {
  if (err) console.log(err);

  $ = cheerio.load(body);
  console.log(body);
  $('.alphabet_list_desc').each(function() {
  	  console.log("FOUND");
      console.log($(this).text());
      //console.log($(this).find('.course-instructors').text());
      //console.log($(this).find('.course-desc').text());
  });
});