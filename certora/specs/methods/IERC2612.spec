methods {
    permit(address,address,uint256,uint256,uint8,bytes32,bytes32) => DISPATCHER(true)
    nonces(address)    returns (uint256) envfree                  => DISPATCHER(true)
    DOMAIN_SEPARATOR() returns (bytes32) envfree                  => DISPATCHER(true)
}
