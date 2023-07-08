const { network, web3 } = require('hardhat');

async function impersonate(account) {
  await Promise.all([
    network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [account],
    }),
    await setBalance(account),
  ]);
}

async function setBalance(
  account,
  balance = web3.utils.toBN('10000000000000000000000'), // Hardhat default balance
) {
  return network.provider.send('hardhat_setBalance', [account, web3.utils.numberToHex(balance)]);
}

module.exports = {
  impersonate,
  setBalance,
};
