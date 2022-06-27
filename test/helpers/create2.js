function computeCreate2Address (saltHex, bytecode, deployer) {
  return web3.utils.toChecksumAddress(`0x${web3.utils.sha3(`0x${[
    'ff',
    deployer,
    saltHex,
    web3.utils.soliditySha3(bytecode),
  ].map(x => x.replace(/0x/, '')).join('')}`).slice(-40)}`);
}

module.exports = {
  computeCreate2Address,
};
