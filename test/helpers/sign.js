const { web3 } = require('@openzeppelin/test-environment');

function toEthSignedMessageHash (messageHex) {
  const messageBuffer = Buffer.from(messageHex.substring(2), 'hex');
  const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${messageBuffer.length}`);
  return web3.utils.sha3(Buffer.concat([prefix, messageBuffer]));
}

function fixSignature (signature) {
  // in geth its always 27/28, in ganache its 0/1. Change to 27/28 to prevent
  // signature malleability if version is 0/1
  // see https://github.com/ethereum/go-ethereum/blob/v1.8.23/internal/ethapi/api.go#L465
  let v = parseInt(signature.slice(130, 132), 16);
  if (v < 27) {
    v += 27;
  }
  const vHex = v.toString(16);
  return signature.slice(0, 130) + vHex;
}

// signs message in node (ganache auto-applies "Ethereum Signed Message" prefix)
async function signMessage (signer, messageHex = '0x') {
  return fixSignature(await web3.eth.sign(messageHex, signer));
};

/**
 * Create a signer between a contract and a signer for a voucher of method, args, and redeemer
 * Note that `method` is the web3 method, not the truffle-contract method
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

  const REAL_SIGNATURE_SIZE = 2 * 65; // 65 bytes in hexadecimal string legnth
  const PADDED_SIGNATURE_SIZE = 2 * 96; // 96 bytes in hexadecimal string length
  const DUMMY_SIGNATURE = `0x${web3.utils.padLeft('', REAL_SIGNATURE_SIZE)}`;

  // if we have a method, add it to the parts that we're signing
  if (methodName) {
    if (methodArgs.length > 0) {
      parts.push(
        contract.contract.methods[methodName](...methodArgs.concat([DUMMY_SIGNATURE])).encodeABI()
          .slice(0, -1 * PADDED_SIGNATURE_SIZE)
      );
    } else {
      const abi = contract.abi.find(abi => abi.name === methodName);
      parts.push(abi.signature);
    }
  }

  // return the signature of the "Ethereum Signed Message" hash of the hash of `parts`
  const messageHex = web3.utils.soliditySha3(...parts);
  return signMessage(signer, messageHex);
};

module.exports = {
  signMessage,
  toEthSignedMessageHash,
  fixSignature,
  getSignFor,
};
