import './App.css';
import { useEffect, useMemo, useState } from 'react'
import PersonIcon from '@mui/icons-material/Person';

interface Person {
    name: string;
    color?: string;
    moderator?: string;
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
    const [people, setPeople] = useState<number>(0);

    const socket = useMemo(() => new WebSocket('ws://localhost:3000'), []);

    useEffect(() => {
        const addSocketMessage = (event: MessageEvent) => {
            const parsedMessage = JSON.parse(event.data);

            if (parsedMessage.type !== 'count') {
                setMessages((messages) => [...messages, parsedMessage]);
            }

            if (parsedMessage.type === 'kick') {
                window.location.reload();
            }

            if (parsedMessage.type === 'count') {
                setPeople(parsedMessage.count);
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

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ marginRight: '-8rem', display: 'flex', alignItems: 'center' }}>
                        <PersonIcon style={{ color: 'red', fontSize: '26px', marginTop: '4px' }} />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '20px'  }}>
                        {people}
                    </div>
                </div>

                {person.name.length <= 0 ? (
                    <button onClick={joinChat}>Join Chat</button>
                ) : (
                    <>
                        <ul className="message-list">
                            {messages.map((incMessage, index) => {
                                const { message, person } = incMessage;
                                const { name, color, moderator } = person;

                                return (
                                    <li key={index} className="message-item">
                                        <div style={{ display: 'flex', alignItems: 'left', textAlign: 'left', marginLeft: '0px' }}>
                                            {moderator &&
                                                <img src='../public/mod.png'
                                                    alt='mod'
                                                    style={{ width: '18px', height: '18px', marginRight: '4px', marginLeft: '4px', marginTop: '2px' }}
                                                />
                                            }
                                            <span style={{ color, marginRight: '4px' }}>{name}:</span>
                                            <span>{message}</span>
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
                                style={{ marginBottom: '8px' }}
                            />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </>
                )}
            </header>
        </div>
    );
}

export default App
