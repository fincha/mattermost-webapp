// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import './entry.js';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router-dom';
import { getConfig } from 'mattermost-redux/selectors/entities/general';
import PDFJS from 'pdfjs-dist';

// Import our styles
import 'bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css';
import 'sass/styles.scss';
import 'katex/dist/katex.min.css';

import { browserHistory } from 'utils/browser_history';
import { makeAsyncComponent } from 'components/async_load';
import store from 'stores/redux_store.jsx';
import loadRoot from 'bundle-loader?lazy!components/root';

const Root = makeAsyncComponent(loadRoot);

PDFJS.disableWorker = true;

// This is for anything that needs to be done for ALL react components.
// This runs before we start to render anything.
function preRenderSetup(callwhendone) {
    window.onerror = (msg, url, line, column, stack) => {
        if (msg === 'ResizeObserver loop limit exceeded') {
            return;
        }
        var l = {};
        l.level = 'ERROR';
        l.message = 'msg: ' + msg + ' row: ' + line + ' col: ' + column + ' stack: ' + stack + ' url: ' + url;

        const req = new XMLHttpRequest();
        req.open('POST', '/api/v4/logs');
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(l));

        const state = store.getState();
        const config = getConfig(state);
        if (config.EnableDeveloper === 'true') {
            window.ErrorStore.storeLastError({
                type: 'developer',
                message:
                    'DEVELOPER MODE: A JavaScript error has occurred.  Please use the JavaScript console to capture and report the error (row: ' +
                    line +
                    ' col: ' +
                    column +
                    ').',
            });
            window.ErrorStore.emitChange();
        }
    };
    callwhendone();
}

function renderRootComponent() {
    let getCookie = name => {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');

        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) == 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    };

    let setCookie = (name, value, days) => {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    };

    if (getCookie('MMUSERID') && getCookie('chatlogin')) {
        setCookie('closeme', true, 5);

        setInterval(() => {
            if (getCookie('closed')) {
                // window.close();
            }
        }, 500);
    }

    ReactDOM.render(
        <Provider store={store}>
            <Router history={browserHistory}>
                <Route path="/" component={Root} />
            </Router>
        </Provider>,
        document.getElementById('root')
    );
}

/**
 * Adds a function to be invoked onload appended to any existing onload
 * event handlers.
 *
 * @param   {function} fn onload event handler
 *
 */
function appendOnLoadEvent(fn) {
    if (window.attachEvent) {
        window.attachEvent('onload', fn);
    } else if (window.onload) {
        const curronload = window.onload;
        window.onload = evt => {
            curronload(evt);
            fn(evt);
        };
    } else {
        window.onload = fn;
    }
}

appendOnLoadEvent(() => {
    // Do the pre-render setup and call renderRootComponent when done
    preRenderSetup(renderRootComponent);
});
