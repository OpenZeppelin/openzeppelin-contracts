// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {CallReceiverMockTrustingForwarder, CallReceiverMock} from "@openzeppelin/contracts/mocks/CallReceiverMock.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

enum TamperType {
    FROM,
    TO,
    VALUE,
    DATA,
    SIGNATURE
}

contract ERC2771ForwarderMock is ERC2771Forwarder {
    constructor(string memory name) ERC2771Forwarder(name) {}

    function forwardRequestStructHash(
        ERC2771Forwarder.ForwardRequestData calldata request,
        uint256 nonce
    ) external view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        _FORWARD_REQUEST_TYPEHASH,
                        request.from,
                        request.to,
                        request.value,
                        request.gas,
                        nonce,
                        request.deadline,
                        keccak256(request.data)
                    )
                )
            );
    }
}

contract ERC2771ForwarderTest is Test {
    using ECDSA for bytes32;

    ERC2771ForwarderMock internal _erc2771Forwarder;
    CallReceiverMockTrustingForwarder internal _receiver;

    uint256 internal _signerPrivateKey = 0xA11CE;
    address internal _signer = vm.addr(_signerPrivateKey);

    uint256 internal constant _MAX_ETHER = 10_000_000; // To avoid overflow

    function setUp() public {
        _erc2771Forwarder = new ERC2771ForwarderMock("ERC2771Forwarder");
        _receiver = new CallReceiverMockTrustingForwarder(address(_erc2771Forwarder));
    }

    // Forge a new ForwardRequestData
    function _forgeRequestData() private view returns (ERC2771Forwarder.ForwardRequestData memory) {
        return
            _forgeRequestData({
                value: 0,
                deadline: uint48(block.timestamp + 1),
                data: abi.encodeCall(CallReceiverMock.mockFunction, ())
            });
    }

    function _forgeRequestData(
        uint256 value,
        uint48 deadline,
        bytes memory data
    ) private view returns (ERC2771Forwarder.ForwardRequestData memory) {
        return
            ERC2771Forwarder.ForwardRequestData({
                from: _signer,
                to: address(_receiver),
                value: value,
                gas: 30000,
                deadline: deadline,
                data: data,
                signature: ""
            });
    }

    // Sign a ForwardRequestData (in place) for a given nonce. Also returns it for convenience.
    function _signRequestData(
        ERC2771Forwarder.ForwardRequestData memory request,
        uint256 nonce
    ) private view returns (ERC2771Forwarder.ForwardRequestData memory) {
        bytes32 digest = _erc2771Forwarder.forwardRequestStructHash(request, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_signerPrivateKey, digest);
        request.signature = abi.encodePacked(r, s, v);
        return request;
    }

    // Tamper a ForwardRequestData (in place). Also returns it for convenience.
    function _tamperRequestData(
        ERC2771Forwarder.ForwardRequestData memory request,
        TamperType tamper
    ) private returns (ERC2771Forwarder.ForwardRequestData memory) {
        if (tamper == TamperType.FROM) request.from = vm.randomAddress();
        else if (tamper == TamperType.TO) request.to = vm.randomAddress();
        else if (tamper == TamperType.VALUE) request.value = vm.randomUint();
        else if (tamper == TamperType.DATA) request.data = vm.randomBytes(4);
        else if (tamper == TamperType.SIGNATURE) request.signature = vm.randomBytes(65);

        return request;
    }

    // Predict the revert error for a tampered request, and expect it is emitted.
    function _tamperedExpectRevert(
        ERC2771Forwarder.ForwardRequestData memory request,
        TamperType tamper,
        uint256 nonce
    ) private returns (ERC2771Forwarder.ForwardRequestData memory) {
        if (tamper == TamperType.FROM) nonce = _erc2771Forwarder.nonces(request.from);

        // predict revert
        if (tamper == TamperType.TO) {
            vm.expectRevert(
                abi.encodeWithSelector(
                    ERC2771Forwarder.ERC2771UntrustfulTarget.selector,
                    request.to,
                    address(_erc2771Forwarder)
                )
            );
        } else {
            (address recovered, , ) = _erc2771Forwarder.forwardRequestStructHash(request, nonce).tryRecover(
                request.signature
            );
            vm.expectRevert(
                abi.encodeWithSelector(ERC2771Forwarder.ERC2771ForwarderInvalidSigner.selector, recovered, request.from)
            );
        }
        return request;
    }

    function testExecuteAvoidsETHStuck(uint256 initialBalance, uint256 value, bool targetReverts) public {
        initialBalance = bound(initialBalance, 0, _MAX_ETHER);
        value = bound(value, 0, _MAX_ETHER);

        // create and sign request
        ERC2771Forwarder.ForwardRequestData memory request = _forgeRequestData({
            value: value,
            deadline: uint48(block.timestamp + 1),
            data: targetReverts
                ? abi.encodeCall(CallReceiverMock.mockFunctionRevertsNoReason, ())
                : abi.encodeCall(CallReceiverMock.mockFunction, ())
        });
        _signRequestData(request, _erc2771Forwarder.nonces(_signer));

        vm.deal(address(_erc2771Forwarder), initialBalance);
        vm.deal(address(this), request.value);

        if (targetReverts) vm.expectRevert();
        _erc2771Forwarder.execute{value: value}(request);

        assertEq(address(_erc2771Forwarder).balance, initialBalance);
    }

    function testExecuteBatchAvoidsETHStuck(uint256 initialBalance, uint256 batchSize, uint256 value) public {
        uint256 seed = uint256(keccak256(abi.encodePacked(initialBalance, batchSize, value)));

        batchSize = bound(batchSize, 1, 10);
        initialBalance = bound(initialBalance, 0, _MAX_ETHER);
        value = bound(value, 0, _MAX_ETHER);

        address refundReceiver = address(0xebe);
        uint256 refundExpected = 0;
        uint256 nonce = _erc2771Forwarder.nonces(_signer);

        // create an sign array or requests (that may fail)
        ERC2771Forwarder.ForwardRequestData[] memory requests = new ERC2771Forwarder.ForwardRequestData[](batchSize);
        for (uint256 i = 0; i < batchSize; ++i) {
            bool failure = (seed >> i) & 0x1 == 0x1;

            requests[i] = _forgeRequestData({
                value: value,
                deadline: uint48(block.timestamp + 1),
                data: failure
                    ? abi.encodeCall(CallReceiverMock.mockFunctionRevertsNoReason, ())
                    : abi.encodeCall(CallReceiverMock.mockFunction, ())
            });
            _signRequestData(requests[i], nonce + i);

            refundExpected += SafeCast.toUint(failure) * value;
        }

        // distribute ether
        vm.deal(address(_erc2771Forwarder), initialBalance);
        vm.deal(address(this), value * batchSize);

        // execute batch
        _erc2771Forwarder.executeBatch{value: value * batchSize}(requests, payable(refundReceiver));

        // check balances
        assertEq(address(_erc2771Forwarder).balance, initialBalance);
        assertEq(refundReceiver.balance, refundExpected);
    }

    function testVerifyTamperedValues(uint8 _tamper) public {
        TamperType tamper = _asTamper(_tamper);

        // create request, sign, tamper
        ERC2771Forwarder.ForwardRequestData memory request = _forgeRequestData();
        _signRequestData(request, 0);
        _tamperRequestData(request, tamper);

        // should not pass verification
        assertFalse(_erc2771Forwarder.verify(request));
    }

    function testExecuteTamperedValues(uint8 _tamper) public {
        TamperType tamper = _asTamper(_tamper);

        // create request, sign, tamper, expect execution revert
        ERC2771Forwarder.ForwardRequestData memory request = _forgeRequestData();
        _signRequestData(request, 0);
        _tamperRequestData(request, tamper);
        _tamperedExpectRevert(request, tamper, 0);

        vm.deal(address(this), request.value);
        _erc2771Forwarder.execute{value: request.value}(request);
    }

    function testExecuteBatchTamperedValuesZeroReceiver(uint8 _tamper) public {
        TamperType tamper = _asTamper(_tamper);
        uint256 nonce = _erc2771Forwarder.nonces(_signer);

        // create an sign array or requests
        ERC2771Forwarder.ForwardRequestData[] memory requests = new ERC2771Forwarder.ForwardRequestData[](3);
        for (uint256 i = 0; i < requests.length; ++i) {
            requests[i] = _forgeRequestData({
                value: 0,
                deadline: uint48(block.timestamp + 1),
                data: abi.encodeCall(CallReceiverMock.mockFunction, ())
            });
            _signRequestData(requests[i], nonce + i);
        }

        // tamper with request[1] and expect execution revert
        _tamperRequestData(requests[1], tamper);
        _tamperedExpectRevert(requests[1], tamper, nonce + 1);

        vm.deal(address(this), requests[1].value);
        _erc2771Forwarder.executeBatch{value: requests[1].value}(requests, payable(address(0)));
    }

    function testExecuteBatchTamperedValues(uint8 _tamper) public {
        TamperType tamper = _asTamper(_tamper);
        uint256 nonce = _erc2771Forwarder.nonces(_signer);

        // create an sign array or requests
        ERC2771Forwarder.ForwardRequestData[] memory requests = new ERC2771Forwarder.ForwardRequestData[](3);
        for (uint256 i = 0; i < requests.length; ++i) {
            requests[i] = _forgeRequestData({
                value: 0,
                deadline: uint48(block.timestamp + 1),
                data: abi.encodeCall(CallReceiverMock.mockFunction, ())
            });
            _signRequestData(requests[i], nonce + i);
        }

        // tamper with request[1]
        _tamperRequestData(requests[1], tamper);

        // should not revert
        vm.expectCall(address(_receiver), abi.encodeCall(CallReceiverMock.mockFunction, ()), 1);

        vm.deal(address(this), requests[1].value);
        _erc2771Forwarder.executeBatch{value: requests[1].value}(requests, payable(address(0xebe)));
    }

    function _asTamper(uint8 _tamper) private pure returns (TamperType) {
        return TamperType(bound(_tamper, uint8(TamperType.FROM), uint8(TamperType.SIGNATURE)));
    }
}
