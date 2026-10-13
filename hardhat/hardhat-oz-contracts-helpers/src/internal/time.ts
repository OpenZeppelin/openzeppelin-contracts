import { ethers } from 'ethers';
import type { ChainType, NetworkConnection } from 'hardhat/types/network';

export const clock = <ChainTypeT extends ChainType | string>({ networkHelpers }: NetworkConnection<ChainTypeT>) => ({
  blockNumber: () => networkHelpers.time.latestBlock().then(ethers.toBigInt),
  timestamp: () => networkHelpers.time.latest().then(ethers.toBigInt),
});

export const clockFromReceipt = <ChainTypeT extends ChainType | string>({ ethers }: NetworkConnection<ChainTypeT>) => ({
  blockNumber: (receipt: Promise<ethers.TransactionReceipt>) =>
    Promise.resolve(receipt).then(({ blockNumber }) => ethers.toBigInt(blockNumber)),
  timestamp: (receipt: Promise<ethers.TransactionReceipt>) =>
    Promise.resolve(receipt)
      .then(({ blockNumber }) => ethers.provider.getBlock(blockNumber) as Promise<ethers.Block>) // receipt necessarily correspond to a block that exists
      .then(({ timestamp }) => ethers.toBigInt(timestamp)),
});

export const increaseBy = <ChainTypeT extends ChainType | string>({
  networkHelpers,
}: NetworkConnection<ChainTypeT>) => ({
  blockNumber: networkHelpers.mine,
  timestamp: (delay: ethers.BigNumberish, mine = true) =>
    networkHelpers.time
      .latest()
      .then(clock => clock + ethers.toNumber(delay))
      .then(to => (mine ? networkHelpers.time.increaseTo(to) : networkHelpers.time.setNextBlockTimestamp(to))),
});

export const increaseTo = <ChainTypeT extends ChainType | string>({
  networkHelpers,
}: NetworkConnection<ChainTypeT>) => ({
  blockNumber: networkHelpers.mineUpTo,
  timestamp: (to: ethers.BigNumberish, mine = true) =>
    mine ? networkHelpers.time.increaseTo(to) : networkHelpers.time.setNextBlockTimestamp(to),
});

export const duration = <ChainTypeT extends ChainType | string>({ networkHelpers }: NetworkConnection<ChainTypeT>) => ({
  years: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.years(ethers.toNumber(n))),
  weeks: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.weeks(ethers.toNumber(n))),
  days: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.days(ethers.toNumber(n))),
  hours: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.hours(ethers.toNumber(n))),
  minutes: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.minutes(ethers.toNumber(n))),
  seconds: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.seconds(ethers.toNumber(n))),
  millis: (n: ethers.BigNumberish) => ethers.toBigInt(networkHelpers.time.duration.millis(ethers.toNumber(n))),
});
