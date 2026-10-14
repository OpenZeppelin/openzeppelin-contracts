methods {
    // Account
    function entryPoint()                                                      external returns (address) envfree;
    function getNonce()                                                        external returns (uint256) envfree;
    function getNonce(uint192)                                                 external returns (uint256) envfree;
    function validateUserOp(Account.PackedUserOperation,bytes32,uint256)       external returns (uint256);

    // IERC1271
    function isValidSignature(bytes32,bytes)                                   external returns (bytes4);

    // IERC7579AccountConfig
    function accountId()                                                       external returns (string)  envfree;
    function supportsExecutionMode(bytes32)                                    external returns (bool)    envfree;
    function supportsModule(uint256)                                           external returns (bool)    envfree;

    // IERC7579ModuleConfig
    function installModule(uint256,address,bytes)                              external;
    function uninstallModule(uint256,address,bytes)                            external;
    function isModuleInstalled(uint256,address,bytes)                          external returns (bool)    envfree;

    // IERC7579Execution
    function execute(bytes32,bytes)                                            external;
    function executeFromExecutor(bytes32,bytes)                                external returns (bytes[]);

    // IERC721Receiver
    function onERC721Received(address,address,uint256,bytes)                   external returns (bytes4)  envfree;

    // IERC1155Receiver
    function onERC1155Received(address,address,uint256,uint256,bytes)          external returns (bytes4)  envfree;
    function onERC1155BatchReceived(address,address,uint256[],uint256[],bytes) external returns (bytes4)  envfree;

    // IERC165
    function supportsInterface(bytes4)                                         external returns (bool)    envfree;
}
