pragma solidity ^0.5.2;

import "./ERC777Base.sol";


/**
 * @title ERC777 token implementation
 * @notice mint an amount of tokens given to msg.sender
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777 is ERC777Base {
    /*
     * @dev constructor
     * @param name name of the token
     * @param symbol symbol of the token
     * @param granularity granularity of token
     * @param defaultOperators array of default operators address
     * @param initialSupply amount of tokens given to msg.sender
     * @param data bytes information attached to the send, and intended for the recipient (to)
     * @param operatorData bytes extra information provided by the operator (if any)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 granularity,
        address[] memory defaultOperators,
        uint256 initialSupply,
        bytes memory data,
        bytes memory operatorData
    )
    public
    ERC777Base(
        name,
        symbol,
        granularity,
        defaultOperators
    ) {
        _mint(
            msg.sender,
            msg.sender,
            initialSupply,
            data,
            operatorData
        );
    }
}
