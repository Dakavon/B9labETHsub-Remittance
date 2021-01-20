import React, { useContext } from "react";
import { Button } from '@chakra-ui/react';
import { Web3Context, AccountContext } from "../Remittance/RemittanceContext";

export default function LogIn(){

    const [web3]                = useContext(Web3Context);
    const [account, setAccount] = useContext(AccountContext);

    async function getAccount(){
        if(web3){
            try{
                // Use web3 to get the user's accounts.
                const accounts = await web3.eth.requestAccounts();
                setAccount(accounts[0]);

                if(web3.currentProvider.isMetaMask){
                    web3.currentProvider.on('accountsChanged', (accounts) => {
                        if(accounts[0]){
                            setAccount(accounts[0]);
                        }
                        else{
                            setAccount(undefined);
                        }
                    });
                }
            }
            catch(error){
                console.log(error);
            }
        }
    };

    async function logMeIn(){
        try{
            await getAccount();
        }
        catch(error){
            console.log(error);
        }
    };

    async function logMeOut(){
        setAccount(undefined);
    };

    return(
        <div>
            {!(web3 && account) ?
                <Button colorScheme="green" size="sm" width="90px"
                    onClick={() => logMeIn()}>
                    LogIn
                </Button>
                :
                <Button colorScheme="pink" size="sm" width="90px"
                    onClick={() =>logMeOut()}>
                    LogOut
                </Button>
            }
        </div>
    );
}