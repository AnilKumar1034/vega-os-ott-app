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
  rowId?: string;
}

export const ContentRowCardItem = ({
  item,
  index,
  layout = 'horizontal',
  onContentFocus,
  shouldPreferFocus,
  onMenuEscapeLeft,
  rowId,
}: ContentRowCardItemProps) => {
  return (
    <ContentCard
      {...item}
      layout={layout}
      rowId={rowId}
      isContinueWatching={rowId === 'continue-watching'}
      savedPositionSeconds={item.savedPositionSeconds}
      contentType={item.contentType}
      testID={`content-card-${item.id}`}
      onFocus={onContentFocus}
      hasTVPreferredFocus={shouldPreferFocus && index === 0}
      onMenuEscapeLeft={index === 0 ? onMenuEscapeLeft : undefined}
    />
  );
};
