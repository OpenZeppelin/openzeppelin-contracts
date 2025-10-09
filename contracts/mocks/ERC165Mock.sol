// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC165} from "../utils/introspection/IERC165.sol";

/**
 * https://eips.ethereum.org/EIPS/eip-214#specification
 * From the specification:
 * > Any attempts to make state-changing operations inside an execution instance with STATIC set to true will instead
 * throw an exception.
 * > These operations include [...], LOG0, LOG1, LOG2, [...]
 *
 * therefore, because this contract is staticcall'd we need to not emit events (which is how solidity-coverage works)
 * solidity-coverage ignores the /mocks folder, so we duplicate its implementation here to avoid instrumenting it
 */
contract SupportsInterfaceWithLookupMock is IERC165 {
    /*
     * bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7
     */
    bytes4 public constant INTERFACE_ID_ERC165 = 0x01ffc9a7;

    /**
     * @dev A mapping of interface id to whether or not it's supported.
     */
    mapping(bytes4 interfaceId => bool) private _supportedInterfaces;

    /**
     * @dev A contract implementing SupportsInterfaceWithLookup
     * implement ERC-165 itself.
     */
    constructor() {
        _registerInterface(INTERFACE_ID_ERC165);
    }

    /**
     * @dev Implement supportsInterface(bytes4) using a lookup table.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    /**
     * @dev Private method for registering an interface.
     */
    function _registerInterface(bytes4 interfaceId) internal {
        require(interfaceId != 0xffffffff, "ERC165InterfacesSupported: invalid interface id");
        _supportedInterfaces[interfaceId] = true;
    }
}

contract ERC165InterfacesSupported is SupportsInterfaceWithLookupMock {
    constructor(bytes4[] memory interfaceIds) {
        for (uint256 i = 0; i < interfaceIds.length; i++) {
            _registerInterface(interfaceIds[i]);
        }
    }
}

// Similar to ERC165InterfacesSupported, but revert (without reason) when an interface is not supported
contract ERC165RevertInvalid is SupportsInterfaceWithLookupMock {
    constructor(bytes4[] memory interfaceIds) {
        for (uint256 i = 0; i < interfaceIds.length; i++) {
            _registerInterface(interfaceIds[i]);
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        require(super.supportsInterface(interfaceId));
        return true;
    }
}

contract ERC165MaliciousData {
    function supportsInterface(bytes4) public pure returns (bool) {
        assembly {
            mstore(0, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
            return(0, 32)
        }
    }
}

contract ERC165MissingData {
    function supportsInterface(bytes4 interfaceId) public view {} // missing return
}

contract ERC165NotSupported {}

contract ERC165ReturnBombMock is IERC165 {
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        if (interfaceId == type(IERC165).interfaceId) {
            assembly {
                mstore(0, 1)
            }
        }
        assembly {
            return(0, 101500)
        }
    }
}
