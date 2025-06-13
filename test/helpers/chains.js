// The following listing does not pretend to be exhaustive or even accurate. It SHOULD NOT be used in production.

const { ethers } = require('hardhat');
const { mapValues } = require('./iterate');

// EVM (https://axelarscan.io/resources/chains?type=evm)
const ethereum = {
  Ethereum: 1n,
  optimism: 10n,
  binance: 56n,
  Polygon: 137n,
  Fantom: 250n,
  fraxtal: 252n,
  filecoin: 314n,
  Moonbeam: 1284n,
  centrifuge: 2031n,
  kava: 2222n,
  mantle: 5000n,
  base: 8453n,
  immutable: 13371n,
  arbitrum: 42161n,
  celo: 42220n,
  Avalanche: 43114n,
  linea: 59144n,
  blast: 81457n,
  scroll: 534352n,
  aurora: 1313161554n,
};

const solana = {
  Mainnet: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
};

const CAIP350 = {
  eip155: { chainType: '0x0000', encoder: { reference: x => ethers.toBigInt(x).toString(), address: ethers.hexlify } },
  solana: { chainType: '0x0002', encoder: { reference: ethers.encodeBase58, address: ethers.encodeBase58 } },
};

const asHex = value => {
  if (value === undefined || value === null || value === '') return '0x';
  try {
    return ethers.toBeHex(value);
  } catch {
    /* Do nothing */
  }
  try {
    return ethers.toBeHex(ethers.decodeBase58(value));
  } catch {
    /* Do nothing */
  }
  try {
    return ethers.toBeHex(ethers.decodeBase64(value));
  } catch {
    /* Do nothing */
  }
  throw new Error(`Unable to decode ${value}`);
};

const formatERC7930v1 = ({ type, reference, address }) => {
  const chainReferenceHex = asHex(reference);
  const addressHex = asHex(address);
  const binary = ethers.solidityPacked(
    [
      'uint16', // version
      'uint16', // type
      'uint8', // chainReferenceLength
      'bytes', // chainReference
      'uint8', // addressLength
      'bytes', // address
    ],
    [
      1n,
      CAIP350[type].chainType,
      ethers.getBytes(chainReferenceHex).length,
      chainReferenceHex,
      ethers.getBytes(addressHex).length,
      addressHex,
    ],
  );
  const checksum = ethers.keccak256(ethers.getBytes(binary).slice(2)).slice(2, 10).toUpperCase();
  const name = [address, '@', type, reference && `:${reference}`, '#', checksum].filter(Boolean).join('');

  return { binary, name, fields: { type, reference, address, checksum } };
};

const parseERC7930v1 = input => {
  const parse = input.match(/((?<address>[.-:_%a-zA-Z0-9]*)@)?(?<chain>[.-:_a-zA-Z0-9]*)#(?<checksum>[0-9A-F]{8})/);
  if (parse) {
    const { address, chain, checksum } = parse.groups;
    const [type, reference] = chain.split(/:(.*)/s);
    const entry = { type, reference: reference || undefined, address: address || undefined };
    return formatERC7930v1(entry)?.fields.checksum === checksum ? entry : null;
  } else if (ethers.isBytesLike(input)) {
    const buffer = ethers.getBytes(input);
    if (ethers.toBigInt(buffer.slice(0, 2)) !== 1n) throw new Error('only version 1 is supported');
    const typeBytes = buffer.slice(2, 4);
    const [type, { encoder }] = Object.entries(CAIP350).find(
      ([, { chainType }]) => chainType == ethers.hexlify(typeBytes),
    );
    const referenceLength = buffer[4];
    const referenceBytes = buffer.slice(5, 5 + referenceLength);
    const reference = referenceLength ? encoder.reference(referenceBytes) : undefined;
    const addressLength = buffer[5 + referenceLength];
    const addressBytes = buffer.slice(6 + referenceLength, 6 + referenceLength + addressLength);
    const address = addressLength ? encoder.address(addressBytes) : undefined;

    return buffer.length >= 6 + referenceLength + addressLength ? { type, reference, address } : null;
  } else {
    return null;
  }
};

const format = ({ namespace, reference }) => ({
  namespace,
  reference: reference.toString(),
  caip2: `${namespace}:${reference}`,
  erc7930: formatERC7930v1({ type: namespace, reference }),
  toCaip10: other => `${namespace}:${reference}:${ethers.getAddress(other.target ?? other.address ?? other)}`,
  toErc7930: other => formatERC7930v1({ type: namespace, reference, address: other.target ?? other.address ?? other }),
});

module.exports = {
  CAIP350,
  CHAINS: mapValues(
    Object.assign(
      mapValues(ethereum, reference => ({ namespace: 'eip155', reference })),
      mapValues(solana, reference => ({ namespace: 'solana', reference })),
    ),
    format,
  ),
  getLocalChain: () =>
    ethers.provider.getNetwork().then(({ chainId }) => format({ namespace: 'eip155', reference: chainId })),
  formatERC7930v1,
  parseERC7930v1,
  asHex,
};
