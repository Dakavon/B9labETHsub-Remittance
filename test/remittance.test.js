//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Remittance <<< - Test file
//
//Last update: 07.01.2021

const Remittance = artifacts.require('Remittance');
const truffleAssert = require('truffle-assertions');
const timeMachine = require('ganache-time-traveler');
const { toBN } = web3.utils;
const checkIfFiveAccountsAvailable = require('./utils/printAccounts');

contract("Remittance", async (accounts) => {

    const [owner, sender, exchange, attacker] = accounts;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const contractState = {
        paused: 0,
        running: 1,
        destroyed: 2,
    };

    const defaultMaxDurationBlocks = 1000;
    const defaultContractFeePercentage = 10;

    const clearPassword = "passwordDummy";
    const hexClearPassword = web3.utils.asciiToHex(clearPassword);


    checkIfFiveAccountsAvailable(accounts);


    describe("constructor()", async () => {

        it("should not be possible to start Remittance as 'destroyed'", async () => {
            await truffleAssert.reverts(
                Remittance.new(
                    contractState.destroyed, defaultMaxDurationBlocks, defaultContractFeePercentage,
                    {from: owner}
                ),
                "Stoppable: Initial contract state can be 0 (paused) or 1 (running)"
            );
        });

        it("should not be possible to set 'maxDurationBlocks' to 0", async () => {
            await truffleAssert.reverts(
                Remittance.new(
                    contractState.running, 0, defaultContractFeePercentage,
                    {from: owner}
                ),
                "maxDurationBlocks needs to be greater than 0"
            );
        });

        it("should not be possible to set 'defaultContractFeePercentage' below 0 or higher than 50", async () => {
            await truffleAssert.fails(
                Remittance.new(
                    contractState.running, defaultMaxDurationBlocks, -1,
                    {from: owner}
                )
            );

            await truffleAssert.reverts(
                Remittance.new(
                    contractState.running, defaultMaxDurationBlocks, 51,
                    {from: owner}
                ),
                "contractFeePercentage must be a value between 0 (lower bound) and 50 (upper bound)"
            );
        });

        it("should not be possible to send value", async () => {
            await truffleAssert.reverts(
                Remittance.new(
                    contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                    {from: owner, value: 1000}
                ),
                ""
            );
        });

        it("should be possible to start Remittance as 'paused'", async () => {
            const instance = await Remittance.new(
                contractState.paused, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            const _state = await instance.getState({from: sender});
            assert.strictEqual(_state.toNumber(), contractState.paused, "contract could not set to paused");
        });

        it("should be possible to start Remittance as 'running'", async () => {
            const instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            const _state = await instance.getState({from: sender});
            assert.strictEqual(_state.toNumber(), contractState.running, "contract could not set to running");
        });

        it("should be possible to start Remittance with maxDurationBlocks: 1000, contractFeePercentage: 10", async () => {
            const instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            const _duration = await instance.maxDurationBlocks({from: sender});
            const _feePercentage = await instance.contractFeePercentage({from: sender});
            assert.strictEqual(_duration.toNumber(), defaultMaxDurationBlocks, "maxDurationBlocks was not initially set to 1000");
            assert.strictEqual(_feePercentage.toNumber(), defaultContractFeePercentage, "contractFeePercentage was not initially set to 10");
        });
    });


    describe("function createHashedPassword()", async () => {
        let instance = null;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );
        });

        it("should not be possible to create a hashed password without providing 'exchange'", async () => {
            await truffleAssert.reverts(
                instance.createHashedPassword(zeroAddress, hexClearPassword, {from: sender}),
                "exchange address must be provided"
            );
        });

        it("should not be possible to create a hashed password when 'clearPassword' is empty", async () => {
            await truffleAssert.reverts(
                instance.createHashedPassword(exchange, web3.utils.asciiToHex(""), {from: sender}),
                "clearPassword must be provided"
            );
        });

        it("hashed password should match with soliditySha3", async () => {
            const instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            hashedPassword = web3.utils.soliditySha3(
                {t: 'address', v: exchange},
                {t: 'bytes32', v: hexClearPassword},
                {t: 'address', v: instance.address},
            );
            const _hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});

            assert.strictEqual(_hashedPassword, hashedPassword, "hashPassword does not match");
        });

    });


    describe("function changeMaxDurationBlocks()", async () => {
        let instance = null;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );
        });

        it("should not be possible to set a new value for 'maxDurationBlocks' by an attacker", async () => {
            await truffleAssert.reverts(
                instance.changeMaxDurationBlocks(10, {from: attacker}),
                "Owned: Caller is not the owner"
            );
        });

        it("should not be possible to set the value for 'maxDurationBlocks' to 0", async () => {
            await truffleAssert.reverts(
                instance.changeMaxDurationBlocks(0, {from: owner}),
                "newMaxDurationBlocks needs to be greater than 0"
            );
        });

        it("should be possible to set a new value for 'maxDurationBlocks' by owner", async () => {
            const returned = await instance.changeMaxDurationBlocks.call(5000, {from: owner});
            assert.strictEqual(returned, true, "maxDurationBlocks cannot be changed by owner");

            const txObj = await instance.changeMaxDurationBlocks(5000, {from: owner});
            truffleAssert.eventEmitted(txObj, "LogMaxDurationChanged");

            const logSender = txObj.receipt.logs[0].args.sender;
            const oldMaxDurationBlocks = txObj.receipt.logs[0].args.oldMaxDurationBlocks;
            const newMaxDurationBlocks = txObj.receipt.logs[0].args.newMaxDurationBlocks;
            assert.strictEqual(logSender, owner, "sender was not logged correctly");
            assert.strictEqual(oldMaxDurationBlocks.toNumber(), defaultMaxDurationBlocks, "oldMaxDurationBlocks was not logged correctly");
            assert.strictEqual(newMaxDurationBlocks.toNumber(), 5000, "newMaxDurationBlocks was not logged correctly");

            const _newMaxDurationBlocks = await instance.maxDurationBlocks({from: sender});
            assert.strictEqual(_newMaxDurationBlocks.toNumber(), 5000, "maxDurationBlocks could not be changed by owner");
        });

    });


    describe("function changeContractFeePercentage()", async () => {
        let instance = null;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );
        });

        it("should not be possible to set a new value for 'contractFeePercentage' by an attacker", async () => {
            await truffleAssert.reverts(
                instance.changeContractFeePercentage(2, {from: attacker}),
                "Owned: Caller is not the owner"
            );
        });

        it("should not be possible to change the value for 'contractFeePercentage' lower than 0 (lower bound) and above 50 (upper bound)", async () => {
            await truffleAssert.fails(
                instance.changeContractFeePercentage(-1, {from: owner})
            );

            await truffleAssert.reverts(
                instance.changeContractFeePercentage(51, {from: owner}),
                "newContractFeePercentage must be a value between 0 (lower bound) and 50 (upper bound)"
            );
        });

        it("should be possible to set a new value for 'contractFeePercentage' by owner", async () => {
            const newFeePercentage = 50;

            const returned = await instance.changeContractFeePercentage.call(newFeePercentage, {from: owner});
            assert.strictEqual(returned, true, "contractFeePercentage cannot be changed by owner");

            const txObj = await instance.changeContractFeePercentage(newFeePercentage, {from: owner});
            truffleAssert.eventEmitted(txObj, "LogContractFeePercentageChanged");

            const logSender = txObj.receipt.logs[0].args.sender;
            const oldContractFeePercentage = txObj.receipt.logs[0].args.oldContractFeePercentage;
            const newContractFeePercentage = txObj.receipt.logs[0].args.newContractFeePercentage;
            assert.strictEqual(logSender, owner, "sender was not logged correctly");
            assert.strictEqual(oldContractFeePercentage.toNumber(), defaultContractFeePercentage, "oldContractFeePercentage was not logged correctly");
            assert.strictEqual(newContractFeePercentage.toNumber(), newFeePercentage, "newContractFeePercentage was not logged correctly");

            const _newContractFeePercentage = await instance.contractFeePercentage({from: sender});
            assert.strictEqual(_newContractFeePercentage.toNumber(), newFeePercentage, "contractFeePercentage could not be changed by owner")
        });

    });


    describe("function depositFunds()", async () => {
        let instance = null;
        let hashedPassword = null;
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});
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
                "hashedPassword must be provided"
            );
        });

        it("should not be possible to deposit with non-applicable 'durationBlocks'", async () => {
            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, 0, {from: sender, value: amount}),
                "durationBlocks must be greater than 0 and less or equal than maxDurationBlocks"
            );

            const _maxDurationBlocks = await instance.maxDurationBlocks({from: sender});
            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, _maxDurationBlocks.toNumber()+1, {from: sender, value: amount}),
                "durationBlocks must be greater than 0 and less or equal than maxDurationBlocks"
            );
        });

        it("should be possible to deposit funds", async () => {
            const returned = await instance.depositFunds.call(hashedPassword, durationBlocks, {from: sender, value: amount});
            assert.strictEqual(returned, true, "sender was unable to deposit funds");

            const contractFeePercentage = await instance.contractFeePercentage({from: sender});
            const contractBalanceBefore = await web3.eth.getBalance(instance.address);

            assert.strictEqual(contractFeePercentage.toNumber(), defaultContractFeePercentage, "defaultContractFeePercentage is not correct");
            assert.strictEqual(contractBalanceBefore.toString(10), '0', "contractBalanceBefore is not correct");

            const txObj = await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});
            truffleAssert.eventEmitted(txObj, "LogFundsDeposited");

            const expectedFee = toBN(amount).mul(toBN(contractFeePercentage)).div(toBN(100));
            const expectedAmount = toBN(amount).sub(toBN(expectedFee));
            const expectedDeadline = txObj.receipt.blockNumber + durationBlocks;

            const loghashedPassword = txObj.receipt.logs[0].args.hashedPassword;
            const logOrigin = txObj.receipt.logs[0].args.origin;
            const logAmount = txObj.receipt.logs[0].args.amount;
            const logDeadline = txObj.receipt.logs[0].args.deadline;
            const logFee = txObj.receipt.logs[0].args.fee;
            assert.strictEqual(loghashedPassword, hashedPassword, "hashedPassword was not logged correctly");
            assert.strictEqual(logOrigin, sender, "origin was not logged correctly");
            assert.strictEqual(logAmount.toString(10), expectedAmount.toString(10), "amount was not logged correctly");
            assert.strictEqual(logDeadline.toNumber(), expectedDeadline, "deadline was not logged correctly");
            assert.strictEqual(logFee.toString(10), expectedFee.toString(10), "fee was not logged correctly");

            const remittanceStruct = await instance.remittanceStructs(hashedPassword);
            assert.strictEqual(remittanceStruct.origin, sender, "origin was not stored correctly");
            assert.strictEqual(remittanceStruct.amount.toString(10), expectedAmount.toString(10), "amount was not stored correctly");
            assert.strictEqual(remittanceStruct.deadline.toNumber(), expectedDeadline, "deadline was not stored correctly");

            const contractBalanceAfter = await web3.eth.getBalance(instance.address);
            const contractCollectedFees = await instance.contractCollectedFees(owner, {from: sender});
            assert.strictEqual(contractBalanceAfter.toString(10), amount.toString(10), "contracts balance is not correct");
            assert.strictEqual(contractCollectedFees.toString(10), expectedFee.toString(10), "contracts fee balance is not correct");
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
        let instance = null;
        let hashedPassword = null;
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});
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

        it("should not be possible to withdraw without providing 'clearPassword'", async () => {
            await truffleAssert.reverts(
                instance.withdrawFunds(web3.utils.asciiToHex(""), {from: exchange}),
                "clearPassword must be provided"
            );
        });

        it("should not be possible to withdraw with known 'clearPassword' by an attacker", async () => {
            await truffleAssert.reverts(
                instance.withdrawFunds(hexClearPassword, {from: attacker}),
                "No value to retrieve"
            );
        });

        it("should be possible to withdraw funds", async () => {
            const returned = await instance.withdrawFunds.call(hexClearPassword, {from: exchange});
            assert.strictEqual(returned, true, "exchange was unable to withdraw funds");

            const contractBalanceBefore = await web3.eth.getBalance(instance.address);
            const exchangeBalanceBefore = await web3.eth.getBalance(exchange);
            const remittanceStructBefore = await instance.remittanceStructs(hashedPassword);

            const txObj = await instance.withdrawFunds(hexClearPassword, {from: exchange});

            truffleAssert.eventEmitted(txObj, "LogFundsWithdrawn");
            assert.strictEqual(txObj.receipt.logs[0].args.hashedPassword, hashedPassword, "hashedPassword was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.receiver, exchange, "receiver was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.amount.toString(10), remittanceStructBefore.amount.toString(10), "amount was not logged correctly");

            const tx = await web3.eth.getTransaction(txObj.tx);
            const txFee = toBN(tx.gasPrice).mul(toBN(txObj.receipt.gasUsed));

            const contractBalanceAfter = await web3.eth.getBalance(instance.address);
            const exchangeBalanceAfter = await web3.eth.getBalance(exchange);
            const remittanceStructAfter = await instance.remittanceStructs(hashedPassword);

            assert.strictEqual(
                toBN(contractBalanceBefore).sub(toBN(remittanceStructBefore.amount)).toString(10),
                contractBalanceAfter.toString(10),
                "contracts balance is not correct after withdraw"
            );
            assert.strictEqual(
                toBN(exchangeBalanceBefore).add(toBN(remittanceStructBefore.amount)).sub(toBN(txFee)).toString(10),
                exchangeBalanceAfter.toString(10),
                "exchanges balance is not correct after withdraw"
            );
            assert.strictEqual(remittanceStructAfter.amount.toString(10), '0', "amount was not stored correctly");
            assert.strictEqual(remittanceStructAfter.deadline.toString(10), '0', "deadline was not stored correctly");
        });

        it("should not be possible to withdraw funds twice", async () => {
            await instance.withdrawFunds(hexClearPassword, {from: exchange});

            truffleAssert.reverts(
                instance.withdrawFunds(hexClearPassword, {from: exchange}),
                "No value to retrieve"
            );
        });

        it("should not be possible to deposit with the same 'hashedPassword' after withdraw", async () => {
            await instance.withdrawFunds(hexClearPassword, {from: exchange});

            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount}),
                "Remittance must be unique"
            );
        });
    });

    describe("function reclaimFunds()", async () => {
        let instance = null;
        let hashedPassword = null;
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});
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
                instance.reclaimFunds(hashedPassword, {from: sender, value: amount})
            );
        });

        it("should only be 'sender'/'origin' who is allowed to reclaim funds", async () => {
            await truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: attacker}),
                "Remittance can only be reclaimed by origin"
            );

            const balanceOfContract = await web3.eth.getBalance(instance.address);
            assert.strictEqual(balanceOfContract.toString(10), amount.toString(10), "amount was able to reclaim by attacker");
        });

        it("should not be possible to reclaim funds if deadline is not expired", async () => {
            await truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: sender}),
                "Remittance is not expired yet"
            );

            const blockNumber = await web3.eth.getBlockNumber();
            const remittanceStruct = await instance.remittanceStructs(hashedPassword);

            assert.isAtMost(blockNumber, remittanceStruct.deadline.toNumber(), "deadline should not be expired yet");
        });

        it("should be possible to reclaim funds by 'sender'/'origin'", async () => {
            const contractBalanceBefore = await web3.eth.getBalance(instance.address);
            const senderBalanceBefore = await web3.eth.getBalance(sender);
            const remittanceStructBefore = await instance.remittanceStructs(hashedPassword);

            for(let i=0; i<=durationBlocks; i++){
                await timeMachine.advanceBlock();
            }
            const blockNumberAfter = await web3.eth.getBlockNumber();
            assert.isBelow(remittanceStructBefore.deadline.toNumber(), blockNumberAfter, "time did not move forward as expected");

            const returned = await instance.reclaimFunds.call(hashedPassword, {from: sender});
            assert.strictEqual(returned, true, "sender was unable to reclaim funds");

            const txObj = await instance.reclaimFunds(hashedPassword, {from: sender});

            truffleAssert.eventEmitted(txObj, "LogFundsReclaimed");
            assert.strictEqual(txObj.receipt.logs[0].args.hashedPassword, hashedPassword, "hashedPassword was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.origin, sender, "origin was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.amount.toString(10), remittanceStructBefore.amount.toString(10), "amount was not logged correctly");

            const tx = await web3.eth.getTransaction(txObj.tx);
            const txFee = toBN(tx.gasPrice).mul(toBN(txObj.receipt.gasUsed));

            const contractBalanceAfter = await web3.eth.getBalance(instance.address);
            const senderBalanceAfter = await web3.eth.getBalance(sender);
            const remittanceStructAfter = await instance.remittanceStructs(hashedPassword);

            assert.strictEqual(
                toBN(contractBalanceBefore).sub(toBN(remittanceStructBefore.amount)).toString(10),
                contractBalanceAfter.toString(10),
                "contracts balance is not correct after reclaim"
            );
            assert.strictEqual(
                toBN(senderBalanceBefore).add(toBN(remittanceStructBefore.amount)).sub(toBN(txFee)).toString(10),
                senderBalanceAfter.toString(10),
                "senders balance is not correct after reclaim"
            );
            assert.strictEqual(remittanceStructAfter.amount.toString(10), '0', "amount was not stored correctly");
            assert.strictEqual(remittanceStructAfter.deadline.toString(10), '0', "deadline was not stored correctly");
        });

        it("should not be possible to reclaim funds twice", async () => {
            for(let i=0; i<=durationBlocks; i++){
                await timeMachine.advanceBlock();
            }

            await instance.reclaimFunds(hashedPassword, {from: sender});

            truffleAssert.reverts(
                instance.reclaimFunds(hashedPassword, {from: sender}),
                "No value to retrieve"
            );
        });

        it("should not be possible to deposit with the same 'hashedPassword' after reclaim", async () => {
            for(let i=0; i<=durationBlocks; i++){
                await timeMachine.advanceBlock();
            }
            await instance.reclaimFunds(hashedPassword, {from: sender});

            await truffleAssert.reverts(
                instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount}),
                "Remittance must be unique"
            );
        });
    });

    describe("function withdrawFees()", async () => {
        let instance = null;
        let hashedPassword = null;
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});
            await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});
        });

        it("should not be payable", async () => {
            await truffleAssert.reverts(
                instance.withdrawFees({from: owner, value: amount})
            );
        });

        it("should not be possible to withdraw fees by an attacker", async () => {
            await truffleAssert.reverts(
                instance.withdrawFees({from: attacker}),
                "Owned: Caller is not the owner"
            );
        });

        it("should not withdraw when no fees were collected", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            await truffleAssert.reverts(
                instance.withdrawFees({from: owner}),
                "No fees to withdraw"
            );
        });

        it("should be possible to withdraw fees", async () => {
            const contractBalanceBefore = await web3.eth.getBalance(instance.address);
            const ownerBalanceBefore = await web3.eth.getBalance(owner);
            const contractCollectedFeesBefore = await instance.contractCollectedFees(owner, {from: owner});
            const remittanceStruct = await instance.remittanceStructs(hashedPassword);

            const returned = await instance.withdrawFees.call({from: owner});
            assert.strictEqual(returned, true, "owner was unable to withdraw fees");

            const txObj = await instance.withdrawFees({from: owner});

            truffleAssert.eventEmitted(txObj, "LogFeesWithdrawn");
            assert.strictEqual(txObj.receipt.logs[0].args.sender, owner, "sender was not logged correctly");
            assert.strictEqual(txObj.receipt.logs[0].args.amount.toString(10), contractCollectedFeesBefore.toString(10), "amount was not logged correctly");

            const tx = await web3.eth.getTransaction(txObj.tx);
            const txFee = toBN(tx.gasPrice).mul(toBN(txObj.receipt.gasUsed));

            const contractBalanceAfter = await web3.eth.getBalance(instance.address);
            const ownerBalanceAfter = await web3.eth.getBalance(owner);
            const contractCollectedFeesAfter = await instance.contractCollectedFees(owner, {from: owner});

            assert.strictEqual(
                toBN(contractBalanceBefore).sub(toBN(contractCollectedFeesBefore)).toString(10),
                contractBalanceAfter.toString(10),
                "contracts balance is not correct after withdraw fees"
            );
            assert.strictEqual(
                toBN(ownerBalanceBefore).add(toBN(contractCollectedFeesBefore)).sub(toBN(txFee)).toString(10),
                ownerBalanceAfter.toString(10),
                "owners balance is not correct after withdraw fees"
            );
            assert.strictEqual(contractCollectedFeesAfter.toString(10), '0', "fees were not stored correctly");
        });

        it("should not be possible to withdraw fees twice", async () => {
            await instance.withdrawFees({from: owner});

            truffleAssert.reverts(
                instance.withdrawFees({from: owner}),
                "No fees to withdraw"
            );
        });
    });

    describe("overwritten function renounceOwnership()", async () => {
        let instance = null;
        let hashedPassword = null;
        const durationBlocks = 10;
        const amount = 1000;

        beforeEach("deploy new instance", async () => {
            instance = await Remittance.new(
                contractState.running, defaultMaxDurationBlocks, defaultContractFeePercentage,
                {from: owner}
            );

            hashedPassword = await instance.createHashedPassword(exchange, hexClearPassword, {from: sender});
            await instance.depositFunds(hashedPassword, durationBlocks, {from: sender, value: amount});
        });

        it("should not be payable", async () => {
            await truffleAssert.reverts(
                instance.renounceOwnership({from: owner, value: amount})
            );
        });

        it("should still not be possible to renounce ownership by an attacker", async () => {
            await truffleAssert.reverts(
                instance.renounceOwnership({from: attacker}),
                "Owned: Caller is not the owner"
            );
        });

        it("should not be possible to renounce ownership before 'contractFeePercentage' was set to 0", async () => {
            await truffleAssert.reverts(
                instance.renounceOwnership({from: owner}),
                "contractFeePercentage was not set to 0"
            );
        });

        it("should not be possible to renounce ownership when collected fees were not withdrawn", async () => {
            await instance.changeContractFeePercentage(0, {from: owner});

            await truffleAssert.reverts(
                instance.renounceOwnership({from: owner}),
                "contractCollectedFees were not withdrawn"
            );
        });

        it("should be possible to renounce ownership with all preconditions fulfilled", async () => {
            await instance.withdrawFees({from: owner});
            await instance.changeContractFeePercentage(0, {from: owner});

            const returned = await instance.renounceOwnership.call({from: owner});
            assert.strictEqual(returned, true, "owner was unable to resign");

            const txObj = await instance.renounceOwnership({from: owner});
            truffleAssert.eventEmitted(txObj, "LogOwnershipRenounced");

            const _newOwner = await instance.getOwner({from: owner});
            assert.strictEqual(_newOwner, zeroAddress, "contract is not owned by 0x0");
        });
    });
});