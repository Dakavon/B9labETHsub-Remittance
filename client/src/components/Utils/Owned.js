import React, { useContext, useState } from "react";
import { Heading, Divider, Button, Input } from '@chakra-ui/react';

import { Web3Context, AccountContext, InstanceContext } from "../Remittance/RemittanceContext";


export default function Owned(){

    const {web3}                            = useContext(Web3Context);
    const {accountIsOwner}                  = useContext(AccountContext);
    const {instance, instanceIsDeployed}    = useContext(InstanceContext);

    const [instanceOwner, setInstanceOwner] = useState(undefined);
    const [appVariables, setAppVariables]   = useState({
        inputs: {
            newOwner: "",
        }
    });

    async function getOwner(){
        if(instanceIsDeployed){
            try{
                const _owner = await instance.methods.getOwner().call();
                setInstanceOwner(_owner);

                console.log("contract owner: ", _owner);
            }
            catch(error){
                console.log(error);
            }
        }
    }

    async function changeOwner(_newOwner){
        try{
            const _account = await accountIsOwner();
            if(_account){
                _newOwner = _newOwner.replace(/\s+/g, '');
                if(web3.utils.isAddress(_newOwner)){
                    const returned = await instance.methods.changeOwner(_newOwner).call({from: _account});
                    if(returned){
                        await instance.methods.changeOwner(_newOwner)
                        .send({
                            from: _account,
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
                        console.log("changeOwner: Owner was changed to", _newOwner);
                    }else{
                        console.log("changeOwner: Owner can not be changed");
                    }
                }else{
                    console.log("changeOwner: Input is not an address");
                }
            }else{
                console.log("changeOwner: You are not the owner")
            }
        }
        catch(error){
            console.error(error);
        }
    }

    async function renounceOwnership(){
        try{
            const _account = await accountIsOwner();
            if(_account){
                const returned = await instance.methods.renounceOwnership().call({from: _account});
                if(returned){
                    await instance.methods.renounceOwnership()
                    .send({
                        from: _account,
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
                    console.log("renounceOwnership: Ownership was renounced");
                }
            }else{
                console.log("renounceOwnership: You are not the owner")
            }
        }catch(error){
            console.error(error);
        }
    }

    return(
        <div>
            <Heading size="lg" m="5px" fontWeight="300">Owned</Heading>
            <Divider />
            <div className="functions">
                {instanceIsDeployed ?
                    <Button colorScheme="gray" variant="solid" fontWeight="300"
                        onClick={() => getOwner()}>
                        Call getOwner()
                    </Button>
                    :
                    <Button colorScheme="gray" variant="solid" fontWeight="300" isDisabled>
                        Call getOwner()
                    </Button>
                }{' '}{instanceOwner !== 'undefined' && instanceOwner}
            </div>
            <div className="functions">
                <Input
                    variant="filled"
                    size="md"
                    width="250"
                    type="text"
                    maxLength="42"
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
                {instanceIsDeployed ?
                    <Button colorScheme="yellow" variant="solid" fontWeight="300"
                        onClick={() => changeOwner(appVariables.inputs.newOwner)}>
                        Invoke changeOwner()
                    </Button>
                    :
                    <Button colorScheme="yellow" variant="solid" fontWeight="300" isDisabled>
                        Invoke changeOwner()
                    </Button>
                }
            </div>

            <div className="functions">
                {instanceIsDeployed ?
                    <Button colorScheme="red" variant="solid" fontWeight="300"
                        onClick={() => renounceOwnership()}>
                        Invoke renounceOwnership()
                    </Button>
                    :
                    <Button colorScheme="red" variant="solid" fontWeight="300" isDisabled>
                        Invoke renounceOwnership()
                    </Button>
                }
          </div>
        </div>
    )
}