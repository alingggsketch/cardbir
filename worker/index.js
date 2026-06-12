const REPO = 'alingggsketch/cardimg';

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { filename, mimeType, data } = await request.json();
      if (!data) {
        return new Response(JSON.stringify({ error: '请选择文件' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ext = filename?.split('.').pop() || mimeType?.split('/')[1] || 'bin';
      const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `media/${key}`;

      const resp = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'cardbir-worker',
        },
        body: JSON.stringify({
          message: `upload ${key}`,
          content: data,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: '上传失败: ' + (err.message || resp.statusText) }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ key, name: filename }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: '上传失败: ' + err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
