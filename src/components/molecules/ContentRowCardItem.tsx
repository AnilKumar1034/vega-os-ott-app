import React from 'react';
import {CardLayoutType, HomeContentItem} from '../../data/home';
import {ContentCard} from './ContentCard';

interface ContentRowCardItemProps {
  item: HomeContentItem;
  index: number;
  layout?: CardLayoutType;
  onContentFocus: () => void;
  shouldPreferFocus?: boolean;
}

export const ContentRowCardItem = ({
  item,
  index,
  layout = 'horizontal',
  onContentFocus,
  shouldPreferFocus,
}: ContentRowCardItemProps) => {
  return (
    <ContentCard
      {...item}
      layout={layout}
      testID={`content-card-${item.id}`}
      onFocus={onContentFocus}
      hasTVPreferredFocus={shouldPreferFocus && index === 0}
    />
  );
};
