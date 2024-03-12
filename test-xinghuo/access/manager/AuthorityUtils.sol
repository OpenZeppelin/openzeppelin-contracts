pragma solidity ^0.8.20;

import {AuthorityUtils} from "../../../openzeppelin-contracts/contracts/access/manager/AuthorityUtils.sol";

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

contract MyAuthorityUtils {
    function test() external returns(bool, uint32) {
        return (false,10);
    }

    function canCallWithDelay() public returns(bool, uint32) {
        address authority = address(new MyAuthority());
        return AuthorityUtils.canCallWithDelay(authority, address(this), address(this), this.test.selector);
    }
}