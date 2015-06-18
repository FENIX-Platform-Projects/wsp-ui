/* global define */
define(['jquery',
        'handlebars',
        'text!wsp_ui/html/templates.hbs',
        'i18n!wsp_ui/nls/translate',
        'bootstrap',
        'sweet-alert'], function ($, Handlebars, templates, translate, sweetAlert) {

    'use strict';

    function WSP_UI() {

        this.CONFIG = {

            w: null,
            lang: 'E',
            prefix: 'wsp_ui_',
            placeholder_id: 'wsp_ui',
            url_wds_crud: 'http://fenixapps2.fao.org/wds_5.1/rest/crud'

        };

    }

    WSP_UI.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang !== null ? this.CONFIG.lang : 'en';

    };

    WSP_UI.prototype.destroy = function() {

    };

    return WSP_UI;

});