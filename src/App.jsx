import React, { useState, useEffect } from 'react';
import {
  Search, Star, Home, User, BookOpen, Heart, Share2, Facebook, Instagram,
  LogOut, Loader2, ArrowLeft, Sparkles, Wifi, Users, UserPlus, UserCheck, Bell, Calendar, Award,
} from 'lucide-react';

/* ---------------------------------------------------------------
   DESIGN TOKENS — "sala de leitura à noite": verde-tinta profundo,
   latão envelhecido e pergaminho. Lombadas de livro como elemento
   de assinatura visual (estantes reais, não grades de capas).
----------------------------------------------------------------*/
const C = {
  bg: '#132420',
  bgSoft: '#0F1D19',
  panel: '#1C332B',
  panelBorder: '#2E4B3E',
  parchment: '#EEE4CC',
  parchmentDark: '#E2D3AC',
  ink: '#241C13',
  gold: '#C7A25A',
  goldSoft: '#8C7439',
  burgundy: '#8B3A3A',
  textLight: '#EFE6D2',
  textMuted: '#9EB2A6',
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
.bkbx-display { font-family: 'Fraunces', serif; }
.bkbx-body { font-family: 'Inter', sans-serif; }
.bkbx-mono { font-family: 'IBM Plex Mono', monospace; }
.bkbx-spine-title { writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.03em; }
.bkbx-shelf::-webkit-scrollbar { height: 7px; }
.bkbx-shelf::-webkit-scrollbar-track { background: transparent; }
.bkbx-shelf::-webkit-scrollbar-thumb { background: ${C.goldSoft}; border-radius: 4px; }
.bkbx-input::placeholder { color: #7C8E82; }
.spin { animation: sp 1s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }
`;

const SPINE_COLORS = ['#8B3A3A', '#3F6355', '#B8863B', '#5A4A73', '#4A5F7A'];
function spineColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return SPINE_COLORS[Math.abs(h) % SPINE_COLORS.length];
}
function initialsOf(name = '?') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
}
function relTime(ts) {
  const diff = Math.max(0, Date.now() - new Date(ts).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(ts).toLocaleDateString('pt-BR');
}
const FALLBACK_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="${C.parchmentDark}"/><text x="100" y="155" font-family="serif" font-size="16" fill="${C.ink}" text-anchor="middle">sem capa</text></svg>`
);

function normalizeBook(b) {
  return { id: b.id, title: b.title, authors: b.authors, cover: b.cover_url, description: b.description };
}

/* Fora do chat da Claude, usamos o localStorage normal do navegador
   (a API especial "window.storage" só existe dentro do artifact). */
const storage = {
  async get(key) {
    const v = window.localStorage.getItem(key);
    if (v === null) throw new Error('not found');
    return { key, value: v };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    window.localStorage.removeItem(key);
    return { key, deleted: true };
  },
};

/* ---------------------------- API layer ----------------------------
   Toda leitura/escrita de dados agora passa por aqui — nada mais fica
   só na memória do navegador. `callApi` é independente do estado do
   componente para poder ser usada na restauração de sessão, antes do
   React terminar de atualizar os states.
------------------------------------------------------------------- */
async function callApi(base, tok, path, opts = {}) {
  if (!base) throw new Error('Informe a URL da API primeiro.');
  const url = base.replace(/\/+$/, '') + path;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (tok) headers.Authorization = `Bearer ${tok}`;
  let res;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (e) {
    throw new Error('Não foi possível alcançar essa API. Verifique a URL e se o servidor está no ar.');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* resposta sem corpo, ok em DELETE */ }
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status} ao falar com a API.`);
  return data;
}

/* ---------------------------- small UI bits ---------------------------- */
function Stars({ value = 0, size = 16, interactive = false, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          fill={n <= Math.round(value) ? C.gold : 'none'}
          color={C.gold}
          strokeWidth={1.5}
          onClick={interactive ? () => onChange(n) : undefined}
        />
      ))}
    </div>
  );
}

function Avatar({ name, size = 36 }) {
  return (
    <div className="bkbx-mono" style={{
      width: size, height: size, borderRadius: '50%', background: C.gold, color: C.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
      fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initialsOf(name)}
    </div>
  );
}

function Cover({ src, alt, width = 64, height = 96, radius = 4 }) {
  return (
    <img
      src={src || FALLBACK_COVER}
      alt={alt}
      onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_COVER; }}
      style={{ width, height, objectFit: 'cover', borderRadius: radius, boxShadow: '0 2px 6px rgba(0,0,0,0.4)', flexShrink: 0, background: C.parchmentDark }}
    />
  );
}

function Pill({ children, active, onClick, tone = 'gold' }) {
  const bg = active ? (tone === 'gold' ? C.gold : C.burgundy) : 'transparent';
  const color = active ? C.ink : C.textLight;
  return (
    <button onClick={onClick} className="bkbx-body" style={{
      padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      background: bg, color, border: `1px solid ${active ? bg : C.panelBorder}`, transition: 'all .15s',
    }}>
      {children}
    </button>
  );
}

function BookSpine({ book, reviewedByMe, onClick }) {
  const bg = spineColor(book.title);
  return (
    <button onClick={onClick} title={book.title} style={{
      background: bg, width: 46, height: 190, borderRadius: '2px 5px 5px 2px', flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', cursor: 'pointer', border: 'none',
      boxShadow: 'inset -3px 0 0 rgba(0,0,0,0.15), 2px 2px 5px rgba(0,0,0,0.35)',
    }}>
      <div className="bkbx-spine-title bkbx-display" style={{
        color: C.parchment, fontSize: 12.5, fontWeight: 600, maxHeight: 130, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {book.title}
      </div>
      {reviewedByMe && <Star size={11} fill={C.gold} color={C.gold} strokeWidth={0} />}
    </button>
  );
}

function EmptyState({ icon: Icon, text, compact }) {
  return (
    <div style={{
      textAlign: 'center', color: C.textMuted, padding: compact ? '18px 10px' : '40px 20px',
      border: `1px dashed ${C.panelBorder}`, borderRadius: 10,
    }}>
      <Icon size={compact ? 18 : 24} style={{ marginBottom: 8, opacity: 0.6 }} />
      <div className="bkbx-body" style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

function StatLine({ icon: Icon, iconColor, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <Icon size={17} color={iconColor || C.gold} style={{ flexShrink: 0 }} />
      <span className="bkbx-body" style={{ fontSize: 14, color: C.textLight }}>{children}</span>
    </div>
  );
}

function ReadingStatsCard({ stats, loading, onOpenBook }) {
  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13, marginBottom: 20 }}>
        <Loader2 size={16} className="spin" /> Carregando estatísticas…
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 26, background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 10, padding: '14px 16px' }}>
      {stats.averageRating != null && (
        <StatLine icon={Star}>
          <strong>{stats.averageRating.toFixed(1).replace('.', ',')}</strong> de média nas avaliações
        </StatLine>
      )}
      {stats.topGenre && (
        <StatLine icon={Heart} iconColor={C.burgundy}>{stats.topGenre.name}</StatLine>
      )}
      {stats.topAuthor && (
        <StatLine icon={Award}>
          Autor mais lido: <strong>{stats.topAuthor.name}</strong>
        </StatLine>
      )}
      {stats.currentlyReading && (
        <button onClick={() => onOpenBook({ id: stats.currentlyReading.id, title: stats.currentlyReading.title, cover: stats.currentlyReading.cover_url })}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <StatLine icon={BookOpen} iconColor={C.gold}>
            Lendo agora: <strong>{stats.currentlyReading.title}</strong>
          </StatLine>
        </button>
      )}

      {stats.favorites?.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}` }}>
          <div className="bkbx-mono" style={{ fontSize: 10.5, color: C.textMuted, marginBottom: 8 }}>MEUS FAVORITOS</div>
          {stats.favorites.slice(0, 5).map((b, i) => (
            <button key={b.id} onClick={() => onOpenBook({ id: b.id, title: b.title, cover: b.cover_url })}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0', textAlign: 'left' }}>
              <span className="bkbx-mono" style={{ fontSize: 12, color: C.gold, width: 16, flexShrink: 0 }}>{i + 1}.</span>
              <Cover src={b.cover_url} alt={b.title} width={26} height={38} radius={3} />
              <span className="bkbx-body" style={{ fontSize: 13.5, color: C.textLight }}>{b.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APP
============================================================ */
export default function Bookerbox() {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [screen, setScreen] = useState('login'); // 'login' | 'app'

  const DEFAULT_API_BASE = 'https://bookerbox-api.onrender.com';
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('feed');
  const [selectedBook, setSelectedBook] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  const [feedReviews, setFeedReviews] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const [shelves, setShelves] = useState({}); // bookId -> { status, book }
  const [shelvesLoading, setShelvesLoading] = useState(false);

  const [bookDetailReviews, setBookDetailReviews] = useState([]);
  const [bookReviewsLoading, setBookReviewsLoading] = useState(false);

  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');

  const [peopleQuery, setPeopleQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState([]);
  const [peopleSearchLoading, setPeopleSearchLoading] = useState(false);
  const [myFollowing, setMyFollowing] = useState([]);
  const [myFollowers, setMyFollowers] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const [viewedPerson, setViewedPerson] = useState(null); // { user, stats, following, followers }
  const [viewedPersonLoading, setViewedPersonLoading] = useState(false);

  const [myReadingStats, setMyReadingStats] = useState(null);
  const [readingStatsLoading, setReadingStatsLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [toast, setToast] = useState(null);
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  const apiFetch = (path, opts) => callApi(apiBase, token, path, opts);

  /* ---------------- restore session (apiBase + token only) ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.get('bookerbox:session', false);
        if (saved) {
          const s = JSON.parse(saved.value);
          if (s.apiBase) setApiBase(s.apiBase);
          if (s.apiBase && s.token) {
            try {
              const me = await callApi(s.apiBase, s.token, '/auth/me');
              setToken(s.token);
              setCurrentUser(me.user);
              setScreen('app');
              await loadShelves(s.token, s.apiBase);
              await loadFeed(s.token, s.apiBase);
              await loadNotifications();
            } catch (e) { /* token inválido/expirado: fica na tela de login */ }
          }
        }
      } catch (e) { /* nada salvo ainda */ }
      setSessionLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!sessionLoaded || !token) return;
    storage.set('bookerbox:session', JSON.stringify({ apiBase, token }), false).catch(() => {});
  }, [token, apiBase, sessionLoaded]);

  /* ---------------- data loaders ---------------- */
  async function loadShelves(tok = token, base = apiBase) {
    setShelvesLoading(true);
    try {
      const data = await callApi(base, tok, '/shelves');
      const map = {};
      data.shelves.forEach(s => {
        map[s.book_id] = { status: s.status, book: { id: s.book_id, title: s.title, authors: s.authors, cover: s.cover_url } };
      });
      setShelves(map);
    } catch (err) {
      showToast(err.message);
    } finally {
      setShelvesLoading(false);
    }
  }

  async function loadFeed(tok = token, base = apiBase) {
    setFeedLoading(true);
    try {
      const data = await callApi(base, tok, '/feed');
      setFeedReviews(data.reviews);
    } catch (err) {
      showToast(err.message);
    } finally {
      setFeedLoading(false);
    }
  }

  async function loadBookReviews(bookId) {
    setBookReviewsLoading(true);
    try {
      const data = await apiFetch(`/reviews/book/${bookId}`);
      setBookDetailReviews(data.reviews);
    } catch (err) {
      showToast(err.message);
      setBookDetailReviews([]);
    } finally {
      setBookReviewsLoading(false);
    }
  }

  /* ---------------- auth ---------------- */
  async function testConnection() {
    if (!apiBase.trim()) { showToast('Informe a URL da API primeiro.'); return; }
    try {
      await callApi(apiBase, null, '/health');
      showToast('Conectado! A API respondeu certinho.');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleAuthSubmit() {
    if (!apiBase.trim()) { showToast('Informe a URL da API.'); return; }
    if (!formEmail.trim() || !formPassword.trim() || (authMode === 'register' && !formName.trim())) {
      showToast('Preencha todos os campos.');
      return;
    }
    if (authMode === 'register' && formPassword !== formPasswordConfirm) {
      showToast('As senhas não são iguais.');
      return;
    }
    setAuthLoading(true);
    try {
      const path = authMode === 'register' ? '/auth/register' : '/auth/login';
      const body = authMode === 'register'
        ? { name: formName.trim(), email: formEmail.trim(), password: formPassword }
        : { email: formEmail.trim(), password: formPassword };
      const data = await callApi(apiBase, null, path, { method: 'POST', body: JSON.stringify(body) });
      setToken(data.token);
      setCurrentUser(data.user);
      setScreen('app');
      await loadShelves(data.token, apiBase);
      await loadFeed(data.token, apiBase);
      await loadNotifications();
      showToast(authMode === 'register' ? 'Conta criada!' : 'Login feito!');
    } catch (err) {
      showToast(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  /* ---------------- login social (Google) ---------------- */
  // Substitua pelo valor real que você criar no Google Cloud Console.
  // Não é segredo — pode ficar no código do site.
  const GOOGLE_CLIENT_ID = '735029892304-1jm5jpkgd41pf0c71h7ebtukcah6c9oo.apps.googleusercontent.com';

  async function afterSocialLogin(data, providerLabel) {
    setToken(data.token);
    setCurrentUser(data.user);
    setScreen('app');
    await loadShelves(data.token, apiBase);
    await loadFeed(data.token, apiBase);
    await loadNotifications();
    showToast(`Login feito com ${providerLabel}!`);
  }

  async function handleGoogleCredential(response) {
    try {
      const data = await callApi(apiBase, null, '/auth/google', { method: 'POST', body: JSON.stringify({ idToken: response.credential }) });
      await afterSocialLogin(data, 'Google');
    } catch (err) {
      showToast(err.message);
    }
  }

  useEffect(() => {
    if (screen !== 'login') return;
    if (!window.google?.accounts?.id) return; // script do Google ainda carregando
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    const el = document.getElementById('google-signin-btn');
    if (el) {
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 320, text: 'continue_with', locale: 'pt-BR' });
    }
  }, [screen, apiBase]);

  async function handleLogout() {
    try { await storage.delete('bookerbox:session', false); } catch (e) {}
    setToken(null);
    setCurrentUser(null);
    setShelves({});
    setFeedReviews([]);
    setScreen('login');
    setActiveTab('feed');
    setSelectedBook(null);
  }

  /* ---------------- search ---------------- */
  async function runSearch(e) {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchDone(false);
    try {
      const data = await apiFetch(`/books/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.books.map(normalizeBook));
    } catch (err) {
      showToast(err.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      setSearchDone(true);
    }
  }

  /* ---------------- book detail ---------------- */
  async function openBook(bookStub) {
    setSelectedBook(bookStub);
    setNewRating(0);
    setNewText('');
    loadBookReviews(bookStub.id);
    if (!bookStub.description) {
      try {
        const data = await apiFetch(`/books/${bookStub.id}`);
        const full = normalizeBook(data.book);
        setSelectedBook(prev => (prev && prev.id === bookStub.id ? { ...prev, ...full } : prev));
      } catch (e) { /* fica só com o que já tínhamos */ }
    }
  }
  function closeBook() { setSelectedBook(null); setBookDetailReviews([]); }

  /* ---------------- shelves ---------------- */
  async function setShelf(book, status) {
    const current = shelves[book.id];
    try {
      if (current && current.status === status) {
        await apiFetch(`/shelves/${book.id}`, { method: 'DELETE' });
        setShelves(prev => { const next = { ...prev }; delete next[book.id]; return next; });
        showToast('Removido da estante.');
      } else {
        await apiFetch(`/shelves/${book.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        setShelves(prev => ({ ...prev, [book.id]: { status, book } }));
        const labels = { want: 'Quero ler', reading: 'Lendo', read: 'Lido' };
        showToast(`Adicionado a "${labels[status]}".`);
      }
    } catch (err) {
      showToast(err.message);
    }
  }

  /* ---------------- reviews & likes ---------------- */
  async function submitReview(book) {
    if (newRating < 1) { showToast('Escolha ao menos 1 estrela.'); return; }
    try {
      await apiFetch('/reviews', { method: 'POST', body: JSON.stringify({ bookId: book.id, rating: newRating, text: newText.trim() }) });
      setNewRating(0);
      setNewText('');
      showToast('Resenha publicada!');
      await loadBookReviews(book.id);
      await loadShelves();
      await loadFeed();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function toggleLike(review) {
    try {
      const method = review.liked_by_me ? 'DELETE' : 'POST';
      await apiFetch(`/reviews/${review.id}/like`, { method });
      if (selectedBook) await loadBookReviews(selectedBook.id);
      await loadFeed();
    } catch (err) {
      showToast(err.message);
    }
  }

  /* ---------------- sharing ---------------- */
  function fbShareUrl(book) {
    const demoUrl = `https://bookerbox.app/livro/${book.id}`;
    const quote = `Avaliei "${book.title}" no Bookerbox!`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(demoUrl)}&quote=${encodeURIComponent(quote)}`;
  }
  async function copyInstagramCaption(book, avg) {
    const r = Math.round(avg) || 5;
    const text = `📖 "${book.title}" — ${'★'.repeat(r)}${'☆'.repeat(5 - r)}\nAvaliado no Bookerbox #bookerbox #livros`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Legenda copiada! Cole no Instagram.');
    } catch {
      showToast('Não foi possível copiar automaticamente.');
    }
  }

  /* ---------------- pessoas / conexões ---------------- */
  async function loadConnections() {
    setConnectionsLoading(true);
    try {
      const [followingRes, followersRes] = await Promise.all([
        apiFetch(`/users/${currentUser.id}/following`),
        apiFetch(`/users/${currentUser.id}/followers`),
      ]);
      setMyFollowing(followingRes.following);
      setMyFollowers(followersRes.followers);
    } catch (err) {
      showToast(err.message);
    } finally {
      setConnectionsLoading(false);
    }
  }

  async function searchPeople() {
    if (!peopleQuery.trim()) return;
    setPeopleSearchLoading(true);
    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(peopleQuery)}`);
      setPeopleResults(data.users.filter(u => u.id !== currentUser.id));
    } catch (err) {
      showToast(err.message);
      setPeopleResults([]);
    } finally {
      setPeopleSearchLoading(false);
    }
  }

  async function toggleFollow(personId, isFollowing) {
    try {
      await apiFetch(`/users/${personId}/follow`, { method: isFollowing ? 'DELETE' : 'POST' });
      showToast(isFollowing ? 'Deixou de seguir.' : 'Agora vocês estão conectados!');
      await loadConnections();
      if (viewedPerson?.user.id === personId) await openPerson(personId);
      await loadFeed();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function openPerson(personId) {
    setViewedPersonLoading(true);
    try {
      const [profile, followingRes, followersRes, readingRes, compatRes] = await Promise.all([
        apiFetch(`/users/${personId}`),
        apiFetch(`/users/${personId}/following`),
        apiFetch(`/users/${personId}/followers`),
        apiFetch(`/users/${personId}/reading-stats`),
        apiFetch(`/users/${personId}/compatibility`),
      ]);
      setViewedPerson({ user: profile.user, stats: profile.stats, following: followingRes.following, followers: followersRes.followers, reading: readingRes, compatibility: compatRes });
    } catch (err) {
      showToast(err.message);
    } finally {
      setViewedPersonLoading(false);
    }
  }
  function closePerson() { setViewedPerson(null); }

  async function loadMyReadingStats() {
    setReadingStatsLoading(true);
    try {
      const data = await apiFetch(`/users/${currentUser.id}/reading-stats`);
      setMyReadingStats(data);
    } catch (err) {
      showToast(err.message);
    } finally {
      setReadingStatsLoading(false);
    }
  }

  /* ---------------- notificações ---------------- */
  async function loadNotifications() {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
    } catch (err) { /* falha silenciosa, não interrompe o app */ }
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { /* ignora */ }
  }

  async function toggleNotifPanel() {
    const next = !showNotifPanel;
    setShowNotifPanel(next);
    if (next) {
      await loadNotifications();
      await markAllRead();
    }
  }

  function notifText(n) {
    const name = n.payload?.actorName || 'Alguém';
    if (n.type === 'follow') return `${name} começou a seguir você`;
    if (n.type === 'like') return `${name} curtiu sua resenha de "${n.payload?.bookTitle || 'um livro'}"`;
    return 'Nova notificação';
  }

  /* ---------------- atualização automática (a cada 25s) ---------------- */
  useEffect(() => {
    if (screen !== 'app') return;
    const interval = setInterval(() => {
      if (activeTab === 'feed' && !selectedBook && !viewedPerson) loadFeed();
      loadNotifications();
    }, 25000);
    return () => clearInterval(interval);
  }, [screen, activeTab, selectedBook, viewedPerson, apiBase, token]);

  function onTabClick(id) {
    setActiveTab(id);
    if (id === 'feed') loadFeed();
    if (id === 'shelves') loadShelves();
    if (id === 'people') loadConnections();
    if (id === 'profile') { loadMyReadingStats(); loadConnections(); }
  }

  /* =========================== LOADING SESSÃO =========================== */
  if (!sessionLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONTS}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMuted }} className="bkbx-body">
          <Loader2 size={18} className="spin" color={C.gold} /> Restaurando sessão…
        </div>
      </div>
    );
  }

  /* =========================== LOGIN / CADASTRO =========================== */
  if (screen === 'login') {
    return (
      <div className="bkbx-body" style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <style>{FONTS}</style>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <BookOpen size={26} color={C.gold} />
              <span className="bkbx-display" style={{ fontSize: 30, fontWeight: 700, color: C.textLight }}>Bookerbox</span>
            </div>
            <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, letterSpacing: 1 }}>conectado à sua API · sua estante, sua rede</div>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 10, padding: 24 }}>
            <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', color: C.textMuted, fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: C.panelBorder }} />
              ou
              <div style={{ flex: 1, height: 1, background: C.panelBorder }} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <Pill active={authMode === 'login'} onClick={() => setAuthMode('login')}>Entrar</Pill>
              <Pill active={authMode === 'register'} onClick={() => setAuthMode('register')}>Criar conta</Pill>
            </div>

            <div onKeyDown={e => { if (e.key === 'Enter') handleAuthSubmit(); }}>
              {authMode === 'register' && (
                <>
                  <label className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted }}>NOME</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="ex: Ana Ribeiro" className="bkbx-input bkbx-body" style={fieldStyle} />
                </>
              )}
              <label className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted }}>E-MAIL</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="voce@email.com" className="bkbx-input bkbx-body" style={fieldStyle} />
              <label className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted }}>SENHA</label>
              <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="mínimo 6 caracteres" className="bkbx-input bkbx-body" style={{ ...fieldStyle, marginBottom: authMode === 'register' ? 0 : 16 }} />
              {authMode === 'register' && (
                <>
                  <label className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted }}>CONFIRMAR SENHA</label>
                  <input type="password" value={formPasswordConfirm} onChange={e => setFormPasswordConfirm(e.target.value)} placeholder="digite a senha de novo" className="bkbx-input bkbx-body" style={{ ...fieldStyle, marginBottom: 16 }} />
                </>
              )}

              <button type="button" onClick={() => handleAuthSubmit()} disabled={authLoading} className="bkbx-body" style={{
                width: '100%', padding: '11px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: C.gold, color: C.ink, fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: authLoading ? 0.7 : 1,
              }}>
                {authLoading && <Loader2 size={15} className="spin" />}
                {authMode === 'register' ? 'Criar conta e entrar' : 'Entrar'}
              </button>
            </div>

            <button onClick={() => setShowAdvanced(v => !v)} className="bkbx-body" style={{
              background: 'none', border: 'none', color: C.textMuted, fontSize: 11, cursor: 'pointer', marginTop: 16, padding: 0,
            }}>
              {showAdvanced ? 'ocultar opções avançadas' : 'opções avançadas'}
            </button>

            {showAdvanced && (
              <div style={{ marginTop: 10 }}>
                <label className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted }}>URL DA API</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    value={apiBase}
                    onChange={e => setApiBase(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="bkbx-input bkbx-body"
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 6, border: `1px solid ${C.panelBorder}`,
                      background: C.bgSoft, color: C.textLight, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button type="button" onClick={testConnection} title="Testar conexão" style={{
                    background: C.bgSoft, border: `1px solid ${C.panelBorder}`, borderRadius: 6, padding: '0 12px', cursor: 'pointer', color: C.gold,
                  }}>
                    <Wifi size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="bkbx-body" style={{ fontSize: 11.5, color: C.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Suas resenhas, estantes e conexões ficam salvas de verdade — sua conta é sua, para sempre.
          </p>
          <p style={{ textAlign: 'center', marginTop: 8 }}>
            <a href="/privacidade" className="bkbx-body" style={{ fontSize: 11.5, color: C.textMuted, textDecoration: 'underline' }}>
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* =========================== TABS =========================== */
  const TABS = [
    { id: 'feed', label: 'Início', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'shelves', label: 'Estantes', icon: BookOpen },
    { id: 'people', label: 'Amigos', icon: Users },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const myReviews = feedReviews.filter(r => r.user_id === currentUser.id);
  const shelfList = status => Object.values(shelves).filter(s => s.status === status);
  const reviewedBookIds = new Set(myReviews.map(r => r.book_id));
  const myFollowingIds = new Set(myFollowing.map(u => u.id));
  /* =========================== BOOK DETAIL =========================== */
  function BookDetail({ book }) {
    const rs = bookDetailReviews;
    const avg = rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0;
    const myStatus = shelves[book.id]?.status;

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 90px' }}>
        <button onClick={closeBook} className="bkbx-body" style={{ background: 'none', border: 'none', color: C.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
          <ArrowLeft size={15} /> voltar
        </button>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <Cover src={book.cover} alt={book.title} width={100} height={148} radius={5} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="bkbx-display" style={{ fontSize: 22, fontWeight: 700, color: C.textLight, margin: '0 0 4px', lineHeight: 1.2 }}>{book.title}</h1>
            <div className="bkbx-body" style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 10 }}>{book.authors}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars value={avg} size={15} />
              <span className="bkbx-mono" style={{ fontSize: 12, color: C.textMuted }}>
                {bookReviewsLoading ? 'carregando…' : avg > 0 ? `${avg.toFixed(1)} · ${rs.length} resenha${rs.length > 1 ? 's' : ''}` : 'sem avaliações ainda'}
              </span>
            </div>
          </div>
        </div>

        {book.description && (
          <p className="bkbx-body" style={{ fontSize: 14, color: C.textLight, lineHeight: 1.6, opacity: 0.9, marginBottom: 20 }}>
            {book.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          <Pill active={myStatus === 'want'} onClick={() => setShelf(book, 'want')}>Quero ler</Pill>
          <Pill active={myStatus === 'reading'} onClick={() => setShelf(book, 'reading')}>Lendo</Pill>
          <Pill active={myStatus === 'read'} onClick={() => setShelf(book, 'read')} tone="burgundy">Lido</Pill>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
          <a href={fbShareUrl(book)} target="_blank" rel="noopener noreferrer" className="bkbx-body" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 6, background: '#3b5998',
            color: '#fff', fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
          }}>
            <Facebook size={14} /> Compartilhar
          </a>
          <button onClick={() => copyInstagramCaption(book, avg)} className="bkbx-body" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 6,
            background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff',
            fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}>
            <Instagram size={14} /> Copiar legenda
          </button>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 10, padding: 16, marginBottom: 22 }}>
          <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>SUA AVALIAÇÃO</div>
          <Stars value={newRating} interactive size={22} onChange={setNewRating} />
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="O que você achou deste livro?"
            className="bkbx-input bkbx-body"
            rows={3}
            style={{
              width: '100%', marginTop: 12, padding: 10, borderRadius: 6, border: `1px solid ${C.panelBorder}`,
              background: C.bgSoft, color: C.textLight, fontSize: 13.5, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <button onClick={() => submitReview(book)} className="bkbx-body" style={{
            marginTop: 10, padding: '9px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.gold, color: C.ink, fontWeight: 700, fontSize: 13.5,
          }}>
            Publicar resenha
          </button>
        </div>

        {bookReviewsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13 }}>
            <Loader2 size={16} className="spin" /> Carregando resenhas…
          </div>
        ) : rs.length > 0 && (
          <div>
            <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>RESENHAS</div>
            {rs.map(r => (
              <div key={r.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <Avatar name={r.user_name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="bkbx-body" style={{ fontWeight: 600, fontSize: 13.5, color: C.textLight }}>{r.user_name}</span>
                    <Stars value={r.rating} size={12} />
                  </div>
                  {r.text && <p className="bkbx-body" style={{ fontSize: 13.5, color: C.textLight, opacity: 0.85, margin: '4px 0 0', lineHeight: 1.5 }}>{r.text}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <span className="bkbx-mono" style={{ fontSize: 10.5, color: C.textMuted }}>{relTime(r.created_at)}</span>
                    <button onClick={() => toggleLike(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: r.liked_by_me ? C.burgundy : C.textMuted }}>
                      <Heart size={12} fill={r.liked_by_me ? C.burgundy : 'none'} /> <span className="bkbx-mono" style={{ fontSize: 10.5 }}>{r.like_count || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* =========================== FEED ITEM =========================== */
  function ReviewCard({ r }) {
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <Avatar name={r.user_name} />
          <div style={{ flex: 1 }}>
            <div className="bkbx-body" style={{ fontWeight: 600, fontSize: 13.5, color: C.textLight }}>{r.user_name}</div>
            <div className="bkbx-mono" style={{ fontSize: 10.5, color: C.textMuted }}>{relTime(r.created_at)}</div>
          </div>
        </div>
        <button onClick={() => openBook({ id: r.book_id, title: r.book_title, authors: r.book_authors, cover: r.book_cover })}
          style={{ display: 'flex', gap: 12, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 10 }}>
          <Cover src={r.book_cover} alt={r.book_title} width={52} height={78} />
          <div style={{ minWidth: 0 }}>
            <div className="bkbx-display" style={{ fontSize: 15, fontWeight: 600, color: C.textLight, lineHeight: 1.25 }}>{r.book_title}</div>
            <div className="bkbx-body" style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{r.book_authors}</div>
            <Stars value={r.rating} size={13} />
          </div>
        </button>
        {r.text && <p className="bkbx-body" style={{ fontSize: 13.5, color: C.textLight, opacity: 0.9, lineHeight: 1.5, margin: '0 0 10px' }}>{r.text}</p>}
        <div style={{ display: 'flex', gap: 16, borderTop: `1px solid ${C.panelBorder}`, paddingTop: 10 }}>
          <button onClick={() => toggleLike(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: r.liked_by_me ? C.burgundy : C.textMuted }}>
            <Heart size={15} fill={r.liked_by_me ? C.burgundy : 'none'} /> <span className="bkbx-mono" style={{ fontSize: 11.5 }}>{r.like_count || 0}</span>
          </button>
          <a href={fbShareUrl({ id: r.book_id, title: r.book_title })} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: 'none', color: C.textMuted, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
            <Share2 size={14} /> <span className="bkbx-mono" style={{ fontSize: 11.5 }}>compartilhar</span>
          </a>
        </div>
      </div>
    );
  }

  /* =========================== PESSOA (linha em lista) =========================== */
  function PersonRow({ person, isFollowing }) {
    const isMe = person.id === currentUser.id;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.panelBorder}` }}>
        <button onClick={() => openPerson(person.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <Avatar name={person.name} size={32} />
          <span className="bkbx-body" style={{ fontSize: 13.5, color: C.textLight, fontWeight: 600 }}>{person.name}</span>
        </button>
        {!isMe && (
          <button onClick={() => toggleFollow(person.id, isFollowing)} className="bkbx-body" style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: isFollowing ? 'transparent' : C.gold, color: isFollowing ? C.textLight : C.ink, border: `1px solid ${isFollowing ? C.panelBorder : C.gold}`,
          }}>
            {isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>
    );
  }

  /* =========================== PERFIL DE OUTRA PESSOA =========================== */
  function PersonProfile() {
    if (viewedPersonLoading || !viewedPerson) {
      return (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>
          <button onClick={closePerson} className="bkbx-body" style={{ background: 'none', border: 'none', color: C.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
            <ArrowLeft size={15} /> voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13 }}>
            <Loader2 size={16} className="spin" /> Carregando perfil…
          </div>
        </div>
      );
    }
    const { user, stats, following, followers, reading, compatibility } = viewedPerson;
    const isMe = user.id === currentUser.id;
    const isFollowing = myFollowingIds.has(user.id);

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 90px' }}>
        <button onClick={closePerson} className="bkbx-body" style={{ background: 'none', border: 'none', color: C.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
          <ArrowLeft size={15} /> voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <Avatar name={user.name} size={56} />
          <div style={{ flex: 1 }}>
            <div className="bkbx-display" style={{ fontSize: 19, fontWeight: 700 }}>{user.name}</div>
            <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted }}>
              {stats.reviews} resenha{stats.reviews !== 1 ? 's' : ''} · {stats.followers} seguidor{stats.followers !== 1 ? 'es' : ''} · {stats.following} seguindo
            </div>
          </div>
          {!isMe && (
            <button onClick={() => toggleFollow(user.id, isFollowing)} className="bkbx-body" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: isFollowing ? 'transparent' : C.gold, color: isFollowing ? C.textLight : C.ink, border: `1px solid ${isFollowing ? C.panelBorder : C.gold}`,
            }}>
              {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
          )}
        </div>

        {!isMe && compatibility?.percent != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: C.panel, border: `1px solid ${C.goldSoft}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 14,
          }}>
            <Sparkles size={16} color={C.gold} style={{ flexShrink: 0 }} />
            <span className="bkbx-body" style={{ fontSize: 13.5, color: C.textLight }}>
              <strong style={{ color: C.gold }}>{compatibility.percent}%</strong> de compatibilidade literária com você
              {compatibility.sharedBooks?.length > 0 && (
                <span style={{ color: C.textMuted }}> · {compatibility.sharedBooks.length} livro{compatibility.sharedBooks.length !== 1 ? 's' : ''} em comum</span>
              )}
            </span>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <ReadingStatsCard stats={reading} loading={false} onOpenBook={openBook} />
        </div>

        <div style={{ marginTop: 4, marginBottom: 26 }}>
          <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
            {isMe ? 'VOCÊ SEGUE' : `QUEM ${user.name.split(' ')[0].toUpperCase()} SEGUE`} ({following.length})
          </div>
          {following.length === 0 ? (
            <EmptyState compact icon={Users} text="Ninguém por aqui ainda." />
          ) : following.map(p => <PersonRow key={p.id} person={p} isFollowing={myFollowingIds.has(p.id)} />)}
        </div>

        <div>
          <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
            {isMe ? 'SEGUIDORES' : `QUEM SEGUE ${user.name.split(' ')[0].toUpperCase()}`} ({followers.length})
          </div>
          {followers.length === 0 ? (
            <EmptyState compact icon={Users} text="Ninguém por aqui ainda." />
          ) : followers.map(p => <PersonRow key={p.id} person={p} isFollowing={myFollowingIds.has(p.id)} />)}
        </div>
      </div>
    );
  }

  /* =========================== MAIN RENDER =========================== */
  return (
    <div className="bkbx-body" style={{ minHeight: '100vh', background: C.bg, color: C.textLight }}>
      <style>{FONTS}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bgSoft, borderBottom: `1px solid ${C.panelBorder}` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BookOpen size={19} color={C.gold} />
            <span className="bkbx-display" style={{ fontSize: 18, fontWeight: 700 }}>Bookerbox</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <button onClick={toggleNotifPanel} title="Notificações" style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', position: 'relative', display: 'flex' }}>
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="bkbx-mono" style={{
                  position: 'absolute', top: -4, right: -4, background: C.burgundy, color: '#fff',
                  fontSize: 9, fontWeight: 700, borderRadius: 999, minWidth: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <div style={{
                position: 'absolute', top: 30, right: 40, width: 280, maxHeight: 340, overflowY: 'auto',
                background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.4)', zIndex: 20, padding: 10,
              }}>
                <div className="bkbx-mono" style={{ fontSize: 10.5, color: C.textMuted, marginBottom: 8, padding: '0 4px' }}>NOTIFICAÇÕES</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px 4px', textAlign: 'center', color: C.textMuted, fontSize: 12.5 }} className="bkbx-body">
                    Nada por aqui ainda.
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{ padding: '8px 6px', borderBottom: `1px solid ${C.panelBorder}`, fontSize: 12.5 }} className="bkbx-body">
                    <div style={{ color: C.textLight, opacity: n.read ? 0.6 : 1 }}>{notifText(n)}</div>
                    <div className="bkbx-mono" style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{relTime(n.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleLogout} title="Sair" style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Avatar name={currentUser.name} size={26} />
              <LogOut size={15} />
            </button>
          </div>
        </div>
        {!selectedBook && !viewedPerson && (
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 4 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => onTabClick(t.id)} className="bkbx-body" style={{
                  flex: 1, padding: '9px 4px 11px', background: 'none', border: 'none', cursor: 'pointer',
                  color: active ? C.gold : C.textMuted, borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
                }}>
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedBook ? (
        <BookDetail book={selectedBook} />
      ) : viewedPerson ? (
        <PersonProfile />
      ) : (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '18px 16px 90px' }}>

          {activeTab === 'feed' && (
            <>
              <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>SEU FEED (você + quem você segue)</div>
              {feedLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13 }}>
                  <Loader2 size={16} className="spin" /> Carregando…
                </div>
              ) : feedReviews.length === 0 ? (
                <EmptyState icon={Sparkles} text="Nada por aqui ainda. Avalie um livro para começar, ou siga alguém pela API." />
              ) : feedReviews.map(r => <ReviewCard key={r.id} r={r} />)}
            </>
          )}

          {activeTab === 'search' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
                  placeholder="Buscar título, autor ou ISBN…"
                  className="bkbx-input bkbx-body"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: `1px solid ${C.panelBorder}`, background: C.panel, color: C.textLight, fontSize: 14, outline: 'none' }}
                />
                <button type="button" onClick={() => runSearch()} style={{ background: C.gold, border: 'none', borderRadius: 6, padding: '0 14px', cursor: 'pointer', color: C.ink, display: 'flex', alignItems: 'center' }}>
                  <Search size={17} />
                </button>
              </div>

              {searchLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13 }}>
                  <Loader2 size={16} className="spin" /> Buscando…
                </div>
              )}

              {!searchLoading && searchDone && searchResults.length === 0 && (
                <EmptyState icon={Search} text="Nenhum resultado. Tente outro título ou autor." />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 14 }}>
                {searchResults.map(b => (
                  <button key={b.id} onClick={() => openBook(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <Cover src={b.cover} alt={b.title} width="100%" height={140} radius={5} />
                    <div className="bkbx-body" style={{ fontSize: 12, fontWeight: 600, marginTop: 6, lineHeight: 1.3, color: C.textLight }}>{b.title}</div>
                    <div className="bkbx-body" style={{ fontSize: 10.5, color: C.textMuted }}>{b.authors}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'shelves' && (
            <>
              {shelvesLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
                  <Loader2 size={16} className="spin" /> Carregando estantes…
                </div>
              )}
              {[
                { key: 'want', label: 'Quero ler' },
                { key: 'reading', label: 'Lendo' },
                { key: 'read', label: 'Lido' },
              ].map(s => (
                <div key={s.key} style={{ marginBottom: 26 }}>
                  <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>{s.label.toUpperCase()} ({shelfList(s.key).length})</div>
                  {shelfList(s.key).length === 0 ? (
                    <EmptyState compact icon={BookOpen} text={`Nenhum livro em "${s.label}" ainda.`} />
                  ) : (
                    <div className="bkbx-shelf" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, borderBottom: `2px solid ${C.goldSoft}` }}>
                      {shelfList(s.key).map(entry => (
                        <BookSpine key={entry.book.id} book={entry.book} reviewedByMe={reviewedBookIds.has(entry.book.id)} onClick={() => openBook(entry.book)} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {activeTab === 'people' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                  value={peopleQuery}
                  onChange={e => setPeopleQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchPeople(); }}
                  placeholder="Buscar pessoas pelo nome…"
                  className="bkbx-input bkbx-body"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: `1px solid ${C.panelBorder}`, background: C.panel, color: C.textLight, fontSize: 14, outline: 'none' }}
                />
                <button type="button" onClick={() => searchPeople()} style={{ background: C.gold, border: 'none', borderRadius: 6, padding: '0 14px', cursor: 'pointer', color: C.ink, display: 'flex', alignItems: 'center' }}>
                  <Search size={17} />
                </button>
              </div>

              {peopleSearchLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
                  <Loader2 size={16} className="spin" /> Buscando…
                </div>
              )}

              {peopleResults.length > 0 && (
                <div style={{ marginBottom: 26 }}>
                  <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>RESULTADOS</div>
                  {peopleResults.map(p => (
                    <PersonRow key={p.id} person={p} isFollowing={myFollowingIds.has(p.id)} />
                  ))}
                </div>
              )}

              {connectionsLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
                  <Loader2 size={16} className="spin" /> Carregando conexões…
                </div>
              )}

              <div style={{ marginBottom: 26 }}>
                <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>VOCÊ SEGUE ({myFollowing.length})</div>
                {myFollowing.length === 0 ? (
                  <EmptyState compact icon={Users} text="Você ainda não segue ninguém. Busque pessoas acima." />
                ) : myFollowing.map(p => <PersonRow key={p.id} person={p} isFollowing={true} />)}
              </div>

              <div>
                <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>SEGUIDORES ({myFollowers.length})</div>
                {myFollowers.length === 0 ? (
                  <EmptyState compact icon={Users} text="Ninguém te segue ainda." />
                ) : myFollowers.map(p => <PersonRow key={p.id} person={p} isFollowing={myFollowingIds.has(p.id)} />)}
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <Avatar name={currentUser.name} size={56} />
                <div>
                  <div className="bkbx-display" style={{ fontSize: 19, fontWeight: 700 }}>{currentUser.name}</div>
                  <button onClick={() => onTabClick('people')} className="bkbx-mono" style={{
                    fontSize: 11, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
                  }}>
                    {myFollowers.length} seguidor{myFollowers.length !== 1 ? 'es' : ''} · {myFollowing.length} seguindo
                  </button>
                </div>
              </div>

              <ReadingStatsCard stats={myReadingStats} loading={readingStatsLoading} onOpenBook={openBook} />

              <div className="bkbx-mono" style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>MINHAS RESENHAS</div>
              {myReviews.length === 0 ? (
                <EmptyState icon={Star} text="Você ainda não avaliou nenhum livro. Busque um título para começar." />
              ) : myReviews.map(r => <ReviewCard key={r.id} r={r} />)}

              <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.panelBorder}` }}>
                <p className="bkbx-body" style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.5 }}>
                  Estante, resenhas e curtidas agora vivem na sua API ({apiBase || 'nenhuma URL configurada'}), não neste navegador. Qualquer pessoa que se cadastrar nela vê o mesmo banco de dados — isso é uma rede social de verdade.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {toast && (
        <div className="bkbx-body" style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: C.gold,
          color: C.ink, padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.35)', zIndex: 50, maxWidth: '90%', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const fieldStyle = {
  width: '100%', marginTop: 6, marginBottom: 14, padding: '10px 12px', borderRadius: 6,
  border: `1px solid ${C.panelBorder}`, background: C.bgSoft, color: C.textLight, fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
