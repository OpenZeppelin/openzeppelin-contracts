import type { HookContext, NetworkHooks } from 'hardhat/types/hooks';
import type { ChainType, NetworkConnection } from 'hardhat/types/network';

import { impersonate } from '../internal/account.js';
import { format } from '../internal/chains.js';
import { clock, clockFromReceipt, increaseBy, increaseTo, duration } from '../internal/time.js';
import { getSlot, getAddressInSlot, setSlot } from '../internal/storage.js';

export type * from '../type-extensions.ts';

export default async (): Promise<Partial<NetworkHooks>> => ({
  newConnection: async <ChainTypeT extends ChainType | string>(
    context: HookContext,
    next: (nextContext: HookContext) => Promise<NetworkConnection<ChainTypeT>>,
  ): Promise<NetworkConnection<ChainTypeT>> =>
    next(context).then(async connection =>
      Object.assign(connection, {
        helpers: {
          chain: await connection.provider
            .request({ method: 'eth_chainId' })
            .then((chainId: any) => format({ chainType: 'eip155', reference: connection.ethers.toBigInt(chainId) })),
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
