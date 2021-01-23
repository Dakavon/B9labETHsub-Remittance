import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { ChakraProvider } from "@chakra-ui/react"
import Navbar from './components/Navbar/Navbar';
import App from './components/App/App';

import { RemittanceContextProvider } from "./components/Remittance/RemittanceContext";

const appTitle = "Remittance";

ReactDOM.render(
    <React.StrictMode>
        <ChakraProvider>
            <RemittanceContextProvider>
                <Navbar title={appTitle} />

            </RemittanceContextProvider>
        </ChakraProvider>
    </React.StrictMode>,
    document.getElementById('root')
);