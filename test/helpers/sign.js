const utils = require('ethereumjs-util');
const { soliditySha3 } = require('web3-utils');

const REAL_SIGNATURE_SIZE = 2 * 65; // 65 bytes in hexadecimal string legnth
const PADDED_SIGNATURE_SIZE = 2 * 96; // 96 bytes in hexadecimal string length

const DUMMY_SIGNATURE = `0x${web3.padLeft('', REAL_SIGNATURE_SIZE)}`;

/**
 * Hash and add same prefix to the hash that ganache use.
 * @param {string} message the plaintext/ascii/original message
 * @return {string} the hash of the message, prefixed, and then hashed again
 */
function hashMessage (message) {
  const messageHex = Buffer.from(utils.sha3(message).toString('hex'), 'hex');
  const prefix = utils.toBuffer('\u0019Ethereum Signed Message:\n' + messageHex.length.toString());
  return utils.bufferToHex(utils.sha3(Buffer.concat([prefix, messageHex])));
}

// signs message in node (auto-applies prefix)
// message must be in hex already! will not be autoconverted!
const signMessage = (signer, message = '') => {
  return web3.eth.sign(signer, message);
};

// @TODO - remove this when we migrate to web3-1.0.0
const transformToFullName = function (json) {
  if (json.name.indexOf('(') !== -1) {
    return json.name;
  }

  const typeName = json.inputs.map(function (i) { return i.type; }).join();
  return json.name + '(' + typeName + ')';
};

/**
 * Create a signer between a contract and a signer for a voucher of method, args, and redeemer
 * Note that `method` is the web3 method, not the truffle-contract method
 * Well truffle is terrible, but luckily (?) so is web3 < 1.0, so we get to make our own method id
 *   fetcher because the method on the contract isn't actually the SolidityFunction object ಠ_ಠ
 * @param contract TruffleContract
 * @param signer address
 * @param redeemer address
 * @param methodName string
 * @param methodArgs any[]
 */
const getBouncerSigner = (contract, signer) => (redeemer, methodName, methodArgs = []) => {
  const parts = [
    contract.address,
    redeemer,
  ];

  // if we have a method, add it to the parts that we're signing
  if (methodName) {
    if (methodArgs.length > 0) {
      parts.push(
        contract.contract[methodName].getData(...methodArgs.concat([DUMMY_SIGNATURE])).slice(
          0,
          -1 * PADDED_SIGNATURE_SIZE
        )
      );
    } else {
      const abi = contract.abi.find(abi => abi.name === methodName);
      const name = transformToFullName(abi);
      const signature = web3.sha3(name).slice(0, 10);
      parts.push(signature);
    }
  }

  // ^ substr to remove `0x` because in solidity the address is a set of byes, not a string `0xabcd`
  const hashOfMessage = soliditySha3(...parts);
  return signMessage(signer, hashOfMessage);
};

module.exports = {
  hashMessage,
  signMessage,
  getBouncerSigner,
};
