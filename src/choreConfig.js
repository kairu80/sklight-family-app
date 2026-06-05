export const MORNING_CHORES = [
  'Brush Teeth', 'Wash Face', 'Lotion Face', 'Lotion Body', 'Deodorant',
  'Make Bed', 'Vacuum Room', 'Take out Dogs', 'Feed Pets', 'Water Pets',
  'Kitty Glitter', 'Make Breakfast', 'Clean up Breakfast', 'Mouthwash',
  'Pack Lunch', 'Pack Water', 'Pack Backpack',
]

export const AFTERNOON_CHORES = [
  'Wash Hands', 'Unpack Backpack', 'Clean out Lunch', 'Put Away Backpack & Shoes',
  'Eat Snack', 'Walk Dogs', 'Do Homework', 'Get Ready for Sports',
  'Drink Water', 'Eat Dinner', 'Clean up Dinner', 'Take a Shower',
  'Wash Face', 'Lotion Face & Body', 'Floss & Brush Teeth',
]

export const WEEKEND_CHORES = [
  'Clean Bathroom', 'Wash Floors', 'Clean Baseboards', 'Do Laundry',
  'Dry Laundry', 'Put Away Laundry', 'Clean Door Knobs',
  'Clean Appliances', 'Clean Guest Bathroom',
]

export const KINDNESS_CHORES = [
  'Take out Trash Bag',
  'Take out Trash Cans',
  'Take in Trash Cans',
  'Help out with Koa',
  'Wash a Car (Inside & Out)',
]

export const SECTIONS = [
  { id: 'morning',   label: 'Morning',   emoji: '☀️',  points: 5  },
  { id: 'afternoon', label: 'Afternoon', emoji: '🌆',  points: 5  },
  { id: 'weekend',   label: 'Weekend',   emoji: '🏠',  points: 10 },
]

export const SECTION_POINTS = { morning: 5, afternoon: 5, weekend: 10, kindness: 25 }

export const RANKS = [
  { min: 0,    label: 'Seedling',          emoji: '🌱', color: '#86efac' },
  { min: 50,   label: 'Star Rookie',       emoji: '⭐', color: '#fde68a' },
  { min: 150,  label: 'Cosmic Kid',        emoji: '🌟', color: '#fbbf24' },
  { min: 300,  label: 'Shooting Star',     emoji: '💫', color: '#f472b6' },
  { min: 500,  label: 'Galaxy Hero',       emoji: '🌌', color: '#818cf8' },
  { min: 750,  label: 'Super Nova',        emoji: '🚀', color: '#22d3ee' },
  { min: 1000, label: 'Universe Champion', emoji: '👑', color: '#fbbf24' },
]

export const KOA_RANKS = [
  { min: 0,   label: 'Pretty Cute',    emoji: '😊', color: '#fde68a' },
  { min: 15,  label: 'Very Cute',      emoji: '🥰', color: '#f472b6' },
  { min: 40,  label: 'Super Cute',     emoji: '💕', color: '#fb7185' },
  { min: 80,  label: 'Sparkle Cute',   emoji: '✨', color: '#818cf8' },
  { min: 150, label: 'Legendary Cute', emoji: '👑', color: '#fbbf24' },
]

export function getChoresForSection(section) {
  if (section === 'morning')   return MORNING_CHORES
  if (section === 'afternoon') return AFTERNOON_CHORES
  if (section === 'weekend')   return WEEKEND_CHORES
  if (section === 'kindness')  return KINDNESS_CHORES
  return []
}

export function getRank(pts) {
  return [...RANKS].reverse().find(r => pts >= r.min) || RANKS[0]
}

export function getKoaRank(pts) {
  return [...KOA_RANKS].reverse().find(r => pts >= r.min) || KOA_RANKS[0]
}

export const KOA_MESSAGES = [
  'Maximum Cuteness Achieved! 🌟',
  'Too cute to handle! 💕',
  'Stop, my heart! 🥺',
  'Precious angel! 👼',
  'Awwwww! 🤗',
  'Sweetest ever! 🍬',
  'Angels are jealous! 😇',
  'The universe smiles! ✨',
  'Pure joy incarnate! 🌈',
  'Cuteness overload! 💥',
]
