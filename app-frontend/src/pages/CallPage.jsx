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

const SCREEN_PRESETS = [
  { label: '720p · 30fps', width: 1280, height: 720, frameRate: 30 },
  { label: '1080p · 30fps', width: 1920, height: 1080, frameRate: 30 },
  { label: '1080p · 60fps', width: 1920, height: 1080, frameRate: 60 },
  { label: '1440p · 60fps', width: 2560, height: 1440, frameRate: 60 },
  { label: '4K · 30fps', width: 3840, height: 2160, frameRate: 30 },
  { label: '4K · 60fps', width: 3840, height: 2160, frameRate: 60 },
];

export default function CallPage() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const roomRef = useRef(null);
  const localVideoRef = useRef(null);

  const [participants, setParticipants] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(SCREEN_PRESETS[2]); // 1080p60 por padrao

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

  function toggleDeafen() {
    const next = !deafened;
    setDeafened(next);
    document.querySelectorAll('audio[data-remote-audio]').forEach((el) => {
      el.muted = next;
    });
  }

  async function startScreenShare(preset) {
    const room = roomRef.current;
    if (!room) return;

    setSelectedPreset(preset);
    setShowQualityMenu(false);
    await room.localParticipant.setScreenShareEnabled(true, {
      resolution: { width: preset.width, height: preset.height, frameRate: preset.frameRate },
    });
    setSharingScreen(true);
  }

  async function stopScreenShare() {
    const room = roomRef.current;
    await room?.localParticipant.setScreenShareEnabled(false);
    setSharingScreen(false);
  }

  // Janela flutuante sempre-por-cima (Picture-in-Picture nativo do navegador).
  // E o que mais se aproxima de um "overlay" sem precisar de um app nativo:
  // a janela do PiP fica visivel por cima de outros programas no desktop.
  async function togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      const target =
        localVideoRef.current?.readyState >= 2 ? localVideoRef.current : null;
      const firstRemote = document.querySelector('video[data-remote-video]');
      const videoEl = firstRemote || target;
      if (videoEl && document.pictureInPictureEnabled) {
        await videoEl.requestPictureInPicture();
      } else {
        setError('Picture-in-Picture nao suportado neste navegador');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function endCall() {
    roomRef.current?.disconnect();
    navigate(-1);
  }

  const totalPeople = participants.length + 1;
  const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled;

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

      {sharingScreen && (
        <div style={styles.shareInfo}>
          Compartilhando tela em <strong>{selectedPreset.label}</strong>
        </div>
      )}

      <div style={styles.controls}>
        <button style={btnStyle(micOn)} onClick={toggleMic} title="Microfone">
          {micOn ? '🎙' : '🔇'}
        </button>
        <button style={btnStyle(camOn)} onClick={toggleCam} title="Camera">
          {camOn ? '📹' : '🚫'}
        </button>
        <button style={btnStyle(!deafened)} onClick={toggleDeafen} title="Silenciar todos">
          {deafened ? '🔕' : '🔊'}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            style={btnStyle(sharingScreen, true)}
            onClick={() => (sharingScreen ? stopScreenShare() : setShowQualityMenu((v) => !v))}
            title="Compartilhar tela"
          >
            🖥
          </button>
          {showQualityMenu && (
            <div style={styles.qualityMenu}>
              <p style={styles.qualityMenuTitle}>Qualidade da transmissao</p>
              {SCREEN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  style={styles.qualityOption}
                  onClick={() => startScreenShare(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {pipSupported && (
          <button style={btnStyle(false)} onClick={togglePiP} title="Janela flutuante (sempre por cima)">
            🗗
          </button>
        )}

        <button style={styles.endButton} onClick={endCall} title="Encerrar">
          ✕
        </button>
      </div>
    </div>
  );
}

function RemoteTile({ participant }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    function attach() {
      const videoPub = Array.from(participant.videoTrackPublications.values()).find(
        (p) => p.kind === Track.Kind.Video && p.track
      );
      if (videoPub?.track && videoRef.current) {
        videoPub.track.attach(videoRef.current);
      }

      const audioPub = Array.from(participant.audioTrackPublications.values()).find(
        (p) => p.kind === Track.Kind.Audio && p.track
      );
      if (audioPub?.track && audioRef.current) {
        audioPub.track.attach(audioRef.current);
      }
    }

    attach();
    participant.on('trackSubscribed', attach);
    return () => participant.off('trackSubscribed', attach);
  }, [participant]);

  return (
    <div style={styles.tile}>
      <video ref={videoRef} autoPlay playsInline data-remote-video style={styles.video} />
      <audio ref={audioRef} autoPlay data-remote-audio />
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
  shareInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    padding: '0 12px 8px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    padding: '20px 0',
    background: colors.bg,
    borderTop: `1px solid ${colors.border}`,
    flexWrap: 'wrap',
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
  qualityMenu: {
    position: 'absolute',
    bottom: '120%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: 8,
    minWidth: 160,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  qualityMenuTitle: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: '2px 8px 6px',
  },
  qualityOption: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    background: 'none',
    border: 'none',
    borderRadius: radius.sm,
    fontSize: 12.5,
    color: colors.text,
  },
};
