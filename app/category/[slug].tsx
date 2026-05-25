import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { CategoryDetailScreen } from '../../src/features/category/CategoryDetailScreen';

export default function CategoryDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <CategoryDetailScreen slug={slug} />;
}
