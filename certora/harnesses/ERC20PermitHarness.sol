import "../munged/token/ERC20/extensions/draft-ERC20Permit.sol";

contract ERC20PermitHarness is ERC20, ERC20Permit {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}
}
