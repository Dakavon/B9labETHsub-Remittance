import React, { useContext, useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Flex, Box, Spacer, Badge, Divider } from '@chakra-ui/react';
import LogIn from './LogIn';
import logo from "./logo.svg";
import './Navbar.css';

import { Web3Context, AccountContext, InstanceContext } from "../Remittance/RemittanceContext";

export default function Navbar({title}) {

    const [web3]                = useContext(Web3Context);
    const [account]             = useContext(AccountContext);
    const {instanceIsDeployed}  = useContext(InstanceContext);
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
        <Flex className="nav">
            <Box h="16" display="flex" alignItems="center">
                <img src={logo} width="40" height="40" alt="logo" />
                {title}
            </Box>
            {instanceIsDeployed ? <Box></Box> :
                <Box h="16" display="flex" alignItems="end">
                    <div className="errorMessage">*contract was not deployed on this chainID</div>
                </Box>}
            <Spacer />
            <Box h="16" px="2" align="right">
                Your wallet: {account ? account : "N/A"} <br />
                Network: {networkID} {" "}
                    <Badge variant="subtle" fontSize="0.6em" colorScheme={networks(networkID).colour}>
                        {networks(networkID).name}
                    </Badge>
            </Box>
            <Box h="16" align="right">
                <Divider orientation="vertical" />
            </Box>
            <Box boxShadow="xs" h="16" px="2" display="flex" alignItems="center">
                <LogIn />
            </Box>
        </Flex>
    );

}

Navbar.propTypes = {
    title:  PropTypes.string
}