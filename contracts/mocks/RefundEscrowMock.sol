pragma solidity ^0.5.0;

import "../payment/escrow/RefundEscrow.sol";

contract RefundEscrowMock is RefundEscrow {
    constructor(address payable beneficiary) public {
        RefundEscrow.initialize(beneficiary, _msgSender());
    }
}
