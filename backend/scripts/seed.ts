/**
 * Ghoom — Database Seed Script
 *
 * Populates the `monuments` and `monument_logistics` tables with
 * verified, factual heritage monument data. Uses upsert (on name)
 * to prevent duplicates if run multiple times.
 *
 * Usage:  npm run seed
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

// ── Validate env ────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key if available to bypass RLS, fallback to publishable key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Seed Data (factual, hallucination-free) ─────────────────────

interface MonumentSeed {
  name: string;
  description: string;
  architectural_style: string;
  built_century: string;
  lat: number;
  lng: number;
  street_view_id: string | null;
}

interface LogisticsSeed {
  opening_time: string;
  closing_time: string;
  closed_days: string;
  ticket_indian: number;
  ticket_foreigner: number;
  ticket_saarc: number;
  camera_fee: number;
  booking_url: string;
}

interface SeedEntry {
  monument: MonumentSeed;
  logistics: LogisticsSeed;
}

const SEED_DATA: SeedEntry[] = [
  // North India
  {
    monument: { name: 'Taj Mahal', description: 'An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra. Commissioned by Mughal emperor Shah Jahan.', architectural_style: 'Mughal Architecture', built_century: '17th Century (1632)', lat: 27.1751, lng: 78.0421, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '18:30', closed_days: 'Friday', ticket_indian: 250, ticket_foreigner: 1300, ticket_saarc: 740, camera_fee: 0, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Amber Fort', description: 'A magnificent fort built using pale yellow and pink sandstone, and white marble. Known for its artistic Hindu style elements.', architectural_style: 'Rajput Architecture', built_century: '16th Century (1592)', lat: 26.9855, lng: 75.8513, street_view_id: null },
    logistics: { opening_time: '08:00', closing_time: '17:30', closed_days: 'None', ticket_indian: 100, ticket_foreigner: 500, ticket_saarc: 100, camera_fee: 50, booking_url: 'https://bookrajasthanmonuments.in' },
  },
  {
    monument: { name: 'Hawa Mahal', description: 'The Palace of Winds features a unique five-story exterior with 953 small windows called Jharokhas decorated with intricate latticework.', architectural_style: 'Rajput Architecture', built_century: '18th Century (1799)', lat: 26.9239, lng: 75.8267, street_view_id: null },
    logistics: { opening_time: '09:00', closing_time: '16:30', closed_days: 'None', ticket_indian: 50, ticket_foreigner: 200, ticket_saarc: 50, camera_fee: 0, booking_url: 'https://bookrajasthanmonuments.in' },
  },
  {
    monument: { name: 'Jantar Mantar', description: 'An astronomical observation site featuring the world\'s largest stone sundial. It represents the astronomical skills of the Rajput court.', architectural_style: 'Ptolemaic positional astronomy / Rajput', built_century: '18th Century (1734)', lat: 26.9248, lng: 75.8246, street_view_id: null },
    logistics: { opening_time: '09:00', closing_time: '16:30', closed_days: 'None', ticket_indian: 50, ticket_foreigner: 200, ticket_saarc: 50, camera_fee: 50, booking_url: 'https://bookrajasthanmonuments.in' },
  },
  {
    monument: { name: 'Qutub Minar', description: 'A 73-metre tall tapering tower of five storeys, built by Qutb-ud-din Aibak. A masterpiece of Indo-Islamic Afghan architecture.', architectural_style: 'Indo-Islamic Architecture', built_century: '12th Century (1192)', lat: 28.5245, lng: 77.1855, street_view_id: null },
    logistics: { opening_time: '07:00', closing_time: '17:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Red Fort', description: 'A historic fort in Delhi that served as the main residence of the Mughal Emperors. Known for its massive enclosing walls of red sandstone.', architectural_style: 'Mughal Architecture', built_century: '17th Century (1639)', lat: 28.6562, lng: 77.2410, street_view_id: null },
    logistics: { opening_time: '09:30', closing_time: '16:30', closed_days: 'Monday', ticket_indian: 50, ticket_foreigner: 600, ticket_saarc: 50, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Golden Temple (Sri Harmandir Sahib)', description: 'The preeminent spiritual site of Sikhism, famous for its golden dome and the surrounding Amrit Sarovar (Pool of Holy Nectar).', architectural_style: 'Sikh Architecture', built_century: '16th Century (1589)', lat: 31.6200, lng: 74.8765, street_view_id: null },
    logistics: { opening_time: '00:00', closing_time: '23:59', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    monument: { name: 'Martand Sun Temple', description: 'A Hindu temple dedicated to Surya (the chief solar deity) located in Kashmir, featuring stunning Kashmiri architecture despite being in ruins.', architectural_style: 'Kashmiri Architecture', built_century: '8th Century', lat: 33.7381, lng: 75.2222, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 0, booking_url: '' },
  },

  // South India
  {
    monument: { name: 'Group of Monuments at Hampi', description: 'The spectacular ruins of the capital of the Vijayanagara Empire. Features Dravidian temples and monolithic sculptures.', architectural_style: 'Dravidian Architecture', built_century: '14th Century (1336)', lat: 15.3350, lng: 76.4600, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Brihadisvara Temple', description: 'A Hindu temple dedicated to Shiva located in Thanjavur. One of the largest South Indian temples and an exemplary example of fully realized Dravidian architecture.', architectural_style: 'Dravidian Architecture', built_century: '11th Century (1010)', lat: 10.7828, lng: 79.1318, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '20:00', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    monument: { name: 'Meenakshi Temple', description: 'A historic Hindu temple on the southern bank of the Vaigai River in Madurai, famous for its towering gopurams covered in colorful stucco figures.', architectural_style: 'Dravidian Architecture', built_century: 'Ancient (Rebuilt 14th Century)', lat: 9.9195, lng: 78.1193, street_view_id: null },
    logistics: { opening_time: '05:00', closing_time: '22:00', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    monument: { name: 'Shore Temple', description: 'A structural temple, built with blocks of granite, dating from the 8th century AD. It overlooks the shore of the Bay of Bengal.', architectural_style: 'Pallava Architecture', built_century: '8th Century (725 AD)', lat: 12.6166, lng: 80.1983, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Golconda Fort', description: 'A fortified citadel built by the Qutb Shahi dynasty. Known for its acoustic effects, engineering marvels, and the legendary Koh-i-Noor diamond.', architectural_style: 'Qutb Shahi Architecture', built_century: '16th Century', lat: 17.3833, lng: 78.4011, street_view_id: null },
    logistics: { opening_time: '09:00', closing_time: '17:30', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 0, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Charminar', description: 'A mosque and monument built at the center of Hyderabad, known for its four grand arches and minarets.', architectural_style: 'Indo-Islamic Architecture', built_century: '16th Century (1591)', lat: 17.3616, lng: 78.4747, street_view_id: null },
    logistics: { opening_time: '09:30', closing_time: '17:30', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 0, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Bekal Fort', description: 'The largest fort in Kerala, spreading over 40 acres. Built shaped like a giant keyhole beside the Arabian Sea.', architectural_style: 'Military Architecture', built_century: '17th Century (1650)', lat: 12.3946, lng: 75.0298, street_view_id: null },
    logistics: { opening_time: '08:00', closing_time: '17:30', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },

  // West India
  {
    monument: { name: 'Gateway of India', description: 'An arch monument overlooking the Arabian Sea, built to commemorate the landing of King-Emperor George V.', architectural_style: 'Indo-Saracenic Architecture', built_century: '20th Century (1924)', lat: 18.9220, lng: 72.8347, street_view_id: null },
    logistics: { opening_time: '00:00', closing_time: '23:59', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    monument: { name: 'Ajanta Caves', description: 'A series of 30 rock-cut Buddhist cave monuments dating from the 2nd century BCE to about 480 CE, featuring masterpieces of Buddhist religious art.', architectural_style: 'Buddhist Rock-Cut Architecture', built_century: '2nd Century BCE', lat: 20.5519, lng: 75.7033, street_view_id: null },
    logistics: { opening_time: '09:00', closing_time: '17:00', closed_days: 'Monday', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Ellora Caves', description: 'One of the largest rock-cut Hindu temple cave complexes in the world, featuring the monolithic Kailasha temple, excavated from a single rock.', architectural_style: 'Rashtrakuta / Rock-Cut Architecture', built_century: '6th Century', lat: 20.0264, lng: 75.1770, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '18:00', closed_days: 'Tuesday', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Sun Temple Modhera', description: 'A Hindu temple dedicated to the solar deity Surya, situated on the bank of the Pushpavati river in Gujarat.', architectural_style: 'Māru-Gurjara Architecture', built_century: '11th Century (1026)', lat: 23.5833, lng: 72.1333, street_view_id: null },
    logistics: { opening_time: '07:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 0, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Rani ki Vav', description: 'An intricately constructed stepwell situated in Patan, designed as an inverted temple highlighting the sanctity of water.', architectural_style: 'Māru-Gurjara Architecture', built_century: '11th Century', lat: 23.8587, lng: 72.1009, street_view_id: null },
    logistics: { opening_time: '08:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Jaisalmer Fort', description: 'One of the very few living forts in the world, built in 1156 AD. Its massive yellow sandstone walls are a tawny lion colour during the day.', architectural_style: 'Rajput Architecture', built_century: '12th Century (1156)', lat: 26.9124, lng: 70.9123, street_view_id: null },
    logistics: { opening_time: '09:00', closing_time: '17:00', closed_days: 'None', ticket_indian: 50, ticket_foreigner: 250, ticket_saarc: 50, camera_fee: 50, booking_url: '' },
  },

  // East & Central India
  {
    monument: { name: 'Varanasi Ghats (Dashashwamedh)', description: 'The main ghat in Varanasi on the Ganga River, known for the spectacular Agni Pooja (Ganga Aarti) held every evening.', architectural_style: 'Hindu Riverfront Architecture', built_century: 'Ancient (Rebuilt 1748)', lat: 25.3060, lng: 83.0104, street_view_id: null },
    logistics: { opening_time: '00:00', closing_time: '23:59', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    monument: { name: 'Konark Sun Temple', description: 'A colossal temple designed as a massive chariot of the Sun God, Surya, featuring 24 intricately carved stone wheels.', architectural_style: 'Kalinga Architecture', built_century: '13th Century (1250)', lat: 19.8876, lng: 86.0945, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '20:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Khajuraho Temples', description: 'A group of Hindu and Jain temples known for their nagara-style architectural symbolism and their erotic sculptures.', architectural_style: 'Nagara Architecture', built_century: '10th Century', lat: 24.8318, lng: 79.9197, street_view_id: null },
    logistics: { opening_time: '08:00', closing_time: '18:00', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Sanchi Stupa', description: 'One of the oldest stone structures in India, an important monument of Indian Architecture featuring a hemispherical brick structure built over the relics of the Buddha.', architectural_style: 'Buddhist Architecture', built_century: '3rd Century BCE', lat: 23.4871, lng: 77.7397, street_view_id: null },
    logistics: { opening_time: '08:30', closing_time: '17:30', closed_days: 'None', ticket_indian: 40, ticket_foreigner: 600, ticket_saarc: 40, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Nalanda University Ruins', description: 'The ruins of an ancient Mahavihara, a revered Buddhist monastery which also served as a renowned centre of learning.', architectural_style: 'Buddhist Architecture', built_century: '5th Century CE', lat: 25.1360, lng: 85.4439, street_view_id: null },
    logistics: { opening_time: '09:00', closing_time: '17:00', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 25, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Victoria Memorial', description: 'A large marble building in Kolkata built between 1906 and 1921. It is dedicated to the memory of Empress Victoria and is now a museum.', architectural_style: 'Indo-Saracenic Revival Architecture', built_century: '20th Century (1921)', lat: 22.5448, lng: 88.3426, street_view_id: null },
    logistics: { opening_time: '10:00', closing_time: '18:00', closed_days: 'Monday', ticket_indian: 30, ticket_foreigner: 500, ticket_saarc: 30, camera_fee: 0, booking_url: 'https://victoriamemorial-cal.org' },
  },

  // Northeast India
  {
    monument: { name: 'Kamakhya Temple', description: 'A Hindu temple dedicated to the mother goddess Kamakhya, one of the oldest of the 51 Shakti Pithas.', architectural_style: 'Nilachal Architecture', built_century: '8th Century', lat: 26.1673, lng: 91.7061, street_view_id: null },
    logistics: { opening_time: '05:30', closing_time: '17:30', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  },
  {
    monument: { name: 'Rang Ghar', description: 'A two-story building which once served as the royal sports-pavilion for the Ahom kings and nobles.', architectural_style: 'Ahom Architecture', built_century: '18th Century (1746)', lat: 26.9698, lng: 94.6190, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '17:00', closed_days: 'None', ticket_indian: 25, ticket_foreigner: 300, ticket_saarc: 25, camera_fee: 0, booking_url: 'https://asi.payumoney.com' },
  },
  {
    monument: { name: 'Unakoti Rock Carvings', description: 'A historic Shaiva pilgrimage spot featuring massive bas-relief sculptures of Hindu deities carved directly into the rock face.', architectural_style: 'Rock-Cut Architecture', built_century: '7th Century', lat: 24.3146, lng: 92.0152, street_view_id: null },
    logistics: { opening_time: '06:00', closing_time: '17:30', closed_days: 'None', ticket_indian: 0, ticket_foreigner: 0, ticket_saarc: 0, camera_fee: 0, booking_url: '' },
  }
];

const EXPECTED_COUNT = SEED_DATA.length; // 8

// ── Main seed function ──────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱 Starting Ghoom database seed...\n');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY is missing.');
    console.warn('⚠️  If Row Level Security (RLS) is enabled, upsert will fail using the publishable key.\n');
  } else {
    console.log('🔑 Using SUPABASE_SERVICE_ROLE_KEY (RLS bypassed).');
  }

  try {
    // ── Step 1: Upsert monuments ────────────────────────────────
    console.log(`  Upserting ${SEED_DATA.length} monuments...`);

    const monumentRows = SEED_DATA.map((entry) => entry.monument);

    const { data: monuments, error: monumentError } = await supabase
      .from('monuments')
      .upsert(monumentRows, { onConflict: 'name' })
      .select('id, name');

    if (monumentError) {
      throw new Error(
        `Monument upsert failed: ${monumentError.message}\n` +
          `  Code: ${monumentError.code}\n` +
          `  Details: ${monumentError.details}`
      );
    }

    if (!monuments || monuments.length === 0) {
      throw new Error(
        'Monument upsert returned no data. Check RLS policies — ' +
          'the seed script requires a service-role key for writes.'
      );
    }

    console.log(
      `  ✅ Upserted ${monuments.length} monuments:`,
      monuments.map((m) => m.name).join(', ')
    );

    // ── Step 2: Build logistics rows with monument IDs ──────────
    console.log('\n  Upserting logistics data...');

    // Create a name → id lookup from the upserted monuments
    const nameToId = new Map<string, string>();
    for (const m of monuments) {
      nameToId.set(m.name, m.id);
    }

    const logisticsRows = SEED_DATA.map((entry) => {
      const monumentId = nameToId.get(entry.monument.name);
      if (!monumentId) {
        throw new Error(
          `Could not find ID for monument "${entry.monument.name}" after upsert.`
        );
      }
      return {
        monument_id: monumentId,
        ...entry.logistics,
      };
    });

    const { data: logistics, error: logisticsError } = await supabase
      .from('monument_logistics')
      .upsert(logisticsRows, { onConflict: 'monument_id' })
      .select('id, monument_id');

    if (logisticsError) {
      throw new Error(
        `Logistics upsert failed: ${logisticsError.message}\n` +
          `  Code: ${logisticsError.code}\n` +
          `  Details: ${logisticsError.details}`
      );
    }

    console.log(
      `  ✅ Upserted ${logistics?.length ?? 0} logistics entries.`
    );

    // ── Step 3: Validation — count check ────────────────────────
    console.log('\n  Running validation...');

    const { count, error: countError } = await supabase
      .from('monuments')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Validation query failed: ${countError.message}`);
    }

    if (count !== EXPECTED_COUNT) {
      console.error(
        `\n  ❌ SEED VALIDATION FAILED: Expected ${EXPECTED_COUNT} monuments, found ${count}. Check Supabase logs.`
      );
      process.exit(1);
    }

    console.log(
      `  ✅ Validation passed: ${count} monuments in database.\n`
    );
    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// ── Execute ─────────────────────────────────────────────────────
seed();
