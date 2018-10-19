pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./ERC20Detailed.sol";
import "./ERC20Mintable.sol";
import "./ERC20Pausable.sol";


/**
 * @title Standard ERC20 token, with minting and pause functionality.
 *
 */
contract StandaloneERC20 is Initializable, ERC20Detailed, ERC20Mintable, ERC20Pausable {
  function initialize(
    string name, string symbol, uint8 decimals, uint256 initialSupply, address initialHolder,
    address[] minters, address[] pausers
  ) public initializer {
    require(initialSupply > 0);

    ERC20Detailed.initialize(name, symbol, decimals);

    // Mint the initial supply
    _mint(initialHolder, initialSupply);

    // Initialize the minter and pauser roles, and renounce them
    ERC20Mintable.initialize(address(this));
    renounceMinter();

    ERC20Pausable.initialize(address(this));
    renouncePauser();

    // Add the requested minters and pausers (this can be done after renouncing since
    // these are the internal calls)
    for (uint256 i = 0; i < minters.length; ++i) {
      _addMinter(minters[i]);
    }

    for (i = 0; i < pausers.length; ++i) {
      _addPauser(pausers[i]);
    }
  }

  function initialize(
    string name, string symbol, uint8 decimals, address[] minters, address[] pausers
  ) public initializer {
    ERC20Detailed.initialize(name, symbol, decimals);

    // Initialize the minter and pauser roles, and renounce them
    ERC20Mintable.initialize(address(this));
    renounceMinter();

    ERC20Pausable.initialize(address(this));
    renouncePauser();

    // Add the requested minters and pausers (this can be done after renouncing since
    // these are the internal calls)
    for (uint256 i = 0; i < minters.length; ++i) {
      _addMinter(minters[i]);
    }

    for (i = 0; i < pausers.length; ++i) {
      _addPauser(pausers[i]);
    }
  }
}
