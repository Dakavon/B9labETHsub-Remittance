//Check if five accounts are available

async function checkIfFiveAccountsAvailable(accounts){
    before("should be five accounts available: ", async () => {
        console.log("\n    There are five accounts available:");
        for(let i=0; i<5; i++){
            console.log(`\t#${i}: ${accounts[i]}`);
        }
        console.log("\n");
    });
}

module.exports = checkIfFiveAccountsAvailable;