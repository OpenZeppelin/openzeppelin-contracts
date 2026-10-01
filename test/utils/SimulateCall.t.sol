// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SimulateCall} from "@openzeppelin/contracts/utils/SimulateCall.sol";

contract RevertBomb {
    fallback() external payable {
        bytes memory bomb = new bytes(200 * 1024); // expand memory
        assembly ("memory-safe") {
            for {} gt(gas(), 3000) {} {} // burn gas so the simulator gets starved
            revert(add(bomb, 0x20), mload(bomb)) // revert with the already-allocated buffer (cheap)
        }
    }
}

contract SimulateCallHarness {
    function run(address target, bytes calldata data) external returns (bool ok, bytes memory ret) {
        return SimulateCall.simulateCall(target, data);
    }
}

contract SimulateCallRevertBombTest is Test {
    SimulateCallHarness internal harness = new SimulateCallHarness();

    function testRevertBombReportedAsFailure() public {
        harness.run(address(0xBEEF), ""); // deploy simulator
        (bool ok, bytes memory ret) = harness.run{gas: 1_000_000}(address(new RevertBomb()), "");
        assertFalse(ok); // reverting target is a failure (bounded copy can't be starved into an OOG)
        assertEq(ret.length, 2048); // reason copied up to the 2048-byte cap
    }
}
