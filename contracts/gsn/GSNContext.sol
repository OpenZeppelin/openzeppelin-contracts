pragma solidity ^0.5.0;

import "./Context.sol";

/*
 * @dev Enables GSN support on `Context` contracts by recognizing calls from
 * RelayHub and extracting the actual sender and call data from the received
 * calldata.
 *
 * This contract does not perform all required tasks to implement a GSN
 * recipient contract: end users should use `GSNRecipient` instead.
 */
contract GSNContext is Context {
    // We use a random storage slot to allow proxy contracts to enable GSN support in an upgrade without changing their
    // storage layout. This value is calculated as: keccak256('gsn.relayhub.address')
    bytes32 private constant RELAY_HUB_ADDRESS_STORAGE_SLOT = 0x06b7792c761dcc05af1761f0315ce8b01ac39c16cc934eb0b2f7a8e71414f263;

    event RelayHubUpgraded(address indexed oldRelayHub, address indexed newRelayHub);

    constructor() internal {
        _upgradeRelayHub(0x537F27a04470242ff6b2c3ad247A05248d0d27CE);
    }

    function _getRelayHub() internal view returns (address relayHub) {
        bytes32 slot = RELAY_HUB_ADDRESS_STORAGE_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            relayHub := sload(slot)
        }
    }

    function _upgradeRelayHub(address newRelayHub) internal {
        address currentRelayHub = _getRelayHub();
        require(newRelayHub != address(0), "GSNContext: new RelayHub is the zero address");
        require(newRelayHub != currentRelayHub, "GSNContext: new RelayHub is the current one");

        emit RelayHubUpgraded(currentRelayHub, newRelayHub);

        bytes32 slot = RELAY_HUB_ADDRESS_STORAGE_SLOT;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            sstore(slot, newRelayHub)
        }
    }

    // Overrides for Context's functions: when called from RelayHub, sender and
    // data require some pre-processing: the actual sender is stored at the end
    // of the call data, which in turns means it needs to be removed from it
    // when handling said data.

    function _msgSender() internal view returns (address) {
        if (msg.sender != _getRelayHub()) {
            return msg.sender;
        } else {
            return _getRelayedCallSender();
        }
    }

    function _msgData() internal view returns (bytes memory) {
        if (msg.sender != _getRelayHub()) {
            return msg.data;
        } else {
            return _getRelayedCallData();
        }
    }

    function _getRelayedCallSender() private pure returns (address result) {
        // We need to read 20 bytes (an address) located at array index msg.data.length - 20. In memory, the array
        // is prefixed with a 32-byte length value, so we first add 32 to get the memory read index. However, doing
        // so would leave the address in the upper 20 bytes of the 32-byte word, which is inconvenient and would
        // require bit shifting. We therefore subtract 12 from the read index so the address lands on the lower 20
        // bytes. This can always be done due to the 32-byte prefix.

        // The final memory read index is msg.data.length - 20 + 32 - 12 = msg.data.length. Using inline assembly is the
        // easiest/most-efficient way to perform this operation.

        // These fields are not accessible from assembly
        bytes memory array = msg.data;
        uint256 index = msg.data.length;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
            result := and(mload(add(array, index)), 0xffffffffffffffffffffffffffffffffffffffff)
        }
        return result;
    }

    function _getRelayedCallData() private pure returns (bytes memory) {
        // RelayHub appends the sender address at the end of the calldata, so in order to retrieve the actual msg.data,
        // we must strip the last 20 bytes (length of an address type) from it.

        uint256 actualDataLength = msg.data.length - 20;
        bytes memory actualData = new bytes(actualDataLength);

        for (uint256 i = 0; i < actualDataLength; ++i) {
            actualData[i] = msg.data[i];
        }

        return actualData;
    }
}
