// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {CrosschainRemoteExecutor} from "@openzeppelin/contracts/crosschain/CrosschainRemoteExecutor.sol";
import {ERC7786Recipient} from "@openzeppelin/contracts/crosschain/ERC7786Recipient.sol";
import {IERC7786GatewaySource, IERC7786Recipient} from "@openzeppelin/contracts/interfaces/draft-IERC7786.sol";
import {InteroperableAddress} from "@openzeppelin/contracts/utils/draft-InteroperableAddress.sol";
import {
    ERC7579Utils,
    Mode,
    ModeSelector,
    ModePayload
} from "@openzeppelin/contracts/account/utils/draft-ERC7579Utils.sol";

contract CrosschainRemoteExecutorGatewayMock is IERC7786GatewaySource {
    function supportsAttribute(bytes4) public view virtual returns (bool) {
        return false;
    }

    function sendMessage(bytes calldata, bytes calldata, bytes[] calldata) public payable virtual returns (bytes32) {
        return bytes32(0);
    }
}

contract CrosschainRemoteExecutorTest is Test {
    CrosschainRemoteExecutorGatewayMock private _gateway;

    address private constant CONTROLLER = address(0xC0FFEE);
    uint256 private constant REMOTE_CHAIN = 10;

    function setUp() public {
        _gateway = new CrosschainRemoteExecutorGatewayMock();
    }

    function testConstructorRejectsEmptyController() public {
        vm.expectRevert(abi.encodeWithSelector(InteroperableAddress.InteroperableAddressParsingError.selector, ""));
        new CrosschainRemoteExecutor(address(_gateway), "");
    }

    function testConstructorRejectsUnparseableController() public {
        vm.expectRevert(
            abi.encodeWithSelector(InteroperableAddress.InteroperableAddressParsingError.selector, hex"deadbeef")
        );
        new CrosschainRemoteExecutor(address(_gateway), hex"deadbeef");
    }

    function testConstructorRejectsControllerWithoutAddress() public {
        bytes memory chainOnly = InteroperableAddress.formatEvmV1(REMOTE_CHAIN);
        vm.expectRevert(abi.encodeWithSelector(CrosschainRemoteExecutor.InvalidController.selector, chainOnly));
        new CrosschainRemoteExecutor(address(_gateway), chainOnly);
    }

    /// @dev {InteroperableAddress-parseV1} ignores trailing bytes, so a padded controller decodes to the right
    /// address while not being equal, byte for byte, to the sender a gateway reports.
    function testConstructorRejectsControllerWithTrailingBytes() public {
        bytes memory padded = bytes.concat(_controller(), hex"00");

        (, bytes memory chainReference, bytes memory addr) = InteroperableAddress.parseV1(padded);
        assertEq(padded.length, chainReference.length + addr.length + 7);

        vm.expectRevert(abi.encodeWithSelector(CrosschainRemoteExecutor.InvalidController.selector, padded));
        new CrosschainRemoteExecutor(address(_gateway), padded);
    }

    function testConstructorAcceptsValidController() public {
        CrosschainRemoteExecutor executor = new CrosschainRemoteExecutor(address(_gateway), _controller());
        assertEq(executor.gateway(), address(_gateway));
        assertEq(executor.controller(), _controller());
    }

    /// @dev A controller the gateway can never emit as `sender` would lock the executor and the assets it holds.
    function testReconfigureRejectsInvalidController() public {
        CrosschainRemoteExecutor executor = new CrosschainRemoteExecutor(address(_gateway), _controller());
        vm.deal(address(executor), 1 ether);

        bytes memory payload = _singleCallPayload(
            address(executor),
            0,
            abi.encodeCall(CrosschainRemoteExecutor.reconfigure, (address(_gateway), hex"deadbeef"))
        );

        vm.prank(address(_gateway));
        vm.expectRevert(
            abi.encodeWithSelector(InteroperableAddress.InteroperableAddressParsingError.selector, hex"deadbeef")
        );
        IERC7786Recipient(address(executor)).receiveMessage(bytes32(uint256(1)), _controller(), payload);

        // the controller is unchanged and still able to drive the executor
        assertEq(executor.controller(), _controller());

        vm.prank(address(_gateway));
        IERC7786Recipient(address(executor)).receiveMessage(
            bytes32(uint256(2)),
            _controller(),
            _singleCallPayload(address(0xBEEF), 1 ether, "")
        );
        assertEq(address(0xBEEF).balance, 1 ether);
        assertEq(address(executor).balance, 0);
    }

    function testReconfigureRejectsControllerWithTrailingBytes() public {
        CrosschainRemoteExecutor executor = new CrosschainRemoteExecutor(address(_gateway), _controller());
        vm.deal(address(executor), 1 ether);

        bytes memory padded = bytes.concat(_controller(), hex"00");
        bytes memory payload = _singleCallPayload(
            address(executor),
            0,
            abi.encodeCall(CrosschainRemoteExecutor.reconfigure, (address(_gateway), padded))
        );

        vm.prank(address(_gateway));
        vm.expectRevert(abi.encodeWithSelector(CrosschainRemoteExecutor.InvalidController.selector, padded));
        IERC7786Recipient(address(executor)).receiveMessage(bytes32(uint256(1)), _controller(), payload);

        // the controller is unchanged and still able to drive the executor
        assertEq(executor.controller(), _controller());

        vm.prank(address(_gateway));
        IERC7786Recipient(address(executor)).receiveMessage(
            bytes32(uint256(2)),
            _controller(),
            _singleCallPayload(address(0xBEEF), 1 ether, "")
        );
        assertEq(address(0xBEEF).balance, 1 ether);
        assertEq(address(executor).balance, 0);
    }

    function testReconfigureToValidControllerRotatesAuthorization() public {
        CrosschainRemoteExecutor executor = new CrosschainRemoteExecutor(address(_gateway), _controller());

        address newController = address(0xDECAF);
        bytes memory newControllerAddr = InteroperableAddress.formatEvmV1(REMOTE_CHAIN, newController);

        vm.prank(address(_gateway));
        IERC7786Recipient(address(executor)).receiveMessage(
            bytes32(uint256(1)),
            _controller(),
            _singleCallPayload(
                address(executor),
                0,
                abi.encodeCall(CrosschainRemoteExecutor.reconfigure, (address(_gateway), newControllerAddr))
            )
        );
        assertEq(executor.controller(), newControllerAddr);

        // the previous controller is no longer authorized
        vm.prank(address(_gateway));
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC7786Recipient.ERC7786RecipientUnauthorizedGateway.selector,
                address(_gateway),
                _controller()
            )
        );
        IERC7786Recipient(address(executor)).receiveMessage(
            bytes32(uint256(2)),
            _controller(),
            _singleCallPayload(address(0xBEEF), 0, "")
        );
    }

    function _controller() private pure returns (bytes memory) {
        return InteroperableAddress.formatEvmV1(REMOTE_CHAIN, CONTROLLER);
    }

    /// @dev Builds an ERC-7579 single-call payload: mode (32 bytes) followed by target, value and calldata.
    function _singleCallPayload(
        address target,
        uint256 value,
        bytes memory callData
    ) private pure returns (bytes memory) {
        Mode mode = ERC7579Utils.encodeMode(
            ERC7579Utils.CALLTYPE_SINGLE,
            ERC7579Utils.EXECTYPE_DEFAULT,
            ModeSelector.wrap(0),
            ModePayload.wrap(0)
        );
        return abi.encodePacked(mode, bytes20(target), bytes32(value), callData);
    }
}
