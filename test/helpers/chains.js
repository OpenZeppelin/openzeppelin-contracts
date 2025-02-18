// NOTE: this file defines some examples of CAIP-2 and CAIP-10 identifiers.
// The following listing does not pretend to be exhaustive or even accurate. It SHOULD NOT be used in production.

const { ethers } = require('hardhat');
const { mapValues } = require('./iterate');

// EVM (https://axelarscan.io/resources/chains?type=evm)
const ethereum = {
  Ethereum: '1',
  optimism: '10',
  binance: '56',
  Polygon: '137',
  Fantom: '250',
  fraxtal: '252',
  filecoin: '314',
  Moonbeam: '1284',
  centrifuge: '2031',
  kava: '2222',
  mantle: '5000',
  base: '8453',
  immutable: '13371',
  arbitrum: '42161',
  celo: '42220',
  Avalanche: '43114',
  linea: '59144',
  blast: '81457',
  scroll: '534352',
  aurora: '1313161554',
};

// Cosmos (https://axelarscan.io/resources/chains?type=cosmos)
const cosmos = {
  Axelarnet: 'axelar-dojo-1',
  osmosis: 'osmosis-1',
  cosmoshub: 'cosmoshub-4',
  juno: 'juno-1',
  'e-money': 'emoney-3',
  injective: 'injective-1',
  crescent: 'crescent-1',
  kujira: 'kaiyo-1',
  'secret-snip': 'secret-4',
  secret: 'secret-4',
  sei: 'pacific-1',
  stargaze: 'stargaze-1',
  assetmantle: 'mantle-1',
  fetch: 'fetchhub-4',
  ki: 'kichain-2',
  evmos: 'evmos_9001-2',
  aura: 'xstaxy-1',
  comdex: 'comdex-1',
  persistence: 'core-1',
  regen: 'regen-1',
  umee: 'umee-1',
  agoric: 'agoric-3',
  xpla: 'dimension_37-1',
  acre: 'acre_9052-1',
  stride: 'stride-1',
  carbon: 'carbon-1',
  sommelier: 'sommelier-3',
  neutron: 'neutron-1',
  rebus: 'reb_1111-1',
  archway: 'archway-1',
  provenance: 'pio-mainnet-1',
  ixo: 'ixo-5',
  migaloo: 'migaloo-1',
  teritori: 'teritori-1',
  haqq: 'haqq_11235-1',
  celestia: 'celestia',
  ojo: 'agamotto',
  chihuahua: 'chihuahua-1',
  saga: 'ssc-1',
  dymension: 'dymension_1100-1',
  fxcore: 'fxcore',
  c4e: 'perun-1',
  bitsong: 'bitsong-2b',
  nolus: 'pirin-1',
  lava: 'lava-mainnet-1',
  'terra-2': 'phoenix-1',
  terra: 'columbus-5',
};

const makeCAIP = ({ namespace, reference, account }) => ({
  namespace,
  reference,
  account,
  caip2: `${namespace}:${reference}`,
  caip10: `${namespace}:${reference}:${account}`,
  toCaip10: other => `${namespace}:${reference}:${ethers.getAddress(other.target ?? other.address ?? other)}`,
});

module.exports = {
  CHAINS: mapValues(
    Object.assign(
      mapValues(ethereum, reference => ({
        namespace: 'eip155',
        reference,
        account: ethers.Wallet.createRandom().address,
      })),
      mapValues(cosmos, reference => ({
        namespace: 'cosmos',
        reference,
        account: ethers.encodeBase58(ethers.randomBytes(32)),
      })),
    ),
    makeCAIP,
  ),
  getLocalCAIP: account =>
    ethers.provider.getNetwork().then(({ chainId }) => makeCAIP({ namespace: 'eip155', reference: chainId, account })),
};
