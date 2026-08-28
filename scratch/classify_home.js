const fs = require('fs');
let content = fs.readFileSync('src/data/home.ts', 'utf8');

// Add import
if (!content.includes('ContentMaturityRating')) {
  content = "import {ContentMaturityRating} from '../types/maturity';\n" + content;
}

// Update HomeContentItem interface
if (!content.includes('maturityRating?: ContentMaturityRating;')) {
  content = content.replace(
    'export interface HomeContentItem {\n  id: string;',
    'export interface HomeContentItem {\n  id: string;\n  maturityRating?: ContentMaturityRating;'
  );
  content = content.replace(
    'export interface HeroSlide {\n  id: string;',
    'export interface HeroSlide {\n  id: string;\n  maturityRating?: ContentMaturityRating;'
  );
}

const ratingsMap = {
  'The Lion King': 'KIDS',
  '777 Charlie': 'KIDS',
  'Spider-Man: Across the Spider-Verse': '7_PLUS',
  'HanuMan': '7_PLUS',
  'Hi Nanna': '7_PLUS',
  'Bajrangi Bhaijaan': '7_PLUS',
  'Tron: Legacy': '7_PLUS',
  '12th Fail': 'ALL',
  'PK': 'ALL',
  'Om Shanti Om': 'ALL',
  'Zindagi Na Milegi Dobara': 'ALL',
  'Dilwale Dulhania Le Jayenge': 'ALL',
  'Animal 2023': '18_PLUS',
  'Arjun Reddy': '18_PLUS',
  'Baby 2023': '18_PLUS',
  'Kabir Singh': '18_PLUS',
  'Fight Club': '18_PLUS',
  'Pulp Fiction': '18_PLUS',
  'The Godfather': '18_PLUS',
  'Prometheus': '18_PLUS',
  'Tumbbad': '18_PLUS',
  'K.G.F: Chapter 2': '16_PLUS',
  'Oppenheimer': '16_PLUS',
  'Gladiator': '16_PLUS',
  'The Matrix': '16_PLUS',
  'The Shawshank Redemption': '16_PLUS',
  'Pushpa 2: The Rule': '16_PLUS',
  'Dasara': '16_PLUS',
  'Tillu Square': '16_PLUS',
  'DJ Tillu': '16_PLUS',
  'Sanju': '16_PLUS',
  'Uri: The Surgical Strike': '16_PLUS',
  'Andhadhun': '16_PLUS',
  'The Last Horizon': '13_PLUS',
  'Kalki 2898 AD': '13_PLUS',
  'Jawan': '13_PLUS',
  'Interstellar': '13_PLUS',
  'RRR': '13_PLUS',
  'Pushpa: The Rise': '13_PLUS',
  'Kantara': '13_PLUS',
  'Inception': '13_PLUS',
  'Baahubali 2: The Conclusion': '13_PLUS',
  'Salaar': '13_PLUS',
  'Devara': '13_PLUS',
  'Pathaan': '13_PLUS',
  'Dangal': 'ALL',
  'Brahmastra': '13_PLUS',
  'Stree 2': '13_PLUS',
  '3 Idiots': 'ALL',
  'Vikrant Rona': '13_PLUS',
  'Kabzaa': '16_PLUS',
  'The Dark Knight': '13_PLUS',
  'Avatar: The Way of Water': '13_PLUS',
  'Dune: Part Two': '13_PLUS',
  'Avengers: Endgame': '13_PLUS',
  'Spiderman: No Way Home': '13_PLUS',
  'Titanic': '13_PLUS',
  'Forrest Gump': '13_PLUS',
  'Jurassic Park': '13_PLUS',
  'Top Gun: Maverick': '13_PLUS',
  'Black Panther': '13_PLUS',
  'Doctor Strange': '13_PLUS',
  'Baahubali: The Beginning': '13_PLUS',
  'Magadheera': '13_PLUS',
  'Ala Vaikunthapurramuloo': '13_PLUS',
  'Sarileru Neekevvaru': '13_PLUS',
  'Guntur Kaaram': '13_PLUS',
  'Sita Ramam': '13_PLUS',
  'Major': '13_PLUS',
  'Bheemla Nayak': '13_PLUS',
  'Akhanda': '13_PLUS',
  'Waltair Veerayya': '13_PLUS',
  'Veera Simha Reddy': '13_PLUS',
  'Geetha Govindam': '13_PLUS',
  'Gadar 2': '13_PLUS',
  'Bhool Bhulaiyaa 2': '13_PLUS',
  'Drishyam 2': '13_PLUS',
  'War 2019': '13_PLUS',
  'Sultan': '13_PLUS',
  'Padmaavat': '13_PLUS',
  'Chhichhore': '13_PLUS',
  'Sholay': '13_PLUS',
  'Pacific Rim': '13_PLUS',
  'Ready Player One': '13_PLUS',
  'Oblivion 2013': '13_PLUS',
  'Avatar': '13_PLUS',
  'Guardians of the Galaxy': '13_PLUS',
  'Thor: Ragnarok': '13_PLUS',
  'Iron Man 2008': '13_PLUS'
};

// Add maturityRating into items if not already added
for (const [title, rating] of Object.entries(ratingsMap)) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(`(title:\\s*['"]${escapedTitle}['"],(?!\\s*maturityRating:))`, 'g');
  content = content.replace(searchRegex, `$1\n    maturityRating: '${rating}',`);
}

// Add a kids slide to hero slides
if (!content.includes('the-lion-king-hero')) {
  const kidsHeroSlide = `  {
    id: 'the-lion-king-hero',
    eyebrow: 'DISNEY CLASSIC • KIDS SPECIAL',
    title: 'The Lion King',
    maturityRating: 'KIDS',
    description:
      'A young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.',
    meta: ['2019', 'ENGLISH', '1h 58m', '4K UHD', 'IMDb 6.9', 'KIDS'],
    image: {
      uri: 'https://image.tmdb.org/t/p/w1280/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
    },
    badge: 'KIDS FAVORITE',
    rating: '⭐ 7.7 / 10',
    genre: 'Animation • Adventure • Family',
    director: 'Jon Favreau',
    cast: 'Donald Glover, Beyoncé, Seth Rogen, Chiwetel Ejiofor',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
`;
  content = content.replace('export const homeHeroSlides: HeroSlide[] = [\n', 'export const homeHeroSlides: HeroSlide[] = [\n' + kidsHeroSlide);
}

fs.writeFileSync('src/data/home.ts', content, 'utf8');
console.log('Classified home.ts successfully');
