var root = '../';

require.config({

    baseUrl: 'js/libs',

    paths: {
        WSP_UI:         root + 'wsp-ui',
        wsp_ui:         root + '..',
        APPLICATION:    root + '../js/application'
    },

    shim: {
        bootstrap: ['jquery'],
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        highcharts: ['jquery'],
        underscore: {
            exports: '_'
        }
    }

});

require(['APPLICATION'], function(APP) {

    /* Initiate components. */
    var app = new APP();

    /* Initiate the application. */
    app.init();

});