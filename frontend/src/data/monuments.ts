export interface Logistics {
  opening_time: string;
  closing_time: string;
  closed_days: string;
  ticket_indian: number;
  ticket_foreigner: number;
  ticket_saarc: number;
  camera_fee: number;
  booking_url: string;
}

export interface Monument {
  id: string; // fallback string id
  name: string;
  description: string;
  architectural_style: string;
  built_century: string;
  lat: number;
  lng: number;
  street_view_id: string | null;
  logistics: Logistics;
}

export const ALL_MONUMENTS: Monument[] = [
  {
    id: "amber-fort",
    name: 'Amber Fort',
    description: 'A magnificent fort built using pale yellow and pink sandstone, and white marble. It served as the main residence of the Rajput Maharajas and their families.',
    architectural_style: 'Rajput Architecture',
    built_century: '16th Century (1592)',
    lat: 26.9855,
    lng: 75.8513,
    street_view_id: null,
    logistics: { opening_time: '08:00', closing_time: '17:30', closed_days: 'None', ticket_indian: 100, ticket_foreigner: 500, ticket_saarc: 100, camera_fee: 50, booking_url: 'https://bookrajasthanmonuments.in' },
  },
  {
    id: "hawa-mahal",
    name: 'Hawa Mahal',
    description: 'The Palace of Winds, built with red and pink sandstone. It features a unique five-story exterior with 953 small windows called Jharokhas decorated with intricate latticework.',
    architectural_style: 'Rajput Architecture',
    built_century: '18th Century (1799)',
    lat: 26.9239,
    lng: 75.8267,
    street_view_id: null,
    logistics: { opening_time: '09:00', closing_time: '16:30', closed_days: 'None', ticket_indian: 50, ticket_foreigner: 200, ticket_saarc: 50, camera_fee: 0, booking_url: 'https://bookrajasthanmonuments.in' },
  },
  {
    id: "jantar-mantar",
    name: 'Jantar Mantar',
    description: 'An astronomical observation site consisting of 19 major geometric devices for measuring time, predicting eclipses, and tracking stars. It features the world\'s largest stone sundial.',
    architectural_style: 'Ptolemaic positional astronomy / Rajput',
    built_century: '18th Century (1734)',
    lat: 26.9248,
    lng: 75.8246,
    street_view_id: '524874391837352',
    logistics: { opening_time: '09:00', closing_time: '16:30', closed_days: 'None', ticket_indian: 50, ticket_foreigner: 200, ticket_saarc: 50, camera_fee: 50, booking_url: 'https://bookrajasthanmonuments.in' },
  },
  {
    id: "taj-mahal",
    name: 'Taj Mahal',
    description: 'An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra. Commissioned by Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal.',
    architectural_style: 'Mughal Architecture',
    built_century: '17th Century (1632)',
    lat: 27.1751,
    lng: 78.0421,
    street_view_id: '944786032998308',
    logistics: { opening_time: '06:00', closing_time: '18:30', closed_days: 'Friday', ticket_indian: 250, ticket_foreigner: 1300, ticket_saarc: 740, camera_fee: 0, booking_url: 'https://asi.payumoney.com' },
  },
  {
    id: "hampi",
    name: 'Group of Monuments at Hampi',
    description: 'The spectacular ruins of the capital of the Vijayanagara Empire. Features Dravidian temples, monolithic sculptures, and the famous stone chariot set against a boulder-strewn landscape.',
    architectural_style: 'Dravidian / Vijayanagara Architecture',
    built_century: '14th Century (1336)',
    lat: 15.3350,
    lng: 76.4600,
    street_view_id: null,
    logistics: { opening_time: '06:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    id: "varanasi-ghats",
    name: 'Varanasi Ghats (Dashashwamedh)',
    description: 'The main ghat in Varanasi on the Ganga River, known for the spectacular Agni Pooja (Ganga Aarti) held every evening. A deeply spiritual site of continuous worship for millennia.',
    architectural_style: 'Hindu Riverfront Architecture',
    built_century: 'Ancient (Rebuilt 1748)',
    lat: 25.3060,
    lng: 83.0104,
    street_view_id: null,
    logistics: { opening_time: '00:00', closing_time: '23:59', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    id: "konark-sun-temple",
    name: 'Konark Sun Temple',
    description: 'A colossal temple designed as a massive chariot of the Sun God, Surya, featuring 24 intricately carved stone wheels drawn by 7 horses.',
    architectural_style: 'Kalinga Architecture',
    built_century: '13th Century (1250)',
    lat: 19.8876,
    lng: 86.0945,
    street_view_id: null,
    logistics: { opening_time: '06:00', closing_time: '20:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    id: "gateway-of-india",
    name: 'Gateway of India',
    description: 'An arch monument overlooking the Arabian Sea, built to commemorate the landing of King-Emperor George V. It seamlessly blends Hindu and Muslim architectural styles.',
    architectural_style: 'Indo-Saracenic Architecture',
    built_century: '20th Century (1924)',
    lat: 18.9220,
    lng: 72.8347,
    street_view_id: null,
    logistics: { opening_time: '00:00', closing_time: '23:59', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
];

import { supabase } from '../lib/supabase';

export async function fetchMonuments(): Promise<Monument[]> {
  try {
    // 1. Try Supabase
    const { data: monumentsData, error } = await supabase
      .from('monuments')
      .select('*, monument_logistics(*)');
      
    if (!error && monumentsData && monumentsData.length > 0) {
      return monumentsData.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description || 'A historically significant monument protected by the Archaeological Survey of India.',
        architectural_style: m.architectural_style || 'Heritage Architecture',
        built_century: m.built_century || 'Historic',
        lat: m.lat,
        lng: m.lng,
        street_view_id: m.street_view_id,
        logistics: m.monument_logistics?.[0] || ALL_MONUMENTS.find(f => f.name === m.name)?.logistics
      }));
    }
  } catch (e) {
    console.warn("Supabase failed, falling back to local data", e);
  }

  // 2. Try Backend API
  try {
    const res = await fetch('/api/monuments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Backend API failed, using bundled data", e);
  }

  // 3. Bundled Fallback
  return ALL_MONUMENTS;
}
