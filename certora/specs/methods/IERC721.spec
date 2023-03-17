methods {
    // IERC721
    balanceOf(address)                              returns (uint256) envfree => DISPATCHER(true)
    ownerOf(uint256)                                returns (address) envfree => DISPATCHER(true)
    getApproved(uint256)                            returns (address) envfree => DISPATCHER(true)
    isApprovedForAll(address,address)               returns (bool)    envfree => DISPATCHER(true)
    safeTransferFrom(address,address,uint256,bytes)                           => DISPATCHER(true)
    safeTransferFrom(address,address,uint256)                                 => DISPATCHER(true)
    transferFrom(address,address,uint256)                                     => DISPATCHER(true)
    approve(address,uint256)                                                  => DISPATCHER(true)
    setApprovalForAll(address,bool)                                           => DISPATCHER(true)

    // IERC721Metadata
    name()                                          returns (string)          => DISPATCHER(true)
    symbol()                                        returns (string)          => DISPATCHER(true)
    tokenURI(uint256)                               returns (string)          => DISPATCHER(true)

    // IERC721Receiver
    onERC721Received(address,address,uint256,bytes) returns (bytes4)          => DISPATCHER(true)
}
