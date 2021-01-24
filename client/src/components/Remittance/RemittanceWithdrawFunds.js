import React, { useContext, useState } from "react";
import { FormControl, FormLabel, Box, Button, Input, useToast } from '@chakra-ui/react';

import { Web3Context, AccountContext, InstanceContext } from "./RemittanceContext";

export default function RemittanceWithdrawFunds(){

    const {web3}                            = useContext(Web3Context);
    const {autoLogIn}                       = useContext(AccountContext);
    const {instance, instanceIsDeployed}    = useContext(InstanceContext);

    const [appVariables, setAppVariables] = useState({
        inputs: {
            clearPassword: "",
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

    async function withdrawFunds(_clearPassword){
        _clearPassword = _clearPassword.replace(/\s+/g, '');
        const _hexClearPassword = web3.utils.asciiToHex(_clearPassword);

        console.log("clearPassword: ", _clearPassword);
        console.log("hexClearPassword: ", _hexClearPassword);

        try{
            const _account = await autoLogIn();
            if(_account){
                const returned = await instance.methods.withdrawFunds(_hexClearPassword).call({from: _account});
                if(returned){
                    await instance.methods.withdrawFunds(_hexClearPassword)
                    .send({
                        from: _account,
                    })
                    .on('transactionHash', (hash) => {
                        console.log("transactionHash: ", hash);
                        addToast("info", "Transaction sent!", "withdrawFunds: Your transaction will be mined soon.", "");
                    })
                    .on('receipt', (receipt) => {
                        console.log("receipt :", receipt);
                        addToast("success", "Transaction mined!", "withdrawFunds: Your withdrawal was successful.", "");
                    })
                    .on('error', (error, receipt) => {
                        console.log("receipt: ", receipt);
                        console.log("error message: ", error);
                        addToast("error", "Error!", "withdrawFunds: Transaction failed.", "");
                    });
                    console.log("withdrawFunds: Withdraw successful");
                }
                else{
                    console.log("withdrawFunds: Withdraw failed");
                }
            }
        }
        catch(error){
            console.error(error);
            addToast("error", "Error!", "withdrawFunds: Call failed.", "");
        }
    }

    return (
        <div className="wrapper">
        <Box w="90%" borderWidth="1px" borderRadius="sm" borderColor="red" p={3}>
            <FormControl id="clearPassword" isRequired>
            <FormLabel>clearPassword</FormLabel>
            <Input variant="filled" size="sm" width="100%" type="text" placeholder="clearPassword" isRequired
                value={appVariables.inputs.clearPassword}
                onChange={event => setAppVariables({
                    ...appVariables,
                    inputs: {
                        ...appVariables.inputs,
                        clearPassword: event.target.value,
                    }
                })}
            />
            </FormControl>
            <br />
            {instanceIsDeployed ?
                <Button colorScheme="green" variant="solid" fontWeight="300" size="sm"
                    onClick={() => withdrawFunds(appVariables.inputs.clearPassword)}>
                    Withdraw
                </Button>
                :
                <Button colorScheme="green" variant="solid" fontWeight="300" size="sm" isDisabled>
                    Withdraw
                </Button>
            }
        </Box>
        </div>
    )

}