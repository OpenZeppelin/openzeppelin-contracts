import 'hardhat/types/network';

import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/types';
import type { Contract, TransactionReceipt } from 'ethers';
import type { InteroperableAddress } from 'interoperable-addresses';

type AddressLike = HardhatEthersSigner | Contract | string;

export interface Chain {
  namespace: string;
  reference: string;
  caip2: string;
  erc7930: InteroperableAddress;
  toCaip10: (other: AddressLike) => string;
  toErc7930: (other: AddressLike) => InteroperableAddress;
}

export type ClockType<T> = Map<'blocknumber' | 'timestamp', T>;

declare module 'hardhat/types/network' {
  interface NetworkConnection<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the ChainTypeT must be declared in the interface but in this scenario it's not used
    ChainTypeT extends ChainType | string = DefaultChainType,
  > {
    helpers: {
      chain: Chain;
      impersonate: (connection: ChainTypeT) => (account: AddressLike, balance?: bigint) => Promise<HardhatEthersSigner>;
      time: {
        clock: ClockType<() => Promise<bigint>>;
        clockFromReceipt: ClockType<(receipt: TransactionReceipt) => Promise<bigint>>;
        increaseBy: ClockType<(delay: bigint, mine?: boolean) => Promise<void>>;
        increaseTo: ClockType<(to: bigint, mine?: boolean) => Promise<void>>;
        duration: ClockType<Map<string, (value: bigint) => bigint>>;
      };
    };
  }
}
