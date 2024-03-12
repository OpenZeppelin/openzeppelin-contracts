pragma solidity ^0.8.20;

import {ERC1155} from "../../../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";

contract MyERC1155 is ERC1155 {

    constructor(string memory uri_) ERC1155(uri_) {

    }

    //uri
    //balanceOf
    //balanceOfBatch
    //setApprovalForAll
    //isApprovedForAll
    //safeTransferFrom
    //safeBatchTransferFrom

    function SetURI(string memory newuri) public {
        _setURI(newuri);
    }

    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory values, bytes memory data) public {
        _mintBatch(to, ids, values, data);
    }

    function Burn(address from, uint256 id, uint256 value) public {
        _burn(from, id, value);
    }

    function BurnBatch(address from, uint256[] memory ids, uint256[] memory values) public {
        _burnBatch(from, ids, values);
    }
}