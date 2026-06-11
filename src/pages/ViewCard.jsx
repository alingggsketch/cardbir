import { useState, useEffect, useRef, useCallback } from 'react';
import { getCardFromUrl } from '../utils/storage';
import { getMediaUrl } from '../utils/upload';
import { Heart, Music, Play, Volume2, VolumeX } from 'lucide-react';

// --- Countdown Animation Component ---
function CountdownOverlay({ onFinish, themeColor }) {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState('counting');

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase('blow');
      const timer = setTimeout(() => {
        setPhase('done');
        setTimeout(onFinish, 800);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [count, onFinish]);

  return (
    <div className={`countdown-overlay ${phase === 'done' ? 'fade-out' : ''}`}>
      <div className="countdown-bg" style={{ '--theme': themeColor }} />

      {phase === 'counting' && (
        <div className="countdown-number" key={count}>
          <span className="count-text">{count}</span>
          <div className="count-ring" />
        </div>
      )}

      {phase === 'blow' && (
        <div className="cake-scene">
          <div className="cake">
            <div className="cake-base" />
            <div className="cake-layer" />
            <div className="cake-cream" />
            <div className="candles">
              <div className="candle">
                <div className="flame">
                  <div className="flame-inner" />
                </div>
                <div className="wax" />
              </div>
              <div className="candle">
                <div className="flame">
                  <div className="flame-inner" />
                </div>
                <div className="wax" />
              </div>
              <div className="candle">
                <div className="flame">
                  <div className="flame-inner" />
                </div>
                <div className="wax" />
              </div>
            </div>
          </div>
          <p className="blow-text">许个愿望吧~</p>
        </div>
      )}

      <div className="confetti-container">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 2}s`,
              '--rotation': `${Math.random() * 360}deg`,
              '--color': ['#ff6b9d', '#ffca28', '#66bb6a', '#42a5f5', '#ab47bc', '#ff8a65'][
                Math.floor(Math.random() * 6)
              ],
            }}
          />
        ))}
      </div>
    </div>
  );
}

function resolveSrc(item) {
  if (!item) return '';
  if (item.data) return item.data;
  if (item.key) return getMediaUrl(item.key);
  return '';
}

// --- Image Slideshow Component ---
function ImageSlideshow({ images, themeColor }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!images.length) return null;

  const current = images[currentIndex];

  return (
    <div className="slideshow">
      <div className={`slide ${isVisible ? 'visible' : ''}`}>
        <img src={resolveSrc(current)} alt={`photo-${currentIndex}`} />
        {current.caption && (
          <p className="slide-caption" style={{ borderColor: themeColor }}>
            {current.caption}
          </p>
        )}
      </div>
      {images.length > 1 && (
        <div className="slide-dots">
          {images.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === currentIndex ? 'active' : ''}`}
              style={i === currentIndex ? { backgroundColor: themeColor } : {}}
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setIsVisible(true);
                }, 300);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Audio Player Component ---
function AudioPlayer({ src, themeColor }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-player" style={{ borderColor: themeColor }}>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <button className="play-btn" onClick={toggle} style={{ backgroundColor: themeColor }}>
        {isPlaying ? <VolumeX size={18} /> : <Play size={18} />}
      </button>
      <span className="player-label">
        {isPlaying ? '正在播放语音祝福...' : '点击播放语音祝福'}
      </span>
    </div>
  );
}

// --- Main ViewCard Component ---
export default function ViewCard() {
  const [cardData, setCardData] = useState(null);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState(false);
  const bgMusicRef = useRef(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    const data = getCardFromUrl();
    if (!data) {
      setError(true);
      return;
    }
    setCardData(data);
  }, []);

  const handleCountdownFinish = useCallback(() => {
    setShowCountdown(false);
    setShowContent(true);
    setTimeout(() => {
      if (bgMusicRef.current) {
        bgMusicRef.current.play().then(() => {
          setMusicPlaying(true);
        }).catch(() => {});
      }
    }, 500);
  }, []);

  const toggleMusic = () => {
    if (!bgMusicRef.current) return;
    if (musicPlaying) {
      bgMusicRef.current.pause();
    } else {
      bgMusicRef.current.play();
    }
    setMusicPlaying(!musicPlaying);
  };

  if (error) {
    return (
      <div className="error-page">
        <div className="error-content">
          <Heart size={48} />
          <h2>贺卡未找到</h2>
          <p>链接可能已过期或无效</p>
        </div>
      </div>
    );
  }

  if (!cardData) return null;

  const themeColor = cardData.themeColor || '#ff6b9d';
  const bgMusic = cardData.music;

  // Resolve music src: supports old base64 string, CDN key object, and default URL
  let bgMusicSrc = null;
  let showMusic = false;
  if (bgMusic) {
    if (typeof bgMusic === 'object' && bgMusic.type === 'default') {
      bgMusicSrc = bgMusic.url;
      showMusic = true;
    } else if (typeof bgMusic === 'object' && bgMusic.type === 'custom') {
      bgMusicSrc = getMediaUrl(bgMusic.key);
      showMusic = true;
    } else if (typeof bgMusic === 'string' && bgMusic.startsWith('data:')) {
      bgMusicSrc = bgMusic;
      showMusic = true;
    }
  }

  // Resolve audio src: supports old base64 string and CDN key object
  const audioData = cardData.audio;
  const audioSrc = audioData
    ? typeof audioData === 'string'
      ? audioData
      : audioData.key
        ? getMediaUrl(audioData.key)
        : null
    : null;

  return (
    <div className="view-page" style={{ '--theme': themeColor }}>
      {showCountdown && (
        <CountdownOverlay onFinish={handleCountdownFinish} themeColor={themeColor} />
      )}

      {showContent && (
        <div className="card-content">
          {/* Background music */}
          {showMusic && (
            <audio ref={bgMusicRef} src={bgMusicSrc} loop />
          )}
          {showMusic && (
            <button className="music-toggle-btn" onClick={toggleMusic} style={{ backgroundColor: themeColor }}>
              {musicPlaying ? <VolumeX size={20} /> : <Music size={20} />}
            </button>
          )}

          {/* Hero Section */}
          <section className="card-hero">
            <div className="hero-decorations">
              <span className="balloon" style={{ '--color': themeColor }}>🎈</span>
              <span className="balloon" style={{ '--color': '#ffca28', '--delay': '0.5s' }}>🎈</span>
              <span className="balloon" style={{ '--color': '#66bb6a', '--delay': '1s' }}>🎈</span>
            </div>
            <h1 className="hero-title">
              <span className="title-line">亲爱的</span>
              <span className="title-name" style={{ color: themeColor }}>{cardData.to}</span>
              <span className="title-line">生日快乐!</span>
            </h1>
            <div className="hero-date">
              {cardData.date}
            </div>
          </section>

          {/* Message Section */}
          <section className="card-message">
            <div className="message-bubble" style={{ borderColor: themeColor }}>
              <p className="message-text">{cardData.message}</p>
              <div className="message-author" style={{ color: themeColor }}>
                —— {cardData.from}
              </div>
            </div>
          </section>

          {/* Images Section */}
          {cardData.images?.length > 0 && (
            <section className="card-images">
              <h2 className="section-title">
                <Heart size={18} style={{ color: themeColor }} />
                美好瞬间
              </h2>
              <ImageSlideshow images={cardData.images} themeColor={themeColor} />
            </section>
          )}

          {/* Audio Section */}
          {audioSrc && (
            <section className="card-audio">
              <h2 className="section-title">
                <Volume2 size={18} style={{ color: themeColor }} />
                语音祝福
              </h2>
              <AudioPlayer src={audioSrc} themeColor={themeColor} />
            </section>
          )}

          {/* Footer */}
          <footer className="card-footer">
            <p>来自 {cardData.from} 的生日祝福</p>
            <Heart size={16} style={{ color: themeColor }} />
          </footer>
        </div>
      )}
    </div>
  );
}
