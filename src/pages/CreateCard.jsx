import { useState, useMemo } from 'react';
import { Gift, Sparkles, Calendar, User, Heart, Music, Mic, ImagePlus, ExternalLink } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import AudioRecorder from '../components/AudioRecorder';
import MusicSelector from '../components/MusicSelector';
import DatePicker from '../components/DatePicker';
import ColorPicker from '../components/ColorPicker';
import QRCodeModal from '../components/QRCodeModal';
import { getShareUrl } from '../utils/storage';

export default function CreateCard() {
  const [form, setForm] = useState({
    to: '',
    from: '',
    date: '',
    message: '',
    themeColor: '#ff6b9d',
  });
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState(null);
  const [music, setMusic] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = form.to.trim() && form.from.trim() && form.date && form.message.trim();

  // With CDN storage, URL only contains keys (~30 bytes each), not base64 data
  const estimatedSize = useMemo(() => {
    let size = 200; // text fields + overhead
    images.forEach(() => { size += 40; }); // CDN key per image
    if (audio) size += 40;
    if (music?.type === 'custom') size += 40;
    return size;
  }, [images, audio, music]);

  const handleGenerate = async () => {
    if (!isFormValid) return;
    setIsGenerating(true);

    await new Promise((r) => setTimeout(r, 300));

    const cardData = {
      ...form,
      images: images.map((img) => ({ key: img.key, caption: img.caption })),
      audio: audio?.key ? { key: audio.key } : null,
      music: music?.type === 'default'
        ? { type: 'default', url: music.url }
        : music?.type === 'custom'
          ? { type: 'custom', key: music.key, name: music.name }
          : null,
      createdAt: Date.now(),
    };

    const url = getShareUrl(cardData);
    setShareUrl(url);
    setShowQR(true);
    setIsGenerating(false);
  };

  return (
    <div className="create-page">
      <header className="create-header">
        <div className="header-icon">
          <Gift size={32} />
        </div>
        <h1>生日贺卡生成器</h1>
        <p className="header-desc">填写信息，生成专属生日祝福贺卡</p>
      </header>

      <main className="create-form">
        {/* Basic Info */}
        <section className="form-section">
          <div className="section-header">
            <Heart size={18} />
            <h2>基本信息</h2>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>
                <User size={14} />
                寿星昵称
              </label>
              <input
                type="text"
                placeholder="TA叫什么？"
                value={form.to}
                onChange={(e) => updateField('to', e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="form-field">
              <label>
                <User size={14} />
                你的昵称
              </label>
              <input
                type="text"
                placeholder="你叫什么？"
                value={form.from}
                onChange={(e) => updateField('from', e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="form-field">
              <label>
                <Calendar size={14} />
                生日日期
              </label>
              <DatePicker
                value={form.date}
                onChange={(d) => updateField('date', d)}
              />
            </div>
          </div>
        </section>

        {/* Message */}
        <section className="form-section">
          <div className="section-header">
            <Sparkles size={18} />
            <h2>祝福语</h2>
          </div>
          <textarea
            placeholder="写下你的生日祝福..."
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="char-count">{form.message.length}/500</p>
        </section>

        {/* Theme Color */}
        <section className="form-section">
          <div className="section-header">
            <div className="color-dot" style={{ backgroundColor: form.themeColor }} />
            <h2>主题颜色</h2>
          </div>
          <ColorPicker
            value={form.themeColor}
            onChange={(c) => updateField('themeColor', c)}
          />
        </section>

        {/* Images */}
        <section className="form-section">
          <div className="section-header">
            <ImagePlus size={18} />
            <h2>照片墙</h2>
          </div>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        {/* Audio */}
        <section className="form-section">
          <div className="section-header">
            <Mic size={18} />
            <h2>语音祝福</h2>
          </div>
          <AudioRecorder audio={audio} onChange={setAudio} />
        </section>

        {/* Music */}
        <section className="form-section">
          <div className="section-header">
            <Music size={18} />
            <h2>背景音乐</h2>
          </div>
          <MusicSelector music={music} onChange={setMusic} />
        </section>

        {/* Generate Button */}
        <button
          className={`btn-generate ${!isFormValid ? 'disabled' : ''}`}
          onClick={handleGenerate}
          disabled={!isFormValid || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              生成贺卡
            </>
          )}
        </button>
      </main>

      <footer className="create-footer">
        <div className="footer-left">
          <h3 className="footer-brand">拾光祝语</h3>
          <p className="footer-desc">用数字传递最温暖的情感</p>
        </div>
        <div className="footer-right">
          <a
            href="https://www.xiaohongshu.com/shop/6a08a3f9826d030015cae46f?instation_link=xhsdiscover%3A%2F%2Fshop_detail%3Fseller_id%3D6a08a3f9826d030015cae46f%26general_param%3D%257B%2522source%2522%3A%2522share%2522%257D%26source%3Dshare&page_instance=3957&back_chain_id=shop_homepage_share&share_id=a01ba04082f74e6d905c88f14c9ce7e6&share_channel=wechat"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-contact"
          >
            <ExternalLink size={14} />
            <span>联系我们</span>
          </a>
        </div>
      </footer>

      {showQR && <QRCodeModal url={shareUrl} onClose={() => setShowQR(false)} cardData={form} />}
    </div>
  );
}
