// SPDX-License-Identifier: Unlicense

//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Remittance <<<
//
//Last update: 06.02.2021

pragma solidity 0.6.12;

import "./Stoppable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title Remittance
 *  Funds can be securely moved from person to person including a trustless third party (exchange shop)
 */
contract Remittance is Stoppable{
    using SafeMath for uint;

    //Max block duration after funds can be reclaimed by origin
    uint public maxDurationBlocks;

    //Contract fee that is taken from the deposited funds
    mapping(address => uint) public contractCollectedFees;
    uint public contractFeePercentage;
    uint constant MAX_FEES = 50;

    struct RemittanceStruct{
        address origin;
        uint amount;
        uint deadline;
    }
    mapping(bytes32 => RemittanceStruct) public remittanceStructs;

    event LogFundsDeposited(bytes32 indexed hashedPassword, address indexed origin, uint amount, uint deadline, uint fee);
    event LogFundsWithdrawn(bytes32 indexed hashedPassword, address indexed receiver, uint amount);
    event LogFundsReclaimed(bytes32 indexed hashedPassword, address indexed origin, uint amount);
    event LogMaxDurationChanged(address indexed sender, uint oldMaxDurationBlocks, uint newMaxDurationBlocks);
    event LogContractFeePercentageChanged(address indexed sender, uint oldContractFeePercentage, uint newContractFeePercentage);
    event LogFeesWithdrawn(address indexed sender, uint amount);

    /**
     * @dev Contract constructor function
     *
     * @param initialState The state the contract is in after deployment (paused or running)
     * @param _maxDurationBlocks Sets the initial upper duration limit in blocks until remittances can be claimed
     * @param _contractFeePercentage Sets the initial fees for depositing funds in this contract
     */
    constructor(State initialState, uint _maxDurationBlocks, uint _contractFeePercentage)
        Stoppable(initialState) public {
            require(0 < _maxDurationBlocks, "maxDurationBlocks needs to be greater than 0");
            require(0 <= _contractFeePercentage && _contractFeePercentage <= MAX_FEES,
                "contractFeePercentage must be a value between 0 (lower bound) and 50 (upper bound)");

            maxDurationBlocks = _maxDurationBlocks;
            contractFeePercentage = _contractFeePercentage;
        }

    /**
     * @dev Support function: Create a unique hashed password off-chain to be used for depositFunds() and reclaimFunds()
     *
     * @param exchange The address of the recipient (exchange)
     * @param clearPassword The uncrypted, plain password
     */
    function createHashedPassword(address exchange, bytes32 clearPassword) public view returns(bytes32 hashedPassword){
        require(exchange != address(0x0), "exchange address must be provided");
        require(clearPassword != "", "clearPassword must be provided");

        return keccak256(abi.encodePacked(exchange, clearPassword, address(this)));
    }

    /**
     * @dev Change the maximum allowed duration until the remittance funds can be reclaimed by sender
     *
     * @param newMaxDurationBlocks New maximum duration in blocks for new remittances
     */
    function changeMaxDurationBlocks(uint newMaxDurationBlocks) public onlyOwner returns(bool success){
        require(newMaxDurationBlocks > 0, "newMaxDurationBlocks needs to be greater than 0");

        uint oldMaxDurationBlocks = maxDurationBlocks;
        maxDurationBlocks = newMaxDurationBlocks;

        emit LogMaxDurationChanged(msg.sender, oldMaxDurationBlocks, newMaxDurationBlocks);
        return true;
    }

    /**
     * @dev Change the contract fee percentage that takes a share of the deposits for this contact
     *
     * @param newContractFeePercentage The new fee percentage of this contract is given in '%',
     *          therefore between 0 (lower bound) and 50 (upper bound)
     */
    function changeContractFeePercentage(uint newContractFeePercentage) public onlyOwner returns(bool success){
        require(0 <= newContractFeePercentage && newContractFeePercentage <= MAX_FEES,
            "newContractFeePercentage must be a value between 0 (lower bound) and 50 (upper bound)");

        uint oldContractFeePercentage = contractFeePercentage;
        contractFeePercentage = newContractFeePercentage;

        emit LogContractFeePercentageChanged(msg.sender, oldContractFeePercentage, newContractFeePercentage);
        return true;
    }

    /**
     * @dev Create a new remittance that can be only withdrawn by the receiver specified in createHashedPassword()
     *
     * @param hashedPassword Hashed password created by createHashedPassword()
     * @param durationBlocks Duration in blocks until sender can reclaim unwithdrawn funds
     */
    function depositFunds(bytes32 hashedPassword, uint durationBlocks) public payable onlyIfRunning returns(bool success){
        require(msg.value > 0, "Nothing to deposit");
        require(hashedPassword != "", "hashedPassword must be provided");
        require(durationBlocks > 0 && durationBlocks <= maxDurationBlocks, "durationBlocks must be greater than 0 and less or equal than maxDurationBlocks");

        //Check for address, i.e. same exchange address and password configuration must never have been used before within this contract
        require(remittanceStructs[hashedPassword].origin == address(0x0), "Remittance must be unique");

        uint fee = msg.value.mul(contractFeePercentage).div(100);
        uint amount = msg.value.sub(fee);

        uint deadline = block.number.add(durationBlocks);

        address contractOwner = getOwner();

        remittanceStructs[hashedPassword].origin = msg.sender;
        remittanceStructs[hashedPassword].amount = amount;
        remittanceStructs[hashedPassword].deadline = deadline;
        contractCollectedFees[contractOwner] = contractCollectedFees[contractOwner].add(fee);

        emit LogFundsDeposited(hashedPassword, msg.sender, amount, deadline, fee);
        return true;
    }

    /**
     * @dev Retrieve remittance with the correct password (only by receiver specified in createHashedPassword())
     *
     * @param clearPassword Clear password that was kept secret
     */
    function withdrawFunds(bytes32 clearPassword) public onlyIfRunning returns(bool success){
        bytes32 hashedPassword = createHashedPassword(msg.sender, clearPassword);

        uint amount = remittanceStructs[hashedPassword].amount;
        require(amount > 0, "No value to retrieve");

        remittanceStructs[hashedPassword].amount = 0;
        remittanceStructs[hashedPassword].deadline = 0;
        emit LogFundsWithdrawn(hashedPassword, msg.sender, amount);

        //EIP 1884 (https://eips.ethereum.org/EIPS/eip-1884) within Istanbul hard fork
        //Avoidance of Solidity's transfer() or send() methods
        (success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Reclaim remittance after deadline expired (only by origin)
     *
     * @param hashedPassword Hashed password created by createHashedPassword()
     */
    function reclaimFunds(bytes32 hashedPassword) public onlyIfRunning returns(bool success){
        require(remittanceStructs[hashedPassword].origin == msg.sender, "Remittance can only be reclaimed by origin");
        require(remittanceStructs[hashedPassword].deadline < block.number, "Remittance is not expired yet");

        uint amount = remittanceStructs[hashedPassword].amount;
        require(amount > 0, "No value to retrieve");

        remittanceStructs[hashedPassword].amount = 0;
        remittanceStructs[hashedPassword].deadline = 0;
        emit LogFundsReclaimed(hashedPassword, msg.sender, amount);

        //EIP 1884 (https://eips.ethereum.org/EIPS/eip-1884) within Istanbul hard fork
        //Avoidance of Solidity's transfer() or send() methods
        (success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Withdraw collected fees from deposits
     */
    function withdrawFees() public onlyOwner returns(bool success){
        uint amount = contractCollectedFees[msg.sender];
        require(amount > 0, "No fees to withdraw");
        contractCollectedFees[msg.sender] = 0;

        emit LogFeesWithdrawn(msg.sender, amount);

        //EIP 1884 (https://eips.ethereum.org/EIPS/eip-1884) within Istanbul hard fork
        //Avoidance of Solidity's transfer() or send() methods
        (success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Ownership can only be renounced (by owner).
     *      It is required that contract fees were withdrawn and contractFeePercentage was set to 0
     */
    function renounceOwnership() public override onlyOwner returns(bool success){
        require(contractFeePercentage == 0, "contractFeePercentage was not set to 0");
        require(contractCollectedFees[msg.sender] == 0, "contractCollectedFees were not withdrawn");

        return Owned.renounceOwnership();
    }
}