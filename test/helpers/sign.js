import utils from 'ethereumjs-util';

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

// signs message using web3 (auto-applies prefix)
export const signMessage = (signer, message = '', options = {}) => {
  return web3.eth.sign(signer, web3.sha3(message, options));
};

// signs hex string using web3 (auto-applies prefix)
export const signHex = (signer, message = '') => {
  return signMessage(signer, message, { encoding: 'hex' });
};
