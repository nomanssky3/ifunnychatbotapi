const { EventEmitter } = require('events');
const request = require('request');
const fs = require('fs');
const WebSocket = require('ws');

module.exports = config => {
    const connectUrl = 'https://ws-us-1.sendbird.com/?p=Android&pv=26&sv=3.0.38&ai=' + config.appId + '&user_id=' + config.userId + '&access_token=' + config.accessToken;
    const ws = new WebSocket(connectUrl);

    class Api extends EventEmitter {
        uploadFile(filePath, channelUrl) {
            return new Promise((resolve, reject) => {
                request.post({
                    url: 'https://api-us-1.sendbird.com/v3/storage/file',
                    formData: {
                        file: fs.createReadStream(filePath),
                        channel_url: channelUrl
                    },
                    headers: {
                        'Session-Key': config.sessionKey
                    }
                }, (error, _, body) => {
                    if (error) throw reject(error);
                    console.log(body);
                    return resolve(JSON.parse(body).url);
                });
            });
        }
        sendFile(fileUrl, channelUrl, fileType) {
            return new Promise((resolve, reject) => {
                ws.send('FILE' + JSON.stringify({
                    channel_url: channelUrl,
                    name: 'upload.' + fileType,
                    type: 'image/' + fileType,
                    url: fileUrl,
                    thumbnails: [
                        {
                            url: fileUrl
                        }
                    ]
                }) + '\n', error => {
                    if (error) throw reject(error);
                    return resolve();
                });
            });
        }
        sendMessage(message, channelUrl) {
            ws.send('MESG' + JSON.stringify({
                channel_url: channelUrl,
                message: message
            }) + '\n');
        }
        getChatUrl(userId) {
            return new Promise((resolve, reject) => {
                const url = config.apiUrl + 'chats';
                request.post({
                    url: url,
                    formData: {
                        chat_type: 'chat',
                        users: userId
                    },
                    headers: {
                        Authorization: "Bearer " + config.bearerToken,
                        "User-Agent": config.userAgent
                    }
                }, (error, _, body) => {
                    if (error) throw reject(error);
                    if (JSON.parse(body).error) return resolve(false);
                    return resolve(JSON.parse(body).data.chatUrl);
                });
            });
        }
        getUserId(username) {
            return new Promise((resolve, reject) => {
                const url = config.apiUrl + 'search/users?q=' + username + '&limit=1';
                request.get({
                    url: url,
                    headers: {
                        Authorization: "Bearer " + config.bearerToken
                    }
                }, (error, _, body) => {
                    if (error) throw reject(error);
                    if (JSON.parse(body).data.users.items.length == 0) return resolve(false);
                    if (JSON.parse(body).data.users.items[0].nick.toLowerCase() != username.toLowerCase()) return resolve(false);
                    return resolve(JSON.parse(body).data.users.items[0].id);
                });
            });
        }
        joinChannel(channelUrl) {
            const url = 'https://api-us-1.sendbird.com/v3/group_channels/' + channelUrl + '/accept';
            request.put({
                url: url,
                headers: {
                    'Session-Key': config.sessionKey
                },
                json: {
                    user_id: config.userId
                }
            });
        }
    }

    const API = new Api();

    class User {
        constructor(id, name, pfpUrl) {
            this.id = id;
            this.name = name;
            this.pfpUrl = pfpUrl;
        }
    }

    class iFunnyMessage {
        constructor(text, channelUrl, timeSent, user) {
            this.text = text;
            this.channelUrl = channelUrl;
            this.timeSent = timeSent;
            this.user = user;
        }
        reply(message) {
            API.sendMessage('@' + this.user.name + ' ' + message, this.channelUrl)
        }
    }

    ws.on('open', () => API.emit('ready'));

    ws.on('message', message => {
        if (message.startsWith('MESG')) {
            const data = JSON.parse(message.substr(4));
            if (data.user.guest_id != config.userId) {
                const author = new User(data.user.guest_id, data.user.name, data.user.image)
                const iFM = new iFunnyMessage(data.message, data.channel_url, parseInt(data.ts / 1000, 10), author);
                API.emit('message', iFM);
                return;
            }
        } else if (message.startsWith('SYEV')) {
            const data = JSON.parse(message.substr(4));
            let invited = false;
            if (!data.data.invitees) return;
            for (let i = 0; i < data.data.invitees.length; i++) {
                if (data.data.invitees[i].nickname.toLowerCase() == config.userName.toLowerCase()) {
                    let invited = true;
                }
            }
            if (invited == false) return;
            API.emit('invited', data.channel_url);
            return;
        }
    });
    return API;
}