Getting Started
=============================================

Zeppelin integrates with `Truffle <https://github.com/ConsenSys/truffle/>`_, an Ethereum development environment. Please install Truffle and initialize your project with ``truffle init``::

	npm install -g truffle
	mkdir myproject && cd myproject
	truffle init

To install the Zeppelin library, run::

	npm i zeppelin-solidity

After that, you'll get all the library's contracts in the contracts/zeppelin folder. You can use the contracts in the library like so::

	import "zeppelin-solidity/contracts/Ownable.sol";

	contract MyContract is Ownable {
	  ...
	}

.. epigraph::

   NOTE: The current distribution channel is npm, which is not ideal. `We're looking into providing a better tool for code distribution <https://github.com/OpenZeppelin/zeppelin-solidity/issues/13/>`_ , and ideas are welcome.

Truffle Beta Support
""""""""""""""""""""""""
We also support Truffle Beta npm integration. If you're using Truffle Beta, the contracts in ``node_modules`` will be enough, so feel free to delete the copies at your ``contracts`` folder. If you're using Truffle Beta, you can use Zeppelin contracts like so::

	import "zeppelin-solidity/contracts/Ownable.sol";

	contract MyContract is Ownable {
	  ...
	}

For more info see the `Truffle Beta package management tutorial <http://truffleframework.com/tutorials/package-management/>`_.
