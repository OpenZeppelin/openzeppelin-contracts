import "../../munged/token/ERC1155/extensions/ERC1155Pausable.sol";

contract ERC1155PausableHarness is ERC1155Pausable {
    constructor(string memory uri_) ERC1155(uri_) {}

    function pause() public {
        _pause();
    }

    function unpause() public {
        _unpause();
    }

    function onlyWhenPausedMethod() public whenPaused {}

    function onlyWhenNotPausedMethod() public whenNotPaused {}
}
