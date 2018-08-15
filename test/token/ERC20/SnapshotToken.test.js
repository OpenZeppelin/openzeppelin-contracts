const SnapshotToken = artifacts.require('SnapshotTokenMock');

contract('SnapshotToken', function ([_, account1, account2]) {
  beforeEach(async function () {
    this.token = await SnapshotToken.new({ from: account1 });
  });

  it('can snapshot!', async function () {
    assert.equal(await this.token.balanceOf(account1), 10000);
    assert.equal(await this.token.balanceOf(account2), 0);

    const { logs: logs1 } = await this.token.snapshot();
    const snapshotId1 = logs1[0].args.id;

    assert.equal(await this.token.balanceOf(account1), 10000);
    assert.equal(await this.token.balanceOf(account2), 0);

    assert.equal(await this.token.balanceOfAt(account1, snapshotId1), 10000);
    assert.equal(await this.token.balanceOfAt(account2, snapshotId1), 0);

    await this.token.transfer(account2, 500, { from: account1 });

    assert.equal(await this.token.balanceOf(account1), 9500);
    assert.equal(await this.token.balanceOf(account2), 500);

    assert.equal(await this.token.balanceOfAt(account1, snapshotId1), 10000);
    assert.equal(await this.token.balanceOfAt(account2, snapshotId1), 0);

    const { logs: logs2 } = await this.token.snapshot();
    const snapshotId2 = logs2[0].args.id;

    assert.equal(await this.token.balanceOf(account1), 9500);
    assert.equal(await this.token.balanceOf(account2), 500);

    assert.equal(await this.token.balanceOfAt(account1, snapshotId2), 9500);
    assert.equal(await this.token.balanceOfAt(account2, snapshotId2), 500);
  });
});
