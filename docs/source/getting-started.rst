Getting Started
=============================================

OpenZeppelin integrates with `Truffle <https://github.com/ConsenSys/truffle/>`_, an Ethereum development environment. Please install Truffle and initialize your project with ``truffle init``::

	npm install -g truffle
	mkdir myproject && cd myproject
	truffle init

To install the OpenZeppelin library, run::

	npm init # follow instructions
	npm install zeppelin-solidity

	# If you are using yarn, add dependency like this -
	yarn add zeppelin-solidity


After that, you'll get all the library's contracts in the `node_modules/zeppelin-solidity/contracts` folder. You can use the contracts in the library like so::

	import "zeppelin-solidity/contracts/ownership/Ownable.sol";

	contract MyContract is Ownable {
	  ...
	}
