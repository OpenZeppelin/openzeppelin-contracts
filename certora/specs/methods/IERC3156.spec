methods {
    function maxFlashLoan(address)                    external returns (uint256) envfree;
    function flashFee(address,uint256)                external returns (uint256) envfree;
    function flashLoan(address,address,uint256,bytes) external returns (bool);

    // IERC3156FlashBorrower
    function _.onFlashLoan(address,address,uint256,uint256,bytes) external => DISPATCHER(true);
}
