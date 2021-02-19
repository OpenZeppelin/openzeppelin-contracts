const fs = require('fs');
const glob = require('glob');
const path = require('path');

const versions = [
  '@openzeppelin/contracts',
  '@openzeppelin/contracts-upgradeable',
];

const updates = {
  'access/AccessControl.sol': undefined,
  'access/Ownable.sol': undefined,
  'access/TimelockController.sol': 'governance/TimelockController.sol',
  'cryptography/ECDSA.sol': 'utils/cryptography/ECDSA.sol',
  'cryptography/MerkleProof.sol': 'utils/cryptography/MerkleProof.sol',
  'drafts/EIP712.sol': 'utils/cryptography/draft-EIP712.sol',
  'drafts/ERC20Permit.sol': 'token/ERC20/extensions/draft-ERC20Permit.sol',
  'drafts/IERC20Permit.sol': 'token/ERC20/extensions/draft-IERC20Permit.sol',
  'GSN/Context.sol': 'utils/Context.sol',
  'GSN/GSNRecipientERC20Fee.sol': undefined,
  'GSN/GSNRecipientSignature.sol': undefined,
  'GSN/GSNRecipient.sol': undefined,
  'GSN/IRelayHub.sol': undefined,
  'GSN/IRelayRecipient.sol': undefined,
  'introspection/ERC165Checker.sol': 'utils/introspection/ERC165Checker.sol',
  'introspection/ERC165.sol': 'utils/introspection/ERC165.sol',
  'introspection/ERC1820Implementer.sol': 'utils/introspection/ERC1820Implementer.sol',
  'introspection/IERC165.sol': 'utils/introspection/IERC165.sol',
  'introspection/IERC1820Implementer.sol': 'utils/introspection/IERC1820Implementer.sol',
  'introspection/IERC1820Registry.sol': 'utils/introspection/IERC1820Registry.sol',
  'math/Math.sol': 'utils/math/Math.sol',
  'math/SafeMath.sol': 'utils/math/SafeMath.sol',
  'math/SignedSafeMath.sol': 'utils/math/SignedSafeMath.sol',
  'payment/escrow/ConditionalEscrow.sol': 'utils/escrow/ConditionalEscrow.sol',
  'payment/escrow/Escrow.sol': 'utils/escrow/Escrow.sol',
  'payment/escrow/RefundEscrow.sol': 'utils/escrow/RefundEscrow.sol',
  'payment/PaymentSplitter.sol': 'utils/PaymentSplitter.sol',
  'payment/PullPayment.sol': 'security/PullPayment.sol',
  'presets/ERC1155PresetMinterPauser.sol': 'token/ERC1155/presets/ERC1155PresetMinterPauser.sol',
  'presets/ERC20PresetFixedSupply.sol': 'token/ERC20/presets/ERC20PresetFixedSupply.sol',
  'presets/ERC20PresetMinterPauser.sol': 'token/ERC20/presets/ERC20PresetMinterPauser.sol',
  'presets/ERC721PresetMinterPauserAutoId.sol': 'token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol',
  'presets/ERC777PresetFixedSupply.sol': 'token/ERC777/presets/ERC777PresetFixedSupply.sol',
  'proxy/BeaconProxy.sol': 'proxy/beacon/BeaconProxy.sol',
  'proxy/Clones.sol': undefined,
  'proxy/IBeacon.sol': 'proxy/beacon/IBeacon.sol',
  'proxy/Initializable.sol': 'utils/Initializable.sol',
  'proxy/ProxyAdmin.sol': 'proxy/transparent/ProxyAdmin.sol',
  'proxy/Proxy.sol': undefined,
  'proxy/TransparentUpgradeableProxy.sol': 'proxy/transparent/TransparentUpgradeableProxy.sol',
  'proxy/UpgradeableBeacon.sol': 'proxy/beacon/UpgradeableBeacon.sol',
  'proxy/UpgradeableProxy.sol': undefined,
  'token/ERC1155/ERC1155Burnable.sol': 'token/ERC1155/extensions/ERC1155Burnable.sol',
  'token/ERC1155/ERC1155Holder.sol': 'token/ERC1155/utils/ERC1155Holder.sol',
  'token/ERC1155/ERC1155Pausable.sol': 'token/ERC1155/extensions/ERC1155Pausable.sol',
  'token/ERC1155/ERC1155Receiver.sol': 'token/ERC1155/utils/ERC1155Receiver.sol',
  'token/ERC1155/ERC1155.sol': undefined,
  'token/ERC1155/IERC1155MetadataURI.sol': 'token/ERC1155/extensions/IERC1155MetadataURI.sol',
  'token/ERC1155/IERC1155Receiver.sol': undefined,
  'token/ERC1155/IERC1155.sol': undefined,
  'token/ERC20/ERC20Burnable.sol': 'token/ERC20/extensions/ERC20Burnable.sol',
  'token/ERC20/ERC20Capped.sol': 'token/ERC20/extensions/ERC20Capped.sol',
  'token/ERC20/ERC20Pausable.sol': 'token/ERC20/extensions/ERC20Pausable.sol',
  'token/ERC20/ERC20Snapshot.sol': 'token/ERC20/extensions/ERC20Snapshot.sol',
  'token/ERC20/ERC20.sol': undefined,
  'token/ERC20/IERC20.sol': undefined,
  'token/ERC20/SafeERC20.sol': 'token/ERC20/utils/SafeERC20.sol',
  'token/ERC20/TokenTimelock.sol': 'token/ERC20/utils//TokenTimelock.sol',
  'token/ERC721/ERC721Burnable.sol': 'token/ERC721/extensions/ERC721Burnable.sol',
  'token/ERC721/ERC721Holder.sol': 'token/ERC721/utils/ERC721Holder.sol',
  'token/ERC721/ERC721Pausable.sol': 'token/ERC721/extensions/ERC721Pausable.sol',
  'token/ERC721/ERC721.sol': undefined,
  'token/ERC721/IERC721Enumerable.sol': 'token/ERC721/extensions/IERC721Enumerable.sol',
  'token/ERC721/IERC721Metadata.sol': 'token/ERC721/extensions/IERC721Metadata.sol',
  'token/ERC721/IERC721Receiver.sol': undefined,
  'token/ERC721/IERC721.sol': undefined,
  'token/ERC777/ERC777.sol': undefined,
  'token/ERC777/IERC777Recipient.sol': undefined,
  'token/ERC777/IERC777Sender.sol': undefined,
  'token/ERC777/IERC777.sol': undefined,
  'utils/Address.sol': undefined,
  'utils/Arrays.sol': undefined,
  'utils/Context.sol': undefined,
  'utils/Counters.sol': undefined,
  'utils/Create2.sol': undefined,
  'utils/EnumerableMap.sol': 'utils/structs/EnumerableMap.sol',
  'utils/EnumerableSet.sol': 'utils/structs/EnumerableSet.sol',
  'utils/Pausable.sol': 'security/Pausable.sol',
  'utils/ReentrancyGuard.sol': 'security/ReentrancyGuard.sol',
  'utils/SafeCast.sol': 'utils/math/SafeCast.sol',
  'utils/Strings.sol': undefined,
};

const globAsync = (pattern) =>
  new Promise((resolve, reject) => {
    glob(pattern, (error, files) => error ? reject(error) : resolve(files));
  });

const getPathsAsync = (patterns) =>
  Promise.all(patterns.map(globAsync)).then(paths => [].concat.apply([], paths));

const replaceAsync = (file, from, to, encoding = 'utf-8') =>
  new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (error, contents) => {
      if (error) {
        return reject(error);
      }

      const newContents = from.reduce((contents, item, i) => contents.replace(item, to[i]), contents);

      if (contents === newContents) {
        return resolve({ file, hasChanged: false });
      }

      fs.writeFile(file, newContents, encoding, error => error ? reject(error) : resolve({ file, hasChanged: true }));
    });
  });

const replaceInFiles = (files, from, to) =>
  getPathsAsync(files)
    .then(paths => Promise.all(paths.map(file => replaceAsync(file, from, to))))
    .then(results => {
      return results;
    })
    .catch(error => {
      throw error;
    });

(async () => {
  const results = await replaceInFiles(
    /* files */
    (process.argv.length > 2 ? process.argv.slice(2) : [ 'contracts' ])
      .map(file => fs.statSync(file).isDirectory() ? path.join(file, '**', '*.sol') : file),
    /* from */
    Object.entries(updates)
      .filter(([ from, to ]) => to)
      .flatMap(([ from, to ]) => versions.map(version => path.join(version, from))),
    /* to */
    Object.entries(updates)
      .filter(([ from, to ]) => to)
      .flatMap(([ from, to ]) => versions.map(version => path.join(version, to))),
  );

  const changed = results.filter(result => result.hasChanged);
  if (changed.length) {
    console.log(`${changed.length} file(s) were changed`);
    changed.forEach(result => console.log('-', result.file));
  } else {
    console.log('No files were changed');
  }
})().catch(console.error);
