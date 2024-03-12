pragma solidity ^0.8.20;

import {ERC721Holder} from "../../../../openzeppelin-contracts/contracts/token/ERC721/utils/ERC721Holder.sol";

contract MyERC721Holder is ERC721Holder {
    //onERC721Received

    function OnERC721Received() public returns(bool) {
        address a;
        address b;
        uint256 c;
        bytes memory d;
        return onERC721Received(a, b, c, d) == 0x150b7a02;
    }
}