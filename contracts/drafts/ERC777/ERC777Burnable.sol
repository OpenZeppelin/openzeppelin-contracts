pragma solidity ^0.5.2;

import "./ERC777.sol";


/**
 * @title ERC777 burnable token implementation
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777Burnable is ERC777 {

    /**
     * @dev Burn the amount of tokens from the address msg.sender
     * @param amount uint256 amount of tokens to transfer
     * @param data bytes data provided by the token holder
     */
    function burn(uint256 amount, bytes calldata data) external {
        _burn(
            msg.sender,
            msg.sender,
            amount,
            data,
            ""
        );
    }

    /**
     * @dev Burn the amount of tokens on behalf of the address from
     * @param from address token holder address. Set to 0x0 to use msg.sender as token holder
     * @param amount uint256 amount of tokens to transfer
     * @param data bytes data provided by the token holder
     * @param operatorData bytes extra information provided by the operator (if any)
     */
    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) external {
        address holder = from == address(0) ? msg.sender : from;
        _burn(
            msg.sender,
            holder,
            amount,
            data,
            operatorData
        );
    }
}
