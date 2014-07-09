var orchestrate = require('orchestrate');
var twit = require('twit');
var kew = require('kew');

var db = orchestrate(process.env.ORCHESTRATE_API_KEY);
var T = new twit({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var USERNAME = process.env.TWITTER_HANDLE;
var COLLECTION = 'responses';
var MAXIMUM_WAIT = 60 * 1000 * 60; // one hour

// get a random response
function random () {
  // get number of responses
  return db.newSearchBuilder()
  .collection(COLLECTION)
  .limit(0)
  .query('*')
  .then(function (res) {
    return res.body.total_count;
  })
  // generate a random number
  .then(function (count) {
    return Math.floor(Math.random() * count);
  })
  // return that response
  .then(function (offset) {
    return db.newSearchBuilder()
      .collection(COLLECTION)
      .limit(1)
      .offset(offset)
      .query('*');
  })
  .then(function (res) {
    return res.body.results[0];
  });
}

// tweet every {random duration}
function tweet () {
  var wait = Math.floor(Math.random() * MAXIMUM_WAIT);
  setTimeout(function () {
    random()
    .then(function (response) {
      return kew.nfcall(T.post, 'statuses/update', {
        status: response.text
      });
    })
    .then(function () {
      tweet();
    });
  }, wait);
}

// respond to mentions
function reply () {
  var stream = T.stream('statuses/filter', {
    track: USERNAME
  });

  stream.on('tweet', function (tweet) {
    var handle = tweet.user.screen_name;
    random()
    .then(function (response) {
      return "@" + handle + " " + response.text;
    })
    .then(function (text) {
      return kew.nfcall(T.post, 'statuses/update', {
        status: response.text
      });
    });
  });
}

function start () {
  tweet();
  reply();
}

module.exports = {
  random: random,
  tweet: tweet,
  reply: reply,
  start: start
};