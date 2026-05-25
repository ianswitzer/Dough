import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { CategoryEditScreen } from '../../../src/features/category/CategoryEditScreen';

export default function EditCategory() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <CategoryEditScreen slug={slug} />;
}
