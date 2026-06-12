export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'alingggsketch/cardimg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN 未配置' });

  try {
    const { filename, mimeType, data } = req.body;
    if (!data) return res.status(400).json({ error: '请选择文件' });

    const ext = filename?.split('.').pop() || mimeType?.split('/')[1] || 'bin';
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `media/${key}`;

    const resp = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
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

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return res.status(502).json({ error: '上传失败: ' + (err.message || resp.statusText) });
    }

    const url = `https://cdn.jsdelivr.net/gh/${REPO}@main/${path}`;
    return res.status(200).json({ key, url, name: filename });
  } catch (err) {
    return res.status(500).json({ error: '上传失败: ' + err.message });
  }
}
