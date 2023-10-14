import './App.css';
import { useEffect, useMemo, useState } from 'react'

interface Person {
    name: string;
    color?: string;
}

interface ChatMessage {
    type: string;
    message: string;
    person: Person;
}

function App() {
    const [person, setPerson] = useState<Person>({
        name: '',
    });

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');

    const socket = useMemo(() => new WebSocket('ws://localhost:3000'), []);

    useEffect(() => {
        const addSocketMessage = (event: MessageEvent) => {
            const parsedMessage = JSON.parse(event.data);

            setMessages((messages) => [...messages, parsedMessage]);

            if (parsedMessage.type === 'kick') {
                window.location.reload();
            }
        }

        socket.addEventListener('message', addSocketMessage);

        return () => {
            socket.removeEventListener('message', addSocketMessage);
        }
    }, [socket]);

    function joinChat() {
        const name = prompt('What is your name?');

        if (!name) {
            return;
        }

        setPerson((currentPerson) => {
            const updatedPerson = { ...currentPerson, name };
            const joinMessage = JSON.stringify({ type: 'join', person: updatedPerson });

            socket.send(joinMessage);

            return updatedPerson;
        });
    }

    function sendMessage() {
        if (!input) {
            return;
        }

        let message = '';

        message = JSON.stringify({ type: 'chat', message: input, person });

        if (input.startsWith('/')) {
            message = JSON.stringify({ type: 'command', message: input, person });
        }

        socket.send(message);
        setInput('');
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Twitch chat</h1>
                {person.name.length <= 0 ? (
                    <button onClick={joinChat}>Join Chat</button>
                ) : (
                    <>
                        <ul>
                            {messages.map((incMessage, index) => {
                                const { type, message, person } = incMessage;
                                const { name, color } = person;

                                if (type === 'join') {
                                    return (
                                        <li key={index}>
                                            <span style={{ color }}>{message}</span>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={index}>
                                        <div>
                                            <span style={{ color }}>{name}: </span>
                                            {message}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="input-container">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </>
                )}
            </header>
        </div>
    )
}

export default App
