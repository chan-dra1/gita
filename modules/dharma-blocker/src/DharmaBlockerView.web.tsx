import * as React from 'react';

import { DharmaBlockerViewProps } from './DharmaBlocker.types';

export default function DharmaBlockerView(props: DharmaBlockerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
