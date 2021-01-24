import React, { useContext, useState, useEffect } from "react";
import { Badge } from '@chakra-ui/react';
import { Identicon, EthAddress } from 'ethereum-react-components';

import { Web3Context, AccountContext } from "../Remittance/RemittanceContext";


export default function WalletAndNetworkInfo(){

    const {web3}    = useContext(Web3Context);
    const {account} = useContext(AccountContext);

    const [networkID, setNetworkID] = useState("N/A");

    useEffect(() => {
        (async () => {
            try{
                if(web3){
                    const ID = await web3.eth.net.getId();
                    setNetworkID(ID);
                }
                else{
                    setNetworkID("N/A");
                }
            }
            catch(error){
                console.log(error);
            }
        })();
    }, [web3]);

    const networks = (networkID) => {
        const networkProperties = {
            name: [
                "Olympic",  //0
                "Mainnet",  //1
                "Morden",   //2
                "Ropsten",  //3
                "Rinkeby",  //4
                "Goerli",   //5
            ],
            colour: [
                "gray",     //0
                "red",      //1
                "green",    //2
                "green",    //3
                "green",    //4
                "purple",   //5
            ]
        };

        if(0 <= networkID && networkID < networkProperties.name.length){
            return {
                name: networkProperties.name[networkID],
                colour: networkProperties.colour[networkID]
            };
        }else{
            return {
                name: "unknown",
                colour: "gray"
            };
        }
    }

    return(
        <div>
            {account ?
                <div>
                    Your wallet: <EthAddress short address={account} /> <Identicon address={account} size="tiny" />
                </div>
                :
                <div>
                    Your wallet: N/A
                </div>
            }
            Network: {networkID} {" "}
            <Badge variant="subtle" fontSize="0.6em" colorScheme={networks(networkID).colour}>
                {networks(networkID).name}
            </Badge>
        </div>
    );
}