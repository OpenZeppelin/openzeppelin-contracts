const debug = require('debug');
const fs = require('fs');
const path = require('path');
const replace = require('replace-in-file');

const versions = [
  '@openzeppelin/contracts',
  '@openzeppelin/contracts-upgradeable',
];

const updates = {
  'access/AccessControl.sol': 'utils/access/AccessControl.sol',
  'access/Ownable.sol': 'utils/access/Ownable.sol',
  'access/TimelockController.sol': 'standalone/TimelockController.sol',
  'cryptography/ECDSA.sol': 'utils/cryptography/ECDSA.sol',
  'cryptography/MerkleProof.sol': 'utils/cryptography/MerkleProof.sol',
  'drafts/EIP712.sol': 'utils/drafts-EIP712.sol',
  'drafts/ERC20Permit.sol': 'tokens/ERC20/extensions/draft-ERC20Permit.sol',
  'drafts/IERC20Permit.sol': 'tokens/ERC20/extensions/draft-IERC20Permit.sol',
  'GSN/Context.sol': 'utils/Context.sol',
  'GSN/GSNRecipientERC20Fee.sol': 'utils/GSN/GSNRecipientERC20Fee.sol',
  'GSN/GSNRecipientSignature.sol': 'utils/GSN/GSNRecipientSignature.sol',
  'GSN/GSNRecipient.sol': 'utils/GSN/GSNRecipient.sol',
  'GSN/IRelayHub.sol': 'utils/GSN/IRelayHub.sol',
  'GSN/IRelayRecipient.sol': 'utils/GSN/IRelayRecipient.sol',
  'introspection/ERC165Checker.sol': 'utils/introspection/ERC165Checker.sol',
  'introspection/ERC165.sol': 'utils/introspection/ERC165.sol',
  'introspection/ERC1820Implementer.sol': 'utils/introspection/ERC1820Implementer.sol',
  'introspection/IERC165.sol': 'utils/introspection/IERC165.sol',
  'introspection/IERC1820Implementer.sol': 'utils/introspection/IERC1820Implementer.sol',
  'introspection/IERC1820Registry.sol': 'utils/introspection/IERC1820Registry.sol',
  'math/Math.sol': 'utils/math/Math.sol',
  'math/SafeMath.sol': 'utils/math/SafeMath.sol',
  'math/SignedSafeMath.sol': 'utils/math/SignedSafeMath.sol',
  'payment/escrow/ConditionalEscrow.sol': 'utils/payment/escrow/ConditionalEscrow.sol',
  'payment/escrow/Escrow.sol': 'utils/payment/escrow/Escrow.sol',
  'payment/escrow/RefundEscrow.sol': 'utils/payment/escrow/RefundEscrow.sol',
  'payment/PaymentSplitter.sol': 'standalone/PaymentSplitter.sol',
  'payment/PullPayment.sol': 'utils/payment/PullPayment.sol',
  'presets/ERC1155PresetMinterPauser.sol': 'tokens/ERC1155/presets/ERC1155PresetMinterPauser.sol',
  'presets/ERC20PresetFixedSupply.sol': 'tokens/ERC20/presets/ERC20PresetFixedSupply.sol',
  'presets/ERC20PresetMinterPauser.sol': 'tokens/ERC20/presets/ERC20PresetMinterPauser.sol',
  'presets/ERC721PresetMinterPauserAutoId.sol': 'tokens/ERC721/presets/ERC721PresetMinterPauserAutoId.sol',
  'presets/ERC777PresetFixedSupply.sol': 'tokens/ERC777/presets/ERC777PresetFixedSupply.sol',
  'proxy/BeaconProxy.sol': 'proxy/beacon/BeaconProxy.sol',
  'proxy/Clones.sol': null,
  'proxy/IBeacon.sol': 'proxy/beacon/IBeacon.sol',
  'proxy/Initializable.sol': 'utils/Initializable.sol',
  'proxy/ProxyAdmin.sol': 'proxy/transparent/ProxyAdmin.sol',
  'proxy/Proxy.sol': null,
  'proxy/TransparentUpgradeableProxy.sol': 'proxy/transparent/TransparentUpgradeableProxy.sol',
  'proxy/UpgradeableBeacon.sol': 'proxy/beacon/UpgradeableBeacon.sol',
  'proxy/UpgradeableProxy.sol': null,
  'token/ERC1155/ERC1155Burnable.sol': 'token/ERC1155/extensions/ERC1155Burnable.sol',
  'token/ERC1155/ERC1155Holder.sol': 'token/ERC1155/utils/ERC1155Holder.sol',
  'token/ERC1155/ERC1155Pausable.sol': 'token/ERC1155/extensions/ERC1155Pausable.sol',
  'token/ERC1155/ERC1155Receiver.sol': 'token/ERC1155/utils/ERC1155Receiver.sol',
  'token/ERC1155/ERC1155.sol': null,
  'token/ERC1155/IERC1155MetadataURI.sol': 'token/ERC1155/extensions/IERC1155MetadataURI.sol',
  'token/ERC1155/IERC1155Receiver.sol': null,
  'token/ERC1155/IERC1155.sol': null,
  'token/ERC20/ERC20Burnable.sol': 'token/ERC20/extensions/ERC20Burnable.sol',
  'token/ERC20/ERC20Capped.sol': 'token/ERC20/extensions/ERC20Capped.sol',
  'token/ERC20/ERC20Pausable.sol': 'token/ERC20/extensions/ERC20Pausable.sol',
  'token/ERC20/ERC20Snapshot.sol': 'token/ERC20/extensions/ERC20Snapshot.sol',
  'token/ERC20/ERC20.sol': null,
  'token/ERC20/IERC20.sol': null,
  'token/ERC20/SafeERC20.sol': 'token/ERC20/utils/SafeERC20.sol',
  'token/ERC20/TokenTimelock.sol': 'standalone/TokenTimelock.sol',
  'token/ERC721/ERC721Burnable.sol': 'token/ERC721/extensions/ERC721Burnable.sol',
  'token/ERC721/ERC721Holder.sol': 'token/ERC721/utils/ERC721Holder.sol',
  'token/ERC721/ERC721Pausable.sol': 'token/ERC721/extensions/ERC721Pausable.sol',
  'token/ERC721/ERC721.sol': null,
  'token/ERC721/IERC721Enumerable.sol': 'token/ERC721/extensions/IERC721Enumerable.sol',
  'token/ERC721/IERC721Metadata.sol': 'token/ERC721/extensions/IERC721Metadata.sol',
  'token/ERC721/IERC721Receiver.sol': null,
  'token/ERC721/IERC721.sol': null,
  'token/ERC777/ERC777.sol': null,
  'token/ERC777/IERC777Recipient.sol': null,
  'token/ERC777/IERC777Sender.sol': null,
  'token/ERC777/IERC777.sol': null,
  'utils/Address.sol': null,
  'utils/Arrays.sol': null,
  'utils/Context.sol': null,
  'utils/Counters.sol': null,
  'utils/Create2.sol': null,
  'utils/EnumerableMap.sol': 'utils/enumerable/EnumerableMap.sol',
  'utils/EnumerableSet.sol': 'utils/enumerable/EnumerableSet.sol',
  'utils/Pausable.sol': null,
  'utils/ReentrancyGuard.sol': null,
  'utils/SafeCast.sol': null,
  'utils/Strings.sol': null,
};

(async () => {
  debug('rewrite-migration')('started');
  const logs = await replace({
    files: (process.argv.length > 2 ? process.argv.slice(2) : [ 'contracts' ])
      .map(file => fs.statSync(file).isDirectory() ? path.join(file, '**', '*.sol') : file),
    from: Object.entries(updates)
      .filter(([ from, to ]) => to)
      .flatMap(([ from, to ]) => versions.map(version => path.join(version, from))),
    to: Object.entries(updates)
      .filter(([ from, to ]) => to)
      .flatMap(([ from, to ]) => versions.map(version => path.join(version, to))),
  });
  logs.filter(({ hasChanged }) => hasChanged).forEach(({ file }) => debug('rewrite-migration:updated')(file));
  debug('rewrite-migration')('finished');
})().catch(console.error);
