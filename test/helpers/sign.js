import utils from 'ethereumjs-util';
import { soliditySha3 } from 'web3-utils';

/**
 * Hash and add same prefix to the hash that ganache use.
 * @param {string} message the plaintext/ascii/original message
 * @return {string} the hash of the message, prefixed, and then hashed again
 */
export const hashMessage = (message) => {
  const messageHex = Buffer.from(utils.sha3(message).toString('hex'), 'hex');
  const prefix = utils.toBuffer('\u0019Ethereum Signed Message:\n' + messageHex.length.toString());
  return utils.bufferToHex(utils.sha3(Buffer.concat([prefix, messageHex])));
};

// signs message in node (auto-applies prefix)
// message must be in hex already! will not be autoconverted!
export const signMessage = (signer, message = '') => {
  return web3.eth.sign(signer, message);
};

export const getBouncerSigner = (contract, signer) => (addr, extra = []) => {
  const args = [
    contract.address,
    addr,
    ...extra,
  ];
  // ^ substr to remove `0x` because in solidity the address is a set of byes, not a string `0xabcd`
  const hashOfMessage = soliditySha3(...args);
  return signMessage(signer, hashOfMessage);
};
