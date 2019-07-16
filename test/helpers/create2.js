
// deterministically computes the smart contract address given
// the account the will deploy the contract (factory contract)
// the salt as uint256 and the contract bytecode
const buildCreate2Address = function (saltHex, byteCode, deployerAddress) {
  return web3.utils.toChecksumAddress(`0x${web3.utils.sha3(`0x${[
    'ff',
    deployerAddress,
    saltHex,
    web3.utils.soliditySha3(byteCode),
  ].map(x => x.replace(/0x/, '')).join('')}`).slice(-40)}`);
};

module.exports = {
  buildCreate2Address,
};
