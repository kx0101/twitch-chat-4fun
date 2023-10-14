"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("ws");
var ChatRoom = /** @class */ (function () {
    function ChatRoom() {
        this.server = new WebSocket.Server({ port: 3000 });
        this.clients = new Map();
        this.people = 0;
        this.setupWebSocket();
    }
    ChatRoom.prototype.setupWebSocket = function () {
        var _this = this;
        this.server.on('connection', function (socket) {
            _this.setupSocketEvents(socket);
        });
    };
    ChatRoom.prototype.setupSocketEvents = function (socket) {
        var _this = this;
        socket.on('message', function (message) {
            var parsedMessage = JSON.parse(message);
            var type = parsedMessage.type;
            switch (type) {
                case 'join':
                    var name_1 = parsedMessage.person.name;
                    var color = _this.generateRandomColor();
                    var newPerson = { name: name_1, color: color, moderator: false };
                    if (newPerson.name === 'Elijahkx') {
                        newPerson.moderator = true;
                    }
                    _this.clients.set(socket, newPerson);
                    _this.people++;
                    _this.broadcastCount();
                    _this.broadcast({ type: 'chat', message: "".concat(name_1, " has joined the chat!"), person: { name: 'Server', color: 'green', moderator: true } });
                    break;
                case 'chat':
                    var message_1 = parsedMessage.message;
                    var chattingPerson = _this.clients.get(socket);
                    if (!chattingPerson) {
                        return;
                    }
                    _this.broadcast({ type: 'chat', message: message_1, person: chattingPerson });
                    break;
                case 'command':
                    _this.executeCommand(parsedMessage);
                    break;
                default:
                    console.log('wut');
            }
        });
        socket.on('close', function () {
            var person = _this.clients.get(socket);
            if (!person) {
                return;
            }
            _this.clients.delete(socket);
            _this.people--;
            _this.broadcastCount();
            _this.broadcast({ type: 'chat', message: "".concat(person.name, " has left the chat"), person: { name: 'Server', color: 'gray', moderator: true } });
        });
    };
    ChatRoom.prototype.broadcast = function (message) {
        this.clients.forEach(function (_person, client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    };
    ChatRoom.prototype.broadcastCount = function () {
        var _this = this;
        this.clients.forEach(function (_person, client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'count', count: _this.people }));
            }
        });
    };
    ChatRoom.prototype.executeCommand = function (chatMessage) {
        var person = chatMessage.person;
        var name = person.name;
        var foundPerson = this.clients.get(this.findClientByName(name));
        if (foundPerson && !foundPerson.moderator) {
            return;
        }
        var message = chatMessage.message;
        var command = message.split(' ')[0];
        switch (command) {
            case '/kick':
                var name_2 = chatMessage.message.split(' ')[1];
                var client = this.findClientByName(name_2);
                if (!client) {
                    return;
                }
                client.send(JSON.stringify({
                    type: 'kick',
                    message: 'You have been kicked from the chat. Please refresh the page.',
                    person: { name: 'Server', color: 'red', moderator: true }
                }));
                client.close();
                this.clients.delete(client);
                this.people--;
                this.broadcastCount();
                this.broadcast({ type: 'chat', message: "".concat(name_2, " has been kicked from the chat"), person: { name: 'Server', color: 'red', moderator: true } });
                break;
            default:
                console.log('wut');
        }
    };
    ChatRoom.prototype.findClientByName = function (name) {
        var _this = this;
        return Array.from(this.clients.keys()).find(function (client) {
            var person = _this.clients.get(client);
            if (!person) {
                return undefined;
            }
            return person.name === name;
        });
    };
    ;
    ChatRoom.prototype.generateRandomColor = function () {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };
    return ChatRoom;
}());
new ChatRoom();
