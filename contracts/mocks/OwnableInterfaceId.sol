pragma solidity ^0.5.0;

import "../ownership/Ownable.sol";

/**
 * @title Ownable interface id calculator.
 * @dev See the EIP165 specification for more information:
 * https://eips.ethereum.org/EIPS/eip-165#specification
 */
contract OwnableInterfaceId {
    function getInterfaceId() public pure returns (bytes4) {
        Ownable i;
        return i.owner.selector ^ i.isOwner.selector ^ i.renounceOwnership.selector ^ i.transferOwnership.selector;
    }
}
