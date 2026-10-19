import React from 'react';
import {FlatList, Text} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {HomeContentRow} from '../../data/home';
import {ContentRowCardItem} from './ContentRowCardItem';
import {styles} from './ContentRow.styles';

interface ContentRowProps {
  row: HomeContentRow;
  onContentFocus: () => void;
  shouldPreferFocus?: boolean;
  onMenuEscapeLeft?: () => void;
  selectionSource?: string;
}

export const ContentRow = React.forwardRef<any, ContentRowProps>(
  (
    {
      row,
      onContentFocus,
      shouldPreferFocus,
      onMenuEscapeLeft,
      selectionSource,
    }: ContentRowProps,
    ref,
  ) => {
    return (
      <TVFocusGuideView
        ref={ref}
        style={styles.guide}
        autoFocus={shouldPreferFocus}>
        <Text style={styles.title}>{row.title}</Text>
        <FlatList
          horizontal
          data={row.items}
          keyExtractor={(item) => item.id}
          renderItem={({item, index}) => (
            <ContentRowCardItem
              item={item}
              index={index}
              layout={row.layout || 'horizontal'}
              onContentFocus={onContentFocus}
              shouldPreferFocus={shouldPreferFocus}
              onMenuEscapeLeft={onMenuEscapeLeft}
              rowId={row.id}
              selectionSource={selectionSource}
              isRecommendation={
                row.id === 'recommended-for-you' ||
                row.id === 'because-you-watched' ||
                row.id === 'recently-added'
              }
              recommendationSource={
                row.id === 'recommended-for-you'
                  ? 'genre_match'
                  : row.id === 'because-you-watched'
                  ? 'viewing_history'
                  : row.id === 'recently-added'
                  ? 'recently_added'
                  : undefined
              }
              sectionName={row.title}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      </TVFocusGuideView>
    );
  },
);
