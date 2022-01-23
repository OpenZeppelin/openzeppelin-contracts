pragma solidity ^0.5.0;

import "../utils/ReentrancyGuard.sol";
import "./ReentrancyAttack.sol";

contract ReentrancyMock is ReentrancyGuard {
    uint256 public counter;

    constructor () public {
        counter = 0;
    }

    function callback() external nonReentrant {
        count();
    }

    function countLocalRecursive(uint256 n) public nonReentrant {
        if (n > 0) {
            count();
            countLocalRecursive(n - 1);
        }
    }

    function countThisRecursive(uint256 n) public nonReentrant {
        if (n > 0) {
            count();
            // solhint-disable-next-line avoid-low-level-calls
            (bool success,) = address(this).call(abi.encodeWithSignature("countThisRecursive(uint256)", n - 1));
            require(success, "ReentrancyMock: failed call");
        }
    }

    function countAndCall(ReentrancyAttack attacker) public nonReentrant {
        count();
        bytes4 func = bytes4(keccak256("callback()"));
        attacker.callSender(func);
    }

    function count() private {
        counter += 1;
    }
}
