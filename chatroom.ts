import * as WebSocket from 'ws';

interface Person {
    name: string;
    color: string;
    moderator: boolean;
}

interface ChatMessage {
    type: string;
    message: string;
    person: Person;
}

class ChatRoom {
    private server: WebSocket.Server;
    private clients: Map<WebSocket, Person>;
    private people: number;

    constructor() {
        this.server = new WebSocket.Server({ port: 3000 });
        this.clients = new Map<WebSocket, Person>();
        this.people = 0;

        this.setupWebSocket();
    }

    private setupWebSocket(): void {
        this.server.on('connection', (socket: WebSocket) => {
            this.setupSocketEvents(socket);
        })
    }

    private setupSocketEvents(socket: WebSocket): void {
        socket.on('message', (message: string) => {
            const parsedMessage: ChatMessage = JSON.parse(message);
            const { type } = parsedMessage;

            switch (type) {
                case 'join':
                    const { name } = parsedMessage.person;

                    const color = this.generateRandomColor();
                    const newPerson: Person = { name, color, moderator: false };

                    if (newPerson.name === 'Elijahkx') {
                        newPerson.moderator = true;
                    }

                    this.clients.set(socket, newPerson);

                    this.people++;
                    this.broadcastCount();
                    this.broadcast({ type: 'chat', message: `${name} has joined the chat!`, person: { name: 'Server', color: 'green', moderator: true } });
                    break;

                case 'chat':
                    const { message } = parsedMessage;

                    const chattingPerson = this.clients.get(socket);

                    if (!chattingPerson) {
                        return;
                    }

                    this.broadcast({ type: 'chat', message, person: chattingPerson });
                    break;

                case 'command':
                    this.executeCommand(parsedMessage);
                    break;

                default:
                    console.log('wut');
            }
        })

        socket.on('close', () => {
            const person = this.clients.get(socket);

            if (!person) {
                return;
            }

            this.clients.delete(socket);
            this.people--;
            this.broadcastCount();
            this.broadcast({ type: 'chat', message: `${person.name} has left the chat`, person: { name: 'Server', color: 'gray', moderator: true } });
        })
    }

    private broadcast(message: ChatMessage): void {
        this.clients.forEach((_person, client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        })
    }

    private broadcastCount(): void {
        this.clients.forEach((_person, client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'count', count: this.people }));
            }
        })
    }

    private executeCommand(chatMessage: ChatMessage): void {
        const { person } = chatMessage;
        const { name } = person;

        const foundPerson = this.clients.get(this.findClientByName(name) as WebSocket);

        if (foundPerson && !foundPerson.moderator) {
            return;
        }

        const { message } = chatMessage;
        const command = message.split(' ')[0];

        switch (command) {
            case '/kick':
                const name = chatMessage.message.split(' ')[1];
                const client = this.findClientByName(name);

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
                this.broadcast({ type: 'chat', message: `${name} has been kicked from the chat`, person: { name: 'Server', color: 'red', moderator: true } });
                break;

            default:
                console.log('wut');
        }
    }

    private findClientByName(name: string): WebSocket | undefined {
        return Array.from(this.clients.keys()).find((client) => {
            const person = this.clients.get(client);

            if (!person) {
                return undefined;
            }

            return person.name === name;
        });
    };

    private generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';

        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)]
        }

        return color;
    }
}

new ChatRoom();
