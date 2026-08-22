import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!channelId) return;

    messageService.history(channelId).then(setMessages).catch(console.error);

    const socket = getSocket();
    if (!socket) return;

    socket.emit('channel:join', channelId);

    function handleNewMessage(message) {
      setMessages((prev) => [...prev, message]);
    }

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.emit('channel:leave', channelId);
      socket.off('message:new', handleNewMessage);
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;

    const socket = getSocket();
    socket?.emit('message:send', { channelId, content: text.trim() });
    setText('');
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={{ fontSize: 16, color: '#888780' }}>#</span>
        <p style={styles.title}>canal</p>
        <div style={{ flex: 1 }} />
        <button style={styles.iconButton} onClick={() => navigate(`/call/${channelId}`)}>
          Chamada
        </button>
      </div>

      <div style={styles.messages}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.user_id === user?.id ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
            }}
          >
            <p style={styles.author}>
              {m.user_id === user?.id ? 'voce' : m.username}
            </p>
            <p
              style={{
                ...styles.bubble,
                background: m.user_id === user?.id ? '#e6f1fb' : '#f1efe8',
              }}
            >
              {m.content}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form style={styles.inputBar} onSubmit={handleSend}>
        <input
          style={styles.input}
          placeholder="Mensagem"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button style={styles.sendButton} type="submit">
          Enviar
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    maxWidth: 380,
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 12px',
    borderBottom: '0.5px solid #e5e3da',
  },
  title: { fontSize: 14, fontWeight: 500, margin: 0 },
  iconButton: {
    fontSize: 12,
    border: '0.5px solid #d3d1c7',
    borderRadius: 8,
    background: '#fff',
    padding: '6px 10px',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  author: { fontSize: 12, color: '#73726c', margin: '0 0 2px' },
  bubble: { fontSize: 13, margin: 0, padding: '6px 10px', borderRadius: 10 },
  inputBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    borderTop: '0.5px solid #e5e3da',
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    border: '0.5px solid #d3d1c7',
    padding: '0 12px',
    fontSize: 14,
  },
  sendButton: {
    height: 38,
    padding: '0 14px',
    borderRadius: 8,
    border: 'none',
    background: '#2c2c2a',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
};
