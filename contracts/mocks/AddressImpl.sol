pragma solidity ^0.5.0;

import "../utils/Address.sol";

contract AddressImpl {
    function isContract(address account) external view returns (bool) {
        return Address.isContract(account);
    }

    function toPayable(address account) external pure returns (address payable) {
        return Address.toPayable(account);
    }

    function sendEther(address payable receiver, uint256 amount) external {
        Address.sendEther(receiver, amount);
    }

    function () external payable { } // sendEther's tests require the contract to hold Ether
}
