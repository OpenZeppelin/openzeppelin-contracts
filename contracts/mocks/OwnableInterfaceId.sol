pragma solidity ^0.4.24;

import "../ownership/Ownable.sol";

/**
 * @title Ownable interface id calculator.
 * @dev See the EIP165 specification for more information:
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md#specification
 */
contract OwnableInterfaceId {
    function getInterfaceId() public pure returns (bytes4) {
        Ownable i;
        return i.owner.selector ^ i.isOwner.selector ^ i.renounceOwnership.selector ^ i.transferOwnership.selector;
    }
}
