import * as WebSocket from 'ws';

interface Person {
    name: string;
    color: string;
}

interface ChatMessage {
    type: string;
    message: string;
    person: Person;
}

class ChatRoom {
    private server: WebSocket.Server;
    private clients: Map<WebSocket, Person>;

    constructor() {
        this.server = new WebSocket.Server({ port: 3000 });
        this.clients = new Map<WebSocket, Person>();

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

            if (parsedMessage.type === 'join') {
                const { name } = parsedMessage.person;

                const color = this.generateRandomColor();
                const person: Person = { name, color };

                this.clients.set(socket, person);

                this.broadcast({ type: 'join', message: `${name} has joined the chat!`, person });
            } else if (parsedMessage.type === 'chat') {
                const { message } = parsedMessage;

                const person = this.clients.get(socket);

                if (!person) {
                    return;
                }

                this.broadcast({ type: 'chat', message, person });
            }
        })

        socket.on('close', () => {
            const person = this.clients.get(socket);

            if (!person) {
                return;
            }

            this.clients.delete(socket);
            this.broadcast({ type: 'chat', message: `${person.name} has left the chat`, person });
        })
    }

    private broadcast(message: ChatMessage): void {
        this.clients.forEach((_person, client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        })
    }

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
