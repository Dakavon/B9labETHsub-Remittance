import React, { useContext, useEffect, useState } from "react";
import { Heading, Divider, Skeleton, Stack, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';

import RemittanceInfo from './RemittanceInfo';
import RemittanceCreateHashedPassword from './RemittanceCreateHashedPassword';
import RemittanceDepositFunds from './RemittanceDepositFunds';
import RemittanceWithdrawFunds from './RemittanceWithdrawFunds';
import RemittanceReclaimFunds from './RemittanceReclaimFunds';

import { InstanceContext, Web3Context } from "./RemittanceContext";


export default function RemittanceIndex(){
    const {instance}    = useContext(InstanceContext);
    const {web3}        = useContext(Web3Context);

    const [isLoading, setIsLoading] = useState(true);

    const [contractInfo, setContractInfo] = useState({
      balance: null,
      contractFeePercentage: null,
    });

    useEffect(() => {
      const getInfos = async () => {
          try{
              const _balance = await web3.eth.getBalance(instance._address);
              const _balanceEther = web3.utils.fromWei(_balance, "ether");

              const _contractFeePercentage = await instance.methods.contractFeePercentage().call();


              setContractInfo({
                balance: _balanceEther,
                contractFeePercentage: _contractFeePercentage,
              });
              setIsLoading(false);
          }
          catch(error){
              // Catch any errors for any of the above operations.
              console.error(error);
              setContractInfo({
                balance: "N/A",
                contractFeePercentage: "N/A",
              });
              setIsLoading(false);
          };
      };

      if(instance !== undefined){
          getInfos();
      };
    }, [instance, web3]);


    return (
      <div>
        <Heading size="lg" m="5px" fontWeight="300">Remittance</Heading>
        <Skeleton isLoaded={!isLoading}>
          <Stack direction="row" spacing={10} align="strech">
            <div>TVL: {contractInfo.balance} Ξ</div>
            <div> Fee: {contractInfo.contractFeePercentage} %</div>
          </Stack>
        </Skeleton>
        <Divider />
        <Tabs isFitted>
          <TabList>
            <Tab>Info</Tab>
            <Tab>Deposit</Tab>
            <Tab>Withdraw</Tab>
            <Tab>Reclaim</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <RemittanceInfo />
            </TabPanel>
            <TabPanel>
              <Heading size="md" m="5px" fontWeight="300">1. Create a hashed password</Heading>
              <RemittanceCreateHashedPassword />
              <Heading size="md" m="5px" fontWeight="300">2. Deposit funds</Heading>
              <RemittanceDepositFunds />
            </TabPanel>
            <TabPanel>
              <Heading size="md" m="5px" fontWeight="300">Withdraw funds</Heading>
              <RemittanceWithdrawFunds />
            </TabPanel>
            <TabPanel>
              <Heading size="md" m="5px" fontWeight="300">Reclaim funds</Heading>
              <RemittanceReclaimFunds />
            </TabPanel>
          </TabPanels>
        </Tabs>

      </div>
    )

}