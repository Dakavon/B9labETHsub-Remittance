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

    if(network === "ropsten"){
        deployer.deploy(Remittance, contractState.running, maxDurationBlocks, contractFeePercentage, {from: accounts[0]});
    }
    else if(network === "develop"){
        deployer.deploy(Remittance, contractState.running, maxDurationBlocks, contractFeePercentage, {from: accounts[0]});
    }
};