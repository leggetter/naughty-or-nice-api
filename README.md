# Pusher + Twitter API Integration Example

## Naughty or Nice

Demo: [http://leggetter.github.io/naughty-or-nice/](leggetter.github.io/naughty-or-nice)

![Screenshot](https://raw.githubusercontent.com/leggetter/naughty-or-nice/gh-pages/images/screenshot.png "Screenshot")


## Getting up and running

1. [Create a free Pusher account](http://pusher.com/signup)
2. [Create a Twitter application](https://apps.twitter.com/)
3. Generate access tokens on the "Keys and Access Tokens" tab
4. Create a copy of `config.example.js` and name it `config.js`
5. Fill the configuration options with the values from Pusher and Twitter
6. Update the `publishFilter` to only publish the tweets you're interested in
7. Install the dependencies by running `npm install`
8. Test the API locally by running `node index.js`
9. Upload the API somewhere public (this is already set up for [Heroku](http://heroku.com))
10. [Set up the demo](https://github.com/leggetter/naughty-or-nice)

## Credit

Based on a demo originally created by [Robin Hawkes](https://twitter.com/robhawkes)
