pragma solidity ^0.5.2;

interface IERC1820 {
    /**
     * @notice Indicates whether the contract implements the interface `interfaceHash` for the address `account` or
     * not.
     * @param interfaceHash keccak256 hash of the name of the interface
     * @param account Address for which the contract will implement the interface
     * @return ERC1820_ACCEPT_MAGIC only if the contract implements `interfaceHash` for the address `account`.
     */
    function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32);
}
