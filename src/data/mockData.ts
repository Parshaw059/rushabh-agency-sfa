import { Company, Product, Trip, Dukan, User, Order } from '@/types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-salesman-hiren',
    name: 'Hiren Shah (Sales Officer)',
    role: 'SALESMAN',
    phone: '9825012345',
    username: 'hiren',
    pin: '1234',
    password: '1234',
    assignedTripId: 'trip-nandesari',
    assignedTripName: 'Nandesari Beat'
  },
  {
    id: 'user-owner-1',
    name: 'Rushabh Agency (Owner / Admin Desk)',
    role: 'OWNER',
    phone: '8128232377',
    username: 'owner',
    pin: '9999',
    password: '9999'
  }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-nandesari',
    name: 'Nandesari Beat',
    beatCode: 'BEAT-NAN-01',
    area: 'Nandesari GIDC & Main Village',
    dukanCount: 4,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-undera',
    name: 'Undera Beat',
    beatCode: 'BEAT-UND-02',
    area: 'Undera Village & Refinery Road',
    dukanCount: 3,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-bajwa',
    name: 'Bajwa Beat',
    beatCode: 'BEAT-BAJ-03',
    area: 'Bajwa Main Bazar & Station Road',
    dukanCount: 4,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-bajwa-koyli',
    name: 'Bajwa-Koyli Beat',
    beatCode: 'BEAT-BKY-04',
    area: 'Bajwa-Koyli Link Road & IOCL Gate',
    dukanCount: 3,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-waghodiya',
    name: 'Waghodiya Beat',
    beatCode: 'BEAT-WAG-05',
    area: 'Waghodiya Town & GIDC Industrial',
    dukanCount: 4,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-jarod',
    name: 'Jarod Beat',
    beatCode: 'BEAT-JAR-06',
    area: 'Jarod Cross Road & Market Yard',
    dukanCount: 3,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-chhani',
    name: 'Chhani Beat',
    beatCode: 'BEAT-CHN-07',
    area: 'Chhani Jakat Naka & Canal Road',
    dukanCount: 4,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-sakarda-padamla',
    name: 'Sakarda-Padamla Beat',
    beatCode: 'BEAT-SKP-08',
    area: 'Sakarda-Padamla Highway Corridor',
    dukanCount: 3,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  },
  {
    id: 'trip-dashrath-ranoli',
    name: 'Dashrath-Ranoli Beat',
    beatCode: 'BEAT-DSR-09',
    area: 'Dashrath Village & Ranoli Station Area',
    dukanCount: 18,
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah'
  }
];

export const INITIAL_DUKANS: Dukan[] = [
  // 1. Nandesari Beat Dukans
  {
    id: 'duk-nan-101',
    shopName: 'Shree Ganesh Kirana & General Store',
    ownerName: 'Gopalbhai Shah',
    phone: '9426098765',
    tripId: 'trip-nandesari',
    address: 'Near Nandesari GIDC Gate No. 1, Main Road',
    gstNumber: '24AAAAA0000A1Z5',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-nan-102',
    shopName: 'Mahavir Provision Store',
    ownerName: 'Pravinbhai Mehta',
    phone: '9898011223',
    tripId: 'trip-nandesari',
    address: 'Nandesari Gram Panchayat Chowk',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-nan-103',
    shopName: 'Chamunda Daily Needs',
    ownerName: 'Dineshbhai Patel',
    phone: '9723044556',
    tripId: 'trip-nandesari',
    address: 'Station Road, Nandesari',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-nan-104',
    shopName: 'Jai Ambey Super Market',
    ownerName: 'Mukeshbhai Prajapati',
    phone: '9824055667',
    tripId: 'trip-nandesari',
    address: 'GIDC Colony, Nandesari',
    visitStatus: 'PENDING'
  },

  // 2. Undera Beat Dukans
  {
    id: 'duk-und-201',
    shopName: 'Krishna Provision Stores',
    ownerName: 'Kiritbhai Shah',
    phone: '9712345678',
    tripId: 'trip-undera',
    address: 'Undera Main Road Near Bus Stand',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-und-202',
    shopName: 'Radhe Radhe Kirana Store',
    ownerName: 'Ashokbhai Patel',
    phone: '9825123456',
    tripId: 'trip-undera',
    address: 'Refinery Road, Undera',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-und-203',
    shopName: 'Shubh Laxmi Super Store',
    ownerName: 'Sanjaybhai Modi',
    phone: '9879034567',
    tripId: 'trip-undera',
    address: 'Opposite Primary School, Undera',
    visitStatus: 'PENDING'
  },

  // 3. Bajwa Beat Dukans
  {
    id: 'duk-baj-301',
    shopName: 'Balaji Tea & Provision',
    ownerName: 'Vijaybhai Shah',
    phone: '9898077889',
    tripId: 'trip-bajwa',
    address: 'Station Road, Bajwa',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-baj-302',
    shopName: 'New Gujarat Provision',
    ownerName: 'Hiteshbhai Dave',
    phone: '9898056789',
    tripId: 'trip-bajwa',
    address: 'Main Bazar, Bajwa',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-baj-303',
    shopName: 'Jai Jalaram Super Store',
    ownerName: 'Bharatbhai Thakkar',
    phone: '9427066778',
    tripId: 'trip-bajwa',
    address: 'Tower Chowk, Bajwa Bazar',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-baj-304',
    shopName: 'Shiv Shakti General Stores',
    ownerName: 'Nareshbhai',
    phone: '9426090123',
    tripId: 'trip-bajwa',
    address: 'Near Railway Crossing, Bajwa',
    visitStatus: 'PENDING'
  },

  // 4. Bajwa-Koyli Beat Dukans
  {
    id: 'duk-bky-401',
    shopName: 'IOCL Gate Provision Store',
    ownerName: 'Rameshbhai Parmar',
    phone: '9712078901',
    tripId: 'trip-bajwa-koyli',
    address: 'Opposite Koyli Refinery Main Gate',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-bky-402',
    shopName: 'Maruti Nandan Kirana',
    ownerName: 'Kishorebhai Shah',
    phone: '9825067890',
    tripId: 'trip-bajwa-koyli',
    address: 'Bajwa-Koyli Link Road',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-bky-403',
    shopName: 'Koyli Village Super Mart',
    ownerName: 'Prakashbhai Solanki',
    phone: '9898089012',
    tripId: 'trip-bajwa-koyli',
    address: 'Koyli Gram Panchayat Chowk',
    visitStatus: 'PENDING'
  },

  // 5. Waghodiya Beat Dukans
  {
    id: 'duk-wag-501',
    shopName: 'Waghodiya Super Market',
    ownerName: 'Bipenbhai Patel',
    phone: '9428045678',
    tripId: 'trip-waghodiya',
    address: 'Tower Chowk, Waghodiya Town',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-wag-502',
    shopName: 'Parul Road Provision Store',
    ownerName: 'Sunilbhai Shah',
    phone: '9824001234',
    tripId: 'trip-waghodiya',
    address: 'Near Parul University Cross Road',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-wag-503',
    shopName: 'GIDC Daily Needs & Tea',
    ownerName: 'Nitinbhai Panchal',
    phone: '9825098712',
    tripId: 'trip-waghodiya',
    address: 'GIDC Estate Gate, Waghodiya',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-wag-504',
    shopName: 'Navchetan Provision',
    ownerName: 'Manishbhai Rawal',
    phone: '9898034125',
    tripId: 'trip-waghodiya',
    address: 'College Road, Waghodiya',
    visitStatus: 'PENDING'
  },

  // 6. Jarod Beat Dukans
  {
    id: 'duk-jar-601',
    shopName: 'Jarod Cross Road Mart',
    ownerName: 'Amrutbhai Patel',
    phone: '9712045612',
    tripId: 'trip-jarod',
    address: 'Jarod Cross Road, Halol Highway',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-jar-602',
    shopName: 'Sardar Kirana Stores',
    ownerName: 'Girishbhai Dave',
    phone: '9825067123',
    tripId: 'trip-jarod',
    address: 'Jarod Main Bazar',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-jar-603',
    shopName: 'Gayatri Provision',
    ownerName: 'Kamleshbhai Sharma',
    phone: '9898012398',
    tripId: 'trip-jarod',
    address: 'Near Bus Stand, Jarod',
    visitStatus: 'PENDING'
  },

  // 7. Chhani Beat Dukans
  {
    id: 'duk-chn-701',
    shopName: 'Chhani Jakat Naka Provision',
    ownerName: 'Pareshbhai Shah',
    phone: '9426034567',
    tripId: 'trip-chhani',
    address: 'Chhani Jakat Naka Circle',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-chn-702',
    shopName: 'Canal Road Super Market',
    ownerName: 'Chetanbhai Patel',
    phone: '9825045678',
    tripId: 'trip-chhani',
    address: 'Near Canal Road, Chhani',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-chn-703',
    shopName: 'Poonam Daily Needs',
    ownerName: 'Vinodbhai Soni',
    phone: '9898056712',
    tripId: 'trip-chhani',
    address: 'Chhani Gam Main Road',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-chn-704',
    shopName: 'Guru Krupa Kirana',
    ownerName: 'Nileshbhai Prajapati',
    phone: '9712067890',
    tripId: 'trip-chhani',
    address: 'TP 13 Road, Chhani',
    visitStatus: 'PENDING'
  },

  // 8. Sakarda-Padamla Beat Dukans
  {
    id: 'duk-skp-801',
    shopName: 'Highway Star Super Store',
    ownerName: 'Rajeshbhai Mehta',
    phone: '9825089012',
    tripId: 'trip-sakarda-padamla',
    address: 'NH 48 Sakarda Toll Plaza Corner',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-skp-802',
    shopName: 'Padamla Village Provision',
    ownerName: 'Maheshbhai Vaghela',
    phone: '9898090123',
    tripId: 'trip-sakarda-padamla',
    address: 'Padamla Main Chowk',
    visitStatus: 'PENDING'
  },
  {
    id: 'duk-skp-803',
    shopName: 'Sakarda Gam Daily Mart',
    ownerName: 'Hasmukhbhai Patel',
    phone: '9426012345',
    tripId: 'trip-sakarda-padamla',
    address: 'Sakarda Bus Stand Main Road',
    visitStatus: 'PENDING'
  },

    // 9. Dashrath-Ranoli Beat Dukans (The 18 Real Retailers)
  {
    id: "duk-custom-1789893472983",
    shopName: "KIRTI PRO STORES",
    ownerName: "N/A",
    phone: "0000000000",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893502514",
    shopName: "KALA KATLARI",
    ownerName: "N/A",
    phone: "0000000000",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893547530",
    shopName: "BHAVANI PRO STORES",
    ownerName: "N/A",
    phone: "0000000000",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI STATION,BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893616369",
    shopName: "GAYATRI MEDICAL STORES",
    ownerName: "N/A",
    phone: "7383277567",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI,BARODA",
    gstNumber: "24AAXPT4338D1ZC",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893664068",
    shopName: "DWARKESH GEN STORES",
    ownerName: "N/A",
    phone: "8000828829",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI NR,SHITAL PRO, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893686584",
    shopName: "RAJU PAN",
    ownerName: "N/A",
    phone: "0000000000",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, GAM",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893723852",
    shopName: "HARIOM PRO STORES",
    ownerName: "N/A",
    phone: "8734891232",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893777535",
    shopName: "SANTI KIRANA STORES",
    ownerName: "N/A",
    phone: "9725246937",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    gstNumber: "24ATQPM3855L",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893808885",
    shopName: "SHIV SHAKTI MEDICAL STORES",
    ownerName: "N/A",
    phone: "0000000000",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, GAM",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893832584",
    shopName: "SANKAR PRO STORES",
    ownerName: "N.A",
    phone: "0000000000",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893869169",
    shopName: "UJALA PRO STORES",
    ownerName: "N/A",
    phone: "9824317280",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893924535",
    shopName: "ASHAPURA MEDICAL STORES(VASAD)",
    ownerName: "N/A",
    phone: "0000090909",
    tripId: "trip-dashrath-ranoli",
    address: "VASAD GAM G,12 TARAPUR HIGHWAY BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893955853",
    shopName: "AMBIKA GEN STORES",
    ownerName: "ASHOKBHAI",
    phone: "0909090909",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, GAM",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789893995184",
    shopName: "POOJA PRO STORES",
    ownerName: "N/A",
    phone: "9099620393",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI DHAVAL CINEMA, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789894037984",
    shopName: "JAY MATAJI  PRO STORES",
    ownerName: "N/A",
    phone: "7048184044",
    tripId: "trip-dashrath-ranoli",
    address: "DASHRATH,INDIRANAGAR ROAD",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789894062818",
    shopName: "RAJLAXMI PRO STORES",
    ownerName: "HN",
    phone: "0909090909",
    tripId: "trip-dashrath-ranoli",
    address: "RANOLI, BARODA",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789894101819",
    shopName: "GANESH MEDICAL STORES",
    ownerName: ".",
    phone: "9090909090",
    tripId: "trip-dashrath-ranoli",
    address: "INDIRANAGAR ROAD,DASHRATH",
    visitStatus: "PENDING"
  },
  {
    id: "duk-custom-1789894141469",
    shopName: "MATE SHREE SUPER",
    ownerName: ".",
    phone: "9090909090",
    tripId: "trip-dashrath-ranoli",
    address: "INDIRA NAGAR ROAD, NR GANESH MEDICAL DASHRATH",
    visitStatus: "PENDING"
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'reckitt',
    name: 'Reckitt (Dettol / Harpic)',
    code: 'RB',
    description: 'Dettol Soap, Antiseptic, Harpic Toilet Cleaner, Lizol, Colin',
    tagline: '100% Germ Protection & Hygiene',
    badgeColor: 'bg-emerald-600',
    gradient: 'from-emerald-600 to-teal-800'
  },
  {
    id: 'dabur',
    name: 'Dabur India Ltd.',
    code: 'DAB',
    description: 'Lal Dant Manjan, Red Paste, Honey, Lal Tail, Chyawanprash',
    tagline: 'Ayurvedic Healthcare & Oral Care',
    badgeColor: 'bg-red-600',
    gradient: 'from-red-600 to-amber-700'
  },
  {
    id: 'loreal',
    name: "L'Oréal & Garnier",
    code: 'LOR',
    description: 'Total Repair 5 Shampoo, Extraordinary Oil, Garnier Black Crème',
    tagline: 'Advanced Hair Care & Styling',
    badgeColor: 'bg-rose-700',
    gradient: 'from-rose-700 to-red-900'
  },
  {
    id: 'everest',
    name: 'Everest Spices',
    code: 'EVR',
    description: 'Garam Masala, Pav Bhaji Masala, Kitchen King, Tikhalal Chilli',
    tagline: 'India\'s No. 1 Spice & Blended Masala',
    badgeColor: 'bg-amber-600',
    gradient: 'from-amber-600 to-orange-700'
  },
  {
    id: 'maxo',
    name: 'Jyothy Labs (Maxo Mosquito)',
    code: 'JYO',
    description: 'Maxo Liquid Vaporizer, Maxo Mosquito Coil, Ujala, Pril Bar',
    tagline: 'Home Pest Control & Fabric Care',
    badgeColor: 'bg-blue-700',
    gradient: 'from-blue-700 to-indigo-900'
  },
  {
    id: 'itc',
    name: 'ITC Foods & Personal Care',
    code: 'ITC',
    description: 'Sunfeast Dark Fantasy, Aashirvaad Atta, YiPPee Magic Masala',
    tagline: 'Premium Foods & Daily Biscuits',
    badgeColor: 'bg-yellow-700',
    gradient: 'from-yellow-700 to-amber-800'
  },
  {
    id: 'parachute',
    name: 'Marico (Parachute)',
    code: 'MAR-PAR',
    description: 'Parachute Pure 100% Coconut Oil, Advansed Aloe Vera Hair Oil',
    tagline: 'Pure Nourishment Coconut Oil',
    badgeColor: 'bg-sky-600',
    gradient: 'from-sky-600 to-blue-800'
  },
  {
    id: 'sensodyne',
    name: 'Sensodyne (Haleon / GSK)',
    code: 'SNS',
    description: 'Sensodyne Fresh Mint, Rapid Relief, Repair & Protect, Deep Clean',
    tagline: '#1 Dentist Recommended for Sensitivity',
    badgeColor: 'bg-blue-600',
    gradient: 'from-blue-600 to-cyan-800'
  },
  {
    id: 'patanjali',
    name: 'Patanjali Ayurved',
    code: 'PAT',
    description: 'Dant Kanti, Kesh Kanti, Pure Cow Desi Ghee, Aloe Vera Gel',
    tagline: 'Prakriti Ka Aashirwad',
    badgeColor: 'bg-orange-500',
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    id: 'saffola',
    name: 'Marico (Saffola Oats & Oils)',
    code: 'MAR-SAF',
    description: 'Saffola Classic Masala Oats 500g, Saffola Gold Cooking Oil',
    tagline: 'Healthy Heart Lifestyle & Oats',
    badgeColor: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-700'
  },
  {
    id: 'perfetti',
    name: 'Perfetti (Center Fresh / Fruit)',
    code: 'PVM',
    description: 'Center Fresh Chewing Gum Jar, Center Fruit, Happydent, Mentos',
    tagline: 'Confectionery Jars & Counter Candies',
    badgeColor: 'bg-teal-600',
    gradient: 'from-teal-600 to-emerald-800'
  },
  {
    id: 'godrej',
    name: 'Godrej Consumer Products',
    code: 'GCPL',
    description: 'GoodKnight Gold Flash Liquid, Cinthol Soap, Godrej No. 1, Hit',
    tagline: 'Mosquito Protection & Soaps',
    badgeColor: 'bg-blue-800',
    gradient: 'from-blue-800 to-slate-900'
  },
  {
    id: 'streax',
    name: 'Streax (Hygienic Research)',
    code: 'STR',
    description: 'Streax Professional Walnut Hair Serum, Cream Hair Colour',
    tagline: 'Professional Hair Styling & Serums',
    badgeColor: 'bg-pink-600',
    gradient: 'from-pink-600 to-rose-700'
  },
  {
    id: 'emami',
    name: 'Emami Group',
    code: 'EMM',
    description: 'Navratna Cool Oil, BoroPlus Antiseptic Cream, Zandu Balm',
    tagline: 'Ayurvedic Cool Oil & Health',
    badgeColor: 'bg-purple-600',
    gradient: 'from-purple-600 to-indigo-800'
  },
  {
    id: 'bajaj',
    name: 'Bajaj Consumer Care',
    code: 'BAJ',
    description: 'Bajaj Almond Drops Non-Sticky Hair Oil with Vitamin E',
    tagline: '6x Vitamin E Almond Hair Oil',
    badgeColor: 'bg-amber-700',
    gradient: 'from-amber-700 to-yellow-900'
  },
  {
    id: 'ferrero',
    name: 'Ferrero (Kinder Joy / Bomber)',
    code: 'FRR',
    description: 'Kinder Joy Blue (Boys), Kinder Joy Pink (Girls), Tic Tac Mint',
    tagline: 'Chocolates, Kinder Joy & Confectionery',
    badgeColor: 'bg-red-500',
    gradient: 'from-red-500 to-rose-700'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. RECKITT
  { id: 'rb-01', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Soaps', name: 'Dettol Original Bathing Soap', packSize: '75g', wdmsCode: 'DET-SOP-075', unitsPerBox: 48, mrp: 40.0 },
  { id: 'rb-02', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Soaps', name: 'Dettol Original Bathing Soap', packSize: '125g', wdmsCode: 'DET-SOP-125', unitsPerBox: 36, mrp: 70.0 },
  { id: 'rb-03', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Antiseptic', name: 'Dettol Antiseptic Liquid Bottle', packSize: '110ml', wdmsCode: 'DET-LIQ-110', unitsPerBox: 36, mrp: 68.0 },
  { id: 'rb-04', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Antiseptic', name: 'Dettol Antiseptic Liquid Bottle', packSize: '250ml', wdmsCode: 'DET-LIQ-250', unitsPerBox: 24, mrp: 155.0 },
  { id: 'rb-05', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Home Cleaning', name: 'Harpic Power Plus Toilet Cleaner Blue', packSize: '500ml', wdmsCode: 'HRP-BLU-500', unitsPerBox: 24, mrp: 105.0 },
  { id: 'rb-06', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Home Cleaning', name: 'Lizol Disinfectant Surface Cleaner Citrus', packSize: '500ml', wdmsCode: 'LZL-CTR-500', unitsPerBox: 24, mrp: 110.0 },
  { id: 'rb-07', companyId: 'reckitt', companyName: 'Reckitt (Dettol / Harpic)', category: 'Home Cleaning', name: 'Colin Glass and Surface Cleaner Spray', packSize: '500ml', wdmsCode: 'CLN-SPR-500', unitsPerBox: 24, mrp: 108.0 },

  // 2. DABUR
  { id: 'dab-01', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Oral Care', name: 'Dabur Lal Dant Manjan Powder', packSize: '100g', wdmsCode: 'DAB-MNJ-100', unitsPerBox: 24, mrp: 55.0 },
  { id: 'dab-02', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Oral Care', name: 'Dabur Lal Dant Manjan Powder', packSize: '50g', wdmsCode: 'DAB-MNJ-050', unitsPerBox: 48, mrp: 30.0 },
  { id: 'dab-03', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Oral Care', name: 'Dabur Red Toothpaste Tube', packSize: '150g', wdmsCode: 'DAB-RED-150', unitsPerBox: 36, mrp: 110.0 },
  { id: 'dab-04', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Oral Care', name: 'Dabur Red Toothpaste Tube', packSize: '100g', wdmsCode: 'DAB-RED-100', unitsPerBox: 48, mrp: 75.0 },
  { id: 'dab-05', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Honey & Health', name: 'Dabur Pure Honey Squeezy Bottle', packSize: '250g', wdmsCode: 'DAB-HNY-250', unitsPerBox: 24, mrp: 140.0 },
  { id: 'dab-06', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Honey & Health', name: 'Dabur Pure Honey Glass Jar', packSize: '500g', wdmsCode: 'DAB-HNY-500', unitsPerBox: 12, mrp: 245.0 },
  { id: 'dab-07', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Baby Care', name: 'Dabur Lal Tail Baby Massage Oil', packSize: '100ml', wdmsCode: 'DAB-LTL-100', unitsPerBox: 36, mrp: 120.0 },
  { id: 'dab-08', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Baby Care', name: 'Dabur Lal Tail Baby Massage Oil', packSize: '50ml', wdmsCode: 'DAB-LTL-050', unitsPerBox: 48, mrp: 65.0 },
  { id: 'dab-09', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Health Supplements', name: 'Dabur Chyawanprash Awaleha Jar', packSize: '500g', wdmsCode: 'DAB-CHW-500', unitsPerBox: 12, mrp: 220.0 },
  { id: 'dab-10', companyId: 'dabur', companyName: 'Dabur India Ltd.', category: 'Digestive', name: 'Dabur Pudin Hara Pearls (Strip of 10)', packSize: 'Strip', wdmsCode: 'DAB-PDH-010', unitsPerBox: 50, mrp: 35.0 },

  // 3. L'OREAL & GARNIER
  { id: 'lor-01', companyId: 'loreal', companyName: "L'Oréal & Garnier", category: 'Shampoo', name: "L'Oréal Paris Total Repair 5 Shampoo", packSize: '175ml', wdmsCode: 'LOR-TR5-175', unitsPerBox: 24, mrp: 165.0 },
  { id: 'lor-02', companyId: 'loreal', companyName: "L'Oréal & Garnier", category: 'Hair Serum', name: "L'Oréal Paris Extraordinary Oil Hair Serum", packSize: '100ml', wdmsCode: 'LOR-EXO-100', unitsPerBox: 18, mrp: 549.0 },
  { id: 'lor-03', companyId: 'loreal', companyName: "L'Oréal & Garnier", category: 'Hair Colour', name: 'Garnier Color Naturals Crème (Natural Black 1)', packSize: 'Complete Kit', wdmsCode: 'GAR-CLR-001', unitsPerBox: 48, mrp: 49.0 },
  { id: 'lor-04', companyId: 'loreal', companyName: "L'Oréal & Garnier", category: 'Men Face Care', name: 'Garnier Men PowerWhite Anti-Pollution Face Wash', packSize: '100g', wdmsCode: 'GAR-MEN-100', unitsPerBox: 24, mrp: 185.0 },

  // 4. EVEREST SPICES
  { id: 'evr-01', companyId: 'everest', companyName: 'Everest Spices', category: 'Spices', name: 'Everest Garam Masala', packSize: '100g', wdmsCode: 'EVR-GRM-100', unitsPerBox: 30, mrp: 92.0 },
  { id: 'evr-02', companyId: 'everest', companyName: 'Everest Spices', category: 'Spices', name: 'Everest Garam Masala', packSize: '50g', wdmsCode: 'EVR-GRM-050', unitsPerBox: 60, mrp: 48.0 },
  { id: 'evr-03', companyId: 'everest', companyName: 'Everest Spices', category: 'Spices', name: 'Everest Pav Bhaji Masala', packSize: '100g', wdmsCode: 'EVR-PVB-100', unitsPerBox: 30, mrp: 88.0 },
  { id: 'evr-04', companyId: 'everest', companyName: 'Everest Spices', category: 'Spices', name: 'Everest Kitchen King Masala', packSize: '100g', wdmsCode: 'EVR-KTK-100', unitsPerBox: 30, mrp: 90.0 },
  { id: 'evr-05', companyId: 'everest', companyName: 'Everest Spices', category: 'Spices', name: 'Everest Tikhalal Hot Chilli Powder', packSize: '100g', wdmsCode: 'EVR-TKH-100', unitsPerBox: 40, mrp: 62.0 },
  { id: 'evr-06', companyId: 'everest', companyName: 'Everest Spices', category: 'Spices', name: 'Everest Kasuri Methi Pack', packSize: '50g', wdmsCode: 'EVR-KSR-050', unitsPerBox: 40, mrp: 42.0 },

  // 5. JYOTHY LABS / MAXO
  { id: 'jyo-01', companyId: 'maxo', companyName: 'Jyothy Labs (Maxo Mosquito)', category: 'Mosquito Repellent', name: 'Maxo A Grade Liquid Mosquito Vaporizer Refill', packSize: '45ml', wdmsCode: 'MAX-RFL-045', unitsPerBox: 36, mrp: 75.0 },
  { id: 'jyo-02', companyId: 'maxo', companyName: 'Jyothy Labs (Maxo Mosquito)', category: 'Mosquito Repellent', name: 'Maxo Machine + Refill Combo Pack', packSize: 'Combo', wdmsCode: 'MAX-CMB-001', unitsPerBox: 24, mrp: 120.0 },
  { id: 'jyo-03', companyId: 'maxo', companyName: 'Jyothy Labs (Maxo Mosquito)', category: 'Mosquito Coil', name: 'Maxo Red Mosquito Coil 10 Coils', packSize: 'Pack of 10', wdmsCode: 'MAX-COL-010', unitsPerBox: 60, mrp: 35.0 },
  { id: 'jyo-04', companyId: 'maxo', companyName: 'Jyothy Labs (Maxo Mosquito)', category: 'Fabric Care', name: 'Ujala Supreme Fabric Whitener Bottle', packSize: '100ml', wdmsCode: 'UJL-WHT-100', unitsPerBox: 36, mrp: 40.0 },
  { id: 'jyo-05', companyId: 'maxo', companyName: 'Jyothy Labs (Maxo Mosquito)', category: 'Dishwashing', name: 'Pril Tamarind Shine Dishwash Liquid', packSize: '225ml', wdmsCode: 'PRL-LIQ-225', unitsPerBox: 24, mrp: 55.0 },

  // 6. ITC
  { id: 'itc-01', companyId: 'itc', companyName: 'ITC Foods & Personal Care', category: 'Biscuits', name: 'Sunfeast Dark Fantasy Choco Fills', packSize: '75g', wdmsCode: 'SUN-DKF-075', unitsPerBox: 36, mrp: 40.0 },
  { id: 'itc-02', companyId: 'itc', companyName: 'ITC Foods & Personal Care', category: 'Staples', name: 'Aashirvaad Shudh Chakki Atta', packSize: '5kg', wdmsCode: 'ASH-ATT-5000', unitsPerBox: 4, mrp: 260.0 },
  { id: 'itc-03', companyId: 'itc', companyName: 'ITC Foods & Personal Care', category: 'Noodles', name: 'Sunfeast YiPPee! Magic Masala Noodles (Pack of 4)', packSize: '240g', wdmsCode: 'YIP-MAG-240', unitsPerBox: 24, mrp: 56.0 },

  // 7. MARICO (PARACHUTE)
  { id: 'par-01', companyId: 'parachute', companyName: 'Marico (Parachute)', category: 'Hair Oil', name: 'Parachute 100% Pure Coconut Oil Bottle', packSize: '175ml', wdmsCode: 'PAR-COC-175', unitsPerBox: 36, mrp: 85.0 },
  { id: 'par-02', companyId: 'parachute', companyName: 'Marico (Parachute)', category: 'Hair Oil', name: 'Parachute 100% Pure Coconut Oil Blue Bottle', packSize: '250ml', wdmsCode: 'PAR-COC-250', unitsPerBox: 24, mrp: 125.0 },
  { id: 'par-03', companyId: 'parachute', companyName: 'Marico (Parachute)', category: 'Hair Oil', name: 'Parachute Pure Coconut Oil Family Jar', packSize: '500ml', wdmsCode: 'PAR-COC-500', unitsPerBox: 16, mrp: 235.0 },
  { id: 'par-04', companyId: 'parachute', companyName: 'Marico (Parachute)', category: 'Hair Oil', name: 'Parachute Advansed Aloe Vera Hair Oil', packSize: '150ml', wdmsCode: 'PAR-ALV-150', unitsPerBox: 24, mrp: 95.0 },

  // 8. SENSODYNE (HALEON / GSK)
  { id: 'sns-01', companyId: 'sensodyne', companyName: 'Sensodyne (Haleon / GSK)', category: 'Toothpaste', name: 'Sensodyne Fresh Mint Sensitivity Toothpaste', packSize: '75g', wdmsCode: 'SNS-MNT-075', unitsPerBox: 36, mrp: 130.0 },
  { id: 'sns-02', companyId: 'sensodyne', companyName: 'Sensodyne (Haleon / GSK)', category: 'Toothpaste', name: 'Sensodyne Rapid Relief Toothpaste', packSize: '80g', wdmsCode: 'SNS-RPD-080', unitsPerBox: 36, mrp: 180.0 },
  { id: 'sns-03', companyId: 'sensodyne', companyName: 'Sensodyne (Haleon / GSK)', category: 'Toothpaste', name: 'Sensodyne Repair & Protect Toothpaste', packSize: '70g', wdmsCode: 'SNS-REP-070', unitsPerBox: 36, mrp: 210.0 },

  // 9. PATANJALI
  { id: 'pat-01', companyId: 'patanjali', companyName: 'Patanjali Ayurved', category: 'Oral Care', name: 'Patanjali Dant Kanti Dental Cream', packSize: '100g', wdmsCode: 'PAT-DNK-100', unitsPerBox: 48, mrp: 55.0 },
  { id: 'pat-02', companyId: 'patanjali', companyName: 'Patanjali Ayurved', category: 'Oral Care', name: 'Patanjali Dant Kanti Dental Cream', packSize: '200g', wdmsCode: 'PAT-DNK-200', unitsPerBox: 24, mrp: 105.0 },
  { id: 'pat-03', companyId: 'patanjali', companyName: 'Patanjali Ayurved', category: 'Grocery', name: 'Patanjali Pure Cow Desi Ghee Jar', packSize: '1 Litre', wdmsCode: 'PAT-GHE-1000', unitsPerBox: 12, mrp: 640.0 },
  { id: 'pat-04', companyId: 'patanjali', companyName: 'Patanjali Ayurved', category: 'Hair Care', name: 'Patanjali Kesh Kanti Hair Cleanser', packSize: '200ml', wdmsCode: 'PAT-KSH-200', unitsPerBox: 24, mrp: 115.0 },

  // 10. MARICO (SAFFOLA OATS & OILS)
  { id: 'saf-01', companyId: 'saffola', companyName: 'Marico (Saffola Oats & Oils)', category: 'Healthy Foods', name: 'Saffola Classic Masala Oats Pouch', packSize: '500g', wdmsCode: 'SAF-OAT-500', unitsPerBox: 16, mrp: 195.0 },
  { id: 'saf-02', companyId: 'saffola', companyName: 'Marico (Saffola Oats & Oils)', category: 'Healthy Foods', name: 'Saffola Classic Masala Oats Single Serve', packSize: '38g', wdmsCode: 'SAF-OAT-038', unitsPerBox: 48, mrp: 18.0 },
  { id: 'saf-03', companyId: 'saffola', companyName: 'Marico (Saffola Oats & Oils)', category: 'Edible Oil', name: 'Saffola Gold Pro Healthy Lifestyle Oil', packSize: '1 Litre Pouch', wdmsCode: 'SAF-GLD-1000', unitsPerBox: 15, mrp: 185.0 },

  // 11. PERFETTI VAN MELLE (CENTER FRESH / FRUIT)
  { id: 'pvm-01', companyId: 'perfetti', companyName: 'Perfetti (Center Fresh / Fruit)', category: 'Gums & Mints', name: 'Center Fresh Spearmint Chewing Gum Display Jar', packSize: '200 Pcs Jar', wdmsCode: 'PVM-CF-JAR', unitsPerBox: 8, mrp: 200.0 },
  { id: 'pvm-02', companyId: 'perfetti', companyName: 'Perfetti (Center Fresh / Fruit)', category: 'Gums & Mints', name: 'Center Fruit Liquid Filled Gum Mixed Jar', packSize: '200 Pcs Jar', wdmsCode: 'PVM-CFR-JAR', unitsPerBox: 8, mrp: 200.0 },
  { id: 'pvm-03', companyId: 'perfetti', companyName: 'Perfetti (Center Fresh / Fruit)', category: 'Gums & Mints', name: 'Happydent Wave Sugarfree Spearmint Bottle', packSize: '40g Bottle', wdmsCode: 'PVM-HAP-040', unitsPerBox: 24, mrp: 50.0 },
  { id: 'pvm-04', companyId: 'perfetti', companyName: 'Perfetti (Center Fresh / Fruit)', category: 'Candies', name: 'Mentos Rainbow Roll (Pack of 20)', packSize: '20 Rolls', wdmsCode: 'PVM-MEN-020', unitsPerBox: 12, mrp: 200.0 },
  { id: 'pvm-05', companyId: 'perfetti', companyName: 'Perfetti (Center Fresh / Fruit)', category: 'Candies', name: 'Alpenliebe Gold Caramel Candy Bag', packSize: '150 Pcs Bag', wdmsCode: 'PVM-ALP-BAG', unitsPerBox: 16, mrp: 150.0 },

  // 12. GODREJ
  { id: 'gc-01', companyId: 'godrej', companyName: 'Godrej Consumer Products', category: 'Mosquito Protection', name: 'GoodKnight Gold Flash Liquid Refill', packSize: '45ml', wdmsCode: 'GDK-RFL-045', unitsPerBox: 36, mrp: 85.0 },
  { id: 'gc-02', companyId: 'godrej', companyName: 'Godrej Consumer Products', category: 'Mosquito Protection', name: 'GoodKnight Gold Flash Machine + Refill Combo', packSize: 'Combo', wdmsCode: 'GDK-CMB-001', unitsPerBox: 24, mrp: 135.0 },
  { id: 'gc-03', companyId: 'godrej', companyName: 'Godrej Consumer Products', category: 'Soaps', name: 'Cinthol Original Deodorant Bath Soap', packSize: '100g', wdmsCode: 'CIN-ORG-100', unitsPerBox: 48, mrp: 50.0 },
  { id: 'gc-04', companyId: 'godrej', companyName: 'Godrej Consumer Products', category: 'Soaps', name: 'Godrej No.1 Sandal & Turmeric Soap (Pack of 4)', packSize: '4x100g', wdmsCode: 'GN1-SND-400', unitsPerBox: 16, mrp: 140.0 },
  { id: 'gc-05', companyId: 'godrej', companyName: 'Godrej Consumer Products', category: 'Insecticide', name: 'HIT Flying Insect Killer Black HIT Spray', packSize: '400ml', wdmsCode: 'HIT-BLK-400', unitsPerBox: 24, mrp: 215.0 },

  // 13. STREAX
  { id: 'str-01', companyId: 'streax', companyName: 'Streax (Hygienic Research)', category: 'Hair Serum', name: 'Streax Professional Hair Serum with Walnut Oil', packSize: '100ml', wdmsCode: 'STR-SRM-100', unitsPerBox: 24, mrp: 240.0 },
  { id: 'str-02', companyId: 'streax', companyName: 'Streax (Hygienic Research)', category: 'Hair Serum', name: 'Streax Professional Hair Serum Pocket Pack', packSize: '45ml', wdmsCode: 'STR-SRM-045', unitsPerBox: 36, mrp: 130.0 },
  { id: 'str-03', companyId: 'streax', companyName: 'Streax (Hygienic Research)', category: 'Hair Colour', name: 'Streax Cream Hair Colour (Natural Black 1)', packSize: 'Single Kit', wdmsCode: 'STR-CLR-001', unitsPerBox: 36, mrp: 50.0 },

  // 14. EMAMI
  { id: 'emm-01', companyId: 'emami', companyName: 'Emami Group', category: 'Cool Oil', name: 'Navratna Ayurvedic Cool Hair Oil', packSize: '100ml', wdmsCode: 'NAV-OIL-100', unitsPerBox: 36, mrp: 85.0 },
  { id: 'emm-02', companyId: 'emami', companyName: 'Emami Group', category: 'Cool Oil', name: 'Navratna Ayurvedic Cool Hair Oil', packSize: '300ml', wdmsCode: 'NAV-OIL-300', unitsPerBox: 16, mrp: 210.0 },
  { id: 'emm-03', companyId: 'emami', companyName: 'Emami Group', category: 'Antiseptic Cream', name: 'BoroPlus Antiseptic Cream Tube', packSize: '40g', wdmsCode: 'BOR-CRM-040', unitsPerBox: 48, mrp: 52.0 },
  { id: 'emm-04', companyId: 'emami', companyName: 'Emami Group', category: 'Pain Relief', name: 'Zandu Balm Ayurvedic Pain Relief Jar', packSize: '25ml', wdmsCode: 'ZND-BLM-025', unitsPerBox: 36, mrp: 95.0 },

  // 15. BAJAJ CONSUMER
  { id: 'baj-01', companyId: 'bajaj', companyName: 'Bajaj Consumer Care', category: 'Hair Oil', name: 'Bajaj Almond Drops Non-Sticky Hair Oil', packSize: '100ml', wdmsCode: 'BAJ-ALM-100', unitsPerBox: 36, mrp: 80.0 },
  { id: 'baj-02', companyId: 'bajaj', companyName: 'Bajaj Consumer Care', category: 'Hair Oil', name: 'Bajaj Almond Drops Non-Sticky Hair Oil', packSize: '200ml', wdmsCode: 'BAJ-ALM-200', unitsPerBox: 24, mrp: 155.0 },
  { id: 'baj-03', companyId: 'bajaj', companyName: 'Bajaj Consumer Care', category: 'Hair Oil', name: 'Bajaj Almond Drops Non-Sticky Hair Oil', packSize: '300ml', wdmsCode: 'BAJ-ALM-300', unitsPerBox: 18, mrp: 225.0 },

  // 16. FERRERO (KINDER JOY / BOMBER / TIC TAC)
  { id: 'frr-01', companyId: 'ferrero', companyName: 'Ferrero (Kinder Joy / Bomber)', category: 'Chocolates & Toys', name: 'Kinder Joy Blue for Boys Chocolate with Toy', packSize: '20g', wdmsCode: 'KND-BLU-020', unitsPerBox: 24, mrp: 50.0 },
  { id: 'frr-02', companyId: 'ferrero', companyName: 'Ferrero (Kinder Joy / Bomber)', category: 'Chocolates & Toys', name: 'Kinder Joy Pink for Girls Chocolate with Toy', packSize: '20g', wdmsCode: 'KND-PNK-020', unitsPerBox: 24, mrp: 50.0 },
  { id: 'frr-03', companyId: 'ferrero', companyName: 'Ferrero (Kinder Joy / Bomber)', category: 'Mints', name: 'Tic Tac Spearmint Mouth Freshener Box', packSize: 'Box of 16', wdmsCode: 'TIC-TAC-MNT', unitsPerBox: 16, mrp: 160.0 }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-101',
    orderNumber: 'ORD-8001',
    tripId: 'trip-1',
    tripName: 'Trip 1: Station Road & Market Yard',
    dukanId: 'duk-101',
    dukanName: 'Shree Ganesh Kirana & General Store',
    ownerName: 'Gopalbhai Shah',
    phone: '9426098765',
    salesmanId: 'user-salesman-hiren',
    salesmanName: 'Hiren Shah',
    totalBoxes: 3,
    totalLoose: 11,
    totalUnits: 83,
    totalMrpValue: 5690.0,
    status: 'BOOKED_BY_SALESMAN',
    notes: 'Urgent morning tempo delivery required',
    createdAt: '2026-03-20T10:30:00Z',
    items: [
      {
        productId: 'dab-01',
        wdmsCode: 'DAB-MNJ-100',
        companyName: 'Dabur India Ltd.',
        productName: 'Dabur Lal Dant Manjan Powder',
        packSize: '100g',
        unitsPerBox: 24,
        boxQty: 2,
        looseQty: 5,
        totalUnits: 53,
        mrp: 55.0,
        lineMrpTotal: 2915.0
      },
      {
        productId: 'frr-01',
        wdmsCode: 'KND-BLU-020',
        companyName: 'Ferrero (Kinder Joy / Bomber)',
        productName: 'Kinder Joy Blue for Boys Chocolate with Toy',
        packSize: '20g',
        unitsPerBox: 24,
        boxQty: 1,
        looseQty: 6,
        totalUnits: 30,
        mrp: 50.0,
        lineMrpTotal: 1500.0
      },
      {
        productId: 'jyo-01',
        wdmsCode: 'MAX-RFL-045',
        companyName: 'Jyothy Labs (Maxo Mosquito)',
        productName: 'Maxo A Grade Liquid Mosquito Vaporizer Refill',
        packSize: '45ml',
        unitsPerBox: 36,
        boxQty: 0,
        looseQty: 17,
        totalUnits: 17,
        mrp: 75.0,
        lineMrpTotal: 1275.0
      }
    ]
  }
];
