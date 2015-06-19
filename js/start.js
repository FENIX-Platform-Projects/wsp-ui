/** global console **/

define([
    'jquery',
    'underscore',
    'handlebars',
    //'text!fx-wsp-ui/html/structure.hbs',
    'text!fx-wsp-ui/html/templates.hbs',
    'i18n!fx-wsp-ui/nls/translate',
    'fx-c-c/start',
    'fx-wsp-ui/config/Services',
    'q',
    'fenix-ui-map',
    'select2',
    'sweetAlert'
], function (
    $,
    _,
    Handlebars,
    templates,
    i18n,
    ChartCreator,
    Services,
    Q
) {
    'use strict';

    function WSP() {
        this.o = {
            lang: 'EN',
            prefix: 'wsp_ui_',
            s: {
                placeholder: '#content'
            },
            box: [
                {
                    id: 'myd11c3',
                    title: i18n.temperature_label,
                    coverageSectorCode: 'myd11c3',
                    cachedLayers: [],
                    selectedLayer: null,
                    baselayerDef: ''

                },
                {
                    id: 'et',
                    title: i18n.evapotranspiration_label,
                    coverageSectorCode: 'et',
                    cachedLayers: [],
                },
                //{
                //    id: 'rainfall',
                //    title: i18n.rainfall_label,
                //    coverageSectorCode: 'eco_rainfall'
                //},
                {
                    id: 'mod13a3',
                    title: i18n.ndvi_label,
                    coverageSectorCode: 'mod13a3',
                    cachedLayers: []
                }
            ],

            // query raster timeserie
            pixel_query : {
                "raster": [
                    //{
                    //    "workspace": "eco_et",
                    //    "layerName": "et_6km_mod16a2_200101_3857",
                    //    "datasource": "geoserver"
                    // }
                ],
                "stats": {
                    "pixel": {
                        //"lat": 44.460250,
                        //"lon": 66.774902
                    }
                }
            },

            // template of the chart
            chart_template: {
                xAxis: {
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                },
                series: []
            }
        }
    };

    WSP.prototype.init = function(config) {
        this.o = $.extend(true, {}, this.o, config);
        //this.o.data = $.parseJSON(data);
        //this.o.cl.indicators = $.parseJSON(indicators);
        this.$placeholder = $(this.o.s.placeholder);

        // render
        this.render(this.o.data);
    };

    WSP.prototype.render = function(data) {

        /* Fix the language, if needed. */
        this.o.lang = this.o.lang !== null ? this.o.lang : 'EN';

        /* Load template. */
        var source = $(templates).filter('#wsp_ui_structure').html(),
            template = Handlebars.compile(source),
            boxes = [];

        for (var i = 0; i < this.o.box.length; i++) {
            this.o.box[i] = $.extend(true, {}, this.o.box[i],
                {
                    box_title: this.o.box[i].title,
                    add_new_line: i % 2 == 1,
                    z_score_label: i18n.z_score_label,
                    anomaly_label: i18n.anomaly_label,
                    footer_text: i18n.copyright_label,
                    please_select_label: i18n.please_select_label,

                    // ids
                    box_id: this.o.box[i].id
                }
            );
        }
        var dynamic_data = {
            box: this.o.box,
            wsp_label: i18n.wsp_label
        };
        var html = template(dynamic_data);
        this.$placeholder.html(html);
        $('.select2').select2();



        var _this = this;
        for (var i = 0 ; i < this.o.box.length ; i++) {
            this.o.box[i].$box = this.$placeholder.find('#' + this.o.box[i].id);
            this.o.box[i].$dd = this.o.box[i].$box.find('[data-role="dd"]');
            this.o.box[i].$zscore = this.o.box[i].$box.find('[data-role="zscore"]');
            this.o.box[i].$anomaly = this.o.box[i].$box.find('[data-role="anomaly"]');
            this.o.box[i].$map = this.o.box[i].$box.find('[data-role="map"]');
            this.o.box[i].$chart = this.o.box[i].$box.find('[data-role="chart"]');


            this.o.box[i].$dd = this.o.box[i].$box.find('[data-role="dd"]');
            this.fillDD(this.o.box[i]);

            this.o.box[i].m = this.initMap(this.o.box[i].$map);

            this.o.box[i].m.map.on('click', function (e) {
                _this.createChart(this.box, e.latlng.lat, e.latlng.lng)
            }, {box: this.o.box[i]});
        }

        // sync maps
        this.syncMaps(this.o.box);

    };


    WSP.prototype.fillDD = function(box) {
        var coverageSectorCode = box.coverageSectorCode,
            $dd = box.$dd;


        var request_filter = {
            "meContent.resourceRepresentationType" : {
                "enumeration" : ["geographic"]
            },
            "meContent.seCoverage.coverageSectors" : {
                "codes" : [
                    {
                        "uid" : "layers_products",
                        "version" : "1.0",
                        "codes": [box.coverageSectorCode]
                    }
                ]
            }
        }

        var url = Services.url_d3s_resources_find + "?" + Services.url_d3s_resources_find_order_by_date_parameters;

        var _this = this;
        $.ajax({
            type: 'POST',
            url: url,
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(request_filter),
            crossDomain: true,
            success : function(response) {
                // TODO build dropdown or display:none
                var html = '';
                for (var i=0; i < response.length; i++) {
                    //var selected = ( i == 0 )? "selected='selected'": "";
                    html += "<option value='" + response[i].dsd.layerName + "'>" + response[i].title[_this.o.lang] + "</option>";
                }
                box.cachedLayers = response;
                $dd.append(html);

                // load layer
                $dd.change({box: box}, function(e) {
                    _this.onDDSelection(e.data.box, $(this).find(":selected").val());
                });

                //console.log($dd.select2().select2('val', $('.select2 option:eq(0)').val()));
                $dd.select2().select2('val', $dd.find('option:eq(0)').val(), true);
            },
            error : function(err, b, c) {
                console.log("ERROR D3s");
            }
        });

    };

    WSP.prototype.onDDSelection = function(box, layerName) {
        var m = box.m,
            cachedLayers = box.cachedLayers,
            selectedLayer = box.selectedLayer,
            l = this.getLayerByLayerName(layerName, cachedLayers);

        box.selectedLayer = this.loadLayer(m, selectedLayer, l.dsd.workspace, l.dsd.layerName, l.title[this.o.lang], box);
    };

    WSP.prototype.getLayerByLayerName = function(layerName, cachedLayers) {
        for(var i=0; i < cachedLayers.length; i++) {
            if (cachedLayers[i].dsd.layerName == layerName) {
                return cachedLayers[i];
            }
        }
    };

    WSP.prototype.getLayersByYear = function(cachedLayers, year) {
        var layers = [];
        for (var i = 0; i < 12; i++) {
            layers.push(null);
        }
        for (var i=0; i < cachedLayers.length; i++) {
            try {
                var fromDate = cachedLayers[i].meContent.seCoverage.coverageTime.from;
                var d = new Date(fromDate);
                if (d.getFullYear() == year) {
                    console.log(d.getMonth());
                    layers[d.getMonth()] = cachedLayers[i]
                }
            }
            catch (e) {
                console.warn("Couldn't be possible to parse the date", e);
            }
        }

        console.log(layers);
        return layers;
    };


    WSP.prototype.loadLayer = function(m, selectedLayer, workspace, layerName, layerTitle, box) {

        // remove selected layer
        if (selectedLayer !== null && selectedLayer !== undefined) {
            m.removeLayer(selectedLayer);
        }

        // create layer
        selectedLayer = new FM.layer({
            layers: workspace + ":" + layerName,
            layertitle: layerTitle,
            urlWMS: Services.url_geoserver_wms_demo,
            opacity: '0.9',
            lang: 'EN',
            openlegend: true,
            defaultgfi: true,
            /*                customgfi: {
             content: {
             EN: "{{GRAY_INDEX}}"
             },
             showpopup: true,
             callback: _.bind(this.handlePixelSelection, this, box)
             }*/
        });

        m.addLayer(selectedLayer);

        return selectedLayer;
    };

    WSP.prototype.handlePixelSelection = function(box, value) {

        console.log(value);
        console.log(box);


        //var deferred = Q.defer();
        //http.get(opts, deferred.resolve);
        //return deferred.promise;
    };

    WSP.prototype.getPixelSeries = function(layers) {
        //var deferred = Q.defer();
        //
        //http.get(opts, deferred.resolve);
        //return deferred.promise;
    };

    WSP.prototype.createChart = function(box, lat, lon) {
        var cachedLayers = box.cachedLayers,
            $chart = box.$chart;


        $chart.empty();
        //box.chartObj = null;

        $chart.highcharts({
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            series: []
        });

        var index= $chart.data('highchartsChart');
        box.chartObj = Highcharts.charts[Highcharts.charts.length-1];


        for(var year=2015; year >= 2000; year--) {
            this.getChartData(this.getLayersByYear(cachedLayers, year), lat, lon, year.toString()).then(function(v) {
                // check response
                for(var i=0; i < v.data.length; i++) {
                    if (v.data[i] != null) {
                        box.chartObj.addSeries(v);
                        break;
                    }
                }
            });
        }

        //var membersList = this.getDataTest();

        //membersList.then(function (res) {
        //    console.log(res);
        //    console.log("here");
        //}).then();



        /*        this.getDataTest().then(function(c) {
         console.log("done");
         console.log(c);
         }).then(
         this.getDataTest().then(function(c) {
         console.log("done");
         console.log(c)
         })
         )*/

    };

    WSP.prototype.addSerieToChart = function(chartObj, serie) {
        for(var i=0; i< chartObj.series.length; i++) {
            if ( chartObj.series[i].name == serie.name) {
                console.log(chartObj.series[i].name);
                chartObj.series[i].data = serie.data;
                console.log(serie.data);
                console.log(chartObj.series[i]);
                break;
            }
        }
        chartObj.redraw();
    };

    WSP.prototype.getDataTest = function() {
        var deferred = Q.defer();
        $.get("http://faostat3.fao.org/wds/rest/procedures/usp_GetListBox/faostatdb/MK/4/1/E").done(function (result) {
            deferred.resolve(result);
        });
        return deferred.promise;
    };

    WSP.prototype.getChartData = function(layers, lat, lon, serieName) {
        var deferred = Q.defer();

        var data = $.extend(true, {}, this.o.pixel_query);
        for(var i=0; i < layers.length; i++) {

            var layer = null;
            if (layers[i] != null) {
                layer = { workspace: layers[i].dsd.workspace, layerName: layers[i].dsd.layerName, datasource: "geoserver"}
            }
            else {
                layer = { workspace: "", layerName: "", datasource: "geoserver"}
            }
            data.raster.push(layer);
        }

        data.stats.pixel = {
            lat: lat,
            lon: lon
        }

        $.ajax({
            type: 'POST',
            url: Services.url_geostatistics_rasters_pixel,
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(data),
            crossDomain: true,
            success : function(response) {
                var d = {
                    name: serieName,
                    data: response
                }
                deferred.resolve(d);
            },
            error : function(err, b, c) {}
        });

        return deferred.promise;
    };



    WSP.prototype.initMap = function(c) {
        var m = new FM.Map(c, {
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
        m.createMap();

        m.addLayer(new FM.layer({
            layers: 'fenix:gaul0_line_3857',
            layertitle: i18n.country_coundaries,
            urlWMS: Services.url_geoserver_wms,
            opacity: '0.9',
            zindex: '500',
            lang: 'en'
        }));


        // On Move
        var _m = m;
        var _this = this
        var GFIchk = {};
        GFIchk["lat-" + m.id] = 0;
        GFIchk["lng-" + m.id] = 0;
        GFIchk["globalID-" + m.id] = 0;

        return m;
    };

    WSP.prototype.syncMaps = function(maps) {
        for (var i = 0 ; i < maps.length ; i++) {
            for (var j = 0 ; j < maps.length ; j++) {
                if (i !== j) {
                    if (maps[i].m !== null && maps[i].m !== undefined && maps[j].m !== null && maps[j].m !== undefined) {
                        maps[i].m.syncOnMove(maps[j].m);
                    }
                }
            }
        }
    };

    return WSP;
});