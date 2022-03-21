import "../munged/token/ERC20/extensions/ERC20FlashMint.sol";

contract ERC20FlashMintHarness is ERC20FlashMint {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
}
