const RLP = require('rlp');

function computeCreateAddress(deployer, nonce) {
  return web3.utils.toChecksumAddress(web3.utils.sha3(RLP.encode([deployer.address ?? deployer, nonce])).slice(-40));
}

function computeCreate2Address(saltHex, bytecode, deployer) {
  return web3.utils.toChecksumAddress(
    web3.utils
      .sha3(
        `0x${['ff', deployer.address ?? deployer, saltHex, web3.utils.soliditySha3(bytecode)]
          .map(x => x.replace(/0x/, ''))
          .join('')}`,
      )
      .slice(-40),
  );
}

module.exports = {
  computeCreateAddress,
  computeCreate2Address,
};
