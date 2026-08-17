// Vercel serverless funkcija: dohvaća broj YouTube pretplatnika server-side,
// tako da YouTube API kljuc nikad ne ide u preglednik. Frontend poziva /api/yt-subs.
//
// Env varijable (Vercel -> Project Settings -> Environment Variables):
//   YOUTUBE_API_KEY   API kljuc s omogucenim "YouTube Data API v3" (Google Cloud Console)
//   YOUTUBE_CHANNEL_ID  ID kanala "O novcu" (pocinje s "UC..." - Napredne postavke YouTube kanala)

let cache = { data: null, at: 0 };
const CACHE_MS = 60 * 60 * 1000; // 1h - broj pretplatnika se ne mijenja sekundno

module.exports = async function handler(req, res) {
  const now = Date.now();
  if (cache.data && now - cache.at < CACHE_MS) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(cache.data);
    return;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const ytRes = await fetch(url);
    if (!ytRes.ok) throw new Error('HTTP ' + ytRes.status);
    const json = await ytRes.json();
    const count = json.items && json.items[0] && json.items[0].statistics && json.items[0].statistics.subscriberCount;
    const n = parseInt(count, 10);
    if (!isFinite(n) || n <= 0) throw new Error('invalid_count');

    const data = { subscribers: n };
    cache = { data, at: now };
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    console.error('yt-subs handler error', err);
    // stale cache je bolji od greske, ako postoji
    if (cache.data) { res.status(200).json(cache.data); return; }
    res.status(502).json({ error: 'youtube_error' });
  }
};
