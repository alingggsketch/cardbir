export async function uploadFile(file) {
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '上传失败' }));
    throw new Error(err.error || '上传失败');
  }

  return res.json();
}

export function getMediaUrl(key) {
  if (key.startsWith('http')) return key;
  return `https://cdn.jsdelivr.net/gh/Khao-s/cardimg@main/media/${key}`;
}
