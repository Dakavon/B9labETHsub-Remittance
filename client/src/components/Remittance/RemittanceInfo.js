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

    const [contractInfo, setContractInfo] = useState({});
    const [eventDepositLogs, setEventDepositLogs] = useState([]);
    const [eventWithdrawLogs, setEventWithdrawLogs] = useState([]);
    const [eventsLoaded, setEventsLoaded] = useState({
        deposit: false,
        withdraw: false,
    })

    const getPastEvents = async (eventType, instance, filter, fromBlock) => {
        return await instance.getPastEvents(
                eventType,
                {
                    filter,
                    fromBlock,
                    toBlock: "latest"
                }
            );
    }

    useEffect(() => {
        (async () => {
            if (web3 && instance) {
                //Gather information from network
                const networkID = await web3.eth.net.getId();
                const contractNetwork = RemittanceJSON.networks[networkID];
                const contractReceipt = await web3.eth.getTransactionReceipt(contractNetwork.transactionHash);

                setContractInfo({
                    networkID: networkID,
                    contractTransactionHash: contractNetwork.transactionHash,
                    contractAddress: contractReceipt.contractAddress,
                    contractDeployer: contractReceipt.from,
                    contractDeployedBlock: contractReceipt.blockNumber,
                });
            }
        })();
    }, [web3, instance]);

    useEffect(() => {
        (async () => {
            if (web3 && instance) {
                const pastEventsDepositArray = await getPastEvents('LogFundsDeposited', instance, { origin: account }, contractInfo.contractDeployedBlock);
                setEventDepositLogs(pastEventsDepositArray);
                setEventsLoaded(_el => ({ ..._el, deposit: true}) );
            }
        })();
    }, [web3, instance, account, contractInfo]);

    useEffect(() => {
        (async () => {
            if (web3 && instance) {
                const pastEventsWithdrawArray = await getPastEvents('LogFundsWithdrawn', instance, { receiver: account }, contractInfo.contractDeployedBlock);
                setEventWithdrawLogs(pastEventsWithdrawArray);
                setEventsLoaded(_el => ({ ..._el, withdraw: true }));
            }
        })();
    }, [web3, instance, account, contractInfo])

    useEffect(() => {
        setIsLoading (! (eventsLoaded.deposit && eventsLoaded.withdraw) )
    }, [eventsLoaded])

    useEffect(() => {
        if (!instance || isLoading) return;
        const listenOnDeposits = instance.events.LogFundsDeposited({
            filter: {origin: account}
        });
        const listenOnWithdraws = instance.events.LogFundsWithdrawn({
            filter: {origin: account}
        });
        listenOnDeposits.on('data', newEvent => {
            setEventDepositLogs(_eventLogs => ([
                ..._eventLogs,
                newEvent
            ]));
        });
        listenOnWithdraws.on('data', newEvent => {
            setEventWithdrawLogs(_eventLogs => ([
                ..._eventLogs,
                newEvent
            ]));
        });
        return function cleanup() {
            listenOnDeposits.off('data');
            listenOnWithdraws.off('data');
        }
    }, [instance, account, isLoading]);

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
                {isLoading ? <Skeleton height="30px" /> :
                (eventDepositLogs.length === 0 ? <pre> None.</pre> :
                <Accordion allowToggle m="5px">
                    {eventDepositLogs.map((thisEvent, index) => (
                        <AccordionItem key={thisEvent.id}>
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
                    <AccordionItem key={thisEvent.id}>
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
