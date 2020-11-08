//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Remittance <<< - Test file
//
//Last update: 08.11.2020

const Remittance = artifacts.require('Remittance');
const truffleAssert = require('truffle-assertions');

contract("Remittance", (accounts) => {

    let instance = null;
    const [owner, sender, exchange, attacker] = accounts;

    const contractState = {
        paused: 0,
        running: 1,
        destroyed: 2,
    };

    const clearPassword = "passwordDummy";
    const hexClearPassword = web3.utils.asciiToHex(clearPassword);
    let hashedPassword = null;

    before("should be five accounts available: ", async () => {
        console.log("\n    There are five accounts available:");
        for(let i=0; i<5; i++){
            console.log(`\t#${i}: ${accounts[i]}`);
        }
        console.log("\n");
    });

    it("should create a hashed password", async () => {
        instance = await Remittance.new(contractState.running, {from: owner});

        hashedPassword = web3.utils.soliditySha3(
            {t: 'address', v: exchange},
            {t: 'bytes32', v: hexClearPassword},
            {t: 'address', v: instance.address},
        );
        const _hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});

        assert.strictEqual(_hashedPassword, hashedPassword, "'hashPassword' does not match");
    });

    describe("constructor()", async () => {

        it("should not be possible to start Remittance as 'destroyed'", async () => {
            await truffleAssert.reverts(
                Remittance.new(contractState.destroyed, {from: owner}),
                "Stoppable: Initial contract state can be 0 (paused) or 1 (running)"
            );
        });

        it("should be possible to start Remittance as 'paused'", async () => {
            instance = await Remittance.new(contractState.paused, {from: owner});

            const _state = await instance.getState({from: sender});
            assert.strictEqual(_state.toNumber(), contractState.paused, "contract could not set to 'paused'");
        });

        it("should be possible to start Remittance as 'running'", async () => {
            instance = await Remittance.new(contractState.running, {from: owner});

            const _state = await instance.getState({from: sender});
            assert.strictEqual(_state.toNumber(), contractState.running, "contract could not set to 'running'");
        });

    });

    describe("Variable 'maxDurationBlocks'", async () => {

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(contractState.running, {from: owner});
        });

        it("should be initially value of 'maxDurationBlocks': 1000", async () => {
            const _maxDurationBlocks = await instance.maxDurationBlocks({from: sender});
            assert.strictEqual(_maxDurationBlocks.toNumber(), 1000, "Value 'maxDurationBlocks' was initially not set to 1000");
        });

        it("should not be possible to set the value for 'maxDurationBlocks': 0", async () => {
            await truffleAssert.reverts(
                instance.changeMaxDurationBlocks(0, {from: owner}),
                "'newMaxDurationBlocks' need to be greater than 0"
            );
        });

        it("should be possible to set a new value for 'maxDurationBlocks' by owner", async () => {
            const returned = await instance.changeMaxDurationBlocks.call(500, {from: owner});
            assert.strictEqual(returned, true, "Value 'maxDurationBlocks' cannot be changed by owner");

            const txObj = await instance.changeMaxDurationBlocks(500, {from: owner});
            truffleAssert.eventEmitted(txObj, "LogMaxDurationChanged");

            const logSender = txObj.receipt.logs[0].args.sender;
            const oldMaxDurationBlocks = txObj.receipt.logs[0].args.oldMaxDurationBlocks;
            const newMaxDurationBlocks = txObj.receipt.logs[0].args.newMaxDurationBlocks;
            assert.strictEqual(logSender, owner, "'sender' was not logged correctly");
            assert.strictEqual(oldMaxDurationBlocks.toNumber(), 1000, "'oldMaxDurationBlocks' was not logged correctly");
            assert.strictEqual(newMaxDurationBlocks.toNumber(), 500, "'newMaxDurationBlocks' was not logged correctly");

            const _newMaxDurationBlocks = await instance.maxDurationBlocks({from: owner});
            assert.strictEqual(_newMaxDurationBlocks.toNumber(), 500, "Value 'maxDurationBlocks' could not be changed by owner");
        });

    });

    describe("function depositFunds()", async () => {
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(contractState.running, {from: owner});

            hashedPassword = web3.utils.soliditySha3(
                {t: 'address', v: exchange},
                {t: 'bytes32', v: hexClearPassword},
                {t: 'address', v: instance.address},
            );
        });

        it("should not be possible to deposit funds if contract is paused", async () => {
            await instance.pauseContract({from: owner});

            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount}),
                "Stoppable: Contract is not running"
            );
        });

        it("should not be possible to deposit without value", async () => {
            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, durationBlocks, {from: sender}),
                "Nothing to deposit"
            );
        });

        it("should not be possible to deposit without providing 'hashedPassword'", async () => {
            await truffleAssert.reverts(
                instance.depositFunds(web3.utils.asciiToHex(""), durationBlocks, {from: sender, value: amount}),
                "'hashedPassword' must be provided"
            );
        });

        it("should not be possible to deposit with non-applicable 'durationBlocks'", async () => {
            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, 0, {from: sender, value: amount}),
                "'durationBlocks' must be greater than 0 and less or equal than 'maxDurationBlocks'"
            );

            const _maxDurationBlocks = await instance.maxDurationBlocks({from: sender});
            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, _maxDurationBlocks.toNumber()+1, {from: sender, value: amount}),
                "'durationBlocks' must be greater than 0 and less or equal than 'maxDurationBlocks'"
            );
        });

        it("should be possible to deposit funds", async () => {
            const returned = await instance.depositFunds.call(hashedPassword, durationBlocks, {from: sender, value: amount});
            assert.strictEqual(returned, true, "Account 'sender' was unable to deposit funds");

            const txObj = await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});
            truffleAssert.eventEmitted(txObj, "LogFundsDeposited");

            const blockNumber = await web3.eth.getBlockNumber();
            const deadline = blockNumber + durationBlocks;

            const logOrigin = txObj.receipt.logs[0].args.origin;
            const logAmount = txObj.receipt.logs[0].args.amount;
            const logDeadline = txObj.receipt.logs[0].args.deadline;
            assert.strictEqual(logOrigin, sender, "'origin' was not logged correctly");
            assert.strictEqual(logAmount.toNumber(), amount, "'amount' was not logged correctly");
            assert.strictEqual(logDeadline.toNumber(), deadline, "'deadline' was not logged correctly");

            const remittanceStruct = await instance.remittanceStructs(hashedPassword);
            assert.strictEqual(remittanceStruct.origin, sender, "'origin' was not stored correctly");
            assert.strictEqual(remittanceStruct.amount.toNumber(), amount, "'amount' was not stored correctly");
            assert.strictEqual(remittanceStruct.deadline.toNumber(), deadline, "'deadline' was not stored correctly");

            const balanceOfContract = await web3.eth.getBalance(instance.address);
            assert.strictEqual(balanceOfContract, amount.toString(10), "Contracts balance is not correct");
        });

        it("should not be possible to deposit with the same 'hashedPassword'", async () => {
            await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});

            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount}),
                "Remittance must be unique"
            );
        });
    });

    describe("function withdrawFunds()", async () => {
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(contractState.running, {from: owner});

            hashedPassword = web3.utils.soliditySha3(
                {t: 'address', v: exchange},
                {t: 'bytes32', v: hexClearPassword},
                {t: 'address', v: instance.address},
            );

            await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});
        });

        it("should not be possible to withdraw funds if contract is paused", async () => {
            await instance.pauseContract({from: owner});

            await truffleAssert.reverts(
                instance.withdrawFunds(hexClearPassword, {from: exchange}),
                "Stoppable: Contract is not running"
            );
        });

        it("should not be payable", async () => {
            await truffleAssert.reverts(
                instance.withdrawFunds(hexClearPassword, {from: exchange, value: amount})
            );
        });

        it("should not be possible to deposit without providing 'hashedPassword'", async () => {
            await truffleAssert.reverts(
                instance.withdrawFunds(web3.utils.asciiToHex(""), {from: exchange}),
                "'clearPassword' must be provided"
            );
        });

        it("should be possible to withdraw funds", async () => {
            const returned = await instance.withdrawFunds.call(hexClearPassword, {from: exchange});
            assert.strictEqual(returned, true, "Account 'exchange' was unable to withdraw funds");

            const txObj = await instance.withdrawFunds(hexClearPassword, {from: exchange});
            truffleAssert.eventEmitted(txObj, "LogFundsWithdrawn");

            assert.strictEqual(txObj.receipt.logs[0].args.receiver, exchange, "'exchange' was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.amount.toNumber(), amount, "'amount' was not logged correctly");

            const remittanceStruct = await instance.remittanceStructs(hashedPassword);
            assert.strictEqual(remittanceStruct.amount.toNumber(), 0, "'amount' was not stored correctly");

            const balanceOfContract = await web3.eth.getBalance(instance.address);
            assert.strictEqual(balanceOfContract, '0', "Contracts balance is not correct");
        });

        it("should not be possible to withdraw funds twice", async () => {
            await instance.withdrawFunds(hexClearPassword, {from: exchange});

            truffleAssert.reverts(
                instance.withdrawFunds(hexClearPassword, {from: exchange}),
                "No value to retrieve"
            );
        });

    });

    describe("function reclaimFunds()", async () => {
        const durationBlocks = 1;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(contractState.running, {from: owner});

            hashedPassword = web3.utils.soliditySha3(
                {t: 'address', v: exchange},
                {t: 'bytes32', v: hexClearPassword},
                {t: 'address', v: instance.address},
            );

            await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});
        });

        it("should not be possible to reclaim funds if contract is paused", async () => {
            await instance.pauseContract({from: owner});

            await truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: sender}),
                "Stoppable: Contract is not running"
            );
        });

        it("should not be payable", async () => {
            await truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: sender})
            );
        });

        it("should not be possible to reclaim funds without providing 'hashedPassword'", async () => {
            await truffleAssert.reverts(
                instance.reclaimFunds(web3.utils.asciiToHex(""), {from: sender}),
                "'hashedPassword' must be provided"
            );
        });

        it("should only be 'sender'/'origin' who is allowed to reclaim funds", async () => {
            await truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: attacker}),
                "Remittance can only be reclaimed by origin"
            );

            const balanceOfContract = await web3.eth.getBalance(instance.address);
            assert.strictEqual(balanceOfContract.toString(10), amount.toString(10), "'amount' was able to reclaim by attacker");
        });

        it("should not be possible to reclaim funds if deadline is not expired", async () => {
            await truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: sender}),
                "Remittance is not expired yet"
            );

            const blockNumber = await web3.eth.getBlockNumber();
            const remittanceStruct = await instance.remittanceStructs(hashedPassword);

            assert.isAtMost(remittanceStruct.deadline.toNumber(), blockNumber, "'deadline' should not be expired yet");
        });

        it("should be possible to reclaim funds by 'sender'/'origin'", async () => {
            //Fake transactions to get development blockchain to mine two blocks to meet deadline
            await instance.pauseContract({from: owner});
            await instance.resumeContract({from: owner});

            const blockNumber = await web3.eth.getBlockNumber();
            const remittanceStruct = await instance.remittanceStructs(hashedPassword);
            assert.isBelow(remittanceStruct.deadline.toNumber(), blockNumber, "'deadline' should be expired");

            const returned = await instance.reclaimFunds.call(hashedPassword, {from: sender});
            assert.strictEqual(returned, true, "Account 'sender' was unable to reclaim funds");

            const remittanceStructBefore = await instance.remittanceStructs(hashedPassword);
            const balanceOfContractBefore = await web3.eth.getBalance(instance.address);
            assert.strictEqual(remittanceStructBefore.amount.toString(10), amount.toString(10), "'amount' was not stored correctly");
            assert.strictEqual(balanceOfContractBefore.toString(10), amount.toString(10), "Contracts balance is not correct");

            const txObj = await instance.reclaimFunds(hashedPassword, {from: sender});
            truffleAssert.eventEmitted(txObj, "LogFundsReclaimed");

            assert.strictEqual(txObj.receipt.logs[0].args.origin, sender, "'origin' was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.amount.toNumber(), amount, "'amount' was not logged correctly");

            const remittanceStructAfter = await instance.remittanceStructs(hashedPassword);
            const balanceOfContractAfter = await web3.eth.getBalance(instance.address);
            assert.strictEqual(remittanceStructAfter.amount.toString(10), '0', "'amount' was not stored correctly");
            assert.strictEqual(balanceOfContractAfter.toString(10), '0', "Contracts balance is not correct");
        });

        it("should not be possible to reclaim funds twice", async () => {
            //Fake transactions to get development blockchain to mine two blocks to meet deadline
            await instance.pauseContract({from: owner});
            await instance.resumeContract({from: owner});

            const blockNumber = await web3.eth.getBlockNumber();
            const remittanceStruct = await instance.remittanceStructs(hashedPassword);
            assert.isBelow(remittanceStruct.deadline.toNumber(), blockNumber, "'deadline' should be expired");

            await instance.reclaimFunds(hashedPassword, {from: sender});

            truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: sender}),
                "No value to retrieve"
            );
        });

    });

});