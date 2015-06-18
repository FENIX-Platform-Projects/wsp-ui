/* global define */
define(function() {

    'use strict';

    var config;
    config = {
        paths: {
            WSP_UI: 'wsp-ui',
            wsp_ui: '../'
        },
        shim: {
            bootstrap: {
                deps: ['jquery']
            }
        }
    };

    return config;

});