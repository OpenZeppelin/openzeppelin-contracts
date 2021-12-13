const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const ERC1363Mock = artifacts.require('ERC1363Mock');
const ERC1363ReceiverMock = artifacts.require('ERC1363ReceiverMock');

contract('ERC1363', function (accounts) {
  const [ holder, operator ] = accounts;

  const initialSupply = new BN(100);
  const value = new BN(10);

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    this.token = await ERC1363Mock.new(name, symbol, holder, initialSupply);
    this.receiver = await ERC1363ReceiverMock.new();
  });

  shouldSupportInterfaces([
    'ERC165',
    'ERC1363',
  ]);

  describe('transferAndCall', function () {
    it('without data', async function () {
      const data = null;

      const { tx } = await this.token.methods['transferAndCall(address,uint256)'](
        this.receiver.address,
        value,
        { from: holder },
      );

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.receiver.address,
        value,
      });
      await expectEvent.inTransaction(tx, this.receiver, 'TransferReceived', {
        operator: holder,
        from: holder,
        value,
        data,
      });
    });

    it('with data', async function () {
      const data = '0x123456';

      const { tx } = await this.token.methods['transferAndCall(address,uint256,bytes)'](
        this.receiver.address,
        value,
        data,
        { from: holder },
      );

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.receiver.address,
        value,
      });
      await expectEvent.inTransaction(tx, this.receiver, 'TransferReceived', {
        operator: holder,
        from: holder,
        value,
        data,
      });
    });

    describe('revert', function () {
      it('invalid return value', async function () {
        const data = '0x00';

        await expectRevert(
          this.token.methods['transferAndCall(address,uint256,bytes)'](
            this.receiver.address,
            value,
            data,
            { from: holder },
          ),
          'ERC1363: onTransferReceived invalid result',
        );
      });

      it('hook reverts with message', async function () {
        const data = '0x01';

        await expectRevert(
          this.token.methods['transferAndCall(address,uint256,bytes)'](
            this.receiver.address,
            value,
            data,
            { from: holder },
          ),
          'onTransferReceived revert',
        );
      });

      it('hook reverts with error', async function () {
        const data = '0x02';

        await expectRevert(
          this.token.methods['transferAndCall(address,uint256,bytes)'](
            this.receiver.address,
            value,
            data,
            { from: holder },
          ),
          'ERC1363: onTransferReceived reverted without reason',
        );
      });
    });
  });

  describe('transferFromAndCall', function () {
    beforeEach(async function () {
      await this.token.approve(operator, initialSupply, { from: holder });
    });

    it('without data', async function () {
      const data = null;

      const { tx } = await this.token.methods['transferFromAndCall(address,address,uint256)'](
        holder,
        this.receiver.address,
        value,
        { from: operator },
      );

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.receiver.address,
        value,
      });
      await expectEvent.inTransaction(tx, this.receiver, 'TransferReceived', {
        operator,
        from: holder,
        value,
        data,
      });
    });

    it('with data', async function () {
      const data = '0x123456';

      const { tx } = await this.token.methods['transferFromAndCall(address,address,uint256,bytes)'](
        holder,
        this.receiver.address,
        value,
        data,
        { from: operator },
      );

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.receiver.address,
        value,
      });
      await expectEvent.inTransaction(tx, this.receiver, 'TransferReceived', {
        operator,
        from: holder,
        value,
        data,
      });
    });

    describe('revert', function () {
      it('invalid return value', async function () {
        const data = '0x00';

        await expectRevert(
          this.token.methods['transferFromAndCall(address,address,uint256,bytes)'](
            holder,
            this.receiver.address,
            value,
            data,
            { from: operator },
          ),
          'ERC1363: onTransferReceived invalid result',
        );
      });

      it('hook reverts with message', async function () {
        const data = '0x01';

        await expectRevert(
          this.token.methods['transferFromAndCall(address,address,uint256,bytes)'](
            holder,
            this.receiver.address,
            value,
            data,
            { from: operator },
          ),
          'onTransferReceived revert',
        );
      });

      it('hook reverts with error', async function () {
        const data = '0x02';

        await expectRevert(
          this.token.methods['transferFromAndCall(address,address,uint256,bytes)'](
            holder,
            this.receiver.address,
            value,
            data,
            { from: operator },
          ),
          'ERC1363: onTransferReceived reverted without reason',
        );
      });
    });
  });

  describe('approveAndCall', function () {
    it('without data', async function () {
      const data = null;

      const { tx } = await this.token.methods['approveAndCall(address,uint256)'](
        this.receiver.address,
        value,
        { from: holder },
      );

      await expectEvent.inTransaction(tx, this.token, 'Approval', {
        owner: holder,
        spender: this.receiver.address,
        value,
      });
      await expectEvent.inTransaction(tx, this.receiver, 'ApprovalReceived', {
        owner: holder,
        value,
        data,
      });
    });

    it('with data', async function () {
      const data = '0x123456';

      const { tx } = await this.token.methods['approveAndCall(address,uint256,bytes)'](
        this.receiver.address,
        value,
        data,
        { from: holder },
      );

      await expectEvent.inTransaction(tx, this.token, 'Approval', {
        owner: holder,
        spender: this.receiver.address,
        value,
      });
      await expectEvent.inTransaction(tx, this.receiver, 'ApprovalReceived', {
        owner: holder,
        value,
        data,
      });
    });

    describe('revert', function () {
      it('invalid return value', async function () {
        const data = '0x00';

        await expectRevert(
          this.token.methods['approveAndCall(address,uint256,bytes)'](
            this.receiver.address,
            value,
            data,
            { from: holder },
          ),
          'ERC1363: onApprovalReceived invalid result',
        );
      });

      it('hook reverts with message', async function () {
        const data = '0x01';

        await expectRevert(
          this.token.methods['approveAndCall(address,uint256,bytes)'](
            this.receiver.address,
            value,
            data,
            { from: holder },
          ),
          'onApprovalReceived revert',
        );
      });

      it('hook reverts with error', async function () {
        const data = '0x02';

        await expectRevert(
          this.token.methods['approveAndCall(address,uint256,bytes)'](
            this.receiver.address,
            value,
            data,
            { from: holder },
          ),
          'ERC1363: onApprovalReceived reverted without reason',
        );
      });
    });
  });
});
