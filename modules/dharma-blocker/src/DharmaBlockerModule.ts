import { NativeModule, requireNativeModule } from 'expo';

import { DharmaBlockerModuleEvents } from './DharmaBlocker.types';

declare class DharmaBlockerModule extends NativeModule<DharmaBlockerModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<DharmaBlockerModule>('DharmaBlocker');
