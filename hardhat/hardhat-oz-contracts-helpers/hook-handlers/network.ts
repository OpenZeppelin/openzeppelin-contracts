import type { HookContext, NetworkHooks } from 'hardhat/types/hooks';
import type { ChainType, NetworkConnection } from 'hardhat/types/network';

import { impersonate } from '../../../test/helpers/account.js';
import { getLocalChain } from '../../../test/helpers/chains.js';
import { getSlot, getAddressInSlot, setSlot } from '../../../test/helpers/storage.js';
import { clock, clockFromReceipt, increaseBy, increaseTo, duration } from '../../../test/helpers/time.js';

export default async (): Promise<Partial<NetworkHooks>> => ({
  newConnection: async <ChainTypeT extends ChainType | string>(
    context: HookContext,
    next: (nextContext: HookContext) => Promise<NetworkConnection<ChainTypeT>>,
  ): Promise<NetworkConnection<ChainTypeT>> =>
    next(context).then(async connection =>
      Object.assign(connection, {
        helpers: {
          chain: await getLocalChain(connection.provider),
          impersonate: impersonate(connection),
          storage: {
            getSlot: getSlot(connection),
            getAddressInSlot: getAddressInSlot(connection),
            setSlot: setSlot(connection),
          },
          time: {
            clock: clock(connection),
            clockFromReceipt: clockFromReceipt(connection),
            increaseBy: increaseBy(connection),
            increaseTo: increaseTo(connection),
            duration: duration(connection),
          },
        },
      }),
    ),
});
