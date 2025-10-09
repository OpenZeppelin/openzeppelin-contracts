methods {
    // IERC721
    function balanceOf(address)                              external returns (uint256) envfree;
    function ownerOf(uint256)                                external returns (address) envfree;
    function getApproved(uint256)                            external returns (address) envfree;
    function isApprovedForAll(address,address)               external returns (bool)    envfree;
    function safeTransferFrom(address,address,uint256,bytes) external;
    function safeTransferFrom(address,address,uint256)       external;
    function transferFrom(address,address,uint256)           external;
    function approve(address,uint256)                        external;
    function setApprovalForAll(address,bool)                 external;

    // IERC721Metadata
    function name()                                          external returns (string);
    function symbol()                                        external returns (string);
    function tokenURI(uint256)                               external returns (string);
}
