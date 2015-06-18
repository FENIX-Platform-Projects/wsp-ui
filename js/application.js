define(['jquery',
        'WSP_UI',
        'domReady!'], function($, WDS_UI) {

    'use strict';

    function APP() {

        this.CONFIG = {

        }

    }

    APP.prototype.init = function() {

        /* Initiate the routing. */
        var ui = new WDS_UI();
        ui.init(this.CONFIG);

    };

    return APP;

});