pragma solidity ^0.8.20;

import {ERC20FlashMint} from "../../../../openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20FlashMint.sol";
import {ERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC3156FlashBorrower} from "../../../../openzeppelin-contracts/contracts/interfaces/IERC3156FlashBorrower.sol";
import {IERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC3156FlashLender} from "../../../../openzeppelin-contracts/contracts/interfaces/IERC3156FlashLender.sol";

contract MyEERC20FlashMint is ERC20FlashMint {

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {

    }

    function _flashFee(address token, uint256 value) internal view override returns (uint256) {
        // silence warning about unused variable without the addition of bytecode.
        return 5;
    }

    //only owner
    function Mint(address account, uint256 value) public {
        _mint(account, value);
    }
}

contract MyIERC3156FlashBorrower is IERC3156FlashBorrower {
    address public flashLoanProvider;

    constructor(address ad) {
        flashLoanProvider = ad;
    }

    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        //do something
        initiator;
        uint256 val = amount + fee;
        IERC20(token).approve(token, amount + fee);

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    function Borrower() public {
        bytes memory data;
        (bool success,) = flashLoanProvider.call(  
            abi.encodeWithSelector(  
                IERC3156FlashLender(flashLoanProvider).flashLoan.selector,
                address(this),  
                flashLoanProvider,  
                100,  
                data
            )
        );  
        require(success, "Flash loan failed");
    }
}