const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const REPO = 'Khao-s/cardimg';

export async function uploadFile(file) {
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const ext = file.name?.split('.').pop() || file.type?.split('/')[1] || 'bin';
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `media/${key}`;

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cardbir-app',
    },
    body: JSON.stringify({
      message: `upload ${key}`,
      content: data,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('上传失败: ' + (err.message || res.statusText));
  }

  return { key, name: file.name };
}

export function getMediaUrl(key) {
  if (key.startsWith('http')) return key;
  return `https://cdn.jsdelivr.net/gh/${REPO}@main/media/${key}`;
}
