import 'hardhat/types/network';

import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/types';
import type { BytesLike, Contract, TransactionReceipt } from 'ethers';
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

export type ClockType<T> = { blockNumber: T; timestamp: T };

declare module 'hardhat/types/network' {
  interface NetworkConnection<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the ChainTypeT must be declared in the interface but in this scenario it's not used
    ChainTypeT extends ChainType | string = DefaultChainType,
  > {
    helpers: {
      chain: Chain;
      impersonate: (account: AddressLike, balance?: bigint) => Promise<HardhatEthersSigner>;
      storage: {
        getSlot: (address: AddressLike, slot: BytesLike | string) => Promise<string>;
        getAddressInSlot: (address: AddressLike, slot: BytesLike | string) => Promise<string>;
        setSlot: (address: AddressLike, slot: BytesLike | string, value: AddressLike | string) => Promise<void>;
      };
      time: {
        clock: ClockType<() => Promise<bigint>>;
        clockFromReceipt: ClockType<(receipt: TransactionReceipt) => Promise<bigint>>;
        increaseBy: ClockType<(delay: bigint, mine?: boolean) => Promise<void>>;
        increaseTo: ClockType<(to: bigint, mine?: boolean) => Promise<void>>;
        duration: {
          years: (value: bigint) => bigint;
          weeks: (value: bigint) => bigint;
          days: (value: bigint) => bigint;
          hours: (value: bigint) => bigint;
          minutes: (value: bigint) => bigint;
          seconds: (value: bigint) => bigint;
          millis: (value: bigint) => bigint;
        };
      };
    };
  }
}
