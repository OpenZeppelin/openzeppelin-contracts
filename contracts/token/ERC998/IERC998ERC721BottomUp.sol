pragma solidity ^0.8.0;

interface ERC998ERC721BottomUp {
    function transferToParent(address _from, address _toContract, uint256 _toTokenId, uint256 _tokenId, bytes memory _data) external;
}

