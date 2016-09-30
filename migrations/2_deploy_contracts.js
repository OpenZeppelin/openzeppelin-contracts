module.exports = function(deployer) {
  deployer.deploy(PullPaymentBid);
  deployer.deploy(BadArrayUse);
  deployer.deploy(ProofOfExistence);
  deployer.deploy(Bounty);
  deployer.deploy(Ownable);
  deployer.deploy(LimitFunds);
};
