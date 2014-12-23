var _ = require("underscore");
var Twit = require("twit");

var express = require("express");
var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");

var config;
try {
  config = require("./config");
} catch(e) {
  console.log("Failed to find local config, falling back to environment variables");
  config = {
    pusher_app_id: process.env.PUSHER_APP_ID,
    pusher_key: process.env.PUSHER_KEY,
    pusher_secret: process.env.PUSHER_SECRET,
    twitter_consumer_key: process.env.TWITTER_CONSUMER_KEY,
    twitter_consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    twitter_access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    twitter_access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    DEBUG: process.env.DEBUG || false
  }
}

var keywords = config.keywords;
var keywordStats = {};

function log() {
  if( config.DEBUG ) {
    console.log.apply( null, arguments );
  }
}

// Capture uncaught errors
process.on("uncaughtException", function(err) {
  console.log(err);

  log("Attempting to restart stream");
  setImmediate(restartStream);
});

// --------------------------------------------------------------------
// SET UP PUSHER
// --------------------------------------------------------------------
var Pusher = require("pusher");
var pusher = new Pusher({
  appId: config.pusher_app_id,
  key: config.pusher_key,
  secret: config.pusher_secret
});


// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

var app = express();

// Ping
app.get("/ping", function(req, res) {
  res.status(200).end();
});

// Error handler
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true
}));

// Open server on specified port
log("Starting Express server");
app.listen(process.env.PORT || 5001);


// --------------------------------------------------------------------
// SET UP TWITTER
// --------------------------------------------------------------------

var twit = new Twit({
  consumer_key: config.twitter_consumer_key,
  consumer_secret: config.twitter_consumer_secret,
  access_token: config.twitter_access_token_key,
  access_token_secret: config.twitter_access_token_secret
});

var streamRetryCount = 0;
var streamRetryLimit = 10;
var streamRetryDelay = 1000;
var stream;

var startStream = function() {
  var keywords = [ 'santa', 'christmas', 'xmas', 'hohoho', 'humbug' ];
  stream = twit.stream('statuses/filter', { track: keywords.join(',') } );

  stream.on('tweet', function (tweet) {
    if (streamRetryCount > 0) {
      streamRetryCount = 0;
    }

    processTweet(tweet);
  });

  stream.on("error", function(error) {
    console.log("Error");
    console.log(error);

    setImmediate(restartStream);
  });

  stream.on("disconnect", function(response) {
    console.log("Stream end");
    setImmediate(restartStream);
  });

};

var restartingStream = false;
var restartStream = function() {
  if (restartingStream) {
    log("Aborting stream retry as it is already being restarted");
  }

  log("Aborting previous stream");
  if (stream) {
    stream.stop();
  }

  streamRetryCount += 1;
  restartingStream = true;

  if (streamRetryCount >= streamRetryLimit) {
    log("Aborting stream retry after too many attempts");
    return;
  }

  setTimeout(function() {
    restartingStream = false;
    stream.start();
  }, streamRetryDelay * (streamRetryCount * 2));
};

var processTweet = function(tweet) {
  if( publishFilter( tweet ) ) {
    log(tweet);

    pusher.trigger( 'tweets', 'new-tweet', tweet );
  }
};

var publishFilter = function(tweet) {
  // Only send tweets to the client that will be used
  if(!tweet || !tweet.place || !tweet.lang || !tweet.geo) return false;
  if(tweet.lang !== 'en') return false;
  return true;
}

// Start stream after short timeout to avoid triggering multi-connection errors
setTimeout(startStream, 2000);
