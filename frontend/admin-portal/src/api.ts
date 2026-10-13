// Service layer: swap the bodies of these functions for real backend calls (fetch/Firebase/etc.).
import { Admin, Guesthouse } from './types'

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T } catch { return d } }
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))
const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString()
const g = (id: string, name: string, city: string, price: number, rating: number, status: Guesthouse['status'], n: number, lat: number, lng: number): Guesthouse => ({
  id, name, city, country: 'South Africa', price, rating, ratingCount: 40 + n * 11, status, lat, lng, gallery: [],
  description: `A welcoming guesthouse in ${city} with easy access to local attractions.`, amenities: ['Wi-Fi', 'Secure Parking'],
  phone: '+27 31 555 0192', email: `contact@${id}.co.za`, rooms: 6, checkIn: '14:00 - 20:00', rules: 'No smoking. Quiet hours after 22:00.', updatedAt: day(n)
})
const seed: Guesthouse[] = [
  g('urban-view', 'Urban View Boutique', 'Durban', 95, 4.7, 'Active', 1, -29.8587, 31.0218),
  g('majestic-cliff', 'The Majestic Cliff', 'Cape Town', 210, 4.9, 'Active', 2, -33.9249, 18.4241),
  g('serene-garden', 'Serene Garden Hideaway', 'Pretoria', 85, 4.2, 'Pending', 3, -25.7479, 28.2293),
  g('breezy-palms', 'Breezy Palms Suite', 'Port Elizabeth', 120, 4.5, 'Active', 5, -33.9608, 25.6022),
  g('valley-peak', 'Valley Mountain Peak', 'Drakensberg', 165, 4.8, 'Suspended', 9, -28.7, 29.2),
  g('table-vista', 'Table Mountain Vista', 'Cape Town', 180, 4.8, 'Active', 4, -33.95, 18.42)
]
const seedAdmin: Admin = { id: 'a1', name: 'Admin User', email: 'admin@stayhaven.com', role: 'Super Admin', password: 'admin123' }
const wait = <T,>(v: T) => new Promise<T>(r => setTimeout(() => r(v), 120))

export const api = {
  async login(email: string, password: string) {
    const a = read<Admin[]>('sh_admins', [seedAdmin]).find(x => x.email === email.trim().toLowerCase() && x.password === password)
    if (!a) throw new Error('Incorrect email or password.')
    if (a.approved === false) throw new Error('Your account is awaiting approval by an existing admin.')
    write('sh_session', a.id); return wait(a)
  },
  logout() { localStorage.removeItem('sh_session') },
  me(): Admin | null { const id = read<string>('sh_session', ''); return read<Admin[]>('sh_admins', [seedAdmin]).find(a => a.id === id) || null },
  listAdmins: () => wait(read<Admin[]>('sh_admins', [seedAdmin])),
  async requestAdmin(a: Omit<Admin, 'id' | 'approved'>) {
    const all = read<Admin[]>('sh_admins', [seedAdmin])
    if (all.some(x => x.email === a.email)) throw new Error('An account with this email already exists.')
    write('sh_admins', [...all, { ...a, approved: false, id: crypto.randomUUID() }]); return wait(true)
  },
  async approveAdmin(id: string) { write('sh_admins', read<Admin[]>('sh_admins', [seedAdmin]).map(x => (x.id === id ? { ...x, approved: true } : x))); return wait(true) },
  async createAdmin(a: Omit<Admin, 'id'>) {
    const all = read<Admin[]>('sh_admins', [seedAdmin])
    if (all.some(x => x.email === a.email)) throw new Error('An admin with this email already exists.')
    write('sh_admins', [...all, { ...a, approved: true, id: crypto.randomUUID() }]); return wait(true)
  },
  listGuesthouses: () => wait(read<Guesthouse[]>('sh_houses', seed)),
  async getGuesthouse(id: string) { return wait(read<Guesthouse[]>('sh_houses', seed).find(x => x.id === id) || null) },
  async saveGuesthouse(h: Guesthouse) {
    const all = read<Guesthouse[]>('sh_houses', seed)
    const rec = { ...h, updatedAt: new Date().toISOString() }
    write('sh_houses', all.some(x => x.id === h.id) ? all.map(x => (x.id === h.id ? rec : x)) : [rec, ...all]); return wait(rec)
  },
  async deleteGuesthouse(id: string) { write('sh_houses', read<Guesthouse[]>('sh_houses', seed).filter(x => x.id !== id)); return wait(true) }
}
