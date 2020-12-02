// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../drafts/EIP712.sol";
import "../cryptography/ECDSA.sol";

contract EIP712External is EIP712 {
    constructor(string memory name, string memory version) public EIP712(name, version) {}

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function verify(bytes memory signature, address signer, address mailTo, string memory mailContents) external view {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("Mail(address to,string contents)"),
            mailTo,
            keccak256(bytes(mailContents))
        )));
        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == signer);
    }

    function getChainId() external pure returns (uint256 chainId) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }
    }
}
