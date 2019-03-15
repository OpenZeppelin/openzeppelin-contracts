pragma solidity ^0.4.24;

import "./ERC777Base.sol";


/**
 * @title ERC777 burnable token implementation
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777Burnable is ERC777Base {

    /**
     * @dev Burn the amount of tokens from the address msg.sender
     * @param amount uint256 amount of tokens to transfer
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, msg.sender, amount, "");
    }

    /**
     * @dev Burn the amount of tokens on behalf of the address from
     * @param from address token holder address. Set to 0x0 to use msg.sender as token holder
     * @param amount uint256 amount of tokens to transfer
     * @param operatorData bytes extra information provided by the operator (if any)
     */
    function operatorBurn(
        address from,
        uint256 amount,
        bytes operatorData
    ) external {
        address holder = from == address(0) ? msg.sender : from;
        _burn(msg.sender, holder, amount, operatorData);
    }
}
