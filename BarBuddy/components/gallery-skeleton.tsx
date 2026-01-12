
import { View, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
// @ts-ignore
import { Video } from 'expo-av';

// Accepts a prop: jobs (array of job JSONs)
type GallerySkeletonProps = {
  jobs?: Array<any>;
};

export function GallerySkeleton({ jobs }: GallerySkeletonProps) {
  // Show 9 skeleton items in a grid
  const data = Array.from({ length: 9 });

  return (
    <ThemedView style={styles.galleryContainer}>
      <FlatList
        data={data}
        numColumns={3}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={() => <View style={styles.skeletonItem} />}
        contentContainerStyle={styles.grid}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  skeletonItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    width: 100,
    height: 100,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
});
