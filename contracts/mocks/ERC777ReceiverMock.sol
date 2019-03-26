pragma solidity ^0.5.2;

import "../drafts/ERC777/IERC777Recipient.sol";
import "../drafts/IERC1820Registry.sol";

/**
 * @title ERC777TokensRecipientMock a contract that implements tokensReceived() hook
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777ReceiverMock is IERC777Recipient {

    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820b744B33945482C17Dc37218C01D858EBc714);

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
            _erc1820.setInterfaceImplementer(
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
        bytes calldata userData,
        bytes calldata operatorData
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
