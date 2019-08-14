pragma solidity ^0.5.2;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

import "../GSN/Context.sol";
import "../token/ERC20/ERC20.sol";
import "../token/ERC20/ERC20Detailed.sol";

/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract SimpleToken is Initializable, Context,  ERC20, ERC20Detailed {

    /**
     * @dev Constructor that gives _msgSender() all of existing tokens.
     */
    function initialize(address sender) public initializer {
        ERC20Detailed.initialize("SimpleToken", "SIM", 18);
        _mint(sender, 10000 * (10 ** uint256(decimals())));
    }

    uint256[50] private ______gap;
}
