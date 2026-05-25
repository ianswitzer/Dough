import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { TransactionDetailScreen } from '../../src/features/transaction/TransactionDetailScreen';

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionDetailScreen id={id} />;
}
