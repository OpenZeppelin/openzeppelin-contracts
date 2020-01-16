const { contract } = require('@openzeppelin/test-environment');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const EnumerablesMock = contract.fromArtifact('EnumerablesMock');

const emptyData = '0x0000000000000000000000000000000000000000';
const headData = '0x0000000000000000000000000000000000000001';
const middleData = '0x0000000000000000000000000000000000000002';
const tailData = '0x0000000000000000000000000000000000000003';

describe('Enumerable', function () {
    beforeEach(async function () {
        this.enumerables = await EnumerablesMock.new();
    });

    // it('starts at zero', async function () {
    //   expect(await this.counter.current()).to.be.bignumber.equal('0');
    // });

    /**
     * Test the two describe methods
     * @test {Enumerable#set} and {Enumerable#get}
     */
    it('Constructor variables.', async function () {
        // expect(await this.enumerables.enumerable().idCounter()).toNumber()).to.be.equal(1);
    });

    it('get on a non existing object returns (0,0,0,0).', async function () {
        const result = (await this.enumerables.testGet(0));
        expect(result[0].toNumber()).to.be.equal(0);
        expect(result[1].toNumber()).to.be.equal(0);
        expect(result[2].toNumber()).to.be.equal(0);
        expect(result[3]).to.be.equal(emptyData);
    });

    it('appends an object at the head - event emission.', async function () {
        const objectEvent = (
            await this.enumerables.testAppend(headData)
        ).logs[0];
        expect(objectEvent.args.id.toNumber()).to.be.equal(1);
        expect(objectEvent.args.data).to.be.equal(headData);
    });

    it('appends an object at the head - data storage.', async function () {
        const objectId = (
            await this.enumerables.testAppend(headData)
        ).logs[0].args.id.toNumber();

        const result = (await this.enumerables.testGet(objectId));
        expect(result[0].toNumber()).to.be.equal(objectId);
        expect(result[1].toNumber()).to.be.equal(0);
        expect(result[2].toNumber()).to.be.equal(0);
        expect(result[3]).to.be.equal(headData);
    });

    it('appends two objects.', async function () {
        const objectOneId = (
            await this.enumerables.testAppend(middleData)
        ).logs[0].args.id.toNumber();
        const objectTwoId = (
            await this.enumerables.testAppend(headData)
        ).logs[0].args.id.toNumber();

        const objectOne = (await this.enumerables.testGet(objectOneId));
        expect(objectOne[0].toNumber()).to.be.equal(objectOneId);
        expect(objectOne[1].toNumber()).to.be.equal(0);
        expect(objectOne[2].toNumber()).to.be.equal(objectTwoId);
        expect(objectOne[3]).to.be.equal(middleData);

        const objectTwo = (await this.enumerables.testGet(objectTwoId));
        expect(objectTwo[0].toNumber()).to.be.equal(objectTwoId);
        expect(objectTwo[1].toNumber()).to.be.equal(objectOneId);
        expect(objectTwo[2].toNumber()).to.be.equal(0);
        expect(objectTwo[3]).to.be.equal(headData);

        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(objectTwoId);
    });
});

describe('Enumerable - length', (accounts) => {
    beforeEach(async function () {
        this.this.enumerables = await EnumerablesMock.new();
    });

    it('Retrieves the length of an empty this.enumerables.', async function () {
        const resultId = (await this.enumerables.testLength());
        expect(resultId.toNumber()).to.be.equal(0);
    });

    it('Retrieves the length of an this.enumerables.', async function () {
        tailId = (
            await this.enumerables.testAppend(tailData)
        ).logs[0].args.id.toNumber();
        middleId = (
            await this.enumerables.testAppend(middleData)
        ).logs[0].args.id.toNumber();
        headId = (
            await this.enumerables.testAppend(headData)
        ).logs[0].args.id.toNumber();
        const resultId = (await this.enumerables.testLength());
        expect(resultId.toNumber()).to.be.equal(3);
    });
});

/** @test {Enumerable} describe */
describe('Enumerable - contains', (accounts) => {
    beforeEach(async function () {
        this.this.enumerables = await EnumerablesMock.new();
        tailId = (
            await this.enumerables.testAppend(tailData)
        ).logs[0].args.id.toNumber();
        middleId = (
            await this.enumerables.testAppend(middleData)
        ).logs[0].args.id.toNumber();
    });

    it('Returns false for empty data.', async function () {
        const resultId = (await this.enumerables.testContains(emptyData));
        expect(resultId).to.be.false;
    });

    it('Returns true for existing data.', async function () {
        const resultId = (await this.enumerables.testContains(tailData));
        expect(resultId).to.be.true;
    });

    it('Returns false for non existing data.', async function () {
        const resultId = (await this.enumerables.testContains(headData));
        expect(resultId).to.be.false;
    });
});

/** @test {Enumerable} describe */
/* describe('Enumerable - enumerate', (accounts) => {

    let enumerable: EnumerablesMockInstance;
    let headId: number;
    let middleId: number;
    let tailId: number;

    beforeEach(async function () {
        enumerable = await EnumerablesMock.new();
        tailId = (
            await this.enumerables.testAppend(tailData)
        ).logs[0].args.id.toNumber();
        middleId = (
            await this.enumerables.testAppend(middleData)
        ).logs[0].args.id.toNumber();
        headId = (
            await this.enumerables.testAppend(headData)
        ).logs[0].args.id.toNumber();
    });

    it('finds an id for given data.', async function () {
        let resultId = (await this.enumerables.findIdForData(headData));
        expect(resultId.toNumber()).to.be.equal(headId);
        resultId = (await this.enumerables.findIdForData(middleData));
        expect(resultId.toNumber()).to.be.equal(middleId);
        resultId = (await this.enumerables.findIdForData(tailData));
        expect(resultId.toNumber()).to.be.equal(tailId);
    });
}); */

/** @test {Enumerable} describe */
describe('Enumerable - remove', (accounts) => {
    beforeEach(async function () {
        this.this.enumerables = await EnumerablesMock.new();
        tailId = (
            await this.enumerables.testAppend(tailData)
        ).logs[0].args.id.toNumber();
        middleId = (
            await this.enumerables.testAppend(middleData)
        ).logs[0].args.id.toNumber();
        headId = (
            await this.enumerables.testAppend(headData)
        ).logs[0].args.id.toNumber();
    });

    it('removes the head.', async function () {
        const removedId = (
            await this.enumerables.testRemove(headId)
        ).logs[1].args.id.toNumber();
        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(middleId);

        const middleObject = (await this.enumerables.testGet(middleId));
        expect(middleObject[0].toNumber()).to.be.equal(middleId);
        expect(middleObject[1].toNumber()).to.be.equal(tailId);
        expect(middleObject[2].toNumber()).to.be.equal(0);
        expect(middleObject[3]).to.be.equal(middleData);

        const tailObject = (await this.enumerables.testGet(tailId));
        expect(tailObject[0].toNumber()).to.be.equal(tailId);
        expect(tailObject[1].toNumber()).to.be.equal(0);
        expect(tailObject[2].toNumber()).to.be.equal(middleId);
        expect(tailObject[3]).to.be.equal(tailData);
    });

    it('removes the tail.', async function () {
        const removedId = (
            await this.enumerables.testRemove(tailId)
        ).logs[1].args.id.toNumber();
        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(headId);

        const headObject = (await this.enumerables.testGet(headId));
        expect(headObject[0].toNumber()).to.be.equal(headId);
        expect(headObject[1].toNumber()).to.be.equal(middleId);
        expect(headObject[2].toNumber()).to.be.equal(0);
        expect(headObject[3]).to.be.equal(headData);

        const middleObject = (await this.enumerables.testGet(middleId));
        expect(middleObject[0].toNumber()).to.be.equal(middleId);
        expect(middleObject[1].toNumber()).to.be.equal(0);
        expect(middleObject[2].toNumber()).to.be.equal(headId);
        expect(middleObject[3]).to.be.equal(middleData);
    });

    it('removes the middle.', async function () {
        const removedId = (
            await this.enumerables.testRemove(middleId)
        ).logs[1].args.id.toNumber();
        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(headId);

        const headObject = (await this.enumerables.testGet(headId));
        expect(headObject[0].toNumber()).to.be.equal(headId);
        expect(headObject[1].toNumber()).to.be.equal(tailId);
        expect(headObject[2].toNumber()).to.be.equal(0);
        expect(headObject[3]).to.be.equal(headData);

        const tailObject = (await this.enumerables.testGet(tailId));
        expect(tailObject[0].toNumber()).to.be.equal(tailId);
        expect(tailObject[1].toNumber()).to.be.equal(0);
        expect(tailObject[2].toNumber()).to.be.equal(headId);
        expect(tailObject[3]).to.be.equal(tailData);
    });

    it('removes all.', async function () {
        (await this.enumerables.testRemove(headId)).logs[1].args.id.toNumber();
        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(middleId);

        (await this.enumerables.testRemove(tailId)).logs[1].args.id.toNumber();
        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(middleId);
        // expect(((await this.enumerables.tail()).toNumber())).to.be.equal(middleId);

        (await this.enumerables.testRemove(middleId)).logs[1].args.id.toNumber();
        // expect(((await this.enumerables.head()).toNumber())).to.be.equal(0);
        // expect(((await this.enumerables.tail()).toNumber())).to.be.equal(0);
    });
});
