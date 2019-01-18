pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "./IERC721Receiver.sol";

contract ERC721Holder is Initializable, IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes memory) public returns (bytes4) {
        return this.onERC721Received.selector;
    }

    uint256[50] private ______gap;
}
