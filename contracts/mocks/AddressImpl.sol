pragma solidity ^0.6.0;

import "../utils/Address.sol";

contract AddressImpl {
    function isContract(address account) external view returns (bool) {
        return Address.isContract(account);
    }

    function sendValue(address payable receiver, uint256 amount) external {
        Address.sendValue(receiver, amount);
    }

    // sendValue's tests require the contract to hold Ether
    receive () external payable { }
}
