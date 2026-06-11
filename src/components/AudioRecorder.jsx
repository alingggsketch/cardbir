import { useRef } from 'react';
import { Mic, Square, Trash2, Upload, Play, Pause, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { uploadFile, getMediaUrl } from '../utils/upload';
import { useState } from 'react';

export default function AudioRecorder({ audio, onChange }) {
  const {
    isRecording,
    formattedDuration,
    maxDuration,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();
  const fileInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);

  const handleRecordDone = () => {
    stopRecording();
  };

  const handleStart = () => {
    startRecording(async (blob) => {
      setUploading(true);
      try {
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        const result = await uploadFile(file);
        onChange({ key: result.key });
      } catch (err) {
        console.error('语音上传失败:', err);
        alert('语音上传失败，请重试');
      }
      setUploading(false);
    });
  };

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
      onChange({ key: result.key });
    } catch (err) {
      console.error('音频上传失败:', err);
      alert('音频上传失败，请重试');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleClear = () => {
    clearRecording();
    onChange(null);
    setIsPlaying(false);
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

  const audioSrc = audio?.data || (audio?.key ? getMediaUrl(audio.key) : null);

  return (
    <div className="audio-recorder">
      {!audio ? (
        <div className="audio-controls">
          {!isRecording ? (
            <button className="btn-record" onClick={handleStart} disabled={uploading}>
              <Mic size={18} />
              <span>开始录音</span>
            </button>
          ) : (
            <button className="btn-stop" onClick={handleRecordDone}>
              <Square size={18} />
              <span>停止录音 ({formattedDuration}/{maxDuration}s)</span>
            </button>
          )}
          <span className="divider-text">或</span>
          <button
            className="btn-upload-audio"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
            <span>{uploading ? '上传中...' : '上传音频'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="audio-preview">
          {audioSrc && (
            <audio
              ref={audioRef}
              src={audioSrc}
              onEnded={() => setIsPlaying(false)}
            />
          )}
          <button className="btn-play" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="audio-label">语音祝福</span>
          <button className="btn-clear" onClick={handleClear}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
      <p className="hint">最长{maxDuration}秒，自动压缩</p>
    </div>
  );
}
