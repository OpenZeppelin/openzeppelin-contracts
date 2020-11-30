// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

abstract contract EIP712 {
    /* solhint-disable var-name-mixedcase */
    // Cache the domain separator as an immutable value, but also store the chain id that it corresponds to, in order to
    // invalidate the cached domain separator if the chain id changes.
    bytes32 private immutable _CACHED_DOMAIN_SEPARATOR;
    uint256 private immutable _CACHED_CHAIN_ID;

    bytes32 private immutable _HASHED_NAME;
    bytes32 private immutable _HASHED_VERSION;
    bytes32 private immutable _TYPE_HASH;
    bytes32 private immutable _TYPE_HASH_SALT;
    /* solhint-enable var-name-mixedcase */

    constructor(string memory name, string memory version) internal {
        bytes32 hashedName = keccak256(bytes(name));
        bytes32 hashedVersion = keccak256(bytes(version));
        bytes32 typeHash = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"); 
        _HASHED_NAME = hashedName;
        _HASHED_VERSION = hashedVersion;
        _CACHED_CHAIN_ID = _getChainId();
        _CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(typeHash, hashedName, hashedVersion);
        _TYPE_HASH = typeHash;
        _TYPE_HASH_SALT = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)");
    }

    function _domainSeparator() internal view returns (bytes32) {
        if (_getChainId() == _CACHED_CHAIN_ID) {
            return _CACHED_DOMAIN_SEPARATOR;
        } else {
            return _buildDomainSeparator(_TYPE_HASH, _HASHED_NAME, _HASHED_VERSION);
        }
    }

    function _domainSeparator(bytes32 salt) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                _TYPE_HASH_SALT,
                _HASHED_NAME,
                _HASHED_VERSION,
                _getChainId(),
                address(this),
                salt
            )
        );
    }

    function _buildDomainSeparator(bytes32 typeHash, bytes32 name, bytes32 version) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                typeHash,
                name,
                version,
                _getChainId(),
                address(this)
            )
        );
    }

    function _getChainId() private pure returns (uint256 chainId) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }
    }
}
