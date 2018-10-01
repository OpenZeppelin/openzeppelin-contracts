async function balanceDifference (account, method) {
    let balanceBefore = web3.eth.getBalance(account);
    await method(account);
    let balanceAfter = web3.eth.getBalance(account);
    return balanceAfter.minus(balanceBefore);
  }
  
  module.exports = {
    balanceDifference
  };