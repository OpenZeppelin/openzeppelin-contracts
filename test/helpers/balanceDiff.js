async function balanceDifference (account, method) {
  const balanceBefore = web3.eth.getBalance(account);
  await method(account);
  const balanceAfter = web3.eth.getBalance(account);
  return balanceAfter.minus(balanceBefore);
}

module.exports = {
  balanceDifference,
};
