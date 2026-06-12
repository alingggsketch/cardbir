import { useState, useMemo } from 'react';
import { Gift, Sparkles, Calendar, User, Heart, Music, Mic, ImagePlus, ExternalLink, Mail, MessageCircle, Star, Shield, Zap } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import AudioRecorder from '../components/AudioRecorder';
import MusicSelector from '../components/MusicSelector';
import DatePicker from '../components/DatePicker';
import ThemePicker, { getThemeById } from '../components/ThemePicker';
import QRCodeModal from '../components/QRCodeModal';
import { getShareUrl } from '../utils/storage';

export default function CreateCard() {
  const [form, setForm] = useState({
    to: '',
    from: '',
    date: '',
    message: '',
    themeImage: 'one',
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

  const theme = getThemeById(form.themeImage);
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
      themeColor: theme.color,
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
    <>
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

        {/* Theme */}
        <section className="form-section">
          <div className="section-header">
            <div className="color-dot" style={{ backgroundColor: theme.color }} />
            <h2>主题风格</h2>
          </div>
          <ThemePicker
            value={form.themeImage}
            onChange={(id) => updateField('themeImage', id)}
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
    </div>

    <footer className="site-footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,30 L1440,60 L0,60 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-col footer-brand-col">
            <div className="footer-logo">
              <Gift size={24} />
              <span>拾光祝语</span>
            </div>
            <p className="footer-tagline">用数字传递最温暖的情感，让每一份生日祝福都充满心意。</p>
            <div className="footer-social">
              <a
                href="https://www.xiaohongshu.com/shop/6a08a3f9826d030015cae46f?instation_link=xhsdiscover%3A%2F%2Fshop_detail%3Fseller_id%3D6a08a3f9826d030015cae46f%26general_param%3D%257B%2522source%2522%3A%2522share%2522%257D%26source%3Dshare&page_instance=3957&back_chain_id=shop_homepage_share&share_id=a01ba04082f74e6d905c88f14c9ce7e6&share_channel=wechat"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                title="小红书"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="footer-col">
            <h4 className="footer-heading">功能特色</h4>
            <ul className="footer-links">
              <li><Star size={14} /> <span>个性化贺卡定制</span></li>
              <li><Music size={14} /> <span>语音祝福录制</span></li>
              <li><ImagePlus size={14} /> <span>照片墙上传</span></li>
              <li><Heart size={14} /> <span>多种主题配色</span></li>
            </ul>
          </div>

          {/* Advantages */}
          <div className="footer-col">
            <h4 className="footer-heading">我们的优势</h4>
            <ul className="footer-links">
              <li><Zap size={14} /> <span>一键生成分享</span></li>
              <li><Shield size={14} /> <span>数据安全保障</span></li>
              <li><MessageCircle size={14} /> <span>永久有效链接</span></li>
              <li><Sparkles size={14} /> <span>完全免费使用</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">联系我们</h4>
            <ul className="footer-links">
              <li>
                <Mail size={14} />
                <a
                  href="https://www.xiaohongshu.com/shop/6a08a3f9826d030015cae46f?instation_link=xhsdiscover%3A%2F%2Fshop_detail%3Fseller_id%3D6a08a3f9826d030015cae46f%26general_param%3D%257B%2522source%2522%3A%2522share%2522%257D%26source%3Dshare&page_instance=3957&back_chain_id=shop_homepage_share&share_id=a01ba04082f74e6d905c88f14c9ce7e6&share_channel=wechat"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  小红书店铺
                </a>
              </li>
              <li>
                <MessageCircle size={14} />
                <span>在线客服咨询</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">&copy; {new Date().getFullYear()} 拾光祝语 &middot; 用心传递每一份祝福</p>
          <p className="footer-icp">Made with <Heart size={12} className="footer-heart-icon" /> for you</p>
        </div>
      </div>
    </footer>

    {showQR && <QRCodeModal url={shareUrl} onClose={() => setShowQR(false)} cardData={form} />}
  </>
  );
}
