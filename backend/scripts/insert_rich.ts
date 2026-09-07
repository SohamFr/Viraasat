import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

const ALL_MONUMENTS = [
  {
    name: 'Amber Fort',
    description: 'A magnificent fort built using pale yellow and pink sandstone, and white marble. It served as the main residence of the Rajput Maharajas and their families.',
    architectural_style: 'Rajput Architecture',
    built_century: '16th Century (1592)',
    lat: 26.9855,
    lng: 75.8513,
  },
  {
    name: 'Hawa Mahal',
    description: 'The Palace of Winds, built with red and pink sandstone. It features a unique five-story exterior with 953 small windows called Jharokhas decorated with intricate latticework.',
    architectural_style: 'Rajput Architecture',
    built_century: '18th Century (1799)',
    lat: 26.9239,
    lng: 75.8267,
  },
  {
    name: 'Jantar Mantar',
    description: 'An astronomical observation site consisting of 19 major geometric devices for measuring time, predicting eclipses, and tracking stars. It features the world\'s largest stone sundial.',
    architectural_style: 'Ptolemaic positional astronomy / Rajput',
    built_century: '18th Century (1734)',
    street_view_id: '524874391837352',
    lat: 26.9248,
    lng: 75.8246,
  },
  {
    name: 'Taj Mahal',
    description: 'An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra. Commissioned by Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal.',
    architectural_style: 'Mughal Architecture',
    built_century: '17th Century (1632)',
    street_view_id: '944786032998308',
    lat: 27.1751,
    lng: 78.0421,
  },
  {
    name: 'Group of Monuments at Hampi',
    description: 'The spectacular ruins of the capital of the Vijayanagara Empire. Features Dravidian temples, monolithic sculptures, and the famous stone chariot set against a boulder-strewn landscape.',
    architectural_style: 'Dravidian / Vijayanagara Architecture',
    built_century: '14th Century (1336)',
    lat: 15.3350,
    lng: 76.4600,
  },
  {
    name: 'Varanasi Ghats (Dashashwamedh)',
    description: 'The main ghat in Varanasi on the Ganga River, known for the spectacular Agni Pooja (Ganga Aarti) held every evening. A deeply spiritual site of continuous worship for millennia.',
    architectural_style: 'Hindu Riverfront Architecture',
    built_century: 'Ancient (Rebuilt 1748)',
    lat: 25.3060,
    lng: 83.0104,
  },
  {
    name: 'Konark Sun Temple',
    description: 'A colossal temple designed as a massive chariot of the Sun God, Surya, featuring 24 intricately carved stone wheels drawn by 7 horses.',
    architectural_style: 'Kalinga Architecture',
    built_century: '13th Century (1250)',
    lat: 19.8876,
    lng: 86.0945,
  },
  {
    name: 'Gateway of India',
    description: 'An arch monument overlooking the Arabian Sea, built to commemorate the landing of King-Emperor George V. It seamlessly blends Hindu and Muslim architectural styles.',
    architectural_style: 'Indo-Saracenic Architecture',
    built_century: '20th Century (1924)',
    lat: 18.9220,
    lng: 72.8347,
  },
];

async function seedRichMonuments() {
  console.log("Upserting rich monument data...");
  const { error } = await supabase.from('monuments').upsert(ALL_MONUMENTS, { onConflict: 'name', ignoreDuplicates: false });
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log("Successfully updated rich monument data.");
  }
}

seedRichMonuments();
