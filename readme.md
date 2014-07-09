# Twitter Cat

An example of a Twitter Bot using [Orchestrate][] to store responses.

[Orchestrate]: http://orchestrate.io/

## What?

Twitter's ubiquity and well-documented API make it great for interactive projects and monitoring services. As it so happens, cats are also very interactive, so I figured I'd become a cat lady of the internet and make a twittercat.

A twittercat is a bot that runs a Twitter account, tweeting cat-like things periodically, and at whoever mentions or replies to the twittercat. To start, let's answer why you would build such a silly thing, and finish off with how to do it yourself. If you want to skip to the details, check out the bot's [source](https://github.com/orchestrate-io/twittercat) and its [twitter](https://twitter.com/mx_tweetcat).

<blockquote class="twitter-tweet" lang="en"><p><a href="https://twitter.com/garbados">@garbados</a> *chases an invisible something*</p>&mdash; Mx. Tweetcat (@mx_tweetcat) <a href="https://twitter.com/mx_tweetcat/statuses/486931801945161729">July 9, 2014</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## Why?

Our twittercat doesn't store any of its personality data internally. Instead, it stores everything in Orchestrate, reading it when needed. For static data like a cat's personality, this is overkill. But say you wanted a bot constantly monitoring a site's status, or the weather, or [the Portland Police](https://twitter.com/pdxpolicelog); separating the logic that collects data from the logic that broadcasts it to Twitter means a failure in either doesn't halt the other, while allowing you to hook in other data sources or bots to interpret it as you please.

Twittercat selects items from its Orchestrate collection at random, like this:

```javascript
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
```

But if you wanted to get the latest data instead, just swap that function out for something like this:

```javascript
function latest() {
    return db.newSearchBuilder()
    .collection(COLLECTION)
    .limit(1)
    .query('*')
    .then(function (res) {
        return res.body.results[0].value;
    })
    .fail(console.error);
}
```

That implementation assumes the items in your database have lexicographically ascending keys, which by default, Orchestrate does.

## How?

For simplicity, our twittercat's data source is a static JSON file we'll upload into Orchestrate using [orcup](https://github.com/orchestrate-io/orcup). To get orcup, run this:

    npm install -g orcup

The twittercat's personality file looks like this:

    [
        {"text":"*chases an invisible something*"},
        {"text":"*rubs against furniture*"},
        {"text":"*rubs against your laptop*"},
        {"text":"*rubs against your cup, knocking it off the table*"},
        {"text":"*knocks your pen away from you; glares at you*"},
        {"text":"*sits on your laptop*"},
        {"text":"*blinks, slowly*"},
        {"text":"meow"},
        {"text":"mrow"},
        {"text":"*sits on the roomba as it roves about, surveying the kingdom*"},
        {"text":"https://www.youtube.com/watch?v=tLt5rBfNucc"},
        {"text":"https://www.youtube.com/watch?v=Of2HU3LGdbo"},
        {"text":"*flicks tail angrily*"},
        {"text":"*purrs loudly, interrupting conversation*"},
        {"text":"http://eggchair.maxthayer.org/img/JykzFai.gif"},
        {"text":"https://www.youtube.com/watch?v=0M7ibPk37_U"},
        {"text":"*sits, adorably*"},
        {"text":"*chases the red dot*"},
        {"text":"http://www.businesscat.happyjar.com/"}
    ]

To get it into Orchestrate, run this:

    orcup -a YOUR_API_KEY -c responses PATH/TO/PERSONALITY.json

Now your bot has a personality. Congratulations!

If you want to use a custom data source, just make sure it goes into the `responses` collection. That's where the twittercat reads from.

Now then, actually deploying our twittercat:

## Install

To deploy your Twitter Cat, you'll need these:

* [node.js](http://nodejs.org/)
* [Heroku toolbelt](https://toolbelt.heroku.com/)

Now, get the repo. In a terminal, run:

    git clone git@github.com:orchestrate-io/twittercat.git
    cd twittercat

Then, set your environment variables. Rather than hardcode sensitive settings,
like the bot's Twitter authentication credentials and Orchestrate API key,
we store them as environment variables using Heroku's `.env` file.

So, with a text editor, open up or create a `.env` file and add values like this:

    TWITTER_HANDLE=YOUR_TWITTERBOT_HANDLE
    TWITTER_API_KEY=YOUR_TWITTER_API_KEY
    TWITTER_API_SECRET=YOUR_TWITTER_API_SECRET
    TWITTER_ACCESS_TOKEN=YOUR_TWITTER_ACCESS_TOKEN
    TWITTER_ACCESS_TOKEN_SECRET=YOUR_TWITTER_ACCESS_TOKEN_SECRET
    ORCHESTRATE_API_KEY=YOUR_ORCHESTRATE_API_KEY

To get those credentials from Twitter, follow these steps:

* [Enable mobile updates so your bot can post tweets](https://twitter.com/settings/devices)
* [Create an application](https://apps.twitter.com/app/new)
* Click "Permissions"
* Under "Access", select "Read, Write and Access direct messages", and click Update Settings
* Click “manage API Keys”
* API key is your TWITTER_API_KEY
* API secret is your TWITTER_API_SECRET
* Click “Create my access tokens”
* Watch [this seal play in the snow](https://www.youtube.com/watch?v=753g1cepA9Y) while you wait for your access tokens to generate
* Refresh the API keys page; your access tokens should appear
* Access token is your TWITTER_ACCESS_TOKEN
* Access token secret is your TWITTER_ACCESS_TOKEN_SECRET

To get your API key from Orchestrate, follow these steps:

* [Sign up](https://dashboard.orchestrate.io/apps)
* Create an application
* Look! An API key!

Once you've got your credentials set up, we'll need to give our twittercat a personality -- a bank of responses to use. To do that, we'll use [orcup]()

Now we'll use Heroku to create a web server and push our configuration values to it:

    heroku create
    heroku plugins:install git://github.com/ddollar/heroku-config.git
    heroku config:push

Finally, push your project to Heroku:

    git push heroku master

Witness! Your Twitter Cat is live.

## Next up

All through the making of the twittercat, I've been awwww-ing at my automated pet, but the project is most important as a demonstration of what you can do with bots and databases. [Fork twittercat](https://github.com/orchestrate-io/twittercat), add a dynamic data source, and have fun~

![cat intensifies](http://eggchair.maxthayer.org/img/JykzFai.gif)

## License

[ISC][], yo.

[ISC]: http://opensource.org/licenses/ISC