pragma solidity >=0.7 <0.9;
pragma experimental ABIEncoderV2;

import "./AccessControlMockUpgradeable.sol";

contract AccessControlMockUpgradeableWithInit is AccessControlMockUpgradeable {
    constructor() payable initializer {
        __AccessControlMock_init();
    }
}
import "../governance/TimelockControllerUpgradeable.sol";

contract TimelockControllerUpgradeableWithInit is TimelockControllerUpgradeable {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) payable initializer {
        __TimelockController_init(minDelay, proposers, executors);
    }
}
import "./wizard/MyGovernor3Upgradeable.sol";

contract MyGovernorUpgradeableWithInit is MyGovernorUpgradeable {
    constructor(IVotesUpgradeable _token, TimelockControllerUpgradeable _timelock) payable initializer {
        __MyGovernor_init(_token, _timelock);
    }
}
import "./wizard/MyGovernor2Upgradeable.sol";

contract MyGovernor2UpgradeableWithInit is MyGovernor2Upgradeable {
    constructor(IVotesUpgradeable _token, TimelockControllerUpgradeable _timelock) payable initializer {
        __MyGovernor2_init(_token, _timelock);
    }
}
import "./wizard/MyGovernor1Upgradeable.sol";

contract MyGovernor1UpgradeableWithInit is MyGovernor1Upgradeable {
    constructor(IVotesUpgradeable _token, TimelockControllerUpgradeable _timelock) payable initializer {
        __MyGovernor1_init(_token, _timelock);
    }
}
import "./GovernorVoteMockUpgradeable.sol";

contract GovernorVoteMocksUpgradeableWithInit is GovernorVoteMocksUpgradeable {
    constructor(string memory name_, IVotesUpgradeable token_) payable initializer {
        __GovernorVoteMocks_init(name_, token_);
    }
}
import "./GovernorTimelockControlMockUpgradeable.sol";

contract GovernorTimelockControlMockUpgradeableWithInit is GovernorTimelockControlMockUpgradeable {
    constructor(
        string memory name_,
        IVotesUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        TimelockControllerUpgradeable timelock_,
        uint256 quorumNumerator_
    ) payable initializer {
        __GovernorTimelockControlMock_init(name_, token_, votingDelay_, votingPeriod_, timelock_, quorumNumerator_);
    }
}
import "./GovernorTimelockCompoundMockUpgradeable.sol";

contract GovernorTimelockCompoundMockUpgradeableWithInit is GovernorTimelockCompoundMockUpgradeable {
    constructor(
        string memory name_,
        IVotesUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        ICompoundTimelockUpgradeable timelock_,
        uint256 quorumNumerator_
    ) payable initializer {
        __GovernorTimelockCompoundMock_init(name_, token_, votingDelay_, votingPeriod_, timelock_, quorumNumerator_);
    }
}
import "./GovernorCompatibilityBravoMockUpgradeable.sol";

contract GovernorCompatibilityBravoMockUpgradeableWithInit is GovernorCompatibilityBravoMockUpgradeable {
    constructor(
        string memory name_,
        ERC20VotesCompUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        ICompoundTimelockUpgradeable timelock_
    ) payable initializer {
        __GovernorCompatibilityBravoMock_init(name_, token_, votingDelay_, votingPeriod_, proposalThreshold_, timelock_);
    }
}
import "../token/ERC20/ERC20Upgradeable.sol";

contract ERC20UpgradeableWithInit is ERC20Upgradeable {
    constructor(string memory name_, string memory symbol_) payable initializer {
        __ERC20_init(name_, symbol_);
    }
}
import "./GovernorCompMockUpgradeable.sol";

contract GovernorCompMockUpgradeableWithInit is GovernorCompMockUpgradeable {
    constructor(string memory name_, ERC20VotesCompUpgradeable token_) payable initializer {
        __GovernorCompMock_init(name_, token_);
    }
}
import "./ERC20VotesCompMockUpgradeable.sol";

contract ERC20VotesCompMockUpgradeableWithInit is ERC20VotesCompMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC20VotesCompMock_init(name, symbol);
    }
}
import "./ERC20VotesMockUpgradeable.sol";

contract ERC20VotesMockUpgradeableWithInit is ERC20VotesMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC20VotesMock_init(name, symbol);
    }
}
import "./ERC1271WalletMockUpgradeable.sol";

contract ERC1271WalletMockUpgradeableWithInit is ERC1271WalletMockUpgradeable {
    constructor(address originalOwner) payable initializer {
        __ERC1271WalletMock_init(originalOwner);
    }
}
import "./MulticallTokenMockUpgradeable.sol";

contract MulticallTokenMockUpgradeableWithInit is MulticallTokenMockUpgradeable {
    constructor(uint256 initialBalance) payable initializer {
        __MulticallTokenMock_init(initialBalance);
    }
}
import "./ERC20MockUpgradeable.sol";

contract ERC20MockUpgradeableWithInit is ERC20MockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable initializer {
        __ERC20Mock_init(name, symbol, initialAccount, initialBalance);
    }
}
import "../token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";

contract ERC20PresetMinterPauserUpgradeableWithInit is ERC20PresetMinterPauserUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC20PresetMinterPauser_init(name, symbol);
    }
}
import "../token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";

contract ERC721PresetMinterPauserAutoIdUpgradeableWithInit is ERC721PresetMinterPauserAutoIdUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) payable initializer {
        __ERC721PresetMinterPauserAutoId_init(name, symbol, baseTokenURI);
    }
}
import "../token/ERC721/ERC721Upgradeable.sol";

contract ERC721UpgradeableWithInit is ERC721Upgradeable {
    constructor(string memory name_, string memory symbol_) payable initializer {
        __ERC721_init(name_, symbol_);
    }
}
import "./MathMockUpgradeable.sol";

contract MathMockUpgradeableWithInit is MathMockUpgradeable {
    constructor() payable initializer {
        __MathMock_init();
    }
}
import "./CheckpointsImplUpgradeable.sol";

contract CheckpointsImplUpgradeableWithInit is CheckpointsImplUpgradeable {
    constructor() payable initializer {
        __CheckpointsImpl_init();
    }
}
import "./SafeCastMockUpgradeable.sol";

contract SafeCastMockUpgradeableWithInit is SafeCastMockUpgradeable {
    constructor() payable initializer {
        __SafeCastMock_init();
    }
}
import "./GovernorMockUpgradeable.sol";

contract GovernorMockUpgradeableWithInit is GovernorMockUpgradeable {
    constructor(
        string memory name_,
        IVotesUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 quorumNumerator_
    ) payable initializer {
        __GovernorMock_init(name_, token_, votingDelay_, votingPeriod_, quorumNumerator_);
    }
}
import "./GovernorPreventLateQuorumMockUpgradeable.sol";

contract GovernorPreventLateQuorumMockUpgradeableWithInit is GovernorPreventLateQuorumMockUpgradeable {
    constructor(
        string memory name_,
        IVotesUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 quorum_,
        uint64 voteExtension_
    ) payable initializer {
        __GovernorPreventLateQuorumMock_init(name_, token_, votingDelay_, votingPeriod_, quorum_, voteExtension_);
    }
}
import "./ERC1155ReceiverMockUpgradeable.sol";

contract ERC1155ReceiverMockUpgradeableWithInit is ERC1155ReceiverMockUpgradeable {
    constructor(
        bytes4 recRetval,
        bool recReverts,
        bytes4 batRetval,
        bool batReverts
    ) payable initializer {
        __ERC1155ReceiverMock_init(recRetval, recReverts, batRetval, batReverts);
    }
}
import "../token/ERC1155/ERC1155Upgradeable.sol";

contract ERC1155UpgradeableWithInit is ERC1155Upgradeable {
    constructor(string memory uri_) payable initializer {
        __ERC1155_init(uri_);
    }
}
import "../token/ERC1155/presets/ERC1155PresetMinterPauserUpgradeable.sol";

contract ERC1155PresetMinterPauserUpgradeableWithInit is ERC1155PresetMinterPauserUpgradeable {
    constructor(string memory uri) payable initializer {
        __ERC1155PresetMinterPauser_init(uri);
    }
}
import "./AccessControlEnumerableMockUpgradeable.sol";

contract AccessControlEnumerableMockUpgradeableWithInit is AccessControlEnumerableMockUpgradeable {
    constructor() payable initializer {
        __AccessControlEnumerableMock_init();
    }
}
import "./EnumerableSetMockUpgradeable.sol";

contract EnumerableBytes32SetMockUpgradeableWithInit is EnumerableBytes32SetMockUpgradeable {
    constructor() payable initializer {
        __EnumerableBytes32SetMock_init();
    }
}
import "./EnumerableSetMockUpgradeable.sol";

contract EnumerableAddressSetMockUpgradeableWithInit is EnumerableAddressSetMockUpgradeable {
    constructor() payable initializer {
        __EnumerableAddressSetMock_init();
    }
}
import "./EnumerableSetMockUpgradeable.sol";

contract EnumerableUintSetMockUpgradeableWithInit is EnumerableUintSetMockUpgradeable {
    constructor() payable initializer {
        __EnumerableUintSetMock_init();
    }
}
import "./EnumerableMapMockUpgradeable.sol";

contract EnumerableMapMockUpgradeableWithInit is EnumerableMapMockUpgradeable {
    constructor() payable initializer {
        __EnumerableMapMock_init();
    }
}
import "./PausableMockUpgradeable.sol";

contract PausableMockUpgradeableWithInit is PausableMockUpgradeable {
    constructor() payable initializer {
        __PausableMock_init();
    }
}
import "./VotesMockUpgradeable.sol";

contract VotesMockUpgradeableWithInit is VotesMockUpgradeable {
    constructor(string memory name) payable initializer {
        __VotesMock_init(name);
    }
}
import "./EIP712ExternalUpgradeable.sol";

contract EIP712ExternalUpgradeableWithInit is EIP712ExternalUpgradeable {
    constructor(string memory name, string memory version) payable initializer {
        __EIP712External_init(name, version);
    }
}
import "../metatx/MinimalForwarderUpgradeable.sol";

contract MinimalForwarderUpgradeableWithInit is MinimalForwarderUpgradeable {
    constructor() payable initializer {
        __MinimalForwarder_init();
    }
}
import "./ERC20PermitMockUpgradeable.sol";

contract ERC20PermitMockUpgradeableWithInit is ERC20PermitMockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable initializer {
        __ERC20PermitMock_init(name, symbol, initialAccount, initialBalance);
    }
}
import "./ERC721VotesMockUpgradeable.sol";

contract ERC721VotesMockUpgradeableWithInit is ERC721VotesMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721VotesMock_init(name, symbol);
    }
}
import "./ERC721URIStorageMockUpgradeable.sol";

contract ERC721URIStorageMockUpgradeableWithInit is ERC721URIStorageMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721URIStorageMock_init(name, symbol);
    }
}
import "./ERC165CheckerMockUpgradeable.sol";

contract ERC165CheckerMockUpgradeableWithInit is ERC165CheckerMockUpgradeable {
    constructor() payable initializer {
        __ERC165CheckerMock_init();
    }
}
import "./ERC165/ERC165InterfacesSupportedUpgradeable.sol";

contract SupportsInterfaceWithLookupMockUpgradeableWithInit is SupportsInterfaceWithLookupMockUpgradeable {
    constructor() payable initializer {
        __SupportsInterfaceWithLookupMock_init();
    }
}
import "./ERC165/ERC165InterfacesSupportedUpgradeable.sol";

contract ERC165InterfacesSupportedUpgradeableWithInit is ERC165InterfacesSupportedUpgradeable {
    constructor(bytes4[] memory interfaceIds) payable initializer {
        __ERC165InterfacesSupported_init(interfaceIds);
    }
}
import "./ERC721EnumerableMockUpgradeable.sol";

contract ERC721EnumerableMockUpgradeableWithInit is ERC721EnumerableMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721EnumerableMock_init(name, symbol);
    }
}
import "./SafeERC20HelperUpgradeable.sol";

contract ERC20ReturnFalseMockUpgradeableWithInit is ERC20ReturnFalseMockUpgradeable {
    constructor() payable initializer {
        __ERC20ReturnFalseMock_init();
    }
}
import "./SafeERC20HelperUpgradeable.sol";

contract ERC20ReturnTrueMockUpgradeableWithInit is ERC20ReturnTrueMockUpgradeable {
    constructor() payable initializer {
        __ERC20ReturnTrueMock_init();
    }
}
import "./SafeERC20HelperUpgradeable.sol";

contract ERC20NoReturnMockUpgradeableWithInit is ERC20NoReturnMockUpgradeable {
    constructor() payable initializer {
        __ERC20NoReturnMock_init();
    }
}
import "./SafeERC20HelperUpgradeable.sol";

contract SafeERC20WrapperUpgradeableWithInit is SafeERC20WrapperUpgradeable {
    constructor(IERC20Upgradeable token) payable initializer {
        __SafeERC20Wrapper_init(token);
    }
}
import "../token/ERC20/utils/TokenTimelockUpgradeable.sol";

contract TokenTimelockUpgradeableWithInit is TokenTimelockUpgradeable {
    constructor(
        IERC20Upgradeable token_,
        address beneficiary_,
        uint256 releaseTime_
    ) payable initializer {
        __TokenTimelock_init(token_, beneficiary_, releaseTime_);
    }
}
import "./ERC20WrapperMockUpgradeable.sol";

contract ERC20WrapperMockUpgradeableWithInit is ERC20WrapperMockUpgradeable {
    constructor(
        IERC20Upgradeable _underlyingToken,
        string memory name,
        string memory symbol
    ) payable initializer {
        __ERC20WrapperMock_init(_underlyingToken, name, symbol);
    }
}
import "../finance/VestingWalletUpgradeable.sol";

contract VestingWalletUpgradeableWithInit is VestingWalletUpgradeable {
    constructor(
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) payable initializer {
        __VestingWallet_init(beneficiaryAddress, startTimestamp, durationSeconds);
    }
}
import "../finance/PaymentSplitterUpgradeable.sol";

contract PaymentSplitterUpgradeableWithInit is PaymentSplitterUpgradeable {
    constructor(address[] memory payees, uint256[] memory shares_) payable initializer {
        __PaymentSplitter_init(payees, shares_);
    }
}
import "../token/ERC777/ERC777Upgradeable.sol";

contract ERC777UpgradeableWithInit is ERC777Upgradeable {
    constructor(
        string memory name_,
        string memory symbol_,
        address[] memory defaultOperators_
    ) payable initializer {
        __ERC777_init(name_, symbol_, defaultOperators_);
    }
}
import "../token/ERC777/presets/ERC777PresetFixedSupplyUpgradeable.sol";

contract ERC777PresetFixedSupplyUpgradeableWithInit is ERC777PresetFixedSupplyUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators,
        uint256 initialSupply,
        address owner
    ) payable initializer {
        __ERC777PresetFixedSupply_init(name, symbol, defaultOperators, initialSupply, owner);
    }
}
import "./ERC777SenderRecipientMockUpgradeable.sol";

contract ERC777SenderRecipientMockUpgradeableWithInit is ERC777SenderRecipientMockUpgradeable {
    constructor() payable initializer {
        __ERC777SenderRecipientMock_init();
    }
}
import "../utils/introspection/ERC1820ImplementerUpgradeable.sol";

contract ERC1820ImplementerUpgradeableWithInit is ERC1820ImplementerUpgradeable {
    constructor() payable initializer {
        __ERC1820Implementer_init();
    }
}
import "./ERC1820ImplementerMockUpgradeable.sol";

contract ERC1820ImplementerMockUpgradeableWithInit is ERC1820ImplementerMockUpgradeable {
    constructor() payable initializer {
        __ERC1820ImplementerMock_init();
    }
}
import "./Create2ImplUpgradeable.sol";

contract Create2ImplUpgradeableWithInit is Create2ImplUpgradeable {
    constructor() payable initializer {
        __Create2Impl_init();
    }
}
import "./ERC777MockUpgradeable.sol";

contract ERC777MockUpgradeableWithInit is ERC777MockUpgradeable {
    constructor(
        address initialHolder,
        uint256 initialBalance,
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) payable initializer {
        __ERC777Mock_init(initialHolder, initialBalance, name, symbol, defaultOperators);
    }
}
import "./ERC3156FlashBorrowerMockUpgradeable.sol";

contract ERC3156FlashBorrowerMockUpgradeableWithInit is ERC3156FlashBorrowerMockUpgradeable {
    constructor(bool enableReturn, bool enableApprove) payable initializer {
        __ERC3156FlashBorrowerMock_init(enableReturn, enableApprove);
    }
}
import "./ERC20FlashMintMockUpgradeable.sol";

contract ERC20FlashMintMockUpgradeableWithInit is ERC20FlashMintMockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable initializer {
        __ERC20FlashMintMock_init(name, symbol, initialAccount, initialBalance);
    }
}
import "./ERC721RoyaltyMockUpgradeable.sol";

contract ERC721RoyaltyMockUpgradeableWithInit is ERC721RoyaltyMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721RoyaltyMock_init(name, symbol);
    }
}
import "./ERC721MockUpgradeable.sol";

contract ERC721MockUpgradeableWithInit is ERC721MockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721Mock_init(name, symbol);
    }
}
import "./StringsMockUpgradeable.sol";

contract StringsMockUpgradeableWithInit is StringsMockUpgradeable {
    constructor() payable initializer {
        __StringsMock_init();
    }
}
import "../token/ERC721/utils/ERC721HolderUpgradeable.sol";

contract ERC721HolderUpgradeableWithInit is ERC721HolderUpgradeable {
    constructor() payable initializer {
        __ERC721Holder_init();
    }
}
import "./ERC721ReceiverMockUpgradeable.sol";

contract ERC721ReceiverMockUpgradeableWithInit is ERC721ReceiverMockUpgradeable {
    constructor(bytes4 retval, Error error) payable initializer {
        __ERC721ReceiverMock_init(retval, error);
    }
}
import "./ERC721BurnableMockUpgradeable.sol";

contract ERC721BurnableMockUpgradeableWithInit is ERC721BurnableMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721BurnableMock_init(name, symbol);
    }
}
import "./ERC721PausableMockUpgradeable.sol";

contract ERC721PausableMockUpgradeableWithInit is ERC721PausableMockUpgradeable {
    constructor(string memory name, string memory symbol) payable initializer {
        __ERC721PausableMock_init(name, symbol);
    }
}
import "./ERC20PausableMockUpgradeable.sol";

contract ERC20PausableMockUpgradeableWithInit is ERC20PausableMockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable initializer {
        __ERC20PausableMock_init(name, symbol, initialAccount, initialBalance);
    }
}
import "./ERC1155PausableMockUpgradeable.sol";

contract ERC1155PausableMockUpgradeableWithInit is ERC1155PausableMockUpgradeable {
    constructor(string memory uri) payable initializer {
        __ERC1155PausableMock_init(uri);
    }
}
import "./ERC1155MockUpgradeable.sol";

contract ERC1155MockUpgradeableWithInit is ERC1155MockUpgradeable {
    constructor(string memory uri) payable initializer {
        __ERC1155Mock_init(uri);
    }
}
import "./ERC1155SupplyMockUpgradeable.sol";

contract ERC1155SupplyMockUpgradeableWithInit is ERC1155SupplyMockUpgradeable {
    constructor(string memory uri) payable initializer {
        __ERC1155SupplyMock_init(uri);
    }
}
import "./ERC1155BurnableMockUpgradeable.sol";

contract ERC1155BurnableMockUpgradeableWithInit is ERC1155BurnableMockUpgradeable {
    constructor(string memory uri) payable initializer {
        __ERC1155BurnableMock_init(uri);
    }
}
import "../token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

contract ERC1155HolderUpgradeableWithInit is ERC1155HolderUpgradeable {
    constructor() payable initializer {
        __ERC1155Holder_init();
    }
}
import "./ERC165StorageMockUpgradeable.sol";

contract ERC165StorageMockUpgradeableWithInit is ERC165StorageMockUpgradeable {
    constructor() payable initializer {
        __ERC165StorageMock_init();
    }
}
import "./ERC165MockUpgradeable.sol";

contract ERC165MockUpgradeableWithInit is ERC165MockUpgradeable {
    constructor() payable initializer {
        __ERC165Mock_init();
    }
}
import "./TimersTimestampImplUpgradeable.sol";

contract TimersTimestampImplUpgradeableWithInit is TimersTimestampImplUpgradeable {
    constructor() payable initializer {
        __TimersTimestampImpl_init();
    }
}
import "./TimersBlockNumberImplUpgradeable.sol";

contract TimersBlockNumberImplUpgradeableWithInit is TimersBlockNumberImplUpgradeable {
    constructor() payable initializer {
        __TimersBlockNumberImpl_init();
    }
}
import "./ArraysImplUpgradeable.sol";

contract ArraysImplUpgradeableWithInit is ArraysImplUpgradeable {
    constructor(uint256[] memory array) payable initializer {
        __ArraysImpl_init(array);
    }
}
import "./ERC20SnapshotMockUpgradeable.sol";

contract ERC20SnapshotMockUpgradeableWithInit is ERC20SnapshotMockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable initializer {
        __ERC20SnapshotMock_init(name, symbol, initialAccount, initialBalance);
    }
}
import "./CountersImplUpgradeable.sol";

contract CountersImplUpgradeableWithInit is CountersImplUpgradeable {
    constructor() payable initializer {
        __CountersImpl_init();
    }
}
import "./UUPS/UUPSUpgradeableMockUpgradeable.sol";

contract UUPSUpgradeableMockUpgradeableWithInit is UUPSUpgradeableMockUpgradeable {
    constructor() payable initializer {
        __UUPSUpgradeableMock_init();
    }
}
import "./UUPS/UUPSUpgradeableMockUpgradeable.sol";

contract UUPSUpgradeableUnsafeMockUpgradeableWithInit is UUPSUpgradeableUnsafeMockUpgradeable {
    constructor() payable initializer {
        __UUPSUpgradeableUnsafeMock_init();
    }
}
import "./UUPS/UUPSLegacyUpgradeable.sol";

contract UUPSUpgradeableLegacyMockUpgradeableWithInit is UUPSUpgradeableLegacyMockUpgradeable {
    constructor() payable initializer {
        __UUPSUpgradeableLegacyMock_init();
    }
}
import "./ReentrancyAttackUpgradeable.sol";

contract ReentrancyAttackUpgradeableWithInit is ReentrancyAttackUpgradeable {
    constructor() payable initializer {
        __ReentrancyAttack_init();
    }
}
import "./ReentrancyMockUpgradeable.sol";

contract ReentrancyMockUpgradeableWithInit is ReentrancyMockUpgradeable {
    constructor() payable initializer {
        __ReentrancyMock_init();
    }
}
import "../token/ERC20/presets/ERC20PresetFixedSupplyUpgradeable.sol";

contract ERC20PresetFixedSupplyUpgradeableWithInit is ERC20PresetFixedSupplyUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) payable initializer {
        __ERC20PresetFixedSupply_init(name, symbol, initialSupply, owner);
    }
}
import "./ERC20BurnableMockUpgradeable.sol";

contract ERC20BurnableMockUpgradeableWithInit is ERC20BurnableMockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable initializer {
        __ERC20BurnableMock_init(name, symbol, initialAccount, initialBalance);
    }
}
import "./ContextMockUpgradeable.sol";

contract ContextMockUpgradeableWithInit is ContextMockUpgradeable {
    constructor() payable initializer {
        __ContextMock_init();
    }
}
import "./ContextMockUpgradeable.sol";

contract ContextMockCallerUpgradeableWithInit is ContextMockCallerUpgradeable {
    constructor() payable initializer {
        __ContextMockCaller_init();
    }
}
import "./ERC20DecimalsMockUpgradeable.sol";

contract ERC20DecimalsMockUpgradeableWithInit is ERC20DecimalsMockUpgradeable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) payable initializer {
        __ERC20DecimalsMock_init(name_, symbol_, decimals_);
    }
}
import "./ERC20CappedMockUpgradeable.sol";

contract ERC20CappedMockUpgradeableWithInit is ERC20CappedMockUpgradeable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 cap
    ) payable initializer {
        __ERC20CappedMock_init(name, symbol, cap);
    }
}
import "./MulticallTestUpgradeable.sol";

contract MulticallTestUpgradeableWithInit is MulticallTestUpgradeable {
    constructor() payable initializer {
        __MulticallTest_init();
    }
}
import "../utils/escrow/EscrowUpgradeable.sol";

contract EscrowUpgradeableWithInit is EscrowUpgradeable {
    constructor() payable initializer {
        __Escrow_init();
    }
}
import "./PullPaymentMockUpgradeable.sol";

contract PullPaymentMockUpgradeableWithInit is PullPaymentMockUpgradeable {
    constructor() payable initializer {
        __PullPaymentMock_init();
    }
}
import "../utils/escrow/RefundEscrowUpgradeable.sol";

contract RefundEscrowUpgradeableWithInit is RefundEscrowUpgradeable {
    constructor(address payable beneficiary_) payable initializer {
        __RefundEscrow_init(beneficiary_);
    }
}
import "./ConditionalEscrowMockUpgradeable.sol";

contract ConditionalEscrowMockUpgradeableWithInit is ConditionalEscrowMockUpgradeable {
    constructor() payable initializer {
        __ConditionalEscrowMock_init();
    }
}
import "./ClonesMockUpgradeable.sol";

contract ClonesMockUpgradeableWithInit is ClonesMockUpgradeable {
    constructor() payable initializer {
        __ClonesMock_init();
    }
}
import "./AddressImplUpgradeable.sol";

contract AddressImplUpgradeableWithInit is AddressImplUpgradeable {
    constructor() payable initializer {
        __AddressImpl_init();
    }
}
import "./StorageSlotMockUpgradeable.sol";

contract StorageSlotMockUpgradeableWithInit is StorageSlotMockUpgradeable {
    constructor() payable initializer {
        __StorageSlotMock_init();
    }
}
import "./OwnableMockUpgradeable.sol";

contract OwnableMockUpgradeableWithInit is OwnableMockUpgradeable {
    constructor() payable initializer {
        __OwnableMock_init();
    }
}
import "./SignatureCheckerMockUpgradeable.sol";

contract SignatureCheckerMockUpgradeableWithInit is SignatureCheckerMockUpgradeable {
    constructor() payable initializer {
        __SignatureCheckerMock_init();
    }
}
import "./ECDSAMockUpgradeable.sol";

contract ECDSAMockUpgradeableWithInit is ECDSAMockUpgradeable {
    constructor() payable initializer {
        __ECDSAMock_init();
    }
}
import "./BadBeaconUpgradeable.sol";

contract BadBeaconNoImplUpgradeableWithInit is BadBeaconNoImplUpgradeable {
    constructor() payable initializer {
        __BadBeaconNoImpl_init();
    }
}
import "./BadBeaconUpgradeable.sol";

contract BadBeaconNotContractUpgradeableWithInit is BadBeaconNotContractUpgradeable {
    constructor() payable initializer {
        __BadBeaconNotContract_init();
    }
}
import "./Base64MockUpgradeable.sol";

contract Base64MockUpgradeableWithInit is Base64MockUpgradeable {
    constructor() payable initializer {
        __Base64Mock_init();
    }
}
import "./BitmapMockUpgradeable.sol";

contract BitMapMockUpgradeableWithInit is BitMapMockUpgradeable {
    constructor() payable initializer {
        __BitMapMock_init();
    }
}
import "./CallReceiverMockUpgradeable.sol";

contract CallReceiverMockUpgradeableWithInit is CallReceiverMockUpgradeable {
    constructor() payable initializer {
        __CallReceiverMock_init();
    }
}
import "./ClashingImplementationUpgradeable.sol";

contract ClashingImplementationUpgradeableWithInit is ClashingImplementationUpgradeable {
    constructor() payable initializer {
        __ClashingImplementation_init();
    }
}
import "./compound/CompTimelockUpgradeable.sol";

contract CompTimelockUpgradeableWithInit is CompTimelockUpgradeable {
    constructor(address admin_, uint256 delay_) payable initializer {
        __CompTimelock_init(admin_, delay_);
    }
}
import "./DummyImplementationUpgradeable.sol";

contract DummyImplementationUpgradeableWithInit is DummyImplementationUpgradeable {
    constructor() payable initializer {
        __DummyImplementation_init();
    }
}
import "./DummyImplementationUpgradeable.sol";

contract DummyImplementationV2UpgradeableWithInit is DummyImplementationV2Upgradeable {
    constructor() payable initializer {
        __DummyImplementationV2_init();
    }
}
import "./ERC165/ERC165MissingDataUpgradeable.sol";

contract ERC165MissingDataUpgradeableWithInit is ERC165MissingDataUpgradeable {
    constructor() payable initializer {
        __ERC165MissingData_init();
    }
}
import "./ERC165/ERC165NotSupportedUpgradeable.sol";

contract ERC165NotSupportedUpgradeableWithInit is ERC165NotSupportedUpgradeable {
    constructor() payable initializer {
        __ERC165NotSupported_init();
    }
}
import "./EtherReceiverMockUpgradeable.sol";

contract EtherReceiverMockUpgradeableWithInit is EtherReceiverMockUpgradeable {
    constructor() payable initializer {
        __EtherReceiverMock_init();
    }
}
import "./MerkleProofWrapperUpgradeable.sol";

contract MerkleProofWrapperUpgradeableWithInit is MerkleProofWrapperUpgradeable {
    constructor() payable initializer {
        __MerkleProofWrapper_init();
    }
}
import "./SafeMathMockUpgradeable.sol";

contract SafeMathMockUpgradeableWithInit is SafeMathMockUpgradeable {
    constructor() payable initializer {
        __SafeMathMock_init();
    }
}
import "./SignedMathMockUpgradeable.sol";

contract SignedMathMockUpgradeableWithInit is SignedMathMockUpgradeable {
    constructor() payable initializer {
        __SignedMathMock_init();
    }
}
import "./SignedSafeMathMockUpgradeable.sol";

contract SignedSafeMathMockUpgradeableWithInit is SignedSafeMathMockUpgradeable {
    constructor() payable initializer {
        __SignedSafeMathMock_init();
    }
}
