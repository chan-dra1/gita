import { requireNativeView } from 'expo';
import * as React from 'react';

import { DharmaBlockerViewProps } from './DharmaBlocker.types';

const NativeView: React.ComponentType<DharmaBlockerViewProps> =
  requireNativeView('DharmaBlocker');

export default function DharmaBlockerView(props: DharmaBlockerViewProps) {
  return <NativeView {...props} />;
}
