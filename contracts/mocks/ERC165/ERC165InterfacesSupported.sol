pragma solidity ^0.4.24;

import "../../introspection/IERC165.sol";

/**
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-214.md#specification
 * > Any attempts to make state-changing operations inside an execution instance with STATIC set to true will instead throw an exception.
 * > These operations include [...], LOG0, LOG1, LOG2, [...]
 *
 * therefore, because this contract is staticcall'd we need to not emit events (which is how solidity-coverage works)
 * solidity-coverage ignores the /mocks folder, so we duplicate its implementation here to avoid instrumenting it
 */
contract SupportsInterfaceWithLookupMock is IERC165 {
    bytes4 public constant InterfaceId_ERC165 = 0x01ffc9a7;
    /**
     * 0x01ffc9a7 ===
     *     bytes4(keccak256('supportsInterface(bytes4)'))
     */

    /**
     * @dev a mapping of interface id to whether or not it's supported
     */
    mapping(bytes4 => bool) private _supportedInterfaces;

    /**
     * @dev A contract implementing SupportsInterfaceWithLookup
     * implement ERC165 itself
     */
    constructor () public {
        _registerInterface(InterfaceId_ERC165);
    }

    /**
     * @dev implement supportsInterface(bytes4) using a lookup table
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    /**
     * @dev private method for registering an interface
     */
    function _registerInterface(bytes4 interfaceId) internal {
        require(interfaceId != 0xffffffff);
        _supportedInterfaces[interfaceId] = true;
    }
}

contract ERC165InterfacesSupported is SupportsInterfaceWithLookupMock {
    constructor (bytes4[] interfaceIds) public {
        for (uint256 i = 0; i < interfaceIds.length; i++) {
            _registerInterface(interfaceIds[i]);
        }
    }
}
