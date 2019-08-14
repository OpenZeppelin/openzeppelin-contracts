pragma solidity ^0.5.0;

import "../payment/escrow/Escrow.sol";

contract EscrowMock is Escrow {
    constructor() public {
        Escrow.initialize(_msgSender());
    }
}
