pragma solidity >=0.4.24 <=0.5.1;

import "../token/ERC20/ERC20.sol";
import "../token/ERC20/ERC20Detailed.sol";

/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract SimpleToken is ERC20, ERC20Detailed {
    string private constant _name = "SimpleToken";
    string private constant _symbol = "SIM";
    uint8 private constant _decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(_decimals));

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor () public ERC20Detailed(_name, _symbol, _decimals) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
