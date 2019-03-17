pragma solidity ^0.4.24;

import "../drafts/ERC777/IERC777TokensRecipient.sol";
import "../introspection/ERC1820Client.sol";

/**
 * @title ERC777TokensRecipientMock a contract that implements tokensReceived() hook
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777ReceiverMock is IERC777TokensRecipient, ERC1820Client {

    event TokensReceived(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    constructor(bool setInterface) public {
        // register interface
        if (setInterface) {
            setInterfaceImplementer(
                address(this),
                keccak256("ERC777TokensRecipient"),
                address(this)
            );
        }
    }

    /**
     * @dev tokensReceived() hook
     * @param operator address operator requesting the transfer
     * @param from address token holder address
     * @param to address recipient address
     * @param amount uint256 amount of tokens to transfer
     * @param userData bytes extra information provided by the token holder (if any)
     * @param operatorData bytes extra information provided by the operator (if any)
     */
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes userData,
        bytes operatorData
    )
    external
    {
        emit TokensReceived(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData
        );
    }
}
