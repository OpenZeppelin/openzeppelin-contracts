#!/usr/bin/env node

const { promises: fs } = require('fs');
const path = require('path');

const pathUpdates = {
  // 'access/AccessControl.sol': undefined,
  // 'access/Ownable.sol': undefined,
  'access/TimelockController.sol': 'governance/TimelockController.sol',
  'cryptography/ECDSA.sol': 'utils/cryptography/ECDSA.sol',
  'cryptography/MerkleProof.sol': 'utils/cryptography/MerkleProof.sol',
  'drafts/EIP712.sol': 'utils/cryptography/EIP712.sol',
  'drafts/ERC20Permit.sol': 'token/ERC20/extensions/ERC20Permit.sol',
  'drafts/IERC20Permit.sol': 'token/ERC20/extensions/IERC20Permit.sol',
  'GSN/Context.sol': 'utils/Context.sol',
  // 'GSN/GSNRecipientERC20Fee.sol': undefined,
  // 'GSN/GSNRecipientSignature.sol': undefined,
  // 'GSN/GSNRecipient.sol': undefined,
  // 'GSN/IRelayHub.sol': undefined,
  // 'GSN/IRelayRecipient.sol': undefined,
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
  'payment/PaymentSplitter.sol': 'finance/PaymentSplitter.sol',
  'utils/PaymentSplitter.sol': 'finance/PaymentSplitter.sol',
  'payment/PullPayment.sol': 'security/PullPayment.sol',
  'presets/ERC1155PresetMinterPauser.sol': 'token/ERC1155/presets/ERC1155PresetMinterPauser.sol',
  'presets/ERC20PresetFixedSupply.sol': 'token/ERC20/presets/ERC20PresetFixedSupply.sol',
  'presets/ERC20PresetMinterPauser.sol': 'token/ERC20/presets/ERC20PresetMinterPauser.sol',
  'presets/ERC721PresetMinterPauserAutoId.sol': 'token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol',
  'presets/ERC777PresetFixedSupply.sol': 'token/ERC777/presets/ERC777PresetFixedSupply.sol',
  'proxy/BeaconProxy.sol': 'proxy/beacon/BeaconProxy.sol',
  // 'proxy/Clones.sol': undefined,
  'proxy/IBeacon.sol': 'proxy/beacon/IBeacon.sol',
  'proxy/Initializable.sol': 'proxy/utils/Initializable.sol',
  'utils/Initializable.sol': 'proxy/utils/Initializable.sol',
  'proxy/ProxyAdmin.sol': 'proxy/transparent/ProxyAdmin.sol',
  // 'proxy/Proxy.sol': undefined,
  'proxy/TransparentUpgradeableProxy.sol': 'proxy/transparent/TransparentUpgradeableProxy.sol',
  'proxy/UpgradeableBeacon.sol': 'proxy/beacon/UpgradeableBeacon.sol',
  'proxy/UpgradeableProxy.sol': 'proxy/ERC1967/ERC1967Proxy.sol',
  'token/ERC1155/ERC1155Burnable.sol': 'token/ERC1155/extensions/ERC1155Burnable.sol',
  'token/ERC1155/ERC1155Holder.sol': 'token/ERC1155/utils/ERC1155Holder.sol',
  'token/ERC1155/ERC1155Pausable.sol': 'token/ERC1155/extensions/ERC1155Pausable.sol',
  'token/ERC1155/ERC1155Receiver.sol': 'token/ERC1155/utils/ERC1155Receiver.sol',
  // 'token/ERC1155/ERC1155.sol': undefined,
  'token/ERC1155/IERC1155MetadataURI.sol': 'token/ERC1155/extensions/IERC1155MetadataURI.sol',
  // 'token/ERC1155/IERC1155Receiver.sol': undefined,
  // 'token/ERC1155/IERC1155.sol': undefined,
  'token/ERC20/ERC20Burnable.sol': 'token/ERC20/extensions/ERC20Burnable.sol',
  'token/ERC20/ERC20Capped.sol': 'token/ERC20/extensions/ERC20Capped.sol',
  'token/ERC20/ERC20Pausable.sol': 'token/ERC20/extensions/ERC20Pausable.sol',
  'token/ERC20/ERC20Snapshot.sol': 'token/ERC20/extensions/ERC20Snapshot.sol',
  // 'token/ERC20/ERC20.sol': undefined,
  // 'token/ERC20/IERC20.sol': undefined,
  'token/ERC20/SafeERC20.sol': 'token/ERC20/utils/SafeERC20.sol',
  'token/ERC20/TokenTimelock.sol': 'token/ERC20/utils/TokenTimelock.sol',
  'token/ERC721/ERC721Burnable.sol': 'token/ERC721/extensions/ERC721Burnable.sol',
  'token/ERC721/ERC721Holder.sol': 'token/ERC721/utils/ERC721Holder.sol',
  'token/ERC721/ERC721Pausable.sol': 'token/ERC721/extensions/ERC721Pausable.sol',
  // 'token/ERC721/ERC721.sol': undefined,
  'token/ERC721/IERC721Enumerable.sol': 'token/ERC721/extensions/IERC721Enumerable.sol',
  'token/ERC721/IERC721Metadata.sol': 'token/ERC721/extensions/IERC721Metadata.sol',
  // 'token/ERC721/IERC721Receiver.sol': undefined,
  // 'token/ERC721/IERC721.sol': undefined,
  // 'token/ERC777/ERC777.sol': undefined,
  // 'token/ERC777/IERC777Recipient.sol': undefined,
  // 'token/ERC777/IERC777Sender.sol': undefined,
  // 'token/ERC777/IERC777.sol': undefined,
  // 'utils/Address.sol': undefined,
  // 'utils/Arrays.sol': undefined,
  // 'utils/Context.sol': undefined,
  // 'utils/Counters.sol': undefined,
  // 'utils/Create2.sol': undefined,
  'utils/EnumerableMap.sol': 'utils/structs/EnumerableMap.sol',
  'utils/EnumerableSet.sol': 'utils/structs/EnumerableSet.sol',
  'utils/Pausable.sol': 'security/Pausable.sol',
  'utils/ReentrancyGuard.sol': 'security/ReentrancyGuard.sol',
  'utils/SafeCast.sol': 'utils/math/SafeCast.sol',
  // 'utils/Strings.sol': undefined,
  'utils/cryptography/draft-EIP712.sol': 'utils/cryptography/EIP712.sol',
  'token/ERC20/extensions/draft-ERC20Permit.sol': 'token/ERC20/extensions/ERC20Permit.sol',
  'token/ERC20/extensions/draft-IERC20Permit.sol': 'token/ERC20/extensions/IERC20Permit.sol',
};

async function main (paths = [ 'contracts' ]) {
  const files = await listFilesRecursively(paths, /\.sol$/);

  const updatedFiles = [];
  for (const file of files) {
    if (await updateFile(file, updateImportPaths)) {
      updatedFiles.push(file);
    }
  }

  if (updatedFiles.length > 0) {
    console.log(`${updatedFiles.length} file(s) were updated`);
    for (const c of updatedFiles) {
      console.log('-', c);
    }
  } else {
    console.log('No files were updated');
  }
}

async function listFilesRecursively (paths, filter) {
  const queue = paths;
  const files = [];

  while (queue.length > 0) {
    const top = queue.shift();
    const stat = await fs.stat(top);
    if (stat.isFile()) {
      if (top.match(filter)) {
        files.push(top);
      }
    } else if (stat.isDirectory()) {
      for (const name of await fs.readdir(top)) {
        queue.push(path.join(top, name));
      }
    }
  }

  return files;
}

async function updateFile (file, update) {
  const content = await fs.readFile(file, 'utf8');
  const updatedContent = update(content);
  if (updatedContent !== content) {
    await fs.writeFile(file, updatedContent);
    return true;
  } else {
    return false;
  }
}

function updateImportPaths (source) {
  for (const [ oldPath, newPath ] of Object.entries(pathUpdates)) {
    source = source.replace(
      path.join('@openzeppelin/contracts', oldPath),
      path.join('@openzeppelin/contracts', newPath),
    );
    source = source.replace(
      path.join('@openzeppelin/contracts-upgradeable', getUpgradeablePath(oldPath)),
      path.join('@openzeppelin/contracts-upgradeable', getUpgradeablePath(newPath)),
    );
  }

  return source;
}

function getUpgradeablePath (file) {
  const { dir, name, ext } = path.parse(file);
  const upgradeableName = name + 'Upgradeable';
  return path.format({ dir, ext, name: upgradeableName });
}

module.exports = {
  pathUpdates,
  updateImportPaths,
  getUpgradeablePath,
};

if (require.main === module) {
  const args = process.argv.length > 2 ? process.argv.slice(2) : undefined;
  main(args).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
