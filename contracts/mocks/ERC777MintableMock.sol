pragma solidity ^0.5.0;

import "../token/ERC777/ERC777Mintable.sol";
import "./MinterRoleMock.sol";

contract ERC777MintableMock is ERC777, ERC777Mintable, MinterRoleMock {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) public ERC777(name, symbol, defaultOperators) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
