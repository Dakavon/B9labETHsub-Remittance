import React, { useContext } from "react";
import { Button } from '@chakra-ui/react';
import { AccountContext } from "../Remittance/RemittanceContext";

export default function LogInButton(){

    const {account, autoLogIn, autoLogOut}  = useContext(AccountContext);

    async function logMeIn(){
        autoLogIn();
    };

    async function logMeOut(){
        autoLogOut();
    };

    return(
        <div>
            {(account) ?
                <Button colorScheme="pink" size="sm" width="90px"
                    onClick={() =>logMeOut()}>
                    LogOut
                </Button>
                :
                <Button colorScheme="green" size="sm" width="90px"
                    onClick={() => logMeIn()}>
                    LogIn
                </Button>
            }
        </div>
    );
}