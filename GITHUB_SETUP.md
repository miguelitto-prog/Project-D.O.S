import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, radius, avatarGradient } from '../theme';

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
        <button style={styles.backButton} onClick={() => navigate('/servers')}>
          ←
        </button>
        <span style={styles.hash}>#</span>
        <p style={styles.title}>geral</p>
        <div style={{ flex: 1 }} />
        <button style={styles.callButton} onClick={() => navigate(`/call/${channelId}`)}>
          ● Chamada
        </button>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Nenhuma mensagem ainda.</p>
            <p style={styles.emptyTextSmall}>Diga oi para comecar a conversa.</p>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.user_id === user?.id;
          return (
            <div key={m.id} style={{ ...styles.row, flexDirection: isMe ? 'row-reverse' : 'row' }}>
              <div style={{ ...styles.avatar, background: avatarGradient(m.username || m.user_id) }}>
                {(isMe ? 'voce' : m.username || '?').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ maxWidth: '72%', textAlign: isMe ? 'right' : 'left' }}>
                <p style={styles.author}>{isMe ? 'voce' : m.username}</p>
                <p
                  style={{
                    ...styles.bubble,
                    background: isMe ? colors.accent : colors.surface2,
                    color: isMe ? colors.onAccent : colors.text,
                    borderTopRightRadius: isMe ? 4 : radius.md,
                    borderTopLeftRadius: isMe ? radius.md : 4,
                  }}
                >
                  {m.content}
                </p>
              </div>
            </div>
          );
        })}
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
    maxWidth: 460,
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: colors.bg,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 14px',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.surface1,
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: colors.textSecondary,
    fontSize: 16,
    padding: '2px 4px',
  },
  hash: { fontSize: 16, color: colors.textMuted },
  title: { fontFamily: fonts.display, fontSize: 15, fontWeight: 600, margin: 0, color: colors.text },
  callButton: {
    fontSize: 12,
    fontWeight: 500,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.surface2,
    color: colors.success,
    padding: '7px 12px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  emptyState: { textAlign: 'center', marginTop: 60 },
  emptyText: { fontSize: 13, color: colors.textSecondary, margin: '0 0 2px' },
  emptyTextSmall: { fontSize: 12, color: colors.textMuted, margin: 0 },
  row: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 600,
    color: '#fff',
  },
  author: { fontSize: 11, color: colors.textMuted, margin: '0 0 3px' },
  bubble: {
    fontSize: 13.5,
    lineHeight: 1.4,
    margin: 0,
    padding: '8px 12px',
    borderRadius: radius.md,
    display: 'inline-block',
    wordBreak: 'break-word',
  },
  inputBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 14px',
    borderTop: `1px solid ${colors.border}`,
    background: colors.surface1,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface2,
    color: colors.text,
    padding: '0 14px',
    fontSize: 14,
  },
  sendButton: {
    height: 40,
    padding: '0 16px',
    borderRadius: radius.sm,
    border: 'none',
    background: colors.accent,
    color: colors.onAccent,
    fontSize: 13,
    fontWeight: 600,
  },
};
