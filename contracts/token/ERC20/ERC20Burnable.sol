pragma solidity ^0.5.2;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

import "../../GSN/Context.sol";
import "./ERC20.sol";

/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract ERC20Burnable is Initializable, Context, ERC20 {
    /**
     * @dev Burns a specific amount of tokens.
     * @param amount The amount of token to be burned.
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Burns a specific amount of tokens from the target address and decrements allowance
     * @param from address The account whose tokens will be burned.
     * @param value uint256 The amount of token to be burned.
     */
    function burnFrom(address from, uint256 value) public {
        _burnFrom(from, value);
    }

    uint256[50] private ______gap;
}
