pragma solidity ^0.4.24;

import "../payment/escrow/ConditionalEscrow.sol";

// mock class using ConditionalEscrow
contract ConditionalEscrowMock is ConditionalEscrow {
    mapping(address => bool) private _allowed;

    function setAllowed(address payee, bool allowed) public {
        _allowed[payee] = allowed;
    }

    function withdrawalAllowed(address payee) public view returns (bool) {
        return _allowed[payee];
    }
}
