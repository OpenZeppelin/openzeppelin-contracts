pragma solidity ^0.5.0;

import "./IERC1155Receiver.sol";
import "../../introspection/ERC165.sol";

contract ERC1155Receiver is ERC165, IERC1155Receiver {
    constructor() public {
        _registerInterface(
            ERC1155Receiver(0).onERC1155Received.selector ^
            ERC1155Receiver(0).onERC1155BatchReceived.selector
        );
    }
}
