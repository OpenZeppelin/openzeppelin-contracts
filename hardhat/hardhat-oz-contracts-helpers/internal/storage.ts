import { ethers } from 'ethers';
import type { ChainType, NetworkConnection } from 'hardhat/types/network';

const erc1967Slot = (label: string) => ethers.toBeHex(ethers.toBigInt(ethers.id(label)) - 1n);

export const getSlot =
  <ChainTypeT extends ChainType | string>({ ethers, networkHelpers }: NetworkConnection<ChainTypeT>) =>
  (address: ethers.AddressLike, slot: ethers.BytesLike | string) =>
    Promise.resolve(ethers.resolveAddress(address)).then(address =>
      networkHelpers.getStorageAt(address, ethers.toBigInt(ethers.isBytesLike(slot) ? slot : erc1967Slot(slot))),
    );

export const getAddressInSlot =
  <ChainTypeT extends ChainType | string>(connection: NetworkConnection<ChainTypeT>) =>
  (address: ethers.AddressLike, slot: ethers.BytesLike | string) =>
    getSlot(connection)(address, slot).then(
      slotValue => ethers.AbiCoder.defaultAbiCoder().decode(['address'], slotValue)[0],
    );

export const setSlot =
  <ChainTypeT extends ChainType | string>({ ethers, networkHelpers }: NetworkConnection<ChainTypeT>) =>
  (address: ethers.AddressLike, slot: ethers.BytesLike | string, value: ethers.AddressLike) =>
    Promise.all([ethers.resolveAddress(address), ethers.resolveAddress(value)]).then(([address, value]) =>
      networkHelpers.setStorageAt(address, ethers.toBigInt(ethers.isBytesLike(slot) ? slot : erc1967Slot(slot)), value),
    );
