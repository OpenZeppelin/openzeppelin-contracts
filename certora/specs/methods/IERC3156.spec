methods {
    maxFlashLoan(address)                    returns (uint256) envfree => DISPATCHER(true)
    flashFee(address,uint256)                returns (uint256) envfree => DISPATCHER(true)
    flashLoan(address,address,uint256,bytes) returns (bool)            => DISPATCHER(true)
}
