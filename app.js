/* Data awal. Setelah login owner, semuanya bisa diubah dari tab Owner. */
const DEF = {
  brand: 'Toko Premium',
  tagline: 'Produk digital, proses cepat, bergaransi.',
  owner: { name: 'Nama Kamu', bio: 'Tulis tentang dirimu di tab Owner.', telegram: 'https://t.me/usernamekamu', channel: 'https://t.me/channelkamu', avatar: '', banner: '' },
  products: [
    { id: 'alight', title: 'Alight Motion', status: 'ok', desc: 'Akun Alight Motion premium, aktif selama 1 tahun.', items: [['Premium 1 tahun', 'Rp20.000']] },
    { id: 'panel', title: 'Panel', status: 'ok', desc: 'Panel Pterodactyl. Paket Rp15.000: garansi 2 hari, masa aktif 1 bulan, Node.js.', items: [['Panel 4GB – 10GB', 'Rp2.000 – 9.000'], ['Panel Unlimited', 'Rp2.000 – 9.000'], ['Panel Garansi', 'Rp15.000']] },
    { id: 'role', title: 'Role Panel', status: 'ok', desc: 'Harga menyesuaikan role yang dipilih.', items: [['Reseller · ADP · PT · CEO', 'Rp10.000 – 28.000']] }
  ]
};
const S = { ok: 'Tersedia', maintenance: 'Lagi maintenance', belum: 'Belum siap', kendala: 'Ada kendala', habis: 'Sedang tidak tersedia' };
let D = { views: 0 }, C = DEF, E = null, cur = 'alight';
const $ = q => document.querySelector(q);
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H = () => ({ 'Content-Type': 'application/json', 'x-pass': sessionStorage.p || '' });
const api = b => fetch('/api/state', b ? { method: 'POST', headers: H(), body: JSON.stringify(b) } : { headers: H() }).then(r => r.json()).catch(() => ({}));
const tabs = () => C.products.map(p => [p.id, p.title]).concat([['profil', 'Profil'], ['owner', 'Owner']]);

$('#tabs').onclick = e => { const k = e.target.dataset.k; if (k) go(k); };
function go(k) { cur = k; if (k !== 'owner') api({ action: 'hit', tab: k }); render(); }

const prod = p => {
  const s = p.status || 'ok', ok = s === 'ok';
  return `<section class="card"><div class="top"><h2>${esc(p.title)}</h2><span class="badge ${s}">${S[s]}</span></div>
  ${p.items.map(([a, b]) => `<div class="row"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}
  <p class="note">${esc(p.desc)}</p>
  <a class="btn" ${ok ? `href="${esc(C.owner.telegram)}" target="_blank" rel="noopener"` : 'aria-disabled="true"'}>${ok ? 'Pesan via Telegram' : S[s]}</a></section>`;
};

const profil = () => {
  const o = C.owner;
  return `<section class="card">${o.banner ? `<img class="ban" src="${esc(o.banner)}" alt="">` : ''}
  ${o.avatar ? `<img class="av" src="${esc(o.avatar)}" alt="">` : `<div class="av">${esc((o.name || '?')[0])}</div>`}
  <h2>${esc(o.name)}</h2><p class="note">${esc(o.bio).replace(/\n/g, '<br>')}</p>
  <div class="acts"><a class="btn" href="${esc(o.telegram)}" target="_blank" rel="noopener">Telegram</a>
  <a class="btn alt" href="${esc(o.channel)}" target="_blank" rel="noopener">Channel tentang saya</a></div>
  <p class="note">Dilihat ${D.views || 0} kali</p></section>`;
};

const field = (l, path, v) => `<label class="f">${l}</label><input value="${esc(v)}" oninput="ed('${path}',this.value)">`;
const area = (l, path, v, r) => `<label class="f">${l}</label><textarea rows="${r}" oninput="ed('${path}',this.value)">${esc(v)}</textarea>`;

const owner = () => {
  if (!D.owner) return `<section class="card"><h2>Masuk owner</h2><p class="note">Masukkan password owner untuk mengatur toko dan melihat statistik.</p>
  <input id="pw" type="password" placeholder="Password"><button class="btn" onclick="login()">Masuk</button></section>`;
  E = E || JSON.parse(JSON.stringify(C));
  const o = E.owner;
  const st = D.stats || {}, d = D.daily || {};
  const days = [...Array(7)].map((_, i) => new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10));
  const mx = Math.max(1, ...days.map(x => +d[x] || 0));
  return `<section class="card"><h2>Profil dan link</h2>
  ${field('Nama toko', 'brand', E.brand)}${field('Slogan', 'tagline', E.tagline)}
  ${field('Nama kamu', 'owner.name', o.name)}${area('Tentang saya', 'owner.bio', o.bio, 4)}
  ${field('Link Telegram', 'owner.telegram', o.telegram)}${field('Link channel', 'owner.channel', o.channel)}
  <label class="f">Foto profil</label>${o.avatar ? `<img class="av" src="${esc(o.avatar)}" alt="">` : ''}<input type="file" accept="image/*" onchange="pickImg('avatar',this)">
  <label class="f">Banner</label>${o.banner ? `<img class="ban" src="${esc(o.banner)}" alt="">` : ''}<input type="file" accept="image/*" onchange="pickImg('banner',this)"></section>
  ${E.products.map((p, i) => `<section class="card"><h2>${esc(p.title)}</h2>
  ${field('Judul', `products.${i}.title`, p.title)}
  <label class="f">Paket dan harga (satu baris satu paket, format: Nama | Harga)</label>
  <textarea rows="4" oninput="edItems(${i},this.value)">${esc(p.items.map(x => x.join(' | ')).join('\n'))}</textarea>
  ${area('Deskripsi', `products.${i}.desc`, p.desc, 3)}
  <label class="f">Status</label><select onchange="ed('products.${i}.status',this.value)">${Object.entries(S).map(([v, l]) => `<option value="${v}"${p.status === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
  <div class="acts"><button class="btn alt" onclick="delP(${i})">Hapus produk</button></div></section>`).join('')}
  <div class="acts"><button class="btn alt" onclick="addP()">Tambah produk</button></div>
  <div class="sv"><button class="btn" onclick="save()">Simpan perubahan</button></div>
  <section class="card"><h2>Statistik</h2>
  <div class="row"><span>Total kunjungan</span><b>${st.views || 0}</b></div>
  ${C.products.map(p => p.id).concat('profil').map(k => `<div class="row"><span>Tab ${esc((C.products.find(p => p.id === k) || { title: 'Profil' }).title)} dibuka</span><b>${st['tab_' + k] || 0}</b></div>`).join('')}
  <p class="note">Kunjungan 7 hari terakhir</p>
  ${days.map(x => `<div class="row"><span>${x.slice(5)}</span><i class="bar" style="width:${(+d[x] || 0) / mx * 60}%"></i><b>${d[x] || 0}</b></div>`).join('')}
  <div class="acts"><button class="btn alt" onclick="logout()">Keluar</button></div></section>`;
};

function render() {
  const t = tabs(), sig = t.map(x => x.join()).join('|'), nav = $('#tabs');
  if (!t.some(x => x[0] === cur)) cur = t[0][0];
  if (nav.dataset.s !== sig) { nav.innerHTML = '<i id="ind"></i>' + t.map(([k, l]) => `<button role="tab" data-k="${esc(k)}">${esc(l)}</button>`).join(''); nav.dataset.s = sig; }
  document.title = C.brand;
  $('#brand').textContent = C.brand;
  $('#tagline').textContent = C.tagline;
  nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === cur));
  const b = nav.querySelector(`[data-k="${cur}"]`), i = $('#ind');
  i.style.width = b.offsetWidth + 'px';
  i.style.transform = `translateX(${b.offsetLeft}px)`;
  const p = C.products.find(x => x.id === cur);
  $('#view').innerHTML = cur === 'profil' ? profil() : cur === 'owner' ? owner() : prod(p);
}

/* edit owner */
function ed(path, v) { const k = path.split('.'); let o = E; k.slice(0, -1).forEach(x => o = o[x]); o[k[k.length - 1]] = v; }
function edItems(i, v) { E.products[i].items = v.split('\n').filter(l => l.trim()).map(l => { const [a, ...b] = l.split('|'); return [a.trim(), b.join('|').trim()]; }); }
function addP() { E.products.push({ id: 'p' + Date.now().toString(36), title: 'Produk baru', status: 'ok', desc: '', items: [['Paket', 'Rp0']] }); render(); }
function delP(i) { if (confirm('Hapus produk ini?')) { E.products.splice(i, 1); render(); } }
function pickImg(k, inp) {
  const f = inp.files[0]; if (!f) return;
  const [w, h] = k === 'avatar' ? [256, 256] : [1000, 333], im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const r = Math.max(w / im.width, h / im.height), dw = im.width * r, dh = im.height * r;
    c.getContext('2d').drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
    E.owner[k] = c.toDataURL('image/jpeg', .8); render();
  };
  im.src = URL.createObjectURL(f);
}
async function save() {
  const r = await api({ action: 'save', cfg: E });
  if (!r.ok) return alert('Gagal menyimpan. Cek password dan koneksi Upstash.');
  E = null; await load(); alert('Tersimpan');
}

async function load() { D = Object.assign({ views: 0 }, await api()); C = D.cfg || DEF; render(); }
async function login() { sessionStorage.p = $('#pw').value; await load(); if (!D.owner) { delete sessionStorage.p; alert('Password salah'); } }
function logout() { delete sessionStorage.p; E = null; load(); }

window.onresize = render;
load().then(() => api({ action: 'hit', tab: 'load' }));
