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
  .limit(1)
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
    return res.body.results[0].value;
  })
  .fail(console.error);
}

// tweet every {random duration}
function tweet () {
  var wait = Math.floor(Math.random() * MAXIMUM_WAIT);
  setTimeout(function () {
    random()
    .then(function (response) {
      var func = T.post.bind(T, 'statuses/update', {
        status: response.text
      });
      return kew.nfcall(func);
    })
    .fail(console.error)
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
    if (handle !== USERNAME) {
      random()
      .then(function (response) {
        return "@" + handle + " " + response.text;
      })
      .then(function (text) {
        var func = T.post.bind(T, 'statuses/update', {
          status: text
        });
        return kew.nfcall(func);
      })
      .fail(console.error);
    }
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