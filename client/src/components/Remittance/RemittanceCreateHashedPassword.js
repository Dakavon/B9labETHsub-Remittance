import React, { useContext, useState } from "react";
import { Stack, FormControl, FormLabel,
  Box, Button, Input, InputGroup, InputRightElement, Textarea } from '@chakra-ui/react';

import { Web3Context, InstanceContext } from "./RemittanceContext";


export default function RemittanceCreateHashedPassword(){

    const [web3]                            = useContext(Web3Context);
    const {instance, instanceIsDeployed}    = useContext(InstanceContext);

    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword(!showPassword);

    const [appVariables, setAppVariables] = useState({
        inputs: {
            exchange: "",
            clearPassword: "",
        },
        outputs: {
            hashedPassword: "",
        },
    });

    function createHashedPassword(_exchange, _clearPassword){
        console.log("exchange: ", _exchange);
        console.log("clearPassword: ", _clearPassword);
        console.log("instance: ", instance._address);

        _exchange = _exchange.replace(/\s+/g, '');
        _clearPassword = _clearPassword.replace(/\s+/g, '');
        const _hexClearPassword = web3.utils.asciiToHex(_clearPassword);

        if(web3.utils.isAddress(_exchange) && web3.utils.isHexStrict(_hexClearPassword)){
            const _hashedPassword = web3.utils.soliditySha3(
                {t: 'address', v: _exchange},
                {t: 'bytes32', v: _hexClearPassword},
                {t: 'address', v: instance._address},
            );

            setAppVariables({
                ...appVariables,
                outputs: {
                    ...appVariables.outputs,
                    hashedPassword: _hashedPassword,
                }
            });
        }
        else{
            console.log("inputs were not correct");
        }
    }

    return (
        <div className="wrapper">
        <Box w="90%" borderWidth="1px" borderRadius="sm" borderColor="red" p={3}>
        <form>
        <Stack direction="row" spacing="5px">
        <FormControl id="exchange" isRequired>
            <FormLabel>Exchange</FormLabel>
            <Input variant="filled" size="sm" width="250" type="text" placeholder="address" isRequired
            value={appVariables.inputs.exchange}
            onChange={event => setAppVariables({
                ...appVariables,
                inputs: {
                    ...appVariables.inputs,
                    exchange: event.target.value,
                }
            })}
            />
        </FormControl>

        <FormControl id="clearPassword" isRequired>
            <FormLabel>Password</FormLabel>
            <InputGroup size="sm">
            <Input variant="filled" size="sm" width="200" placeholder="keepMeSecret" isRequired
            type={showPassword ? "text" : "password"}
            value={appVariables.inputs.clearPassword}
            onChange={event => setAppVariables({
                ...appVariables,
                inputs:{
                    ...appVariables.inputs,
                    clearPassword: event.target.value,
                }
            })}
            />
            <InputRightElement width="4.5rem">
            <Button h="1.5rem" size="sm" onClick={handleClickShowPassword}>
                {showPassword ? "Hide" : "Show"}
            </Button>
            </InputRightElement>
            </InputGroup>
        </FormControl>

        </Stack><br />
            {instanceIsDeployed ?
                <Button colorScheme="gray" variant="solid" fontWeight="300" size="sm"
                    onClick={() => createHashedPassword(appVariables.inputs.exchange, appVariables.inputs.clearPassword)}>
                    Call createHashedPassword()
                </Button>
                :
                <Button colorScheme="gray" variant="solid" fontWeight="300" size="sm" isDisabled>
                    Call createHashedPassword()
                </Button>
            }

        </form><br />
        <Textarea isDisabled size="sm"
            placeholder="your hashed password will be shown here"
            value={appVariables.outputs.hashedPassword}
            />
        </Box>
        </div>
    )
}