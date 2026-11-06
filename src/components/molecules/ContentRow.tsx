import React, {useEffect, useRef} from 'react';
import {FlatList, Text} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {HomeContentRow} from '../../data/home';
import {ContentRowCardItem} from './ContentRowCardItem';
import {sizes, spacing} from '../../theme/sizes';
import {styles} from './ContentRow.styles';

interface ContentRowProps {
  row: HomeContentRow;
  onContentFocus: (cardIndex?: number) => void;
  shouldPreferFocus?: boolean;
  focusedCardIndex?: number;
  onMenuEscapeLeft?: () => void;
  selectionSource?: string;
}

export const ContentRow = React.forwardRef<any, ContentRowProps>(
  (
    {
      row,
      onContentFocus,
      shouldPreferFocus,
      focusedCardIndex,
      onMenuEscapeLeft,
      selectionSource,
    }: ContentRowProps,
    ref,
  ) => {
    const listRef = useRef<FlatList<any>>(null);
    const targetCardIndex = Math.min(
      Math.max(0, focusedCardIndex ?? 0),
      Math.max(0, (row.items?.length || 1) - 1),
    );

    const cardWidth =
      row.layout === 'portrait'
        ? sizes.cardWidthPortrait + spacing.huge
        : sizes.cardWidthHorizontal + spacing.huge;

    useEffect(() => {
      if (shouldPreferFocus && targetCardIndex > 0) {
        listRef.current?.scrollToOffset({
          offset: Math.max(0, targetCardIndex * cardWidth - cardWidth),
          animated: true,
        });
      }
    }, [shouldPreferFocus, targetCardIndex, cardWidth]);

    return (
      <TVFocusGuideView
        ref={ref}
        style={styles.guide}>
        <Text style={styles.title}>{row.title}</Text>
        <FlatList
          ref={listRef}
          horizontal
          data={row.items}
          keyExtractor={(item) => item.id}
          renderItem={({item, index}) => (
            <ContentRowCardItem
              item={item}
              index={index}
              layout={row.layout || 'horizontal'}
              onContentFocus={() => onContentFocus(index)}
              shouldPreferFocus={shouldPreferFocus}
              isTargetCard={index === targetCardIndex}
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
          removeClippedSubviews={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={7}
        />
      </TVFocusGuideView>
    );
  },
);
