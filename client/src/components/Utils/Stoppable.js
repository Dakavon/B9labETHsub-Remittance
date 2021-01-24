import React, { useContext, useState } from "react";
import { Heading, Divider, Button, Stack } from '@chakra-ui/react';

import { AccountContext, InstanceContext } from "../Remittance/RemittanceContext";


export default function Stoppable(){
    const {accountIsOwner}                  = useContext(AccountContext);
    const {instance, instanceIsDeployed}    = useContext(InstanceContext);

    const [state, setState] = useState("");

    async function getState(){
        if(instanceIsDeployed){
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
                console.log("contract state: ", stateString);
            }
            catch(error){
                console.error(error);
            }
        }
    }

    async function pauseContract(){
        try{
            const _account = await accountIsOwner();
            if(_account){
                const returned = await instance.methods.pauseContract().call({from: _account});
                if(returned){
                    await instance.methods.pauseContract()
                    .send({
                        from: _account
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
                    console.log("pauseContract: Contract is now paused");
                }else{
                    console.log("pauseContract: Contract can not be paused");
                }
            }else{
                console.log("pauseContract: You are not the owner");
            }
        }
        catch(error){
            console.error(error);
        };
    };

    async function resumeContract(){
        try{
            const _account = await accountIsOwner();
            if(_account){
                const returned = await instance.methods.resumeContract().call({from: _account});
                if(returned){
                    await instance.methods.resumeContract()
                    .send({
                        from: _account
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
                    console.log("resumeContract: Contract is now resumed");
                }else{
                    console.log("resumeContract: Contract can not be resumed");
                }
            }else{
                console.log("resumeContract: You are not the owner");
            }
        }catch(error){
            console.error(error);
        };
    };

    async function destroyContract(){
        try{
            const _account = await accountIsOwner();
            if(_account){
                const returned = await instance.methods.destroyContract().call({from: _account});
                if(returned){
                    await instance.methods.destroyContract()
                    .send({
                        from: _account
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
                    console.log("destroyContract: Contract is now destroyed");
                }else{
                    console.log("destroyContract: Contract can not be destroyed");
                }
            }else{
                console.log("destroyContract: You are not the owner");
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
    );
}