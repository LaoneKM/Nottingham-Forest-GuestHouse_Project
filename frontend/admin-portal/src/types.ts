export type Status = 'Active' | 'Pending' | 'Suspended'
export interface Guesthouse {
  id: string; name: string; logo?: string; gallery: string[]; description: string
  amenities: string[]; lat: number; lng: number; price: number; city: string; country: string
  phone: string; email: string; rooms: number; checkIn: string; rules: string
  status: Status; rating: number; ratingCount: number; updatedAt: string
}
export interface Admin { id: string; name: string; email: string; role: string; password: string; approved?: boolean }
export const AMENITIES = ['Wi-Fi', 'Swimming Pool', 'Full Kitchen', 'Secure Parking', 'Pet Friendly']
