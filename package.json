import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
} from 'livekit-client';
import { callService } from '../services/api';
import { colors, fonts, radius, avatarGradient } from '../theme';

export default function CallPage() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const roomRef = useRef(null);
  const localVideoRef = useRef(null);

  const [participants, setParticipants] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let room;

    async function connect() {
      try {
        const { token, url } = await callService.getToken(channelId);

        room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.ParticipantConnected, updateParticipants);
        room.on(RoomEvent.ParticipantDisconnected, updateParticipants);
        room.on(RoomEvent.TrackSubscribed, updateParticipants);
        room.on(RoomEvent.TrackUnsubscribed, updateParticipants);

        await room.connect(url, token);

        const tracks = await createLocalTracks({ audio: true, video: true });
        for (const track of tracks) {
          await room.localParticipant.publishTrack(track);
          if (track.kind === 'video' && localVideoRef.current) {
            track.attach(localVideoRef.current);
          }
        }

        updateParticipants();
        setConnecting(false);
      } catch (err) {
        console.error(err);
        setError('Nao foi possivel entrar na chamada');
        setConnecting(false);
      }
    }

    function updateParticipants() {
      if (!room) return;
      setParticipants(Array.from(room.remoteParticipants.values()));
    }

    connect();

    return () => {
      room?.disconnect();
    };
  }, [channelId]);

  function toggleMic() {
    const room = roomRef.current;
    const enabled = !micOn;
    room?.localParticipant.setMicrophoneEnabled(enabled);
    setMicOn(enabled);
  }

  function toggleCam() {
    const room = roomRef.current;
    const enabled = !camOn;
    room?.localParticipant.setCameraEnabled(enabled);
    setCamOn(enabled);
  }

  async function toggleScreenShare() {
    const room = roomRef.current;
    if (!room) return;

    if (!sharingScreen) {
      await room.localParticipant.setScreenShareEnabled(true, {
        resolution: { width: 3840, height: 2160, frameRate: 60 },
      });
      setSharingScreen(true);
    } else {
      await room.localParticipant.setScreenShareEnabled(false);
      setSharingScreen(false);
    }
  }

  function endCall() {
    roomRef.current?.disconnect();
    navigate(-1);
  }

  const totalPeople = participants.length + 1;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.liveDot} />
        <p style={styles.roomInfo}>
          {connecting ? 'Conectando...' : `${totalPeople} na chamada`}
        </p>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.grid}>
        <div style={styles.tile}>
          <video ref={localVideoRef} autoPlay muted playsInline style={styles.video} />
          <div style={styles.tileOverlay} />
          <p style={styles.tileLabel}>voce</p>
        </div>

        {participants.map((p) => (
          <RemoteTile key={p.sid} participant={p} />
        ))}
      </div>

      <div style={styles.controls}>
        <button style={btnStyle(micOn)} onClick={toggleMic} title="Microfone">
          {micOn ? '🎙' : '🔇'}
        </button>
        <button style={btnStyle(camOn)} onClick={toggleCam} title="Camera">
          {camOn ? '📹' : '🚫'}
        </button>
        <button style={btnStyle(sharingScreen, true)} onClick={toggleScreenShare} title="Compartilhar tela">
          🖥
        </button>
        <button style={styles.endButton} onClick={endCall} title="Encerrar">
          ✕
        </button>
      </div>
    </div>
  );
}

function RemoteTile({ participant }) {
  const videoRef = useRef(null);

  useEffect(() => {
    function attach() {
      const pub = Array.from(participant.videoTrackPublications.values()).find(
        (p) => p.kind === Track.Kind.Video && p.track
      );
      if (pub?.track && videoRef.current) {
        pub.track.attach(videoRef.current);
      }
    }

    attach();
    participant.on('trackSubscribed', attach);
    return () => participant.off('trackSubscribed', attach);
  }, [participant]);

  return (
    <div style={styles.tile}>
      <video ref={videoRef} autoPlay playsInline style={styles.video} />
      <div style={styles.tileOverlay} />
      <p style={styles.tileLabel}>{participant.name || 'participante'}</p>
    </div>
  );
}

function btnStyle(active, accent) {
  return {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: `1px solid ${active ? colors.borderStrong : colors.border}`,
    background: active ? colors.surface3 : colors.surface2,
    fontSize: 18,
    color: accent && active ? colors.accent : colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
  };
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
    justifyContent: 'center',
    gap: 8,
    padding: '14px 0 6px',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: colors.success,
    boxShadow: `0 0 8px ${colors.success}`,
  },
  roomInfo: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.mono,
    margin: 0,
  },
  error: { color: colors.danger, fontSize: 12, textAlign: 'center' },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
    padding: 10,
    alignContent: 'start',
    overflowY: 'auto',
  },
  tile: {
    position: 'relative',
    background: colors.surface1,
    borderRadius: radius.md,
    overflow: 'hidden',
    aspectRatio: '3 / 4',
    border: `1px solid ${colors.border}`,
  },
  tileOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 40%)',
    pointerEvents: 'none',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  tileLabel: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    fontSize: 11,
    fontWeight: 500,
    color: '#fff',
    margin: 0,
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    padding: '20px 0',
    background: colors.bg,
    borderTop: `1px solid ${colors.border}`,
  },
  endButton: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: 'none',
    background: colors.danger,
    color: '#fff',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
