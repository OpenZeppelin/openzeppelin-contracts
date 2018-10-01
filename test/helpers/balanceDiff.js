async function balanceDifference (account, promise) {
  const balanceBefore = web3.eth.getBalance(account);
  await promise();
  const balanceAfter = web3.eth.getBalance(account);
  return balanceAfter.minus(balanceBefore);
}

module.exports = {
  balanceDifference,
};
