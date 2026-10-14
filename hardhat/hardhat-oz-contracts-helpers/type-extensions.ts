import 'hardhat/types/network';

import { impersonate } from './internal/account.js';
import { format } from './internal/chains.js';
import { clock, clockFromReceipt, increaseBy, increaseTo, duration } from './internal/time.js';
import { getSlot, getAddressInSlot, setSlot } from './internal/storage.js';

declare module 'hardhat/types/network' {
  interface NetworkConnection<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the ChainTypeT must be declared in the interface but in this scenario it's not used
    ChainTypeT extends ChainType | string = DefaultChainType,
  > {
    helpers: {
      chain: ReturnType<typeof format>;
      impersonate: ReturnType<typeof impersonate>;
      storage: {
        getSlot: ReturnType<typeof getSlot>;
        getAddressInSlot: ReturnType<typeof getAddressInSlot>;
        setSlot: ReturnType<typeof setSlot>;
      };
      time: {
        clock: ReturnType<typeof clock>;
        clockFromReceipt: ReturnType<typeof clockFromReceipt>;
        increaseBy: ReturnType<typeof increaseBy>;
        increaseTo: ReturnType<typeof increaseTo>;
        duration: ReturnType<typeof duration>;
      };
    };
  }
}
