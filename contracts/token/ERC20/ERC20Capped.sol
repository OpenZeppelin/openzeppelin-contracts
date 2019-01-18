pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "./ERC20Mintable.sol";

/**
 * @title Capped token
 * @dev Mintable token with a token cap.
 */
contract ERC20Capped is Initializable, ERC20Mintable {
    uint256 private _cap;

    function initialize(uint256 cap, address sender) public initializer {
        ERC20Mintable.initialize(sender);

        require(cap > 0);
        _cap = cap;
    }

    /**
     * @return the cap for the token minting.
     */
    function cap() public view returns (uint256) {
        return _cap;
    }

    function _mint(address account, uint256 value) internal {
        require(totalSupply().add(value) <= _cap);
        super._mint(account, value);
    }

    uint256[50] private ______gap;
}
