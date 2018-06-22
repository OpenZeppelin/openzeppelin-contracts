pragma solidity ^0.4.24;

import "./StandardToken.sol";

/**
 * @title MultiSend Token
 * @dev Basic token with transfer to multiple addresses functionality.
 */
contract MultiSendToken is StandardToken {

    /**
     * @dev Transfers specific amounts of tokens to specified addresses.
     * @param _beneficiaries The addresses to transfer to.
     * @param _values The amount of tokens to be transferred per address.
     */
    function multiSend(address[] _beneficiaries, uint256[] _values) public {
        require(_beneficiaries.length == _values.length);

        uint256 length = _beneficiaries.length;

        for (uint256 i = 0; i < length; i++) {
            transfer(_beneficiaries[i], _values[i]);
        }
    }
}