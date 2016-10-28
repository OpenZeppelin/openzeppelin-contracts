module.exports = function(deployer) {
  deployer.deploy(PullPaymentBid);
  deployer.deploy(BadArrayUse);
  deployer.deploy(ProofOfExistence);
  deployer.deploy(Ownable);
  deployer.deploy(LimitFunds);

  if(deployer.network == 'test'){
    deployer.deploy(SecureTargetFactory);
    deployer.deploy(InsecureTargetFactory);
  };
};
