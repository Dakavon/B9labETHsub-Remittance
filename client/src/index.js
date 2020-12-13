import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App/App';
//import 'bootstrap/dist/css/bootstrap.min.css';
//import reportWebVitals from './reportWebVitals';
import { ChakraProvider } from "@chakra-ui/react"

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);