
import React, { useContext, useEffect, useState } from "react";
import { Heading, Divider, Stack, Skeleton, Box, Button,
    Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody,
    Accordion, AccordionButton, AccordionItem, AccordionIcon, AccordionPanel } from '@chakra-ui/react';
import RemittanceJSON from './../../contracts/Remittance.json';

import { AccountContext, InstanceContext, Web3Context } from "./RemittanceContext";


export default function RemittanceInfo(){
    const {account}     = useContext(AccountContext);
    const {instance}    = useContext(InstanceContext);
    const {web3}        = useContext(Web3Context);

    const [isLoading, setIsLoading] = useState(true);

    const [contractInfo, setContractInfo] = useState({
        networkID: undefined,
        contractTransactionHash: undefined,
        contractAddress: undefined,
        contractDeployer: undefined,
        contractDeployedBlock: 0,
    });

    const [eventDepositLogs, setEventDepositLogs] = useState([]);
    const [eventWithdrawLogs, setEventWithdrawLogs] = useState([]);
    const [appVariables, setAppVariables] = useState({
        gotPastEvents: false,
        eventListener: false,
      });


    useEffect(() => {
        const getContractInfo = async () => {
            try{
                //Gather information from network
                const networkID = await web3.eth.net.getId();
                const contractNetwork = RemittanceJSON.networks[networkID];
                const contractReceipt = await web3.eth.getTransactionReceipt(contractNetwork.transactionHash);

                setContractInfo({// ...contractInfo,
                    networkID: networkID,
                    contractTransactionHash: contractNetwork.transactionHash,
                    contractAddress: contractReceipt.contractAddress,
                    contractDeployer: contractReceipt.from,
                    contractDeployedBlock: contractReceipt.blockNumber,
                });
            }
            catch(error){
                // Catch any errors for any of the above operations.
                console.error(error);
            };
        };

        if(instance !== undefined){
            getContractInfo();
        };
    }, [web3, instance]);


    useEffect(() => {
        const getPastEvents = async() => {
            if(contractInfo.contractDeployedBlock !== 0
                && appVariables.gotPastEvents === false){
              try{
                const pastEventsDepositArray = await instance.getPastEvents(
                    'LogFundsDeposited',
                    {
                    filter: {
                        origin: account,
                    //   date:
                    },
                    fromBlock: contractInfo.contractDeployedBlock,
                    toBlock: "latest"
                    }
                );
                //add status of deposits here!

                const pastEventsWithdrawArray = await instance.getPastEvents(
                    'LogFundsWithdrawn',
                    {
                    filter: {
                        receiver: account,
                    //   date:
                    },
                    fromBlock: contractInfo.contractDeployedBlock,
                    toBlock: "latest"
                    }
                );

                setEventDepositLogs(pastEventsDepositArray);
                setEventWithdrawLogs(pastEventsWithdrawArray);

                setAppVariables(_oldVariables => ({
                    ..._oldVariables,
                    gotPastEvents: true,
                }));
                setIsLoading(false);
              }
              catch(error){
                    // Catch any errors for any of the above operations.
                    console.error(error);
                    setIsLoading(false);
              };
            };

            // console.log("eventDepositLogs: ", eventDepositLogs);
            // console.log("eventWithdrawLogs: ", eventWithdrawLogs);
        };

        if(instance !== undefined){
            getPastEvents();
        };
    }, [instance, appVariables.gotPastEvents, contractInfo.contractDeployedBlock, account]);

    // useEffect(() => {
    //     const getNewEvents = async () => {
    //         if(appVariables.gotPastEvents === true
    //             && appVariables.eventListener === false){

    //             await instance.events({})
    //             .on('data', newEvent => {

    //               setEventLogs(_eventLogs => ([
    //                 ..._eventLogs,
    //                 newEvent
    //               ]));

    //               setAppVariables(_appVariables => ({
    //                 ..._appVariables,
    //                 eventListener: true,
    //               }));
    //             });
    //           }
    //     };

    //     if(instance !== undefined){
    //         getNewEvents();
    //     };
    // }, [instance]);


    return (
        <div>
        <Box w="100%" borderWidth="1px" borderRadius="sm" borderColor="red" p={3}>
            <Heading fontSize="md">Contract info</Heading>
            <Divider />
            <Stack direction="row" p="10px" align="stretch" display="inline-block">
                <Popover>
                    <PopoverTrigger>
                        <Button size="sm">Transaction hash</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>Transaction hash</PopoverHeader>
                        <PopoverBody>{contractInfo.contractTransactionHash}</PopoverBody>
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger>
                        <Button size="sm">contractAddress</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>contractAddress</PopoverHeader>
                        <PopoverBody>{contractInfo.contractAddress}</PopoverBody>
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger>
                        <Button size="sm">contractOwner</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>contractOwner</PopoverHeader>
                        <PopoverBody>{contractInfo.contractDeployer}</PopoverBody>
                    </PopoverContent>
                </Popover>
            </Stack>
        </Box><br />
        <div className="logs">
            <Heading fontSize="md">Your deposits:</Heading>
                {isLoading === true ? <Skeleton height="30px" /> :
                (eventDepositLogs.length === 0 ? <pre> None.</pre> :
                <Accordion allowToggle m="5px">
                    {eventDepositLogs.map((thisEvent, index) => (
                        <AccordionItem key="{thisEvent.id}">
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                Deposit #{index}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                <Heading fontSize="sm">hashedPassword:</Heading>
                                {thisEvent.returnValues.hashedPassword}
                                <Heading fontSize="sm">amount:</Heading>
                                {web3.utils.fromWei(thisEvent.returnValues.amount, "ether")}{' Ξ'}
                                <Heading fontSize="sm">fee:</Heading>
                                {web3.utils.fromWei(thisEvent.returnValues.fee, "ether")}{' Ξ'}
                                <Heading fontSize="sm">deadline:</Heading>
                                Block no. {thisEvent.returnValues.deadline}
                            </AccordionPanel>
                        </AccordionItem>
                    ))}
                </Accordion>
                )}
        </div>
        <div className="logs">
            <Heading fontSize="md">Your withdrawals:</Heading>
                {isLoading === true ? <Skeleton height="30px" /> :
                (eventWithdrawLogs.length === 0 ? <pre> None.</pre> :
                <Accordion allowToggle m="5px">
                {eventWithdrawLogs.map((thisEvent, index) => (
                    <AccordionItem key="{thisEvent.id}">
                        <AccordionButton>
                            <Box flex="1" textAlign="left">
                            Withdrawal #{index}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                            <Heading fontSize="sm">hashedPassword:</Heading>
                            {thisEvent.returnValues.hashedPassword}
                            <Heading fontSize="sm">amount:</Heading>
                            {web3.utils.fromWei(thisEvent.returnValues.amount, "ether")}{' Ξ'}
                        </AccordionPanel>
                    </AccordionItem>
                ))}
                </Accordion>
                )}
        </div>
        </div>
    )
}