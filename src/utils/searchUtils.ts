import {HomeContentItem, HomeContentRow, HeroSlide} from '../data/home';

export const filterContentItem = (
  item: HomeContentItem,
  query: string,
): boolean => {
  if (!query || query.trim() === '') {
    return true;
  }
  const q = query.toLowerCase().trim();

  const titleMatch = item.title?.toLowerCase().includes(q);
  const descMatch = item.description?.toLowerCase().includes(q);
  const genreMatch = item.genre?.toLowerCase().includes(q);
  const castMatch = item.cast?.toLowerCase().includes(q);
  const directorMatch = item.director?.toLowerCase().includes(q);
  const badgeMatch = item.badge?.toLowerCase().includes(q);
  const metaMatch = item.meta?.some((m) => m.toLowerCase().includes(q));

  return (
    Boolean(titleMatch) ||
    Boolean(descMatch) ||
    Boolean(genreMatch) ||
    Boolean(castMatch) ||
    Boolean(directorMatch) ||
    Boolean(badgeMatch) ||
    Boolean(metaMatch)
  );
};

export const filterContentRows = (
  rows: HomeContentRow[],
  query: string,
): HomeContentRow[] => {
  if (!query || query.trim() === '') {
    return rows;
  }

  return rows
    .map((row) => {
      const filteredItems = row.items.filter((item) =>
        filterContentItem(item, query),
      );
      return {
        ...row,
        items: filteredItems,
      };
    })
    .filter((row) => row.items.length > 0);
};

export const filterHeroSlides = (
  slides: HeroSlide[],
  query: string,
): HeroSlide[] => {
  if (!query || query.trim() === '') {
    return slides;
  }
  const q = query.toLowerCase().trim();

  return slides.filter((slide) => {
    return (
      slide.title.toLowerCase().includes(q) ||
      slide.description.toLowerCase().includes(q) ||
      (slide.genre && slide.genre.toLowerCase().includes(q)) ||
      (slide.cast && slide.cast.toLowerCase().includes(q)) ||
      (slide.director && slide.director.toLowerCase().includes(q)) ||
      (slide.eyebrow && slide.eyebrow.toLowerCase().includes(q))
    );
  });
};
