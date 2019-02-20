# How to setup

You need a file or JSON format to pass into the function returned from require. for example:

```js
const api = require('ifunnychatbotapi')(require('./config.json'));
```

The JSON should have this structure:

```json
{
    "apiUrl": "https://api.ifunny.mobi/v4/",
    "appId": "AFB3A55B-8275-4C1E-AEA8-309842798187",
    "userAgent": "User-Agent: iFunny/5.8(8082) Android/8.0.0 (samsung; samsung; SM-G955U)",
    "bearerToken": "...",
}
```

Feel free to change `apiUrl`, `appId`, or `userAgent` if needed. You will need to gather the `bearerToken`.

The way to gather this parameter is by monitoring the requests coming out of iFunny using a tool such as Fiddler, Burp Suite, or Charles Proxy

* `bearerToken` is the request sent in the `Authorization` header on each request to the /v4/ endpoint. Do not include the 'Bearer ' part.

*Note: In the future the module should have authentication with only your email and password. Currently you will have to write your own library for generating bearer tokens. However, I have a library of mine and just have to implement it.*

Now that you have the token set up, you can start writing code. The `Api` class inherits `EventEmitter`. This means that you can ask the API when stuff is ready or when it happens. Here's an example for a bot that echos back to a user.

```js
// Require the API
const api = require('ifunnychatapi')(require('./config.json'));
// Start listening for messages once the bot has connected
api.once('ready', () => {
    // When the bot receives a message
    api.on('message', message => {
        // Send @username {text}
        message.reply(message.text);
    });
});
```

Here's an example that automatically joins chats when invited.

```js
// Require the API
const api = require('ifunnychatapi')(require('./config.json'));
// Start listening for messages once the bot has connected
api.once('ready', () => {
    // When the bot receives a invite
    api.on('invited', chatUrl => {
        // Joins the channel with the chatUrl that was given from the invite
        api.joinChannel(chatUrl);
    });
});
```

Here's an example that sends a file to the chat.

```js
// Require the API
const api = require('ifunnychatapi')(require('./config.json'));
// Start listening for messages once the bot has connected
api.once('ready', () => {
    // When the bot recieves a message
    api.on('message', message => {
        // Creating a new command: .image
        // Checks if the message sent is .image
        if (message == '.image') {
            // Sends the image
            api.sendFile('https://pbs.twimg.com/profile_images/865062880168759297/yualzpn3.jpg', message.channelUrl, 'jpeg');
        }
    });
});
```

There are some other features that are currently undocumented.