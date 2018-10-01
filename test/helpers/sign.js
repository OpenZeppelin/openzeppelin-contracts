const { sha3, soliditySha3 } = require('web3-utils');

const REAL_SIGNATURE_SIZE = 2 * 65; // 65 bytes in hexadecimal string legnth
const PADDED_SIGNATURE_SIZE = 2 * 96; // 96 bytes in hexadecimal string length

const DUMMY_SIGNATURE = `0x${web3.padLeft('', REAL_SIGNATURE_SIZE)}`;

// messageHex = '0xdeadbeef'
function toEthSignedMessageHash (messageHex) {
  const messageBuffer = Buffer.from(messageHex.substring(2), 'hex');
  const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${messageBuffer.length}`);
  return sha3(Buffer.concat([prefix, messageBuffer]));
}

// signs message in node (ganache auto-applies "Ethereum Signed Message" prefix)
// messageHex = '0xdeadbeef'
const signMessage = (signer, messageHex = '0x') => {
  return web3.eth.sign(signer, messageHex); // actually personal_sign
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
const getSignFor = (contract, signer) => (redeemer, methodName, methodArgs = []) => {
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
      const signature = sha3(name).slice(0, 10);
      parts.push(signature);
    }
  }

  // return the signature of the "Ethereum Signed Message" hash of the hash of `parts`
  const messageHex = soliditySha3(...parts);
  return signMessage(signer, messageHex);
};

module.exports = {
  signMessage,
  toEthSignedMessageHash,
  getSignFor,
};
