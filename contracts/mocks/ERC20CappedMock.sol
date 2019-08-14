pragma solidity ^0.5.0;

import "../token/ERC20/ERC20Capped.sol";
import "./MinterRoleMock.sol";


contract ERC20CappedMock is ERC20Capped, MinterRoleMock {

    constructor(uint256 cap) public {
        ERC20Capped.initialize(cap, _msgSender());
    }

}
