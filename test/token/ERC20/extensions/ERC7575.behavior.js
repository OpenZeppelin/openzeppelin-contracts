import { expect } from 'chai';
import { interfaceId } from '../../../helpers/methods';
import { shouldSupportInterfaces } from '../../../utils/introspection/SupportsInterface.behavior';

const ERC7575 = [
  'asset()',
  'share()',
  'totalAssets()',
  'convertToShares(uint256)',
  'convertToAssets(uint256)',
  'maxDeposit(address)',
  'maxMint(address)',
  'maxRedeem(address)',
  'maxWithdraw(address)',
  'previewDeposit(uint256)',
  'previewMint(uint256)',
  'previewRedeem(uint256)',
  'previewWithdraw(uint256)',
  'deposit(uint256,address)',
  'mint(uint256,address)',
  'redeem(uint256,address,address)',
  'withdraw(uint256,address,address)',
];
const ERC7575Share = ['vault(address)'];

function shouldBehaveLikeERC7575({ selfAsset } = {}) {
  selfAsset ??= true;

  describe('Should behave like ERC7575', function () {
    describe('supports ERC-7575 interface', function () {
      expect(interfaceId(ERC7575)).to.equal('0x2f0a18c5');
      expect(interfaceId(ERC7575Share)).to.equal('0xf815c03d');

      shouldSupportInterfaces(Object.assign({ ERC7575 }, selfAsset ? { ERC7575Share } : {}));
    });

    it('get share address', async function () {
      if (selfAsset) {
        await expect(this.mock.share()).to.eventually.equal(this.mock);
      } else {
        await expect(this.mock.share()).to.eventually.not.equal(this.mock);
      }
    });
  });
}

export { shouldBehaveLikeERC7575 };
