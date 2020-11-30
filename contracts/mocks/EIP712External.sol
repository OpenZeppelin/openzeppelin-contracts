// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../cryptography/EIP712.sol";

contract EIP712External is EIP712 {
    constructor(string memory name, string memory version) public EIP712(name, version) {}

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparator();
    }

    function domainSeparator(bytes32 salt) external view returns (bytes32) {
        return _domainSeparator(salt);
    }

    function getChainId() external pure returns (uint256 chainId) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }
    }
}
