const { ethers } = require('ethers');

const TYPES = [
  { bits: 2n, name: 'PairMap' },
  { bits: 4n, name: 'NibbleMap' },
  { bits: 8n },
  { bits: 16n },
  { bits: 32n },
  { bits: 64n },
  { bits: 128n },
].map(({ bits, name = `Uint${bits}Map` }) => ({
  bits,
  name,
  max: ethers.toBeHex((1n << bits) - 1n),
  mask: ethers.toBeHex(256n / bits - 1n),
  type: `uint${Math.max(Number(bits), 8)}`,
  width: Math.log2(Number(bits)),
}));

module.exports = { TYPES };
