import 'hardhat/types/network';

import type { impersonate } from './internal/account.ts';
import type { format } from './internal/chains.ts';
import type { clock, clockFromReceipt, increaseBy, increaseTo, duration } from './internal/time.ts';
import type { getSlot, getAddressInSlot, setSlot } from './internal/storage.ts';

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
