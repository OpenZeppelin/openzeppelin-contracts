// Local demo: VestingWalletFactory end-to-end walkthrough.
//
// Usage:
//   npx hardhat run scripts/demoFactory.js

const { ethers } = require('hardhat');

const DECIMALS  = 18n;
const UNIT      = 10n ** DECIMALS;
const fmt       = n => (Number(n) / Number(UNIT)).toFixed(2);
const fmtAddr   = a => a.slice(0, 6) + '...' + a.slice(-4);

async function printSchedule(factory, token, id, label) {
  const s          = await factory.getSchedule(id);
  const releasable = await factory.releasable(id);
  const balance    = await token.balanceOf(s.beneficiary);
  console.log(`  [Schedule ${id}] ${label}`);
  console.log(`    beneficiary : ${fmtAddr(s.beneficiary)}`);
  console.log(`    allocation  : ${fmt(s.totalAllocation)} tokens`);
  console.log(`    released    : ${fmt(s.released)} tokens`);
  console.log(`    releasable  : ${fmt(releasable)} tokens`);
  console.log(`    wallet bal  : ${fmt(balance)} tokens`);
}

async function main() {
  const signers = await ethers.getSigners();
  const [owner, alice, bob, carol] = signers;

  const block = await ethers.provider.getBlock('latest');
  const now   = BigInt(block.timestamp);

  // ── 1. Deploy token & factory ─────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════');
  console.log(' VestingWalletFactory — Local Demo');
  console.log('══════════════════════════════════════════════════\n');

  const token   = await ethers.deployContract('$ERC20', ['Demo Token', 'DMT']);
  const factory = await ethers.deployContract('VestingWalletFactory', [owner.address]);

  console.log('Contracts deployed');
  console.log(`  Token   : ${token.target}`);
  console.log(`  Factory : ${factory.target}`);

  // ── 2. Mint tokens to owner and approve factory ───────────────────────────

  const totalSupply = 3000n * UNIT;
  await token.$_mint(owner.address, totalSupply);
  await token.connect(owner).approve(factory.target, ethers.MaxUint256);

  console.log(`\nMinted ${fmt(totalSupply)} DMT to owner, factory approved.\n`);

  // ── 3. Create three vesting schedules ─────────────────────────────────────

  const start    = now + 60n;              // starts in 1 minute
  const oneYear  = BigInt(365 * 24 * 3600);
  const sixMonth = oneYear / 2n;

  // Alice: 1000 tokens over 1 year
  await factory.createVestingSchedule(alice.address, token.target, start, oneYear,  1000n * UNIT);
  // Bob:   500  tokens over 6 months
  await factory.createVestingSchedule(bob.address,   token.target, start, sixMonth,  500n * UNIT);
  // Carol: 1500 tokens over 1 year
  await factory.createVestingSchedule(carol.address, token.target, start, oneYear,  1500n * UNIT);

  console.log('Vesting schedules created:');
  console.log(`  Schedule 0 — Alice  : 1000 DMT over 12 months`);
  console.log(`  Schedule 1 — Bob    :  500 DMT over  6 months`);
  console.log(`  Schedule 2 — Carol  : 1500 DMT over 12 months`);

  // ── 4. State at t=0 ───────────────────────────────────────────────────────

  console.log('\n──────────────────────────────────────────────────');
  console.log(' State at T=0 (vesting just started)');
  console.log('──────────────────────────────────────────────────');
  await printSchedule(factory, token, 0n, 'Alice');
  await printSchedule(factory, token, 1n, 'Bob');
  await printSchedule(factory, token, 2n, 'Carol');

  // ── 5. Advance to 6 months ────────────────────────────────────────────────

  await ethers.provider.send('evm_increaseTime', [Number(sixMonth) + 60]);
  await ethers.provider.send('evm_mine');

  console.log('\n──────────────────────────────────────────────────');
  console.log(' State at T=6 months (Bob fully vested)');
  console.log('──────────────────────────────────────────────────');
  await printSchedule(factory, token, 0n, 'Alice');
  await printSchedule(factory, token, 1n, 'Bob');
  await printSchedule(factory, token, 2n, 'Carol');

  // ── 6. Release Bob's tokens ───────────────────────────────────────────────

  console.log('\nReleasing Bob\'s tokens...');
  await factory.release(1n);
  console.log('  Done.\n');
  await printSchedule(factory, token, 1n, 'Bob  (after release)');

  // ── 7. Advance to 12 months ───────────────────────────────────────────────

  await ethers.provider.send('evm_increaseTime', [Number(sixMonth)]);
  await ethers.provider.send('evm_mine');

  console.log('\n──────────────────────────────────────────────────');
  console.log(' State at T=12 months (all fully vested)');
  console.log('──────────────────────────────────────────────────');
  await printSchedule(factory, token, 0n, 'Alice');
  await printSchedule(factory, token, 1n, 'Bob');
  await printSchedule(factory, token, 2n, 'Carol');

  // ── 8. Release Alice and Carol ────────────────────────────────────────────

  console.log('\nReleasing Alice and Carol\'s tokens...');
  await factory.release(0n);
  await factory.release(2n);
  console.log('  Done.\n');

  // ── 9. Final state ────────────────────────────────────────────────────────

  console.log('──────────────────────────────────────────────────');
  console.log(' Final State');
  console.log('──────────────────────────────────────────────────');
  await printSchedule(factory, token, 0n, 'Alice');
  await printSchedule(factory, token, 1n, 'Bob');
  await printSchedule(factory, token, 2n, 'Carol');

  const factoryBalance = await token.balanceOf(factory.target);
  console.log(`\n  Factory remaining balance: ${fmt(factoryBalance)} DMT`);
  console.log('\n══════════════════════════════════════════════════\n');
}

main().catch(err => { console.error(err); process.exit(1); });
