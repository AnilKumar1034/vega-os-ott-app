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
}

export const ContentRow = ({
  row,
  onContentFocus,
  shouldPreferFocus,
}: ContentRowProps) => {
  return (
    <TVFocusGuideView style={styles.guide} autoFocus>
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
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </TVFocusGuideView>
  );
};
