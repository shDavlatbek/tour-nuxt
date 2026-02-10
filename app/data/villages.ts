import type { VillageDetail } from '~/types/village'

export const villages: VillageDetail[] = [
  {
    id: '1',
    cityName: 'SAMARKAND, UZBEKISTAN',
    villageName: 'Konigil',
    heroImage: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=1600',
    description: {
      subtitle: 'The Paper Mill of Silk Road',
      paragraphs: [
        'Perched along the banks of the Siab River, Konigil is home to the legendary Meros paper mill — the last surviving workshop that produces handmade silk paper using ancient techniques passed down through generations. The village, entirely enveloped in mulberry groves, offers the visitor a living museum of craftsmanship and tradition.',
        'Its narrow pathways, flanked by mud-brick walls and shaded courtyards, lead to workshops where artisans pound mulberry bark into luminous sheets of paper. The rhythmic sound of mallets against stone echoes through the valley, a testament to methods unchanged since the 8th century. It is a place where time seems to have paused, allowing the weary traveler a moment of pure, uninterrupted wonder.'
      ]
    },
    gallery: [
      { id: 1, src: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800', alt: 'Konigil paper mill workshop' },
      { id: 2, src: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=800', alt: 'Ancient mulberry trees' },
      { id: 3, src: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=800', alt: 'Traditional paper making' },
      { id: 4, src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800', alt: 'Siab River valley' },
      { id: 5, src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800', alt: 'Village courtyard' },
      { id: 6, src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800', alt: 'Mountain panorama' }
    ],
    comments: [
      {
        id: 1,
        text: '"Walking through the ancient pathways felt like stepping into a living painting. The golden hour light hitting the stone walls of Samarkand is a memory I shall cherish forever. It is truly a place where time stands still."',
        authorName: 'RANO TOSHQODIROVA',
        authorRole: 'EXPLORER',
        authorInitials: 'RT'
      },
      {
        id: 2,
        text: '"The silence of the Mistborn Peaks spoke volumes. Every corner of this village holds a secret, intricately woven into the fabric of its history. An unforgettable journey into the heart of the past."',
        authorName: 'SULAYMANOVA DILDORA',
        authorRole: 'HISTORIAN',
        authorInitials: 'SD'
      },
      {
        id: 3,
        text: '"From the verdant groves to the cascading waterfalls, the natural beauty is overwhelming. But it is the hospitality of the locals that truly warms the soul. A masterpiece of culture and nature combined."',
        authorName: 'AHZAM BEGMATOV',
        authorRole: 'PHOTOGRAPHER',
        authorInitials: 'AB'
      },
      {
        id: 4,
        text: '"The paper-making workshop was a revelation. Watching artisans transform mulberry bark into delicate sheets of silk paper — using techniques from the 8th century — was a humbling experience."',
        authorName: 'ELENA PETROVA',
        authorRole: 'JOURNALIST',
        authorInitials: 'EP'
      }
    ],
    location: {
      lat: 39.6700,
      lng: 66.9600,
      zoom: 13
    }
  },
  {
    id: '2',
    cityName: 'SAMARKAND, UZBEKISTAN',
    villageName: 'Urgut',
    heroImage: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=1600',
    description: {
      subtitle: 'The Mountain Bazaar',
      paragraphs: [
        'Nestled in the foothills south of Samarkand, Urgut is renowned for its legendary Sunday bazaar — one of the largest and oldest open-air markets in Central Asia. The village pulses with life as traders from surrounding mountain villages descend with handwoven textiles, suzani embroideries, and freshly harvested produce.',
        'Beyond the bazaar, ancient plane trees stand as silent sentinels near the sacred springs of Chor Chinor — four enormous chinars believed to be over a thousand years old. The air here is cooler, scented with wild herbs and the distant promise of snow-capped peaks.'
      ]
    },
    gallery: [
      { id: 1, src: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=800', alt: 'Urgut bazaar entrance' },
      { id: 2, src: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=800', alt: 'Traditional textiles' },
      { id: 3, src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800', alt: 'Ancient plane trees' },
      { id: 4, src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800', alt: 'Mountain landscape' },
      { id: 5, src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800', alt: 'Sacred springs' },
      { id: 6, src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800', alt: 'Sunset over Urgut' }
    ],
    comments: [
      {
        id: 1,
        text: '"The Urgut bazaar is a feast for the senses. The colors, sounds, and aromas create an intoxicating atmosphere that transports you to another era."',
        authorName: 'MARCOS SILVA',
        authorRole: 'TRAVEL WRITER',
        authorInitials: 'MS'
      },
      {
        id: 2,
        text: '"Standing beneath the thousand-year-old plane trees at Chor Chinor, I felt a profound connection to the land and its history. A truly spiritual experience."',
        authorName: 'YUKI TANAKA',
        authorRole: 'BOTANIST',
        authorInitials: 'YT'
      },
      {
        id: 3,
        text: '"The suzani embroideries I found in Urgut are among the finest I have ever seen. Each stitch tells a story of generations of women artisans."',
        authorName: 'SARAH MITCHELL',
        authorRole: 'TEXTILE HISTORIAN',
        authorInitials: 'SM'
      }
    ],
    location: {
      lat: 39.3000,
      lng: 67.2300,
      zoom: 12
    }
  },
  {
    id: '3',
    cityName: 'SAMARKAND, UZBEKISTAN',
    villageName: 'Miankal',
    heroImage: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=1600',
    description: {
      subtitle: 'Emerald Fields of the Valley',
      paragraphs: [
        'Miankal stretches across the fertile plain between the Zarafshan River and the ancient irrigation canals that have sustained agriculture here for millennia. Known as the breadbasket of Samarkand, this cluster of villages is a tapestry of golden wheat fields, orchards heavy with peaches and apricots, and vineyards that produce grapes of legendary sweetness.',
        'Life in Miankal follows the rhythm of the seasons. In spring, the almond blossoms paint the hillsides white and pink; in autumn, the harvest festivals bring entire communities together in celebration. The hospitality here is warm and genuine — visitors are welcomed with fresh bread from the tandoor and bowls of fragrant plov.'
      ]
    },
    gallery: [
      { id: 1, src: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=800', alt: 'Emerald fields' },
      { id: 2, src: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800', alt: 'Golden wheat fields' },
      { id: 3, src: 'https://images.unsplash.com/photo-1770281151839-51fcd6c94439?auto=format&fit=crop&q=80&w=800', alt: 'Irrigation canals' },
      { id: 4, src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800', alt: 'Sunset over the valley' },
      { id: 5, src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800', alt: 'Orchard blooming' },
      { id: 6, src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800', alt: 'Village life' }
    ],
    comments: [
      {
        id: 1,
        text: '"The plov we shared in Miankal was the finest I have ever tasted. Cooked over open flames in a massive kazan, with rice turned golden by carrots and cumin. Pure magic."',
        authorName: 'JAMES WHITFORD',
        authorRole: 'FOOD CRITIC',
        authorInitials: 'JW'
      },
      {
        id: 2,
        text: '"Cycling through the apricot orchards at dawn, with the mountains glowing pink in the distance, was one of the most peaceful moments of my entire journey through Central Asia."',
        authorName: 'ANNA BERG',
        authorRole: 'CYCLIST & WRITER',
        authorInitials: 'AB'
      },
      {
        id: 3,
        text: '"I came for a day and stayed for a week. The warmth of the people and the beauty of the landscape made it impossible to leave. Miankal is Uzbekistan\'s best-kept secret."',
        authorName: 'DAVID CHEN',
        authorRole: 'DOCUMENTARY MAKER',
        authorInitials: 'DC'
      }
    ],
    location: {
      lat: 39.7500,
      lng: 66.8000,
      zoom: 11
    }
  }
]

export function getVillageById(id: string): VillageDetail | undefined {
  return villages.find(v => v.id === id)
}
