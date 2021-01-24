import React, { useContext } from "react";
import PropTypes from 'prop-types';
import { Flex, Box, Spacer, Divider } from '@chakra-ui/react';
import WalletAndNetworkInfo from "./WalletAndNetworkInfo";
import LogInButton from './LogInButton';
import logo from "./logo.svg";
import './Navbar.css';

import { InstanceContext } from "../Remittance/RemittanceContext";


export default function Navbar({title}) {

    const {instanceIsDeployed}  = useContext(InstanceContext);

    return(
        <Flex className="nav">
            <Box h="16" display="flex" alignItems="center">
                <img src={logo} width="40" height="40" alt="logo" />
                {title}
            </Box>
            {instanceIsDeployed ? <Box></Box> :
                <Box h="16" px="3" display="flex" align="center">
                    <div className="errorMessage">*contract was not deployed<br/> on this chainID</div>
                </Box>}
            <Spacer />
            <Box h="16" px="2" align="right">
                <WalletAndNetworkInfo />
            </Box>
            <Box h="16" align="right">
                <Divider orientation="vertical" />
            </Box>
            <Box boxShadow="xs" h="16" px="2" display="flex" alignItems="center">
                <LogInButton />
            </Box>
        </Flex>
    );
}

Navbar.propTypes = {
    title:  PropTypes.string
}