pragma solidity ^0.5.2;

import "./IERC20.sol";
import "../../introspection/ERC165.sol";

/**
 * @title ERC20Detailed token
 * @dev The decimals are only for visualization purposes.
 * All the operations are done using the smallest and indivisible token unit,
 * just as on Ethereum all the operations are done in wei.
 */
contract ERC20Detailed is ERC165, IERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    bytes4 private constant _INTERFACE_ID_ERC20_DETAILED = 0xa219a025;
    /*
     * 0xa219a025 ===
     *     bytes4(keccak256('name()') ^
     *     bytes4(keccak256('symbol()')) ^
     *     bytes4(keccak256('decimals)'))
     */

    constructor (string memory name, string memory symbol, uint8 decimals) public {
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
        _registerInterface(_INTERFACE_ID_ERC20_DETAILED);
    }

    /**
     * @return the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @return the symbol of the token.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @return the number of decimals of the token.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }
}
