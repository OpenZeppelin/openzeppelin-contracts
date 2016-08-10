module.exports = function(deployer) {
  deployer.deploy(BadFailEarly);
  deployer.deploy(GoodFailEarly);
  deployer.deploy(PullPaymentBid);
};
