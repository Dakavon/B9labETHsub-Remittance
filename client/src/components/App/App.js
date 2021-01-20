import React, { useContext } from "react";
import { Tabs, TabList, TabPanels, Tab, TabPanel, Container, Box } from '@chakra-ui/react';
import Owned from './Owned';
import Stoppable from './Stoppable';
import Remittance from '../Remittance/RemittanceIndex';
import "./App.css";

import { Web3Context, InstanceContext } from "../Remittance/RemittanceContext";

export default function App2() {

    const [web3]        = useContext(Web3Context);
    const {instance}    = useContext(InstanceContext);

    if(!(web3 && instance)){
        return(
            <div className="errorMessage">
                Please connect to web3.
            </div>
        );
    }
    else{
        return (
            <div className="page">
                <Tabs isFitted>
                    <TabList>
                        <Tab>Remittance</Tab>
                        <Tab>Owned</Tab>
                        <Tab>Stoppable</Tab>
                    </TabList>

                    <Container bg="gray.400" width="720px" maxW="80%" boxShadow="lg" rounded="md" mt="10px">
                    <Box className="wrapper">
                        <TabPanels>
                            <TabPanel><Remittance /></TabPanel>
                            <TabPanel><Owned /></TabPanel>
                            <TabPanel><Stoppable /></TabPanel>
                        </TabPanels>
                    </Box>
                    </Container>
                </Tabs>
            </div>
        );
    }
}