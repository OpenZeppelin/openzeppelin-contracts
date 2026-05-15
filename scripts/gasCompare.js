// Gas comparison: N separate VestingWallet contracts vs one VestingWalletFactory.
//
// Usage:
//   npx hardhat run scripts/gasCompare.js
//   N=10 npx hardhat run scripts/gasCompare.js   (Linux/macOS)
//   $env:N="10"; npx hardhat run scripts/gasCompare.js  (PowerShell)

const { ethers } = require('hardhat');

const N        = parseInt(process.env.N ?? '5');
const AMOUNT   = ethers.parseEther('1000');
const DURATION = BigInt(365 * 24 * 3600); // 1 year in seconds

async function main() {
  if (N < 1) throw new Error('N must be at least 1');

  const signers = await ethers.getSigners();
  const [owner, ...rest] = signers;

  if (rest.length < N) {
    throw new Error(
      `N=${N} requires ${N + 1} signers but Hardhat provides ${signers.length}. ` +
      `Lower N or add more accounts in hardhat.config.js.`,
    );
  }

  const beneficiaries = rest.slice(0, N);
  const block = await ethers.provider.getBlock('latest');
  const start = BigInt(block.timestamp) + 3600n;

  const token = await ethers.deployContract('$ERC20', ['Gas Token', 'GT']);
  console.log(`\nBenchmarking N=${N} beneficiar${N === 1 ? 'y' : 'ies'}...`);

  // ── Approach A: one VestingWallet per beneficiary ─────────────────────────

  const walletDeployGas  = [];
  const walletFundGas    = [];
  const walletReleaseGas = [];
  const wallets          = [];

  for (let i = 0; i < N; i++) {
    await token.$_mint(owner.address, AMOUNT);

    const wallet = await ethers.deployContract('VestingWallet', [
      beneficiaries[i].address,
      start,
      DURATION,
    ]);
    walletDeployGas.push((await wallet.deploymentTransaction().wait()).gasUsed);

    const fundReceipt = await (await token.connect(owner).transfer(wallet.target, AMOUNT)).wait();
    walletFundGas.push(fundReceipt.gasUsed);

    wallets.push(wallet);
  }

  // ── Approach B: VestingWalletFactory ─────────────────────────────────────

  const factory = await ethers.deployContract('VestingWalletFactory', [owner.address]);
  const factoryDeployGas = (await factory.deploymentTransaction().wait()).gasUsed;

  await token.$_mint(owner.address, AMOUNT * BigInt(N));
  const approveGas = (
    await (await token.connect(owner).approve(factory.target, ethers.MaxUint256)).wait()
  ).gasUsed;

  const factoryCreateGas  = [];
  const factoryReleaseGas = [];

  for (let i = 0; i < N; i++) {
    const receipt = await (
      await factory.createVestingSchedule(
        beneficiaries[i].address,
        token.target,
        start,
        DURATION,
        AMOUNT,
      )
    ).wait();
    factoryCreateGas.push(receipt.gasUsed);
  }

  // ── Advance time past vesting end ─────────────────────────────────────────

  await ethers.provider.send('evm_increaseTime', [Number(DURATION) + 3601]);
  await ethers.provider.send('evm_mine');

  // ── Release ───────────────────────────────────────────────────────────────

  for (const wallet of wallets) {
    const receipt = await (await wallet['release(address)'](token.target)).wait();
    walletReleaseGas.push(receipt.gasUsed);
  }

  for (let i = 0; i < N; i++) {
    const receipt = await (await factory.release(BigInt(i))).wait();
    factoryReleaseGas.push(receipt.gasUsed);
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────

  const sum = arr => arr.reduce((a, b) => a + b, 0n);
  const avg = arr => sum(arr) / BigInt(arr.length);

  const factoryOneTime    = factoryDeployGas + approveGas;
  const walletSetupTotal  = sum(walletDeployGas) + sum(walletFundGas);
  const factorySetupTotal = factoryOneTime + sum(factoryCreateGas);
  const walletTotal       = walletSetupTotal + sum(walletReleaseGas);
  const factoryTotal      = factorySetupTotal + sum(factoryReleaseGas);

  // ── Print table ───────────────────────────────────────────────────────────

  const LBL = 38;
  const W   = 14;
  const SEP  = '  ' + '-'.repeat(LBL + W + W + 2);
  const RULE = '  ' + '='.repeat(LBL + W + W + 2);

  // Inserts commas and right-pads to W characters
  const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',').padStart(W);

  const row = (label, walletVal, factoryVal) =>
    `  ${label.padEnd(LBL)} ${walletVal} ${factoryVal}`;

  console.log('');
  console.log(RULE);
  console.log(`  Gas Comparison — N = ${N} beneficiar${N === 1 ? 'y' : 'ies'}`);
  console.log(RULE);

  console.log('');
  console.log(row('SETUP', 'VestingWallet'.padStart(W), 'Factory'.padStart(W)));
  console.log(SEP);
  console.log(row('  avg deploy / createSchedule', fmt(avg(walletDeployGas)),                    fmt(avg(factoryCreateGas))));
  console.log(row('  avg fund transfer',           fmt(avg(walletFundGas)),                       '(incl. above)'.padStart(W)));
  console.log(row('  avg per-beneficiary total',   fmt(avg(walletDeployGas) + avg(walletFundGas)), fmt(avg(factoryCreateGas))));
  console.log(row('  one-time: deploy + approve',  '—'.padStart(W),                               fmt(factoryOneTime)));
  console.log(SEP);
  console.log(row(`  total setup  (N=${N})`,       fmt(walletSetupTotal),                         fmt(factorySetupTotal)));

  console.log('');
  console.log(row('RELEASE', 'VestingWallet'.padStart(W), 'Factory'.padStart(W)));
  console.log(SEP);
  console.log(row('  avg per beneficiary',         fmt(avg(walletReleaseGas)),                    fmt(avg(factoryReleaseGas))));
  console.log(SEP);
  console.log(row(`  total release (N=${N})`,      fmt(sum(walletReleaseGas)),                    fmt(sum(factoryReleaseGas))));

  console.log('');
  console.log(RULE);
  console.log(row('GRAND TOTAL (setup + release)', fmt(walletTotal), fmt(factoryTotal)));
  console.log(RULE);

  const savings = walletTotal - factoryTotal;
  if (savings > 0n) {
    const pct = (Number(savings * 10000n / walletTotal) / 100).toFixed(1);
    const fmtSavings = savings.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    console.log(`\n  Factory saves ${fmtSavings} gas (${pct}% cheaper than separate wallets)`);
  } else {
    const extra = -savings;
    const pct = (Number(extra * 10000n / factoryTotal) / 100).toFixed(1);
    const fmtExtra = extra.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    console.log(`\n  Separate wallets save ${fmtExtra} gas (${pct}% cheaper than factory)`);
  }
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
