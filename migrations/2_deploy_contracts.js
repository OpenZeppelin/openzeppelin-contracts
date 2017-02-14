var Ownable = artifacts.require("ownership/Ownable.sol");
var Claimable = artifacts.require("ownership/Claimable.sol");
var LimitBalance = artifacts.require("LimitBalance.sol");
var SecureTargetBounty = artifacts.require("test-helpers/SecureTargetBounty.sol");
var InsecureTargetBounty = artifacts.require("test-helpers/InsecureTargetBounty.sol");

module.exports = function(deployer) {
  deployer.deploy(Ownable);
  deployer.deploy(Claimable);
  deployer.deploy(LimitBalance);
  if(deployer.network == 'test'){
    deployer.deploy(SecureTargetBounty);
    deployer.deploy(InsecureTargetBounty);
  }
};
