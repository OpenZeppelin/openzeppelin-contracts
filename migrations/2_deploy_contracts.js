module.exports = function(deployer) {
  deployer.deploy(Ownable);
  deployer.deploy(Claimable);
  deployer.deploy(LimitBalance);
  if(deployer.network == 'test'){
    deployer.deploy(SecureTargetBounty);
    deployer.deploy(InsecureTargetBounty);
  }
};
