import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Link, Download } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import cardBg from '../assets/card.jpg?url';

export default function QRCodeModal({ url, onClose, cardData }) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef(null);

  const qrResult = useMemo(() => {
    if (url.length > 4000) return { ok: false, error: 'too-long' };
    return { ok: true };
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `birthday-card-${cardData?.to || 'friend'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className="modal-title">生日贺卡已生成!</h2>
        <p className="modal-subtitle">分享给朋友，送上你的祝福</p>

        {/* Greeting Card with QR Code */}
        <div className="greeting-card-container" ref={cardRef}>
          <div className="greeting-card" style={{ '--theme-color': cardData?.themeColor || '#ff6b9d', backgroundImage: `url(${cardBg})` }}>
            <div className="card-header">
              <div className="card-decorations">
                <span className="decoration">🎈</span>
                <span className="decoration">🎂</span>
                <span className="decoration">🎈</span>
              </div>
              <h3 className="card-title">生日快乐</h3>
              <p className="card-subtitle">Happy Birthday</p>
            </div>

            <div className="card-body">
              <div className="card-to">
                亲爱的 <strong>{cardData?.to || '朋友'}</strong>
              </div>

              {cardData?.message && (
                <div className="card-message">
                  {cardData.message}
                </div>
              )}

              <div className="card-from">
                来自 <strong>{cardData?.from || '你的朋友'}</strong>
              </div>
            </div>

            <div className="card-footer">
              {qrResult.ok ? (
                <div className="card-qr-section">
                  <div className="qr-wrapper">
                    <QRCodeSVG
                      value={url}
                      size={120}
                      level="L"
                      includeMargin={false}
                      bgColor="transparent"
                      fgColor="currentColor"
                    />
                  </div>
                  <p className="qr-hint">扫码查看完整贺卡</p>
                </div>
              ) : (
                <div className="card-link-hint">
                  <Link size={24} />
                  <p>复制链接查看完整贺卡</p>
                </div>
              )}
            </div>

            <div className="card-date">
              {cardData?.date && new Date(cardData.date).toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {qrResult.ok && (
            <button className="btn-download" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <span className="spinner" />
                  下载中...
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>下载贺卡</span>
                </>
              )}
            </button>
          )}

          <div className="url-box">
            <input type="text" value={url} readOnly className="url-input" />
            <button className="btn-copy" onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '已复制' : '复制链接'}</span>
            </button>
          </div>
        </div>

        <p className="modal-hint">
          {qrResult.ok
            ? '下载贺卡图片或复制链接分享给朋友'
            : '复制链接发送给朋友即可查看完整贺卡'}
        </p>
      </div>
    </div>
  );
}
