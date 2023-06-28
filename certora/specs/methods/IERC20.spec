methods {
    name()                                returns (string)  envfree => DISPATCHER(true)
    symbol()                              returns (string)  envfree => DISPATCHER(true)
    decimals()                            returns (uint8)   envfree => DISPATCHER(true)
    totalSupply()                         returns (uint256) envfree => DISPATCHER(true)
    balanceOf(address)                    returns (uint256) envfree => DISPATCHER(true)
    allowance(address,address)            returns (uint256) envfree => DISPATCHER(true)
    approve(address,uint256)              returns (bool)            => DISPATCHER(true)
    transfer(address,uint256)             returns (bool)            => DISPATCHER(true)
    transferFrom(address,address,uint256) returns (bool)            => DISPATCHER(true)
}
