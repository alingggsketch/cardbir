import { useState, useRef } from 'react';
import { X, ImagePlus, Images, Loader2 } from 'lucide-react';
import { uploadFile, getMediaUrl } from '../utils/upload';
import oneImg from '../assets/one.jpg?url';
import twoImg from '../assets/two.jpg?url';
import threeImg from '../assets/three.jpg?url';
import fourImg from '../assets/four.jpg?url';
import fiveImg from '../assets/five.jpg?url';

const DEFAULT_IMAGES = [oneImg, twoImg, threeImg, fourImg, fiveImg];

export default function ImageUploader({ images, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    const newImages = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImage(file);
        const blob = await fetch(compressed).then((r) => r.blob());
        const result = await uploadFile(new File([blob], file.name || 'image.webp', { type: 'image/webp' }));
        newImages.push({ key: result.key, caption: '' });
      } catch (err) {
        console.error('图片上传失败:', err);
      }
    }
    onChange([...images, ...newImages]);
    setUploading(false);
    e.target.value = '';
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX = 400;
          if (width > MAX) {
            height = (height * MAX) / width;
            width = MAX;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.3));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const updateCaption = (index, caption) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, caption } : img
    );
    onChange(updated);
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const loadDefaultImages = async () => {
    setUploading(true);
    const newImages = [];
    for (const url of DEFAULT_IMAGES) {
      try {
        const compressed = await compressImageUrl(url);
        const blob = await fetch(compressed).then((r) => r.blob());
        const result = await uploadFile(new File([blob], 'default.webp', { type: 'image/webp' }));
        newImages.push({ key: result.key, caption: '' });
      } catch (err) {
        console.error('默认图片上传失败:', err);
      }
    }
    onChange([...images, ...newImages].slice(0, 6));
    setUploading(false);
  };

  const compressImageUrl = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX = 400;
        if (width > MAX) {
          height = (height * MAX) / width;
          width = MAX;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.3));
      };
      img.src = url;
    });

  return (
    <div className="image-uploader">
      <div className="image-grid">
        {images.map((img, i) => (
          <div key={i} className="image-item">
            <img src={img.data || getMediaUrl(img.key)} alt={`upload-${i}`} />
            <button className="remove-btn" onClick={() => removeImage(i)}>
              <X size={14} />
            </button>
            <input
              type="text"
              placeholder="添加文案..."
              value={img.caption}
              onChange={(e) => updateCaption(i, e.target.value)}
              className="caption-input"
              maxLength={30}
            />
          </div>
        ))}
        {images.length < 6 && (
          <button
            className="add-image-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={24} className="spin" /> : <ImagePlus size={24} />}
            <span>{uploading ? '上传中...' : '添加图片'}</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
      />
      <p className="hint">最多6张，自动压缩至400px宽度（WebP格式）</p>
      {images.length === 0 && (
        <button
          className="btn-default-material"
          onClick={loadDefaultImages}
          disabled={uploading}
        >
          <Images size={16} />
          <span>{uploading ? '上传中...' : '使用默认素材'}</span>
        </button>
      )}
    </div>
  );
}
