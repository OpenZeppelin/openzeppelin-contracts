pragma solidity ^0.8.20;

import {AccessManaged} from "../../../openzeppelin-contracts/contracts/access/manager/AccessManaged.sol";

contract MyAuthority {
    function canCall(
        address caller,
        address target,
        bytes4 selector
    ) public virtual returns (bool, uint32) {  
        // 调用目标合约的函数  
        (bool success, bytes memory result) = target.call(abi.encodeWithSelector(selector));
        (bool ret, uint32 delay) = abi.decode(result, (bool, uint32));
        return (ret, delay);
    }
}

contract MyAccessManaged is AccessManaged {
    constructor(address initialAuthority) AccessManaged(initialAuthority) {
    }

    function Authority() public returns(address) {
        return authority();
    }

    function SetAuthority(address newAuthority) public {
        MyAuthority add = new MyAuthority();
        setAuthority(address(add));
    }

    function IsConsumingScheduledOp() public returns (bytes4){
        return isConsumingScheduledOp();
    }
}