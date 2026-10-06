const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const K = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const rd = async c => {
  const r = await fetch(U + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + K }, body: JSON.stringify(c) });
  return (await r.json()).map(x => x.result);
};
const ob = a => { const o = {}; for (let i = 0; i < (a || []).length; i += 2) o[a[i]] = a[i + 1]; return o; };
const ST = ['ok', 'maintenance', 'belum', 'kendala', 'habis'];
const ID = /^[a-z0-9-]{1,30}$/;
const s = (v, n) => String(v == null ? '' : v).slice(0, n);
const url = v => (/^https?:\/\//.test(v) ? s(v, 200) : '');
const img = v => (/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+|https:\/\/[^\s"'()]+)$/.test(v) && v.length < 250000 ? v : '');

const clean = c => {
  const o = c.owner || {};
  return {
    brand: s(c.brand, 60), tagline: s(c.tagline, 160),
    owner: { name: s(o.name, 60), bio: s(o.bio, 1000), telegram: url(o.telegram), channel: url(o.channel), avatar: img(o.avatar), banner: img(o.banner) },
    products: (c.products || []).slice(0, 30).map(p => ({
      id: ID.test(p.id) ? p.id : 'p' + Math.random().toString(36).slice(2, 8),
      title: s(p.title, 80), desc: s(p.desc, 500), status: ST.includes(p.status) ? p.status : 'ok',
      items: (p.items || []).slice(0, 20).map(i => [s(i[0], 80), s(i[1], 40)])
    }))
  };
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.OWNER_PASSWORD;
  let given = '';
  try { given = decodeURIComponent(req.headers['x-pass'] || ''); } catch (e) {}
  const own = !!pw && given.trim() === pw.trim();
  try {
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (b.action === 'hit' && (b.tab === 'load' || ID.test(b.tab))) {
        await rd(b.tab === 'load'
          ? [['HINCRBY', 'stats', 'views', 1], ['HINCRBY', 'daily', new Date().toISOString().slice(0, 10), 1]]
          : [['HINCRBY', 'stats', 'tab_' + b.tab, 1]]);
        return res.json({ ok: 1 });
      }
      if (b.action === 'save' && own && b.cfg) {
        await rd([['SET', 'cfg', JSON.stringify(clean(b.cfg))]]);
        return res.json({ ok: 1 });
      }
      return res.status(own ? 400 : 401).json({ error: 'ditolak' });
    }
    const q = [['GET', 'cfg'], ['HGET', 'stats', 'views']];
    if (own) q.push(['HGETALL', 'stats'], ['HGETALL', 'daily']);
    const r = await rd(q);
    res.json({ cfg: r[0] ? JSON.parse(r[0]) : null, views: +r[1] || 0, owner: own, noPw: !pw, ...(own && { stats: ob(r[2]), daily: ob(r[3]) }) });
  } catch (e) {
    res.status(500).json({ error: 'db', owner: own, noPw: !pw });
  }
};
