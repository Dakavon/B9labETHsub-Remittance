import React, { useContext, useState } from "react";
import { Heading, Divider, Button, Stack } from '@chakra-ui/react';

import { AccountContext, InstanceContext } from "../Remittance/RemittanceContext";


export default function Stoppable(){
    const [account]                         = useContext(AccountContext);
    const {instance, instanceIsDeployed}    = useContext(InstanceContext);

    const [state, setState] = useState("");

    async function getState(){
        let stateString;
        try{
            const instanceState = await instance.methods.getState().call();

            switch(instanceState){
                case "0": stateString = "paused"; break;
                case "1": stateString = "running"; break;
                case "2": stateString = "destroyed"; break;
                default: stateString = "";
              }

              setState(stateString);
              console.log("state: ", stateString);
        }
        catch(error){
            console.log(error);
        }
    }

    async function pauseContract(){
        try{
            const returned = await instance.methods.pauseContract().call({from: account});
            if(returned){
                await instance.methods.pauseContract()
                .send({
                    from: account
                })
                .on('transactionHash', (hash) => {
                    console.log("transactionHash: ", hash);
                })
                .on('receipt', (receipt) => {
                    console.log("receipt :", receipt);
                })
                .on('error', (error, receipt) => {
                    console.log("receipt: ", receipt);
                    console.log("error message: ", error);
                });
                console.log("contract is now paused");
            }
        }
        catch(error){
            console.error(error);
        };
    };

    async function resumeContract(){
        try{
            const returned = await instance.methods.resumeContract().call({from: account});
            if(returned){
                await instance.methods.resumeContract()
                .send({
                    from: account
                })
                .on('transactionHash', (hash) => {
                    console.log("transactionHash: ", hash);
                })
                .on('receipt', (receipt) => {
                    console.log("receipt :", receipt);
                })
                .on('error', (error, receipt) => {
                    console.log("receipt: ", receipt);
                    console.log("error message: ", error);
                });
                console.log("contract is now resumed");
            }
        }
        catch(error){
            console.error(error);
        };
    };

    async function destroyContract(){
        try{
            const returned = await instance.methods.destroyContract().call({from: account});
            if(returned){
                await instance.methods.destroyContract()
                .send({
                    from: account
                })
                .on('transactionHash', (hash) => {
                    console.log("transactionHash: ", hash);
                })
                .on('receipt', (receipt) => {
                    console.log("receipt :", receipt);
                })
                .on('error', (error, receipt) => {
                    console.log("receipt: ", receipt);
                    console.log("error message: ", error);
                });
                console.log("contract is now destroyed");
            }
        }
        catch(error){
            console.error(error);
        };
    };

    return (
        <div>
            <Heading size="lg" m="5px" fontWeight="300">Stoppable</Heading>
            <Divider />
            <div className="functions">
                {instanceIsDeployed ?
                    <Button colorScheme="gray" variant="solid" fontWeight="300"
                        onClick={() => getState()}>
                        Call getState()
                    </Button>
                    :
                    <Button colorScheme="gray" variant="solid" fontWeight="300" isDisabled>
                    Call getState()
                    </Button>
                }{' '}{state !== 'undefined' && state}
            </div>
            <div className="functions">
                <Stack direction="row" spacing={4}>
                    {instanceIsDeployed ?
                        <Button colorScheme="yellow" variant="solid" fontWeight="300"
                            onClick={() => pauseContract()}>
                            Invoke pauseContract()
                        </Button>
                        :
                        <Button colorScheme="yellow" variant="solid" fontWeight="300" isDisabled>
                            Invoke pauseContract()
                        </Button>
                    }
                    {instanceIsDeployed ?
                        <Button colorScheme="yellow" variant="solid" fontWeight="300"
                            onClick={() => resumeContract()}>
                            Invoke resumeContract()
                        </Button>
                        :
                        <Button colorScheme="yellow" variant="solid" fontWeight="300" isDisabled>
                            Invoke resumeContract()
                        </Button>
                    }
                </Stack>
            </div>
            <div className="functions">
                {instanceIsDeployed ?
                    <Button colorScheme="red" variant="solid" fontWeight="300"
                        onClick={() => destroyContract()}>
                        Invoke destroyContract()
                    </Button>
                    :
                    <Button colorScheme="red" variant="solid" fontWeight="300" isDisabled>
                        Invoke destroyContract()
                    </Button>
                }
            </div>
        </div>
    )
}