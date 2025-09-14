// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * JAY Token — ERC20 + Burnable + Ownable
 * - กำหนดจำนวนเริ่มต้น (mint) ให้ owner ตอน deploy
 * - owner สามารถ mint เพิ่มได้ (ปิด/เปิดได้ด้วยการลบสิทธิ์ mint หากต้องการ)
 */
contract JAYToken is ERC20, ERC20Burnable, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_ // หน่วยเป็น "โทเค็น" ไม่ใช่ wei (เดี๋ยวคูณ 10^decimals ให้)
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply_ * 10 ** decimals());
    }

    /// @notice owner สามารถ mint เพิ่มได้
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @dev ค่าเริ่มต้นของ ERC20 = 18 ทศนิยม (เปลี่ยนได้ถ้าต้องการ)
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}