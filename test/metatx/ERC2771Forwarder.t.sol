// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {CallReceiverMockTrustingForwarder, CallReceiverMock} from "@openzeppelin/contracts/mocks/CallReceiverMock.sol";

struct ForwardRequest {
    address from;
    address to;
    uint256 value;
    uint256 gas;
    uint256 nonce;
    uint48 deadline;
    bytes data;
}

contract ERC2771ForwarderMock is ERC2771Forwarder {
    constructor(string memory name) ERC2771Forwarder(name) {}

    function structHash(ForwardRequest calldata request) external view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        _FORWARD_REQUEST_TYPEHASH,
                        request.from,
                        request.to,
                        request.value,
                        request.gas,
                        request.nonce,
                        request.deadline,
                        keccak256(request.data)
                    )
                )
            );
    }
}

contract ERC2771ForwarderTest is Test {
    ERC2771ForwarderMock internal _erc2771Forwarder;
    CallReceiverMockTrustingForwarder internal _receiver;

    uint256 internal _signerPrivateKey;
    uint256 internal _relayerPrivateKey;

    address internal _signer;
    address internal _relayer;

    uint256 internal constant _MAX_ETHER = 10_000_000; // To avoid overflow

    function setUp() public {
        _erc2771Forwarder = new ERC2771ForwarderMock("ERC2771Forwarder");
        _receiver = new CallReceiverMockTrustingForwarder(address(_erc2771Forwarder));

        _signerPrivateKey = 0xA11CE;
        _relayerPrivateKey = 0xB0B;

        _signer = vm.addr(_signerPrivateKey);
        _relayer = vm.addr(_relayerPrivateKey);
    }

    function _forgeRequestData(
        uint256 value,
        uint256 nonce,
        uint48 deadline,
        bytes memory data
    ) private view returns (ERC2771Forwarder.ForwardRequestData memory) {
        ForwardRequest memory request = ForwardRequest({
            from: _signer,
            to: address(_receiver),
            value: value,
            gas: 30000,
            nonce: nonce,
            deadline: deadline,
            data: data
        });

        bytes32 digest = _erc2771Forwarder.structHash(request);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_signerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return
            ERC2771Forwarder.ForwardRequestData({
                from: request.from,
                to: request.to,
                value: request.value,
                gas: request.gas,
                deadline: request.deadline,
                data: request.data,
                signature: signature
            });
    }

    function testExecuteAvoidsETHStuck(uint256 initialBalance, uint256 value, bool targetReverts) public {
        initialBalance = bound(initialBalance, 0, _MAX_ETHER);
        value = bound(value, 0, _MAX_ETHER);

        vm.deal(address(_erc2771Forwarder), initialBalance);

        uint256 nonce = _erc2771Forwarder.nonces(_signer);

        vm.deal(address(this), value);

        ERC2771Forwarder.ForwardRequestData memory requestData = _forgeRequestData({
            value: value,
            nonce: nonce,
            deadline: uint48(block.timestamp + 1),
            data: targetReverts
                ? abi.encodeCall(CallReceiverMock.mockFunctionRevertsNoReason, ())
                : abi.encodeCall(CallReceiverMock.mockFunction, ())
        });

        if (targetReverts) {
            vm.expectRevert();
        }

        _erc2771Forwarder.execute{value: value}(requestData);
        assertEq(address(_erc2771Forwarder).balance, initialBalance);
    }

    function testExecuteBatchAvoidsETHStuck(uint256 initialBalance, uint256 batchSize, uint256 value) public {
        batchSize = bound(batchSize, 1, 10);
        initialBalance = bound(initialBalance, 0, _MAX_ETHER);
        value = bound(value, 0, _MAX_ETHER);

        vm.deal(address(_erc2771Forwarder), initialBalance);
        uint256 nonce = _erc2771Forwarder.nonces(_signer);

        ERC2771Forwarder.ForwardRequestData[] memory batchRequestDatas = new ERC2771Forwarder.ForwardRequestData[](
            batchSize
        );

        uint256 expectedRefund;

        for (uint256 i = 0; i < batchSize; ++i) {
            bytes memory data;
            bool succeed = uint256(keccak256(abi.encodePacked(initialBalance, i))) % 2 == 0;

            if (succeed) {
                data = abi.encodeCall(CallReceiverMock.mockFunction, ());
            } else {
                expectedRefund += value;
                data = abi.encodeCall(CallReceiverMock.mockFunctionRevertsNoReason, ());
            }

            batchRequestDatas[i] = _forgeRequestData({
                value: value,
                nonce: nonce + i,
                deadline: uint48(block.timestamp + 1),
                data: data
            });
        }

        address payable refundReceiver = payable(address(0xebe));
        uint256 totalValue = value * batchSize;

        vm.deal(address(this), totalValue);
        _erc2771Forwarder.executeBatch{value: totalValue}(batchRequestDatas, refundReceiver);

        assertEq(address(_erc2771Forwarder).balance, initialBalance);
        assertEq(refundReceiver.balance, expectedRefund);
    }
}
