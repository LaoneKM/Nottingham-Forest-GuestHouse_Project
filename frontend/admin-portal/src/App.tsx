import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from './api'
import { AMENITIES, Admin, Guesthouse, Status } from './types'

function useData<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [d, setD] = useState<T | null>(null)
  useEffect(() => { let on = true; fn().then(v => on && setD(v)); return () => { on = false } }, deps) // eslint-disable-line
  return d
}
const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const date = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
const money2 = (n: number) => `$${n.toFixed(2)}`
const Pill = ({ s }: { s: string }) => <span className={`pill ${s}`}>{s}</span>
const Thumb = ({ src, label }: { src?: string; label: string }) => <div className="thumb">{src ? <img src={src} alt={label} /> : label}</div>

function Shell({ me, onLogout, crumb, children }: { me: Admin; onLogout: () => void; crumb: string; children: ReactNode }) {
  const nav = [['/', 'Dashboard'], ['/guesthouses', 'Guesthouse Mgmt'], ['/search', 'Advanced Search'], ['/moderation', 'Moderation Queue'], ['/settings', 'Settings']]
  const go = useNavigate()
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">StayHaven<small>Admin Portal</small></div>
        {nav.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'nav' + (isActive ? ' active' : '')}>{l}</NavLink>)}
        <div className="user"><div className="avatar">{me.email.slice(0, 2).toUpperCase()}</div><div><b>{me.name}</b>{me.email}</div></div>
      </aside>
      <div className="main">
        <header className="top">
          <div className="crumb">StayHaven / {crumb.split(' / ').map((c, i, a) => i === a.length - 1 ? <b key={i}>{c}</b> : <span key={i}>{c} / </span>)}</div>
          <form className="gsearch" onSubmit={e => { e.preventDefault(); go('/guesthouses?q=' + encodeURIComponent(String(new FormData(e.currentTarget).get('q') || ''))) }}><input name="q" placeholder="Global Search…" aria-label="Global search" /></form>
          <div className="tr"><span>{me.role}</span><button className="btn" onClick={onLogout}>Log out</button></div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (a: Admin) => void }) {
  const [err, setErr] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget)
    try { onLogin(await api.login(String(f.get('email')), String(f.get('password')))) } catch (x) { setErr((x as Error).message) }
  }
  return (
    <div className="auth"><form className="card" onSubmit={submit}>
      <h1>StayHaven Admin</h1><p className="sub">Portal authentication &amp; secure gateway</p>
      <label>Email Address<input name="email" type="email" required placeholder="admin@stayhaven.com" /></label>
      <label>Password<input name="password" type="password" required /></label>
      <p style={{ textAlign: 'right', margin: '-4px 0 14px' }}><button type="button" className="linkbtn" onClick={() => alert('Please ask an existing admin to reset your password.')}>Forgot Password?</button></p>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn pri full">Authenticate &amp; Login</button>
      <p className="sub" style={{ marginTop: 16, marginBottom: 0 }}>Don&apos;t have an account? <Link to="/request"><b>Request Sign Up</b></Link></p>
    </form></div>
  )
}

function ModCard({ items, act, empty }: { items: Guesthouse[]; act: (h: Guesthouse, s: Status) => void; empty: string }) {
  return (<>
    {items.length === 0 && <p className="sub" style={{ margin: 0 }}>{empty}</p>}
    {items.map(h => <div className="item" key={h.id}><Thumb label="Photo" src={h.gallery[0]} /><div><b><Link to={`/guesthouses/${h.id}`}>{h.name}</Link></b><p>Awaiting validation • {h.city}</p></div>
      <button className="btn" onClick={() => act(h, 'Suspended')}>Decline</button><button className="btn pri" onClick={() => act(h, 'Active')}>Approve</button></div>)}
  </>)
}

function Moderation() {
  const [n, setN] = useState(0), list = useData(api.listGuesthouses, [n])
  if (!list) return <p>Loading…</p>
  const act = async (h: Guesthouse, s: Status) => { await api.saveGuesthouse({ ...h, status: s }); setN(n + 1) }
  return (<><div className="head"><div><h1>Moderation Queue</h1><p>Approve or decline listings awaiting validation. Declined listings are suspended.</p></div></div>
    <div className="card"><ModCard items={list.filter(h => h.status === 'Pending')} act={act} empty="Nothing to review right now." /></div></>)
}

function Dashboard() {
  const [n, setN] = useState(0), list = useData(api.listGuesthouses, [n]), admins = useData(api.listAdmins, [n])
  if (!list || !admins) return <p>Loading…</p>
  const cities: Record<string, number> = {}
  list.forEach(h => { cities[h.city] = (cities[h.city] || 0) + 1 })
  const top = Object.entries(cities).sort((a, b) => b[1] - a[1])[0]
  const best = [...list].sort((a, b) => b.rating - a.rating)[0]
  const avg = list.length ? list.reduce((s, h) => s + h.price, 0) / list.length : 0
  const week = list.filter(h => Date.now() - new Date(h.updatedAt).getTime() < 7 * 864e5).length
  const requests = admins.filter(a => a.approved === false).length
  const act = async (h: Guesthouse, s: Status) => { await api.saveGuesthouse({ ...h, status: s }); setN(n + 1) }
  const exportCsv = () => {
    const rows = [['Name', 'City', 'Country', 'Price', 'Rating', 'Status'], ...list.map(h => [h.name, h.city, h.country, h.price, h.rating, h.status])]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'guesthouses.csv'; a.click()
  }
  return (<>
    <div className="head"><div><h1>Welcome back, Admin!</h1><p>Here is your operations overview for StayHaven platform health.</p></div></div>
    <div className="grid stats">
      <div className="card stat"><span>TOTAL GUESTHOUSES</span><strong>{list.length}</strong><small>{week} updated this week</small></div>
      <div className="card stat"><span>TOP PERFORMING CITY</span><strong>{top ? top[0] : '–'}</strong><small>{top ? `${top[1]} active listings` : ''}</small></div>
      <div className="card stat"><span>HIGHEST RATED</span><strong>{best ? `${best.name} (${best.rating.toFixed(1)})` : '–'}</strong><small>{best ? `Based on ${best.ratingCount} ratings` : ''}</small></div>
      <div className="card stat"><span>NEW SIGN-UPS</span><strong>{requests} {requests === 1 ? 'Admin' : 'Admins'}</strong><small>Pending approval</small></div>
      <div className="card stat"><span>AVG PRICE / NIGHT</span><strong>{money2(avg)}</strong><small>Across all regions</small></div>
    </div>
    <div className="grid two">
      <div className="grid">
        <div className="card"><div className="split"><h2>Listing Moderation Summary</h2><span className="mute">Priority Action Queue</span></div>
          <ModCard items={list.filter(h => h.status === 'Pending').slice(0, 3)} act={act} empty="Nothing awaiting validation." /></div>
        <div className="card"><h2>Platform Activity Log</h2>
          {[...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4).map(h => <div className="logrow" key={h.id}>
            <div><b>{h.status === 'Pending' ? `Review of Guesthouse '${h.name}'` : `Guesthouse '${h.name}' updated`}</b><p>{h.status === 'Pending' ? 'MODERATION' : 'UPDATE'} • {date(h.updatedAt)}</p></div><span className="pill">{h.status.toUpperCase()}</span></div>)}</div>
      </div>
      <div className="card"><h2>Operations Hub</h2><p className="sub">Perform administrative system routines.</p>
        <div className="grid"><Link className="btn pri full" to="/guesthouses/new">Add Guesthouse Entry</Link><button className="btn full" onClick={exportCsv}>Export Listings (.CSV)</button><Link className="btn full" to="/moderation">Review Moderation Queue</Link></div></div>
    </div>
  </>)
}

function Listings() {
  const list = useData(api.listGuesthouses)
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || ''), [st, setSt] = useState(''), [city, setCity] = useState(''), [page, setPage] = useState(0)
  useEffect(() => { setQ(sp.get('q') || ''); setPage(0) }, [sp])
  const rows = useMemo(() => (list || []).filter(h => (!q || h.name.toLowerCase().includes(q.toLowerCase())) && (!st || h.status === st) && (!city || h.city === city)), [list, q, st, city])
  if (!list) return <p>Loading…</p>
  const per = 5, pages = Math.max(1, Math.ceil(rows.length / per)), cur = Math.min(page, pages - 1), view = rows.slice(cur * per, cur * per + per)
  return (<>
    <div className="head"><div><h1>Guesthouse Listings</h1><p>Manage, audit, update, and moderate registered properties on the platform.</p></div><Link className="btn pri" to="/guesthouses/new">+ Add New Guesthouse</Link></div>
    <div className="filters">
      <input placeholder="Search listings by name…" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} aria-label="Search by name" />
      <select value={st} onChange={e => { setSt(e.target.value); setPage(0) }} aria-label="Status"><option value="">Status: All Statuses</option>{['Active', 'Pending', 'Suspended'].map(s => <option key={s}>{s}</option>)}</select>
      <select value={city} onChange={e => { setCity(e.target.value); setPage(0) }} aria-label="City"><option value="">Region / City: All</option>{[...new Set(list.map(h => h.city))].sort().map(c => <option key={c}>{c}</option>)}</select>
    </div>
    <div className="card tablewrap"><table>
      <thead><tr><th>Guesthouse Name</th><th>City</th><th>Price / Night</th><th>Rating</th><th>Status</th><th>Updated Date</th><th>Actions</th></tr></thead>
      <tbody>{view.map(h => <tr key={h.id}><td style={{ fontWeight: 500 }}>{h.name}</td><td>{h.city}</td><td>{money(h.price)}</td><td>{h.rating.toFixed(1)} ★</td><td><Pill s={h.status} /></td><td>{date(h.updatedAt)}</td><td><Link to={`/guesthouses/${h.id}`}>View Details</Link></td></tr>)}
        {view.length === 0 && <tr><td colSpan={7}>No guesthouses match these filters.</td></tr>}</tbody>
    </table>
      <div className="pager"><span>Showing {rows.length ? cur * per + 1 : 0} to {Math.min(rows.length, cur * per + per)} of {rows.length} total guesthouses</span>
        <div><button className="btn" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button>{Array.from({ length: pages }, (_, i) => <button key={i} className={'pg' + (i === cur ? ' on' : '')} aria-label={`Page ${i + 1}`} onClick={() => setPage(i)}>{i + 1}</button>)}<button className="btn" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button></div></div>
    </div>
  </>)
}

function Search() {
  const list = useData(api.listGuesthouses)
  const [f, setF] = useState({ q: '', city: '', country: '', min: '', max: '', rating: 0, am: [] as string[] }), [sort, setSort] = useState('price')
  if (!list) return <p>Loading…</p>
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p })
  const rows = list.filter(h => (!f.q || (h.name + h.city).toLowerCase().includes(f.q.toLowerCase())) && (!f.city || h.city === f.city) && (!f.country || h.country === f.country) &&
    (!f.min || h.price >= +f.min) && (!f.max || h.price <= +f.max) && h.rating >= f.rating && f.am.every(a => h.amenities.includes(a)))
    .sort((a, b) => sort === 'price' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : b.rating - a.rating)
  return (<>
    <div className="head"><div><h1>Advanced search</h1><p>Find listings by location, price, rating and amenities.</p></div></div>
    <div className="grid two" style={{ gridTemplateColumns: '1fr 2fr' }}>
      <div className="card"><div className="split"><h2>Search Parameters</h2></div>
        <label>Name or location<input value={f.q} onChange={e => set({ q: e.target.value })} placeholder="e.g. Ocean, Cape" /></label>
        <div className="grid row2"><label>City<select value={f.city} onChange={e => set({ city: e.target.value })}><option value="">All cities</option>{[...new Set(list.map(h => h.city))].sort().map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Country<select value={f.country} onChange={e => set({ country: e.target.value })}><option value="">All countries</option>{[...new Set(list.map(h => h.country))].sort().map(c => <option key={c}>{c}</option>)}</select></label></div>
        <div className="grid row2"><label>Min price<input type="number" min="0" value={f.min} onChange={e => set({ min: e.target.value })} /></label><label>Max price<input type="number" min="0" value={f.max} onChange={e => set({ max: e.target.value })} /></label></div>
        <div style={{ marginBottom: 14 }}><b style={{ fontSize: 14 }}>Minimum Rating</b><div className="chips">{([[0, 'Any'], [3, '3.0+'], [4, '4.0+'], [4.5, '4.5+']] as [number, string][]).map(([v, l]) => <button type="button" key={l} className={'chip' + (f.rating === v ? ' on' : '')} onClick={() => set({ rating: v })}>{l}</button>)}</div></div>
        <div className="checks"><b style={{ fontSize: 14 }}>Amenities</b><div style={{ height: 8 }} />{AMENITIES.map(a => <label key={a}><input type="checkbox" checked={f.am.includes(a)} onChange={e => set({ am: e.target.checked ? [...f.am, a] : f.am.filter(x => x !== a) })} />{a}</label>)}</div>
        <button className="btn full" onClick={() => setF({ q: '', city: '', country: '', min: '', max: '', rating: 0, am: [] })}>Clear filters</button>
      </div>
      <div><div className="head" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>{rows.length} found</h2>
        <select style={{ width: 220 }} value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort order"><option value="price">Price: cheapest first</option><option value="priceDesc">Price: highest first</option><option value="rating">Rating: highest first</option></select></div>
        <div className="card">{rows.length === 0 && <p>No results. Try loosening a filter.</p>}
          {rows.map(h => <div className="item" key={h.id}><Thumb label="Photo" src={h.gallery[0]} /><div><b>{h.name}</b> <Pill s={h.status} /><p>{h.city} · {h.rating.toFixed(1)} ★ · {money(h.price)} / night</p></div><Link className="btn" to={`/guesthouses/${h.id}`}>Audit Listing</Link></div>)}</div></div>
    </div>
  </>)
}

function Detail() {
  const { id } = useParams(), nav = useNavigate()
  const h = useData(() => api.getGuesthouse(id!), [id])
  if (h === null) return <p>Loading…</p>
  const del = async () => { if (confirm(`Delete "${h.name}"? This cannot be undone.`)) { await api.deleteGuesthouse(h.id); nav('/guesthouses') } }
  const setStatus = async (s: Status) => { await api.saveGuesthouse({ ...h, status: s }); nav(0) }
  return (<>
    <div className="head"><div><h1>{h.name} <Pill s={h.status} /></h1><p>Guesthouse Ref: STH-{h.id.slice(-6).toUpperCase()} • Updated on {date(h.updatedAt)}</p></div>
      <div style={{ display: 'flex', gap: 8 }}>{h.status === 'Pending' && <button className="btn" onClick={() => setStatus('Active')}>Approve</button>}<button className="btn danger" onClick={del}>Delete</button><Link className="btn pri" to={`/guesthouses/${h.id}/edit`}>Edit Guesthouse</Link></div></div>
    <div className="grid two">
      <div className="grid">
        <div className="card"><h2>Property Media</h2><div className="thumbs"><Thumb label="Cover Logo" src={h.logo} />{Array.from({ length: Math.max(3, h.gallery.length) }, (_, i) => <Thumb key={i} label={`Photo ${i + 1}`} src={h.gallery[i]} />)}</div></div>
        <div className="card"><h2>Property Overview &amp; Rules</h2><p>{h.description}</p><div className="grid row2" style={{ marginTop: 16 }}><div><div className="lbl">House Rules</div><p>{h.rules || '–'}</p></div><div><div className="lbl">Room Count · Check-in</div><p>{h.rooms} rooms · {h.checkIn || '–'}</p></div></div></div>
        <div className="card"><h2>Location &amp; Coordinates</h2><b>{h.city}, {h.country}</b><p>Latitude {h.lat} · Longitude {h.lng}</p><p style={{ marginTop: 8 }}><a href={`https://www.google.com/maps?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer">Open in Google Maps</a></p></div>
      </div>
      <div className="grid">
        <div className="card"><h2>Listing Specifications</h2><div className="kv"><span>Base Price / Night</span><b>{money2(h.price)}</b></div><div className="kv"><span>Average Rating</span><b>{h.rating.toFixed(1)} ★</b></div><div className="kv"><span>Total Ratings</span><b>{h.ratingCount}</b></div></div>
        <div className="card"><h2>Amenities Verified</h2>{h.amenities.length ? h.amenities.map(a => <p key={a}>✓ {a}</p>) : <p>None listed.</p>}</div>
        <div className="card"><h2>Vetting &amp; Contact Info</h2><div className="lbl">Provider phone</div><p>{h.phone}</p><div className="lbl" style={{ marginTop: 10 }}>Provider email</div><p>{h.email}</p></div>
      </div>
    </div>
  </>)
}

const empty = (): Guesthouse => ({ id: '', name: '', gallery: [], description: '', amenities: [], lat: 0, lng: 0, price: 0, city: '', country: '', phone: '', email: '', rooms: 1, checkIn: '', rules: '', status: 'Pending', rating: 0, ratingCount: 0, updatedAt: '' })
const toUrl = (f: File) => new Promise<string>(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(f) })

function Form() {
  const { id } = useParams(), nav = useNavigate()
  const existing = useData(() => (id ? api.getGuesthouse(id) : Promise.resolve(empty())), [id])
  const [h, setH] = useState<Guesthouse | null>(null), [err, setErr] = useState('')
  useEffect(() => { if (existing) setH(existing) }, [existing])
  if (!h) return <p>Loading…</p>
  const set = (p: Partial<Guesthouse>) => setH({ ...h, ...p })
  const num = (k: 'lat' | 'lng' | 'price' | 'rooms') => <input type="number" step="any" required value={h[k]} onChange={e => set({ [k]: +e.target.value })} />
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!h.logo) return setErr('Upload a logo.')
    if (h.gallery.length === 0) return setErr('Upload at least one gallery image.')
    if (Math.abs(h.lat) > 90 || Math.abs(h.lng) > 180) return setErr('Coordinates are out of range.')
    const slug = h.id || h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
    const saved = await api.saveGuesthouse({ ...h, id: slug }); nav(`/guesthouses/${saved.id}/saved`, { state: { edit: !!id } })
  }
  return (
    <form onSubmit={submit}>
      <div className="head"><div><h1>{id ? 'Edit Guesthouse' : 'Submit Guesthouse Registry'}</h1><p>Fields are audited for geographic accuracy and administrative standards.</p></div>
        <div style={{ display: 'flex', gap: 8 }}><Link className="btn" to={id ? `/guesthouses/${id}` : '/guesthouses'}>Cancel</Link><button className="btn pri">Save Listing</button></div></div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="grid two"><div className="grid">
        <div className="card"><h2>Core Identity &amp; Info</h2>
          <label>Guesthouse name<input required value={h.name} onChange={e => set({ name: e.target.value })} /></label>
          <div className="grid row2"><label>City<input required value={h.city} onChange={e => set({ city: e.target.value })} /></label><label>Country<input required value={h.country} onChange={e => set({ country: e.target.value })} /></label></div>
          <div className="grid row3"><label>Price Per Night ($ USD)<input type="number" min="0" step="0.01" required value={h.price} onChange={e => set({ price: +e.target.value })} /></label><label>Rooms<input type="number" min="1" required value={h.rooms} onChange={e => set({ rooms: +e.target.value })} /></label><label>Check-in window<input value={h.checkIn} placeholder="14:00 - 20:00" onChange={e => set({ checkIn: e.target.value })} /></label></div></div>
        <div className="card"><h2>Upload Files &amp; Media</h2><div className="grid row2">
          <div><label>Primary logo (PNG or JPG, 2MB max)<input type="file" accept="image/png,image/jpeg" onChange={async e => { const f = e.target.files?.[0]; if (f) f.size > 2e6 ? setErr('Logo must be under 2MB.') : set({ logo: await toUrl(f) }) }} /></label><Thumb label="No logo" src={h.logo} /></div>
          <div><label>Gallery photos (5MB each)<input type="file" accept="image/png,image/jpeg" multiple onChange={async e => { const fs = Array.from(e.target.files ?? []).filter(f => f.size <= 5e6); set({ gallery: [...h.gallery, ...(await Promise.all(fs.map(toUrl)))] }) }} /></label>
            <div className="thumbs">{h.gallery.map((s, i) => <div key={i}><Thumb label="" src={s} /><button type="button" className="btn" style={{ padding: '2px 8px', marginTop: 4 }} onClick={() => set({ gallery: h.gallery.filter((_, j) => j !== i) })}>Remove</button></div>)}</div></div></div></div>
        <div className="card"><h2>Detailed Information</h2>
          <label>Description<textarea required rows={4} value={h.description} onChange={e => set({ description: e.target.value })} /></label>
          <label>House rules<input value={h.rules} onChange={e => set({ rules: e.target.value })} /></label></div>
      </div><div className="grid">
        <div className="card"><h2>Coordinates (Decimal)</h2><label>Latitude{num('lat')}</label><label>Longitude{num('lng')}</label><a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Find coordinates on Google Maps</a></div>
        <div className="card"><h2>Contact &amp; Status</h2><label>Phone<input required value={h.phone} onChange={e => set({ phone: e.target.value })} /></label><label>Email<input type="email" required value={h.email} onChange={e => set({ email: e.target.value })} /></label>
          <label>Status<select value={h.status} onChange={e => set({ status: e.target.value as Status })}>{['Pending', 'Active', 'Suspended'].map(s => <option key={s}>{s}</option>)}</select></label></div>
        <div className="card checks"><h2>Select Amenities</h2>{AMENITIES.map(a => <label key={a}><input type="checkbox" checked={h.amenities.includes(a)} onChange={e => set({ amenities: e.target.checked ? [...h.amenities, a] : h.amenities.filter(x => x !== a) })} />{a}</label>)}</div>
      </div></div>
    </form>
  )
}

function Saved() {
  const { id } = useParams(), h = useData(() => api.getGuesthouse(id!), [id])
  if (!h) return <p>Loading…</p>
  return (<div className="ok"><div className="tick">✓</div><h1>Guesthouse Registration Confirmed</h1><p className="sub">Reference ID: <b>STH-{h.id.slice(-6).toUpperCase()}</b></p>
    <div className="card" style={{ textAlign: 'left' }}><h2>Submitted Listing Summary</h2><div className="kv"><span>Property Name</span><b>{h.name}</b></div><div className="kv"><span>Target City</span><b>{h.city}</b></div><div className="kv"><span>Coordinates registered</span><b>{h.lat}, {h.lng}</b></div><div className="kv"><span>Designated Listing Price</span><b>{money(h.price)} / night</b></div>
      <p className="sub" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>{h.status === 'Pending' ? 'This item is now awaiting validation in the Moderation Queue. ' : ''}No payments are associated with this action.</p></div>
    <div className="btns"><Link className="btn pri" to={`/guesthouses/${h.id}`}>View Listing</Link><Link className="btn" to="/">Return to Dashboard</Link><Link className="btn" to="/guesthouses/new">Add Another Guesthouse</Link></div></div>)
}

function Admins() {
  const [n, setN] = useState(0), list = useData(api.listAdmins, [n]), [err, setErr] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const el = e.currentTarget, f = new FormData(el), pw = String(f.get('password'))
    if (pw.length < 8) return setErr('Password must be at least 8 characters.')
    if (pw !== f.get('confirm')) return setErr('Passwords do not match.')
    try { await api.createAdmin({ name: String(f.get('name')), email: String(f.get('email')).toLowerCase(), role: String(f.get('role')), password: pw }); setErr(''); el.reset(); setN(n + 1) } catch (x) { setErr((x as Error).message) }
  }
  return (<>
    <div className="head"><div><h1>Settings</h1><p>Manage admin accounts. Approve sign-up requests so new admins can log in.</p></div></div>
    <div className="grid two" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
      <div className="card tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{(list || []).map(a => <tr key={a.id}><td><b>{a.name}</b></td><td>{a.email}</td><td>{a.role}</td><td><Pill s={a.approved === false ? 'Pending' : 'Active'} /></td><td>{a.approved === false && <button className="btn" onClick={async () => { await api.approveAdmin(a.id); setN(n + 1) }}>Approve</button>}</td></tr>)}</tbody></table></div>
      <form className="card" onSubmit={submit}><h2>Add admin</h2>
        <label>Full name<input name="name" required /></label><label>Email Address<input name="email" type="email" required /></label><label>Role or title<input name="role" required placeholder="Operations Manager" /></label>
        <label>Password<input name="password" type="password" required /></label><label>Confirm password<input name="confirm" type="password" required /></label>
        {err && <p className="err" role="alert">{err}</p>}<button className="btn pri full">Create admin</button></form>
    </div>
  </>)
}

function RequestAccess() {
  const [err, setErr] = useState(''), [done, setDone] = useState(false)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget), pw = String(f.get('password'))
    if (pw.length < 8) return setErr('Password must be at least 8 characters.')
    if (pw !== f.get('confirm')) return setErr('Passwords do not match.')
    try { await api.requestAdmin({ name: String(f.get('name')), email: String(f.get('email')).toLowerCase(), role: String(f.get('role')), password: pw }); setDone(true) } catch (x) { setErr((x as Error).message) }
  }
  return (<div className="auth"><form className="card" onSubmit={submit}><h1>Create Admin Account</h1><p className="sub">Submit your profile details for system authorization</p>
    {done ? <p style={{ marginBottom: 16 }}>Request submitted. An existing admin must approve it in Settings before you can log in.</p> : <>
      <label>Full Name<input name="name" required placeholder="e.g. Sarah Connor" /></label><label>Email Address<input name="email" type="email" required placeholder="e.g. sarah@stayhaven.com" /></label>
      <label>Organizational Role / Title<input name="role" required placeholder="e.g. Operations Manager" /></label><label>Password<input name="password" type="password" required placeholder="Create robust password" /></label>
      <label>Confirm Password<input name="confirm" type="password" required placeholder="Repeat password" /></label>
      {err && <p className="err" role="alert">{err}</p>}<button className="btn pri full">Submit Account Request</button></>}
    <p className="sub" style={{ marginTop: 16, marginBottom: 0 }}>Already verified? <Link to="/"><b>Return to Login</b></Link></p></form></div>)
}

export default function App() {
  const [me, setMe] = useState<Admin | null>(api.me())
  if (!me) return <Routes><Route path="/request" element={<RequestAccess />} /><Route path="*" element={<Login onLogin={setMe} />} /></Routes>
  const logout = () => { api.logout(); setMe(null) }
  const page = (crumb: string, el: ReactNode) => <Shell me={me} onLogout={logout} crumb={crumb}>{el}</Shell>
  return (
    <Routes>
      <Route path="/" element={page('Dashboard', <Dashboard />)} />
      <Route path="/guesthouses" element={page('Guesthouse Management', <Listings />)} />
      <Route path="/guesthouses/new" element={page('Guesthouse Management / Create Listing Form', <Form />)} />
      <Route path="/guesthouses/:id" element={page('Guesthouse Management / Guesthouse Details', <Detail />)} />
      <Route path="/guesthouses/:id/edit" element={page('Guesthouse Management / Edit Listing', <Form />)} />
      <Route path="/guesthouses/:id/saved" element={page('Guesthouse Management / Submission Confirmed', <Saved />)} />
      <Route path="/search" element={page('Advanced Search', <Search />)} />
      <Route path="/moderation" element={page('Moderation Queue', <Moderation />)} />
      <Route path="/settings" element={page('Settings', <Admins />)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
