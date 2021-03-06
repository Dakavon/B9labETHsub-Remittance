import React, { useContext, useState } from "react";
import { Stack, FormControl, FormLabel, Box, Button, useToast,
    Input, InputGroup, NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper, InputLeftAddon } from '@chakra-ui/react';

import { Web3Context, AccountContext, InstanceContext } from "./RemittanceContext";


export default function RemittanceDepositFunds(){

    const {web3}                            = useContext(Web3Context);
    const {autoLogIn}                       = useContext(AccountContext);
    const {instance, instanceIsDeployed}    = useContext(InstanceContext);

    const [appVariables, setAppVariables] = useState({
        inputs: {
            hashedPassword: "",
            durationBlocks: 1,
            amount: 0,
        },
    });

    const toast = useToast();
    function addToast(_status, headline, body, variable) {
        toast({
            title: headline,
            description: `${body}\n
               ${variable}`,
            status: _status,
            //duration: 3000,
            isClosable: true,
        });
    };

    async function depositFunds(_hashedPassword, _durationBlocks, _amount){
        try{
            _hashedPassword = _hashedPassword.replace(/\s+/g, '');
            _amount = _amount.replace(/\s+/g, '');
            _amount = web3.utils.toWei(_amount, "ether");

            console.log("hashedPassword: ", _hashedPassword);
            console.log("durationBlocks: ", _durationBlocks);
            console.log("amount: ", _amount);
        }
        catch(error){
            console.error(error);
        }


        if(web3.utils.isHexStrict(_hashedPassword) && _amount > 0){
            try{
                const _account = await autoLogIn();
                if(_account){
                    const returned = await instance.methods.depositFunds(_hashedPassword, _durationBlocks).call({from: _account, value: _amount});
                    if(returned){
                        await instance.methods.depositFunds(_hashedPassword, _durationBlocks)
                        .send({
                            from: _account,
                            value: _amount,
                        })
                        .on('transactionHash', (hash) => {
                            console.log("transactionHash: ", hash);
                            addToast("info", "Transaction sent!", "depositFunds: Your transaction will be mined soon.", "");
                        })
                        .on('receipt', (receipt) => {
                            console.log("receipt :", receipt);
                            addToast("success", "Transaction mined!", "depositFunds: Your deposit was successful.", "");
                        })
                        .on('error', (error, receipt) => {
                            console.log("receipt: ", receipt);
                            console.log("error message: ", error);
                            addToast("error", "Error!", "depositFunds: Transaction failed.", "");
                        });
                        console.log("depositFunds: Deposit successful");
                    }
                }
            }catch(error){
                console.error(error);
                addToast("error", "Error!", "depositFunds: Call failed.", "");
            }
        }else{
            console.log("depositFunds: Inputs are not correct");
        }
    }

    return (
        <div className="wrapper">
        <Box w="90%" borderWidth="1px" borderRadius="sm" borderColor="red" p={3}>
        <form>
        <Stack direction="column" spacing="5px">
            <FormControl id="hashedPassword" isRequired>
            <FormLabel>hashedPassword</FormLabel>
            <Input variant="filled" size="sm" width="100%" type="text" placeholder="hashedPassword" isRequired
            value={appVariables.inputs.hashedPassword}
            onChange={event => setAppVariables({
                ...appVariables,
                inputs: {
                    ...appVariables.inputs,
                    hashedPassword: event.target.value,
                }
            })}
            />
            </FormControl>

            <FormControl id="durationBlocks" isRequired>
            <FormLabel>Duration in blocks</FormLabel>
                <NumberInput min={1} size="sm"
                value={appVariables.inputs.durationBlocks}
                onChange={newValue => setAppVariables({
                    ...appVariables,
                    inputs: {
                        ...appVariables.inputs,
                        durationBlocks: newValue,
                    }
                })}
                >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
                </NumberInput>
            </FormControl>

            <FormControl id="amount" isRequired>
                <FormLabel>Amount (in Ether)</FormLabel>
                <InputGroup>
                    <InputLeftAddon h="2em" pointerEvents="none" children="Ξ" />
                    <Input variant="filled" size="sm" width="100%" type="text" placeholder="amount" isRequired
                    value={appVariables.inputs.amount}
                    onChange={event => setAppVariables({
                        ...appVariables,
                        inputs: {
                            ...appVariables.inputs,
                            amount: event.target.value,
                        }
                    })}
                    />
                </InputGroup>
            </FormControl>

        </Stack><br />
            {instanceIsDeployed ?
                <Button colorScheme="green" variant="solid" fontWeight="300" size="sm"
                    onClick={() => depositFunds(
                        appVariables.inputs.hashedPassword,
                        appVariables.inputs.durationBlocks,
                        appVariables.inputs.amount,
                    )}>
                    Deposit
                </Button>
                :
                <Button colorScheme="green" variant="solid" fontWeight="300" size="sm" isDisabled>
                    Deposit
                </Button>
            }
        </form>
        </Box>
        </div>
    )
}