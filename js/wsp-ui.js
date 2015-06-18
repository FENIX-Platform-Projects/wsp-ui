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
            placeholder_id: 'wsp_ui_placeholder',
            url_wds_crud: 'http://fenixapps2.fao.org/wds_5.1/rest/crud'

        };

    }

    WSP_UI.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang !== null ? this.CONFIG.lang : 'en';

        /* Box titles. */
        var titles = [
            translate.temperature_label,
            translate.evapotranspiration_label,
            translate.ndvi_label,
            translate.rainfall_label
        ];

        /* Load template. */
        var source = $(templates).filter('#wsp_ui_structure').html();
        var template = Handlebars.compile(source);
        var boxes = [];
        for (var i = 1 ; i <= titles.length ; i++) {
            boxes.push(
                {
                    box_title: titles[i],
                    z_score_label: translate.z_score_label,
                    anomaly_label: translate.anomaly_label,
                    box_content_id: this.CONFIG.prefix + 'box_content_' + i,
                    footer_text: 'footer_text',
                    add_new_line: i % 2 == 0
                }
            );
        }
        var dynamic_data = {
            box: boxes
        };
        var html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

    };

    WSP_UI.prototype.destroy = function() {

    };

    return WSP_UI;

});