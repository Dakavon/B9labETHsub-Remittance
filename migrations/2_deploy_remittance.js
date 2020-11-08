const Remittance = artifacts.require("Remittance");

module.exports = function (deployer, network, accounts) {
    console.log("  network:", network);

    const contractState = {
        paused: 0,
        running: 1,
        destroyed: 2,
    };

    deployer.deploy(Remittance, contractState.running, {from: accounts[0]});
};