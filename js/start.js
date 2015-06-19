define([
    'jquery',
    'underscore',
    'handlebars',
    'text!fx-flude-ui/html/structure.hbs',
    'i18n!fx-flude-ui/nls/translate',
    'text!fx-flude-ui/config/data.json',
    'text!fx-flude-ui/config/indicators.json',
    'fx-c-c/start',
    'fenix-ui-map',
    'sweetAlert'
], function (
    $,
    _,
    Handlebars,
    structure,
    i18n,
    data,
    indicators,
    ChartCreator
) {
    'use strict';

    function FLUDE() {
        this.o = {
            s: {
                placeholder: '#content',
                map: '[data-role="map"]',
                indicator: '[data-role="indicator"]',
                year: '[data-role="year"]',
                incomes: '[data-role="incomes"]',
                region: '[data-role="region"]',
                domain: '[data-role="domain"]',
                chart: '[data-role="chart"]',
            },
            data: null,
            cl: {
                indicators: null,
                default_indicator: "NFLoss"
            },

            selectedCountries: []
        }
    };

    FLUDE.prototype.init = function(config) {
        $.extend(true, this.o, config);
        this.o.data = $.parseJSON(data);
        this.o.cl.indicators = $.parseJSON(indicators);
        this.$placeholder = $(this.o.s.placeholder);

        // render
        this.render(this.o.data);
    };

    FLUDE.prototype.render = function(data) {

        /* Load template. */
        var source = $(structure).html();
        var template = Handlebars.compile(source);
        var html = template();
        this.$placeholder.html(html);

        // init chosen
        this.$indicator = $(this.o.s.indicator).chosen();
        this.$year = $(this.o.s.year).chosen();
        this.$incomes = $(this.o.s.incomes).chosen();
        this.$region = $(this.o.s.region).chosen();
        this.$domain = $(this.o.s.domain).chosen();
        this.$chart = $(this.o.s.chart);

        // bind
        this.$indicator.on('change', _.bind(function() {this.updateJoinLayer(false);}, this));
        this.$year.on('change', _.bind(function() {this.updateJoinLayer(false);}, this));
        this.$incomes.on('change', _.bind(function() {this.updateJoinLayer(true);}, this));
        this.$region.on('change', _.bind(function() {this.updateJoinLayer(true);}, this));
        this.$domain.on('change', _.bind(function() {this.updateJoinLayer(true);}, this));

        // initDropDown
        this.initDropDown(this.$indicator, this.o.cl.indicators, this.o.cl.default_indicator)

        // init map
        this.initMap(this.o.s.map);

        // update join layer
        this.updateJoinLayer();
    };

    FLUDE.prototype.initDropDown = function($c, data, default_code) {
        var html = ""
        data.forEach(function(d) {
            html += "<option value='" + d.code + "'";
            if (default_code == d.code) {
                html += 'selected="selected"'
            }
            html += ">" + d.label + "</option>"
        });
        $c.html(html);
        $c.trigger("chosen:updated");
    };

    FLUDE.prototype.initMap = function(c) {
        var layers = 'fenix:gaul0_faostat_3857',
            joinColumn = 'iso3',
            joinLabel = 'faost_n';

        this.o.m = new FM.Map(c, {
            plugins: {
                zoomcontrol: 'bottomright',
                disclaimerfao: true,
                fullscreen: true,
                geosearch: true,
                mouseposition: false,
                controlloading : true,
                zoomResetControl: true
            },
            guiController: {
                overlay: true,
                baselayer: true,
                wmsLoader: true
            }
        });
        this.o.m.createMap();

        this.o.joinlayer = new FM.layer({
            layers: layers,
            layertitle: i18n.indicator,
            opacity: '0.7',
            joincolumn: joinColumn,
            joincolumnlabel: joinLabel,
            joindata: [],
            mu: "",
            legendsubtitle: "",
            layertype: 'JOIN',
            jointype: 'shaded',
            openlegend: true,
            defaultgfi: true,
            colorramp: 'Greens',
            intervals: 7,
            lang: 'en',
            customgfi: {
                /*                content: {
                 en: "<div class='fm-popup'>{{"+ joinLabel +"}} <div class='fm-popup-join-content'>{{{"+ joinColumn +"}}}</div></div>"
                 },*/
                content: {
                    en: "{{"+ joinColumn +"}}"
                },
                showpopup: false,
                callback: _.bind(this.handleCountrySelection, this)
            }
        });
        // this.o.map.addLayer(this.o.joinlayer);

        this.o.m.addLayer(new FM.layer({
            layers: 'fenix:gaul0_line_3857',
            layertitle: 'Country Boundaries',
            urlWMS: 'http://fenix.fao.org/geoserver',
            opacity: '0.9',
            zindex: '500',
            lang: 'en'
        }));

        this.o.l_highlight_countries = new FM.layer({
            layers: layers,
            layertitle: '',
            urlWMS: 'http://fenix.fao.org/geoserver',
            zindex: '550',
            style: 'highlight_polygon',
            cql_filter: "iso3 IN ('0')",
            hideLayerInControllerList: true,
            lang: 'en'
        });
        this.o.m.addLayer(this.o.l_highlight_countries);
    };

    FLUDE.prototype.resetCountries = function() {
        this.o.selectedCountries = [];
        this.highlightCountries(this.o.selectedCountries);

        // create chart
        this.$chart.empty();

        this.o.m.map.setView([0,0], 1);
    };

    FLUDE.prototype.handleCountryDropDownSelection = function(codes) {

        this.o.selectedCountries = [];

        _.each(codes, function(code) {
            this.o.selectedCountries.push(code);
        }, this);

        // highlight countries
        this.highlightCountries(this.o.selectedCountries);

        // create chart
        this.createChart();
    },

    FLUDE.prototype.handleCountrySelection = function(code) {

        // check if the code already in the selectedCountries
        if (code !== null && code != undefined) {
            if (_.indexOf(this.o.selectedCountries, code) > -1) {
                this.o.selectedCountries = _.without(this.o.selectedCountries, code);
            }
            else {
                this.o.selectedCountries.push(code);
            }
            this.o.selectedCountries = _.uniq(this.o.selectedCountries);

            //console.log(this.o.selectedCountries);
            this.highlightCountries(this.o.selectedCountries);

            // create chart
            this.createChart();
        }
    };

    FLUDE.prototype.createChart = function() {
        // create chart
        var chartData = this.filterChartData();
        var creator = new ChartCreator();

        creator.init({
            model: chartData,
            adapter: {
                filters: ['Country'],
                x_dimension: 'Year'
            },
            template: {},
            creator: {},
            onReady: _.bind(this.renderChart, this)
        });
    };

    FLUDE.prototype.renderChart = function(creator) {
        var countries = this.o.selectedCountries,
            indicator = this.$indicator.val(),
            series = [];

        _.each(countries, function(country) {
            series.push({
                filters: {
                    'Country': country,
                },
                value: indicator,
                name: country
            });
        });

        creator.render({
            container: this.o.s.chart,
            template: {
                title: "Timeseries of " + this.$indicator.find("option:selected").text() +" by country (1990-2015)"

            },
            creator: {
                chartObj: {
                    chart: {
                        type: 'column'
                    }
                }
            },
            adapter: {
                series: series
            }
        });
    };

    FLUDE.prototype.highlightCountries = function(countryCodes) {

        if ( countryCodes.length > 0) {
            var codes = "'" + countryCodes.join("','") + "'";
            this.o.l_highlight_countries.layer.cql_filter = "iso3 IN (" + codes + ")";
            //this.zoomTo(countryCodes);
        }
        else {
            this.o.l_highlight_countries.layer.cql_filter = "iso3 IN ('0')";
        }

        this.o.l_highlight_countries.redraw();
    };

    FLUDE.prototype.filterData = function() {
        var year = parseInt(this.$year.val()),
            incomes = this.$incomes.val(),
            region = this.$region.val(),
            domain = this.$domain.val(),
            filters = {};

        filters.Year = year;
        if (incomes != "") filters.Incomes = incomes;
        if (domain != "") filters.Domain = domain;
        //if (region != "") filters.Region = region;

        //console.log(filters);

        return  _.where(this.o.data, filters);
    };

    FLUDE.prototype.filterChartData = function() {
        var incomes = this.$incomes.val(),
            region = this.$region.val(),
            domain = this.$domain.val(),
            countries = this.o.selectedCountries,
            filters = {};

        if (incomes != "") filters.Incomes = incomes;
        if (domain != "") filters.Domain = domain;

        var data = [];
        _.each(countries, function(countryCode) {
            filters.Country = countryCode;
            _.each(_.where(this.o.data, filters), function(d) {
                data.push(d);
            });
        }, this);

        return data;
    };

    FLUDE.prototype.updateJoinLayer = function(resetCountries) {
        var indicator = this.$indicator.val(),
            data = this.filterData();
        // remove cached layer

        //console.log(indicator);
        //console.log(data);
        this.o.m.removeLayer(this.o.joinlayer);

        // clean joindata array
        this.o.joinlayer.layer.joindata = [];

        var codes = []
        data.forEach(_.bind(function(d) {
            if (d[indicator] != null && d[indicator] != 0) {
                var p = {};
                p[d['Country']] = d[indicator];
                codes.push(d['Country']);
                this.o.joinlayer.layer.joindata.push(p);
            }
        }, this));

        if (this.o.joinlayer.layer.joindata.length > 0) {
            this.o.joinlayer = new FM.layer(this.o.joinlayer.layer);
            this.o.m.addLayer(this.o.joinlayer);
            // TODO: add check for maximum number of codes?


            console.log(codes);

            // handle dropdown selection
            if (codes.length < 200) {
                this.zoomTo(codes);
                this.handleCountryDropDownSelection(codes);
            }
            else {
                //this.resetCountries();

                // if there are still selected countries refresh the chart
                if (this.o.selectedCountries.length > 0 && resetCountries !== true) {
                    this.createChart();
                }
                else {
                    // reset the countries
                    this.resetCountries();
                }
            }
        }
        else {
            // reset values
            this.resetCountries();

            swal({title: i18n.error, type: 'error', text: i18n.data_not_available_current_selection});
        }
    };

    FLUDE.prototype.chartIndicator = function(codes) {

    };

    FLUDE.prototype.zoomTo = function(codes) {
        this.o.m.zoomTo("country", "iso3", codes);
    };

    FLUDE.prototype.getMapData = function(data, indicator) {

    };

    return FLUDE;
});