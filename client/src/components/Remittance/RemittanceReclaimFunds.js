import React, { useContext, useState } from "react";
import { FormControl, FormLabel, Box, Button, Input, useToast } from '@chakra-ui/react';
import web3 from "web3";

import { AccountContext, InstanceContext } from "./RemittanceContext";

export default function RemittanceReclaimFunds(){

    const {account}     = useContext(AccountContext);
    const {instance}    = useContext(InstanceContext);

    const [appVariables, setAppVariables] = useState({
        inputs: {
            hashedPassword: "",
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

    async function reclaimFunds(_hashedPassword){
        _hashedPassword = _hashedPassword.replace(/\s+/g, '');

        console.log("hashedPassword: ", _hashedPassword);

        if(web3.utils.isHexStrict(_hashedPassword)){
            try{
                const returned = await instance.methods.reclaimFunds(_hashedPassword).call({from: account});
                if(returned){
                    await instance.methods.reclaimFunds(_hashedPassword)
                    .send({
                        from: account,
                    })
                    .on('transactionHash', (hash) => {
                        console.log("transactionHash: ", hash);
                        addToast("info", "Transaction sent!", "Your transaction will be mined soon.", "");
                    })
                    .on('receipt', (receipt) => {
                        console.log("receipt :", receipt);
                        addToast("success", "Transaction mined!", "Your reclaim was successful.", "");
                    })
                    .on('error', (error, receipt) => {
                        console.log("receipt: ", receipt);
                        console.log("error message: ", error);
                        addToast("error", "Error!", "Transaction failed.", "");
                    });
                    console.log("reclaim successful");
                }
                else{
                    console.log("reclaim failed");
                }
            }
            catch(error){
                console.error(error);
                addToast("error", "Error!", "Call failed.", "");
            }
        }
        else{
            console.log("inputs were not correct")
        }
    }

    //     try{
    //         const returned = await instance.methods.withdrawFunds(_hexClearPassword).call({from: account});
    //         if(returned){
    //             await instance.methods.withdrawFunds(_hexClearPassword)
    //             .send({
    //                 from: account,
    //             })
    //             .on('transactionHash', (hash) => {
    //                 console.log("transactionHash: ", hash);
    //             })
    //             .on('receipt', (receipt) => {
    //                 console.log("receipt :", receipt);
    //             })
    //             .on('error', (error, receipt) => {
    //                 console.log("receipt: ", receipt);
    //                 console.log("error message: ", error);
    //             });
    //             console.log("withdraw successful");
    //         }
    //         else{
    //             console.log("withdraw failed");
    //         }
    //     }
    //     catch(error){
    //         console.error(error);
    //     }
    // }

    return (
        <div className="wrapper">
        <Box w="90%" borderWidth="1px" borderRadius="sm" borderColor="red" p={3}>
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
            <br />
            <Button colorScheme="green" variant="solid" fontWeight="300" size="sm"
                onClick={() => reclaimFunds(appVariables.inputs.hashedPassword)}>
                Reclaim
            </Button>
        </Box>
        </div>
    )

}