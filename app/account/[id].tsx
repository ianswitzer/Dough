import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { EditAccountScreen } from '../../src/features/account/EditAccountScreen';

export default function EditAccount() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditAccountScreen id={id} />;
}
