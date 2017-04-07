Bounty
=============================================

To create a bounty for your contract, inherit from the base `Bounty` contract and provide an implementation for ```deployContract()``` returning the new contract address.::

	import {Bounty, Target} from "./zeppelin/Bounty.sol";
	import "./YourContract.sol";

	contract YourBounty is Bounty {
	function deployContract() internal returns(address) {
	return new YourContract()
	  }
	}


Next, implement invariant logic into your smart contract.
Your main contract should inherit from the Target class and implement the checkInvariant method. This is a function that should check everything your contract assumes to be true all the time. If this function returns false, it means your contract was broken in some way and is in an inconsistent state. This is what security researchers will try to acomplish when trying to get the bounty.

At contracts/YourContract.sol::


	import {Bounty, Target} from "./zeppelin/Bounty.sol";
	contract YourContract is Target {
	  function checkInvariant() returns(bool) {
	    // Implement your logic to make sure that none of the invariants are broken.
	  }
	}

Next, deploy your bounty contract along with your main contract to the network.

At ```migrations/2_deploy_contracts.js```::

	module.exports = function(deployer) {
	  deployer.deploy(YourContract);
	  deployer.deploy(YourBounty);
	};

Next, add a reward to the bounty contract

After deploying the contract, send reward funds into the bounty contract.

From ```truffle console```::

	bounty = YourBounty.deployed();
	address = 0xb9f68f96cde3b895cc9f6b14b856081b41cb96f1; // your account address
	reward = 5; // reward to pay to a researcher who breaks your contract

	web3.eth.sendTransaction({
	  from: address,
	  to: bounty.address,
	  value: web3.toWei(reward, "ether")
	})

If researchers break the contract, they can claim their reward.

For each researcher who wants to hack the contract and claims the reward, refer to our `Test <https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/Bounty.js/>`_ for the detail.

Finally, if you manage to protect your contract from security researchers, you can reclaim the bounty funds. To end the bounty, destroy the contract so that all the rewards go back to the owner.::

	bounty.destroy();
