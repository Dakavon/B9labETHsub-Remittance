import React, { useState, useEffect } from "react";
import { Tabs, TabList, TabPanels, Tab, TabPanel, Container, Box } from '@chakra-ui/react';
import getWeb3 from './getWeb3';
import Navbar from './../Navbar/Navbar';
import Owned from './Owned';
import Stoppable from './Stoppable';
import Remittance from '../Remittance/RemittanceIndex';
import './App.css';

//Ethereum contract JSON (abi, deployed networks, ...)
import RemittanceJSON from './../../contracts/Remittance.json';
import { AccountContext, InstanceContext, Web3Context } from "../Remittance/RemittanceContext";

//const contract = require("@truffle/contract");
const appTitle = "Remittance";

export default function App() {
  const [web3, setWeb3] = useState(undefined);
  const [account, setAccount] = useState([]);
  const [instance, setInstance] = useState();

  const [appVariables, setAppVariables] = useState({
    initError: false,
    networkID: undefined,
  });

  //Initialise web3
  useEffect(() => {
    const init = async() => {
      try{
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkID = await web3.eth.net.getId();
        const contractNetwork = RemittanceJSON.networks[networkID];
        const instance = new web3.eth.Contract(
          RemittanceJSON.abi,
          contractNetwork && contractNetwork.address,
        );

        // Set web3, accounts, and contract to the state
        setWeb3(web3);
        setAccount(accounts[0]);
        setInstance(instance);
        setAppVariables({...appVariables,
          networkID: networkID,
        });
      }
      catch(error){
        // Catch any errors for any of the above operations.
        console.error(error);
        setAppVariables({ initError: true });
      };
    };

    init();
  }, [appVariables]);


  if(typeof web3 === 'undefined'){
    return(
      <div className="wrapper">
        Loading Web3, accounts, and contract...
      </div>
    )
  }
  else{
    return(
      <div className="page">
        <Navbar title={appTitle} wallet={account.toString()} network={appVariables.networkID} />
        <div className="errorMessage">{appVariables.initError === true && "Failed to load web3, accounts, or contract."}</div>

        <Tabs isFitted>
          <TabList>
              <Tab>Remittance</Tab>
              <Tab>Owned</Tab>
              <Tab>Stoppable</Tab>
          </TabList>

          <Web3Context.Provider value={{web3}}>
          <AccountContext.Provider value={{account}}>
          <InstanceContext.Provider value={{instance}}>
          <Container bg="gray.400" width="720px" maxW="80%" boxShadow="lg" rounded="md" mt="10px">
          <Box className="wrapper">

          <TabPanels>
              <TabPanel><Remittance /></TabPanel>
              <TabPanel><Owned /></TabPanel>
              <TabPanel><Stoppable /></TabPanel>
          </TabPanels>

          </Box>
          </Container>
          </InstanceContext.Provider>
          </AccountContext.Provider>
          </Web3Context.Provider>
        </Tabs>

      </div>
    )
  }
}