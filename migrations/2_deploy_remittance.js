const Remittance = artifacts.require("Remittance");

module.exports = function (deployer, network, accounts) {
    console.log("  network:", network);

    const contractState = {
        paused: 0,
        running: 1,
        destroyed: 2,
    };
    const maxDurationBlocks = 1000;
    const contractFeePercentage = 10;

    deployer.deploy(Remittance, contractState.running, maxDurationBlocks, contractFeePercentage, {from: accounts[0]});
};