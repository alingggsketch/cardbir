import { useRef, useState } from 'react';
import { Music, Upload, X, Play, Pause, Loader2 } from 'lucide-react';
import { uploadFile, getMediaUrl } from '../utils/upload';

export default function MusicSelector({ music, onChange }) {
  const fileInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file);
      onChange({ type: 'custom', key: result.key, name: file.name });
    } catch (err) {
      console.error('音乐上传失败:', err);
      alert(err.message === 'NO_TOKEN' ? '请先在页面顶部配置 GitHub Token' : '音乐上传失败，请重试');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleBuiltin = () => {
    onChange({ type: 'default', url: '/cardbir/shengri.mp3', name: '生日快乐' });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const musicSrc = music?.type === 'custom'
    ? getMediaUrl(music.key)
    : music?.type === 'default'
      ? music.url
      : null;

  return (
    <div className="music-selector">
      {!music ? (
        <>
          <div className="builtin-music">
            <button className="music-item" onClick={handleBuiltin}>
              <Music size={16} />
              <span>生日快乐</span>
            </button>
          </div>
          <div className="custom-music">
            <p className="label">或上传音乐</p>
            <button
              className="btn-upload-music"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
              <span>{uploading ? '上传中...' : '上传音频文件'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </>
      ) : (
        <div className="music-preview">
          {musicSrc && (
            <audio ref={audioRef} src={musicSrc} onEnded={() => setIsPlaying(false)} />
          )}
          <button className="btn-play" onClick={togglePlay} disabled={music.type === 'builtin'}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <Music size={16} />
          <span className="music-name">{music.name}</span>
          <button className="btn-clear" onClick={() => { onChange(null); setIsPlaying(false); }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
