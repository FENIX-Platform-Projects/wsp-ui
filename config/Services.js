/*global define*/
define(function ( ) {

    'use strict';

    return {

        "url_geoserver_wms": "http://fenix.fao.org/demo/fenix/geosever",
        "url_d3s_metadata_resource": "http://fenix.fao.org/d3smsd/resources/uid/{{UID}}",
        "url_d3s_resources_find": "http://fenix.fao.org/d3smsd/msd/resources/find",
        "url_d3s_resources_find_order_by_date_parameters": "order=meContent.seCoverage.coverageTime.from:desc&logic=StandardFilter&dsd=true&full=true",
        "url_css2sld": "//fenixapps2.fao.org/geoservices/CSS2SLD"

    };
});
