pragma solidity ^0.5.0;

/**
 * @title ERC777 token recipient interface
 * @dev See https://eips.ethereum.org/EIPS/eip-777
 */
interface IERC777Recipient {
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external;
}
