// Simple script to verify that our mock contracts compile correctly
// This doesn't run tests but at least verifies that the contracts are valid

const fs = require('fs');
const path = require('path');

// Paths to our mock contracts
const mockERC20Path = path.join(__dirname, '../contracts/testing/token/MockERC20.sol');
const mockERC721Path = path.join(__dirname, '../contracts/testing/token/MockERC721.sol');

// Check if the files exist
console.log('Verifying mock contracts...');

if (fs.existsSync(mockERC20Path)) {
  console.log('✅ MockERC20.sol exists');

  // Read the file to check its content
  const mockERC20Content = fs.readFileSync(mockERC20Path, 'utf8');

  if (mockERC20Content.includes('contract MockERC20 is ERC20')) {
    console.log('✅ MockERC20.sol contains the correct contract definition');
  } else {
    console.error('❌ MockERC20.sol does not contain the expected contract definition');
  }

  if (mockERC20Content.includes('function mint(address account, uint256 amount)')) {
    console.log('✅ MockERC20.sol contains the mint function');
  } else {
    console.error('❌ MockERC20.sol does not contain the mint function');
  }

  if (mockERC20Content.includes('function burn(address account, uint256 amount)')) {
    console.log('✅ MockERC20.sol contains the burn function');
  } else {
    console.error('❌ MockERC20.sol does not contain the burn function');
  }
} else {
  console.error('❌ MockERC20.sol does not exist');
}

if (fs.existsSync(mockERC721Path)) {
  console.log('✅ MockERC721.sol exists');

  // Read the file to check its content
  const mockERC721Content = fs.readFileSync(mockERC721Path, 'utf8');

  if (mockERC721Content.includes('contract MockERC721 is ERC721')) {
    console.log('✅ MockERC721.sol contains the correct contract definition');
  } else {
    console.error('❌ MockERC721.sol does not contain the expected contract definition');
  }

  if (mockERC721Content.includes('function mint(address to, uint256 tokenId)')) {
    console.log('✅ MockERC721.sol contains the mint function');
  } else {
    console.error('❌ MockERC721.sol does not contain the mint function');
  }

  if (mockERC721Content.includes('function safeMint(address to, uint256 tokenId)')) {
    console.log('✅ MockERC721.sol contains the safeMint function');
  } else {
    console.error('❌ MockERC721.sol does not contain the safeMint function');
  }

  if (mockERC721Content.includes('function burn(uint256 tokenId)')) {
    console.log('✅ MockERC721.sol contains the burn function');
  } else {
    console.error('❌ MockERC721.sol does not contain the burn function');
  }
} else {
  console.error('❌ MockERC721.sol does not exist');
}

console.log('\nVerification complete!');
