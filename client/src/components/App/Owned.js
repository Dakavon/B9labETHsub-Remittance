import React, { useContext, useState } from "react";
import { Heading, Divider, Button, Input } from '@chakra-ui/react';

import { AccountContext, InstanceContext } from "../Remittance/RemittanceContext";
import web3 from "web3";


export default function Owned(){
    const {account}     = useContext(AccountContext);
    const {instance}    = useContext(InstanceContext);

    const [owner, setOwner] = useState(undefined);
    const [appVariables, setAppVariables] = useState({
        inputs: {
            newOwner: "",
        }
    });

    async function getOwner(){
        const _owner = await instance.methods.getOwner().call({from: account});
        setOwner(_owner);

        console.log("owner: ", _owner);
    }

    async function changeOwner(_newOwner){
        _newOwner = _newOwner.replace(/\s+/g, '');
        if(web3.utils.isAddress(_newOwner)){
            try{
                const returned = await instance.methods.changeOwner(_newOwner).call({from: account});
                if(returned){
                    await instance.methods.changeOwner(_newOwner)
                    .send({
                        from: account,
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
                    console.log("owner was changed");
                }
                else{
                    console.log("owner can not be changed");
                }
            }
            catch(error){
                console.error(error);
            }
        }
        else{
            console.log("input is not an address")
        }
    }

    async function renounceOwnership(){
        try{
            const returned = await instance.methods.renounceOwnership().call({from: account});
            if(returned){
                await instance.methods.renounceOwnership()
                .send({
                    from: account,
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
                console.log("ownershio was renounced");
            }
        }
        catch(error){
            console.error(error.message);
        }
    }


    return(
        <div>
            <Heading size="lg" m="5px" fontWeight="300">Owned</Heading>
            <Divider />
            <div className="functions">
                <Button colorScheme="gray" variant="solid" fontWeight="300"
                    onClick={() => getOwner()}>
                    Call getOwner()
                </Button>{' '}{owner !== 'undefined' && owner}
            </div>

            <div className="functions">
                <Input
                variant="filled"
                size="md"
                width="250"
                type="text"
                placeholder="address"
                isRequired
                value={appVariables.inputs.newOwner}
                onChange={event => setAppVariables({
                ...appVariables,
                inputs: {
                    ...appVariables.inputs,
                    newOwner: event.target.value,
                }
                })}
                required
                />{' '}
                <Button colorScheme="yellow" variant="solid" fontWeight="300"
                    onClick={() => changeOwner(appVariables.inputs.newOwner)}>
                    Invoke changeOwner()
                </Button>
            </div>

            <div className="functions">
                <Button colorScheme="red" variant="solid" fontWeight="300"
                    onClick={() => renounceOwnership()}>
                    Invoke renounceOwnership()
                </Button>
          </div>
        </div>
    )
}