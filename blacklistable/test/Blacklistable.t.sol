// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Blacklistable} from "../src/Blacklistable.sol";
import {Ownable} from "../../contracts/access/Ownable.sol";

// Create a concrete implementation of the abstract Blacklistable contract
contract BlacklistableToken is Blacklistable {
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) Ownable(msg.sender) {
        _name = name_;
        _symbol = symbol_;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _totalSupply += amount;
        _balances[to] += amount;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        address from = msg.sender;
        
        // Check blacklist status before executing transfer
        _checkBlacklist(from, to);
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        return true;
    }
}

contract BlacklistableTest is Test {
    BlacklistableToken public token;
    address public owner;
    address public user1;
    address public user2;
    address public user3;

    event BlacklistUpdated(address indexed account, bool isBlacklisted);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);
        
        token = new BlacklistableToken("Test Token", "TEST");
        
        // Mint some tokens to users for testing
        token.mint(user1, 1000);
        token.mint(user2, 1000);
        token.mint(user3, 1000);
    }

    // Test adding an address to the blacklist
    function testAddToBlacklist() public {
        // Initially user is not blacklisted
        assertFalse(token.isBlacklisted(user1));
        
        // Expect an event to be emitted
        vm.expectEmit(true, true, true, true);
        emit BlacklistUpdated(user1, true);
        
        // Add user to blacklist
        token.addToBlacklist(user1);
        
        // Verify user is now blacklisted
        assertTrue(token.isBlacklisted(user1));
    }
    
    // Test trying to add a zero address to the blacklist
    function testAddZeroAddressToBlacklist() public {
        vm.expectRevert("Blacklistable: invalid address");
        token.addToBlacklist(address(0));
    }
    
    // Test trying to add an already blacklisted address
    function testAddAlreadyBlacklistedAddress() public {
        // First add user to blacklist
        token.addToBlacklist(user1);
        
        // Try to add again
        vm.expectRevert("Blacklistable: account already blacklisted");
        token.addToBlacklist(user1);
    }
    
    // Test removing an address from the blacklist
    function testRemoveFromBlacklist() public {
        // First add user to blacklist
        token.addToBlacklist(user1);
        assertTrue(token.isBlacklisted(user1));
        
        // Expect an event to be emitted
        vm.expectEmit(true, true, true, true);
        emit BlacklistUpdated(user1, false);
        
        // Remove user from blacklist
        token.removeFromBlacklist(user1);
        
        // Verify user is no longer blacklisted
        assertFalse(token.isBlacklisted(user1));
    }
    
    // Test trying to remove a zero address from the blacklist
    function testRemoveZeroAddressFromBlacklist() public {
        vm.expectRevert("Blacklistable: invalid address");
        token.removeFromBlacklist(address(0));
    }
    
    // Test trying to remove an address not on the blacklist
    function testRemoveNonBlacklistedAddress() public {
        vm.expectRevert("Blacklistable: account not blacklisted");
        token.removeFromBlacklist(user1);
    }
    
    // Test batch blacklisting
    function testBatchBlacklist() public {
        address[] memory accounts = new address[](3);
        accounts[0] = user1;
        accounts[1] = user2;
        accounts[2] = user3;
        
        // Batch blacklist
        token.batchBlacklist(accounts, true);
        
        // Verify all addresses are blacklisted
        assertTrue(token.isBlacklisted(user1));
        assertTrue(token.isBlacklisted(user2));
        assertTrue(token.isBlacklisted(user3));
        
        // Batch unblacklist
        token.batchBlacklist(accounts, false);
        
        // Verify all addresses are unblacklisted
        assertFalse(token.isBlacklisted(user1));
        assertFalse(token.isBlacklisted(user2));
        assertFalse(token.isBlacklisted(user3));
    }
    
    // Test batch blacklisting with zero address
    function testBatchBlacklistWithZeroAddress() public {
        address[] memory accounts = new address[](3);
        accounts[0] = user1;
        accounts[1] = address(0); // Zero address
        accounts[2] = user3;
        
        vm.expectRevert(abi.encodePacked("Blacklistable: invalid address in array at index 1"));
        token.batchBlacklist(accounts, true);
    }
    
    // Test batch blacklisting with empty array
    function testBatchBlacklistEmptyArray() public {
        address[] memory accounts = new address[](0);
        
        vm.expectRevert("Blacklistable: empty accounts array");
        token.batchBlacklist(accounts, true);
    }
    
    // Test disabling events
    function testDisableEvents() public {
        // Disable events
        token._disableEvents();
        
        // Add to blacklist - event should not be emitted
        token.addToBlacklist(user1);
        
        // Re-enable events
        token._enableEvents();
        
        // Remove from blacklist - event should be emitted
        vm.expectEmit(true, true, true, true);
        emit BlacklistUpdated(user1, false);
        token.removeFromBlacklist(user1);
    }
    
    // Test transfer with blacklisted sender
    function testTransferWithBlacklistedSender() public {
        // Blacklist user1
        token.addToBlacklist(user1);
        
        // Try to transfer from blacklisted user
        vm.prank(user1);
        vm.expectRevert("Blacklistable: sender is blacklisted");
        token.transfer(user2, 100);
    }
    
    // Test transfer with blacklisted recipient
    function testTransferWithBlacklistedRecipient() public {
        // Blacklist user2
        token.addToBlacklist(user2);
        
        // Try to transfer to blacklisted user
        vm.prank(user1);
        vm.expectRevert("Blacklistable: recipient is blacklisted");
        token.transfer(user2, 100);
    }
    
    // Test successful transfer between non-blacklisted addresses
    function testSuccessfulTransfer() public {
        uint256 user1InitialBalance = token.balanceOf(user1);
        uint256 user2InitialBalance = token.balanceOf(user2);
        uint256 transferAmount = 100;
        
        // Transfer tokens
        vm.prank(user1);
        token.transfer(user2, transferAmount);
        
        // Verify balances
        assertEq(token.balanceOf(user1), user1InitialBalance - transferAmount);
        assertEq(token.balanceOf(user2), user2InitialBalance + transferAmount);
    }
    
    // Test ownership control - only owner can blacklist
    function testOnlyOwnerCanBlacklist() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        token.addToBlacklist(user2);
    }
    
    // Test blacklisting the owner
    function testBlacklistOwner() public {
        // Owner can blacklist themselves
        token.addToBlacklist(owner);
        assertTrue(token.isBlacklisted(owner));
    }
}