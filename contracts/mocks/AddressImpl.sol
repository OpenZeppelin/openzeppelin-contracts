pragma solidity ^0.5.0;

import "../utils/Address.sol";

contract AddressImpl {
    function isContract(address account) external view returns (bool) {
        return Address.isContract(account);
    }

    function toPayable(address account) internal pure returns (address payable) {
        return address(uint160(account));
    }
}
