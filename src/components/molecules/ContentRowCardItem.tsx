import React from 'react';
import {CardLayoutType, HomeContentItem} from '../../data/home';
import {ContentCard} from './ContentCard';

interface ContentRowCardItemProps {
  item: HomeContentItem;
  index: number;
  layout?: CardLayoutType;
  onContentFocus: () => void;
  shouldPreferFocus?: boolean;
  onMenuEscapeLeft?: () => void;
}

export const ContentRowCardItem = ({
  item,
  index,
  layout = 'horizontal',
  onContentFocus,
  shouldPreferFocus,
  onMenuEscapeLeft,
}: ContentRowCardItemProps) => {
  return (
    <ContentCard
      {...item}
      layout={layout}
      testID={`content-card-${item.id}`}
      onFocus={onContentFocus}
      hasTVPreferredFocus={shouldPreferFocus && index === 0}
      onMenuEscapeLeft={index === 0 ? onMenuEscapeLeft : undefined}
    />
  );
};
