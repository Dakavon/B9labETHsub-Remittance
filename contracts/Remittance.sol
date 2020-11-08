// SPDX-License-Identifier: Unlicense

//B9lab ETH-SUB Ethereum Developer Subscription Course
//>>> Remittance <<<
//
//Last update: 08.11.2020

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
    uint public maxDurationBlocks = 1000;

    struct RemittanceStruct{
        address origin;
        uint amount;
        uint deadline;
    }
    mapping(bytes32 => RemittanceStruct) public remittanceStructs;

    event LogFundsDeposited(address indexed origin, uint amount, uint deadline);
    event LogFundsWithdrawn(address indexed receiver, uint amount);
    event LogFundsReclaimed(address indexed origin, uint amount);
    event LogMaxDurationChanged(address indexed sender, uint oldMaxDurationBlocks, uint newMaxDurationBlocks);

    constructor(State initialState)
        Stoppable(initialState) public { }

    /**
     * @dev Support function: Create a unique hashed password off-chain to be used for depositFunds() and reclaimFunds()
     *
     * @param exchange The address of the recipient (exchange)
     * @param clearPassword The uncrypted, plain password
     */
    function createHashedPassword(address exchange, bytes32 clearPassword) public view returns(bytes32 hashedPassword){
        return keccak256(abi.encodePacked(exchange, clearPassword, address(this)));
    }

    /**
     * @dev Change the maximum allowed duration until the remittance funds can be reclaimed by sender
     *
     * @param newMaxDurationBlocks New maximum duration in blocks for new remittanceses
     */
    function changeMaxDurationBlocks(uint newMaxDurationBlocks) public onlyOwner returns(bool success){
        require(newMaxDurationBlocks > 0, "'newMaxDurationBlocks' need to be greater than 0");

        emit LogMaxDurationChanged(msg.sender, maxDurationBlocks, newMaxDurationBlocks);
        maxDurationBlocks = newMaxDurationBlocks;

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
        require(hashedPassword != "", "'hashedPassword' must be provided");
        require(durationBlocks > 0 && durationBlocks <= maxDurationBlocks, "'durationBlocks' must be greater than 0 and less or equal than 'maxDurationBlocks'");

        //Check for address, i.e. same exchange address and password configuration must never have been used before within this contract
        require(remittanceStructs[hashedPassword].origin == address(0x0), "Remittance must be unique");

        uint deadline = block.number + durationBlocks;

        remittanceStructs[hashedPassword].origin = msg.sender;
        remittanceStructs[hashedPassword].amount = msg.value;
        remittanceStructs[hashedPassword].deadline = deadline;

        LogFundsDeposited(msg.sender, msg.value, deadline);
        return true;
    }

    /**
     * @dev Retrieve remittance with the correct password (only by receiver specified in createHashedPassword()
     *
     * @param clearPassword Clear password that was kept secret
     */
    function withdrawFunds(bytes32 clearPassword) public onlyIfRunning returns(bool success){
        require(clearPassword != "", "'clearPassword' must be provided");

        bytes32 hashedPassword = createHashedPassword(msg.sender, clearPassword);

        uint amount = remittanceStructs[hashedPassword].amount;
        require(amount > 0, "No value to retrieve");

        remittanceStructs[hashedPassword].amount = 0;
        emit LogFundsWithdrawn(msg.sender, amount);

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
        require(hashedPassword != "", "'hashedPassword' must be provided");
        require(remittanceStructs[hashedPassword].origin == msg.sender, "Remittance can only be reclaimed by origin");
        require(remittanceStructs[hashedPassword].deadline < block.number, "Remittance is not expired yet");

        uint amount = remittanceStructs[hashedPassword].amount;
        require(amount > 0, "No value to retrieve");

        remittanceStructs[hashedPassword].amount = 0;
        emit LogFundsReclaimed(msg.sender, amount);

        //EIP 1884 (https://eips.ethereum.org/EIPS/eip-1884) within Istanbul hard fork
        //Avoidance of Solidity's transfer() or send() methods
        (success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}