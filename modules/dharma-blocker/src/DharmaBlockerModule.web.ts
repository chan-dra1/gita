import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './DharmaBlocker.types';

type DharmaBlockerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class DharmaBlockerModule extends NativeModule<DharmaBlockerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(DharmaBlockerModule, 'DharmaBlockerModule');
