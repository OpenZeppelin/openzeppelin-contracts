// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// solhint-disable no-console

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {console} from "forge-std/console.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {PackedUserOperation, IAccount, IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {ERC4337Utils} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {ERC7579Utils, Mode, CallType, ExecType, ModeSelector, ModePayload, Execution} from "@openzeppelin/contracts/account/utils/draft-ERC7579Utils.sol";

contract SampleAccount is IAccount, Ownable {
    IEntryPoint internal constant ENTRY_POINT = IEntryPoint(payable(0x0000000071727De22E5E9d8BAf0edAc6f37da032));

    event Log(bool duringValidation, Execution[] calls);

    error UnsupportedCallType(CallType callType);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == address(ENTRY_POINT), "only from EP");
        // Check signature
        if (ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(userOpHash), userOp.signature) != owner()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }

        // If this is an execute call with a batch operation, log the call details from the calldata
        if (bytes4(userOp.callData[0x00:0x04]) == this.execute.selector) {
            (CallType callType, , , ) = ERC7579Utils.decodeMode(Mode.wrap(bytes32(userOp.callData[0x04:0x24])));

            if (callType == ERC7579Utils.CALLTYPE_BATCH) {
                // Remove the selector
                bytes calldata params = userOp.callData[0x04:];

                // Use the same vulnerable assignment technique here, but assert afterwards that the checks aren't
                // broken here by comparing to the result of `abi.decode(...)`.
                bytes calldata executionCalldata;
                assembly ("memory-safe") {
                    let dataptr := add(params.offset, calldataload(add(params.offset, 0x20)))
                    executionCalldata.offset := add(dataptr, 32)
                    executionCalldata.length := calldataload(dataptr)
                }
                // Check that this decoding step is done correctly.
                (, bytes memory executionCalldataMemory) = abi.decode(params, (bytes32, bytes));

                require(
                    keccak256(executionCalldata) == keccak256(executionCalldataMemory),
                    "decoding during validation failed"
                );
                // Now, we know that we have `bytes calldata executionCalldata` as would be decoded by the solidity
                // builtin decoder for the `execute` function.

                // This is where the vulnerability from ExecutionLib results in a different result between validation
                // andexecution.

                emit Log(true, ERC7579Utils.decodeBatch(executionCalldata));
            }
        }

        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success; // Silence warning. The entrypoint should validate the result.
        }

        return ERC4337Utils.SIG_VALIDATION_SUCCESS;
    }

    function execute(Mode mode, bytes calldata executionCalldata) external payable {
        require(msg.sender == address(this) || msg.sender == address(ENTRY_POINT), "not auth");

        (CallType callType, ExecType execType, , ) = ERC7579Utils.decodeMode(mode);

        // check if calltype is batch or single
        if (callType == ERC7579Utils.CALLTYPE_SINGLE) {
            ERC7579Utils.execSingle(execType, executionCalldata);
        } else if (callType == ERC7579Utils.CALLTYPE_BATCH) {
            ERC7579Utils.execBatch(execType, executionCalldata);

            emit Log(false, ERC7579Utils.decodeBatch(executionCalldata));
        } else if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) {
            ERC7579Utils.execDelegateCall(execType, executionCalldata);
        } else {
            revert UnsupportedCallType(callType);
        }
    }
}

contract LoggingPOCTest is Test {
    IEntryPoint private constant ENTRYPOINT = IEntryPoint(payable(0x0000000071727De22E5E9d8BAf0edAc6f37da032));
    address private _owner;
    uint256 private _ownerKey;
    address private _account;
    address private _beneficiary;
    address private _recipient1;
    address private _recipient2;

    constructor() {
        vm.etch(0x0000000071727De22E5E9d8BAf0edAc6f37da032, vm.readFileBinary("test/bin/EntryPoint070.bytecode"));
        vm.etch(0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C, vm.readFileBinary("test/bin/SenderCreator070.bytecode"));

        // signing key
        (_owner, _ownerKey) = makeAddrAndKey("owner");

        // ERC-4337 account
        _account = address(new SampleAccount(_owner));
        vm.deal(_account, 1 ether);

        // other
        _beneficiary = makeAddr("beneficiary");
        _recipient1 = makeAddr("recipient1");
        _recipient2 = makeAddr("recipient2");
    }

    function testExecuteBatchDecodeCorrectly() public {
        Execution[] memory calls = new Execution[](2);
        calls[0] = Execution({target: _recipient1, value: 1 wei, callData: ""});
        calls[1] = Execution({target: _recipient2, value: 1 wei, callData: ""});

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: _account,
            nonce: 0,
            initCode: "",
            callData: abi.encodeCall(
                SampleAccount.execute,
                (
                    ERC7579Utils.encodeMode(
                        ERC7579Utils.CALLTYPE_BATCH,
                        ERC7579Utils.EXECTYPE_DEFAULT,
                        ModeSelector.wrap(0x00),
                        ModePayload.wrap(0x00)
                    ),
                    ERC7579Utils.encodeBatch(calls)
                )
            ),
            accountGasLimits: _packGas(500_000, 500_000),
            preVerificationGas: 0,
            gasFees: _packGas(1, 1),
            paymasterAndData: "",
            signature: ""
        });

        bytes32 userOpHash = ERC4337Utils.hashMemory(userOp, address(ENTRYPOINT), block.chainid);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_ownerKey, MessageHashUtils.toEthSignedMessageHash(userOpHash));
        userOp.signature = abi.encodePacked(r, s, v);

        PackedUserOperation[] memory userOps = new PackedUserOperation[](1);
        userOps[0] = userOp;

        vm.recordLogs();
        ENTRYPOINT.handleOps(userOps, payable(_beneficiary));

        assertEq(_recipient1.balance, 1 wei);
        assertEq(_recipient2.balance, 1 wei);

        _collectAndPrintLogs(false);
    }

    function testExecuteBatchDecodeEmpty() public {
        bytes memory fakeCalls = abi.encodePacked(
            uint256(1), // Length of execution[]
            uint256(0x20), // offset
            uint256(uint160(_recipient1)), // target
            uint256(1), // value: 1 wei
            uint256(0x60), // offset of data
            uint256(0) // length of
        );

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: _account,
            nonce: 0,
            initCode: "",
            callData: abi.encodeCall(
                SampleAccount.execute,
                (
                    ERC7579Utils.encodeMode(
                        ERC7579Utils.CALLTYPE_BATCH,
                        ERC7579Utils.EXECTYPE_DEFAULT,
                        ModeSelector.wrap(0x00),
                        ModePayload.wrap(0x00)
                    ),
                    abi.encodePacked(
                        uint256(0x70) // fake offset pointing to paymasterAndData
                    )
                )
            ),
            accountGasLimits: _packGas(500_000, 500_000),
            preVerificationGas: 0,
            gasFees: _packGas(1, 1),
            paymasterAndData: abi.encodePacked(address(0), fakeCalls),
            signature: ""
        });

        bytes32 userOpHash = ERC4337Utils.hashMemory(userOp, address(ENTRYPOINT), block.chainid);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_ownerKey, MessageHashUtils.toEthSignedMessageHash(userOpHash));
        userOp.signature = abi.encodePacked(r, s, v);

        PackedUserOperation[] memory userOps = new PackedUserOperation[](1);
        userOps[0] = userOp;

        vm.recordLogs();
        ENTRYPOINT.handleOps(userOps, payable(_beneficiary));

        assertEq(_recipient1.balance, 0 wei);

        _collectAndPrintLogs(false);
    }

    function testExecuteBatchDecodeDifferent() public {
        bytes memory execCallData = abi.encodePacked(
            uint256(0x20), // offset pointing to the next segment
            uint256(5), // Length of execution[]
            uint256(0), // offset of calls[0], and target (!!)
            uint256(0x20), // offset of calls[1], and value (!!)
            uint256(0), // offset of calls[2], and rel offset of data (!!)
            uint256(0) // offset of calls[3].
            // There is one more to read by the array length, but it's not present here. This will be
            // paymasterAndData.length during validation, pointing to an all-zero call.
            // During execution, the offset will be 0, pointing to a call with value.
        );

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: _account,
            nonce: 0,
            initCode: "",
            callData: abi.encodePacked(
                SampleAccount.execute.selector,
                ERC7579Utils.encodeMode(
                    ERC7579Utils.CALLTYPE_BATCH,
                    ERC7579Utils.EXECTYPE_DEFAULT,
                    ModeSelector.wrap(0x00),
                    ModePayload.wrap(0x00)
                ),
                uint256(0x5c), // offset pointing to the next segment
                uint224(type(uint224).max), // Padding to align the `bytes` types
                // type(uint256).max, // unknown padding
                uint256(execCallData.length), // Length of the data
                execCallData
            ),
            accountGasLimits: _packGas(500_000, 500_000),
            preVerificationGas: 0,
            gasFees: _packGas(1, 1),
            paymasterAndData: abi.encodePacked(uint256(0), uint256(0)), // padding length to create an offset
            signature: ""
        });

        bytes32 userOpHash = ERC4337Utils.hashMemory(userOp, address(ENTRYPOINT), block.chainid);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_ownerKey, MessageHashUtils.toEthSignedMessageHash(userOpHash));
        userOp.signature = abi.encodePacked(r, s, v);

        PackedUserOperation[] memory userOps = new PackedUserOperation[](1);
        userOps[0] = userOp;

        vm.recordLogs();
        ENTRYPOINT.handleOps(userOps, payable(_beneficiary));

        assertEq(_recipient1.balance, 0 wei);

        _collectAndPrintLogs(true);
    }

    function _collectAndPrintLogs(bool includeTotalValue) internal {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter == _account) {
                _printDecodedCalls(logs[i].data, includeTotalValue);
            }
        }
    }

    function _printDecodedCalls(bytes memory logData, bool includeTotalValue) internal pure {
        (bool duringValidation, Execution[] memory calls) = abi.decode(logData, (bool, Execution[]));

        if (duringValidation) {
            console.log("Batch execute contents, as read during validation: ");
        } else {
            console.log("Batch execute contents, as read during execution: ");
        }

        console.log("  Execution[] length: %s", calls.length);

        uint256 totalValue = 0;

        for (uint256 i = 0; i < calls.length; ++i) {
            console.log(string.concat("    calls[", vm.toString(i), "].target = ", vm.toString(calls[i].target)));
            console.log(string.concat("    calls[", vm.toString(i), "].value = ", vm.toString(calls[i].value)));
            console.log(string.concat("    calls[", vm.toString(i), "].data = ", vm.toString(calls[i].callData)));
            totalValue += calls[i].value;
        }

        if (includeTotalValue) {
            console.log("  Total value: %s", totalValue);
        }
    }

    function _packGas(uint256 upper, uint256 lower) internal pure returns (bytes32) {
        return bytes32(uint256((upper << 128) | uint128(lower)));
    }
}
