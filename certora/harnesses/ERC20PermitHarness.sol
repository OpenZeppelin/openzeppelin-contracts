import "../munged/token/ERC20/ERC20.sol";
import "../munged/token/ERC20/extensions/draft-ERC20Permit.sol";

contract ERC20Harness is ERC20, ERC20Permit {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}
