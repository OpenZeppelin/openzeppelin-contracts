pragma solidity ^0.5.2;

import "./ERC20.sol";
import "../../introspection/ERC165.sol";

/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract ERC20Burnable is ERC165, ERC20 {
    bytes4 private constant _INTERFACE_ID_ERC20_BURNABLE = 0x3b5a0bf8;
    /*
     * 0x3b5a0bf8 ===
     *     bytes4(keccak256('burn(uint256)') ^
     *     bytes4(keccak256('burnFrom(address,uint256)'))
     */

    constructor () public {
        _registerInterface(_INTERFACE_ID_ERC20_BURNABLE);
    }

    /**
     * @dev Burns a specific amount of tokens.
     * @param value The amount of token to be burned.
     */
    function burn(uint256 value) public {
        _burn(msg.sender, value);
    }

    /**
     * @dev Burns a specific amount of tokens from the target address and decrements allowance
     * @param from address The account whose tokens will be burned.
     * @param value uint256 The amount of token to be burned.
     */
    function burnFrom(address from, uint256 value) public {
        _burnFrom(from, value);
    }
}
