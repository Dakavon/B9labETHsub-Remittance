import React, { useState, createContext, useEffect } from "react";
import Web3 from "web3";

//Ethereum contract JSON (abi, deployed networks, ...)
import RemittanceJSON from '../../contracts/Remittance.json';

export const Web3Context        = createContext();
export const AccountContext     = createContext();
export const InstanceContext    = createContext();

export const RemittanceContextProvider = (props) => {
    const [web3, setWeb3]                               = useState(undefined);
    const [account, setAccount]                         = useState(undefined);
    const [instance, setInstance]                       = useState(undefined);
    const [instanceIsDeployed, setInstanceIsDeployed]   = useState(false);

    /**
     * Web3
     */
    useEffect(() => {
        async function connect2Web3(){
            window.addEventListener("load", async () => {
                try{
                    if(window.ethereum){
                        // Get network provider and web3 instance.
                        const _web3 = new Web3(window.ethereum);
                        setWeb3(_web3);
                    }
                    // Legacy dapp browsers...
                    else if(window.web3){
                        // Use Mist/MetaMask's provider.
                        const _web3 = window.web3;
                        console.log("Injected web3 detected.");
                        setWeb3(_web3);
                    }
                    // Fallback to localhost; use dev console port by default...
                    else {
                        const provider = new Web3.providers.HttpProvider(
                        "http://127.0.0.1:8545"
                        );
                        const _web3 = new Web3(provider);
                        console.log("No web3 instance injected, using Local web3.");
                        setWeb3(_web3);
                    }
                }
                catch(error){
                    console.log(error);
                }
            })
        };
        connect2Web3();
    }, []);

    useEffect(() => {
        if(web3 && web3.currentProvider.isMetaMask){
            web3.currentProvider.on('chainChanged', () => {
                console.log("Chain was changed. Reloading...");
                window.location.reload();
            });
        }
    }, [web3]);

    /**
     * Instance
     */
    useEffect(() => {
        (async () => {
            if(web3){
                try{
                    const networkID = await web3.eth.net.getId();
                    const contractNetwork = RemittanceJSON.networks[networkID];
                    const _instance = new web3.eth.Contract(
                        RemittanceJSON.abi,
                        contractNetwork && contractNetwork.address,
                    );
                    setInstance(_instance);
                    if(_instance._address){
                        setInstanceIsDeployed(true);
                    }
                    else{
                        setInstanceIsDeployed(false);
                    }
                }
                catch(error){
                    console.log(error);
                }
            }
        })();
    }, [web3]);

    /**
     * Account
     */
    async function autoLogIn(){
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
                return accounts[0];
            }
            catch(error){
                console.log(error);
            }
        }
    }

    async function autoLogOut(){
        setAccount(undefined);
    };

    /**
     * Provider
     */
    return(
        <Web3Context.Provider value={{web3}}>
            <AccountContext.Provider value={{account, autoLogIn, autoLogOut}}>
                <InstanceContext.Provider value={{instance, instanceIsDeployed}}>
                    {props.children}
                </InstanceContext.Provider>
            </AccountContext.Provider>
        </Web3Context.Provider>
    );
};