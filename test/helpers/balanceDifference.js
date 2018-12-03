const { ethGetBalance } = require('./web3');

async function balanceDifference (account, promiseFunc) {
  const balanceBefore = await ethGetBalance(account);
  await promiseFunc();
  const balanceAfter = await ethGetBalance(account);
  return balanceAfter.minus(balanceBefore);
}

module.exports = {
  balanceDifference,
};
