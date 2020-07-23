import React from 'react';
import { render } from 'react-dom';
import { app } from './js/overmind'
import App from './js/App';
// import './css/app.scss';
// import './css/tailwind.css';
import { Provider } from 'overmind-react';

import 'react-toastify/dist/ReactToastify.css';
import * as serviceWorker from './serviceWorker';

const renderApp = () => render(
    <React.StrictMode>
        <Provider value={ app }>
            <App />
        </Provider>
    </React.StrictMode>
    , document.getElementById('root'));

renderApp()
serviceWorker.unregister();
if (module.hot) {
    module.hot.accept(['./js/overmind', './js/App'], () => {
        renderApp();
    });
}


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
