methods {
    function permit(address,address,uint256,uint256,uint8,bytes32,bytes32) external;
    function nonces(address)    external returns (uint256) envfree;
    function DOMAIN_SEPARATOR() external returns (bytes32) envfree;
}
