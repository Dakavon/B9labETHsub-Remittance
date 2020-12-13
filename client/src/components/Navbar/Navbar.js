import React from "react";
import PropTypes from 'prop-types';
import { Flex, Box, Spacer, Badge } from '@chakra-ui/react';
import logo from "./logo.svg";
import './Navbar.css';


export default function Navbar({title, wallet, network}) {

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
                "gray",  //0
                "red",  //1
                "green",   //2
                "green",  //3
                "green",  //4
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
            <Spacer />
            <Box h="16" align="right">
                Your wallet:  {wallet}<br />
                Network: {network} <Badge variant="subtle" fontSize="0.6em" colorScheme={networks(network).colour}>{networks(network).name}</Badge>
            </Box>
        </Flex>
    )

}

Navbar.propTypes = {
    title:  PropTypes.string,
    wallet: PropTypes.string.isRequired,
}