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
  selectionSource?: string;
  isRecommendation?: boolean;
  recommendationSource?: string;
  sectionName?: string;
}

export const ContentRowCardItem = ({
  item,
  index,
  layout = 'horizontal',
  onContentFocus,
  shouldPreferFocus,
  onMenuEscapeLeft,
  rowId,
  selectionSource,
  isRecommendation,
  recommendationSource,
  sectionName,
}: ContentRowCardItemProps) => {
  return (
    <ContentCard
      {...item}
      layout={layout}
      rowId={rowId}
      isContinueWatching={rowId === 'continue-watching'}
      isWatchlist={rowId === 'my-list'}
      isRecommendation={
        isRecommendation ||
        rowId === 'recommended-for-you' ||
        rowId === 'because-you-watched' ||
        rowId === 'recently-added'
      }
      recommendationSource={recommendationSource}
      position={index}
      sectionName={sectionName}
      selectionSource={
        rowId === 'my-list' ? 'watchlist' : selectionSource
      }
      savedPositionSeconds={item.savedPositionSeconds}
      contentType={item.contentType}
      testID={
        rowId &&
        (rowId === 'recommended-for-you' ||
          rowId === 'because-you-watched' ||
          rowId === 'recently-added')
          ? `${rowId}-card-${item.id}`
          : `content-card-${item.id}`
      }
      onFocus={onContentFocus}
      hasTVPreferredFocus={shouldPreferFocus && index === 0}
      onMenuEscapeLeft={index === 0 ? onMenuEscapeLeft : undefined}
    />
  );
};
