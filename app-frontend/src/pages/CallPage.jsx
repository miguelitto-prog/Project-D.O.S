import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
} from 'livekit-client';
import { callService } from '../services/api';

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

  // Compartilhamento de tela em alta qualidade (ate 4K/60fps)
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
      <p style={styles.roomInfo}>
        {connecting ? 'Conectando...' : `${totalPeople} na chamada`}
      </p>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.grid}>
        <div style={styles.tile}>
          <video ref={localVideoRef} autoPlay muted playsInline style={styles.video} />
          <p style={styles.tileLabel}>voce</p>
        </div>

        {participants.map((p) => (
          <RemoteTile key={p.sid} participant={p} />
        ))}
      </div>

      <div style={styles.controls}>
        <button style={btnStyle(micOn)} onClick={toggleMic}>
          Mic
        </button>
        <button style={btnStyle(camOn)} onClick={toggleCam}>
          Cam
        </button>
        <button style={btnStyle(sharingScreen)} onClick={toggleScreenShare}>
          Tela
        </button>
        <button style={styles.endButton} onClick={endCall}>
          Encerrar
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
      <p style={styles.tileLabel}>{participant.name || 'participante'}</p>
    </div>
  );
}

function btnStyle(active) {
  return {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '0.5px solid #d3d1c7',
    background: active ? '#fff' : '#e5e3da',
    fontSize: 11,
    cursor: 'pointer',
  };
}

const styles = {
  wrapper: {
    maxWidth: 380,
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1c1c1a',
  },
  roomInfo: {
    color: '#c2c0b6',
    fontSize: 12,
    textAlign: 'center',
    padding: '10px 0 4px',
    margin: 0,
  },
  error: { color: '#f09595', fontSize: 12, textAlign: 'center' },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 6,
    padding: 8,
    alignContent: 'start',
    overflowY: 'auto',
  },
  tile: {
    position: 'relative',
    background: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    aspectRatio: '3 / 4',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  tileLabel: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    fontSize: 11,
    color: '#fff',
    margin: 0,
    background: 'rgba(0,0,0,0.4)',
    padding: '2px 8px',
    borderRadius: 6,
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    padding: '18px 0',
    background: '#1c1c1a',
  },
  endButton: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    background: '#a32d2d',
    color: '#fff',
    fontSize: 10,
    cursor: 'pointer',
  },
};
