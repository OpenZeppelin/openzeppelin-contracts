pragma solidity ^0.8.20;

import {ERC1155Holder} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract MyERC1155Holder is ERC1155Holder {
    //onERC721Received

    function OnERC1155Received() public returns(bool) {
        address a;
        address b;
        uint256 c;
        uint256 d;
        bytes memory e;
        return onERC1155Received(a, b, c, d, e) == 0xf23a6e61;
    }

    function OnERC1155BatchReceived() public returns(bool) {
        address a;
        address b;
        uint256[] memory c;
        uint256[] memory d;
        bytes memory e;
        return onERC1155BatchReceived(a, b, c, d, e) == 0xbc197c81;
    }
}