sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Controller, JSONModel) {
    "use strict";
    var SPCController = Controller.extend("myapp.controller.SPCWindow", {

        IDLinea: null,
        IDParametro: null,
        Fase: null,

        onInit: function () {
            var ISLOCAL = sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL;
            this.IDLinea = sap.ui.getCore().getModel("IDLinea").getData().IDLinea;
            this.IDParametro = sap.ui.getCore().getModel("IDParametro").getData().IDParametro;
            this.Fase = sap.ui.getCore().getModel("Fase").getData().Fase;

            if (ISLOCAL !== 1) {
                this.RefreshCall();
            }
        },
        RefreshFunction: function () {
            setTimeout(this.RefreshCall.bind(this), 5000);
        },
        RefreshCall: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/SPCDataPlot&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.IDLinea + "&ParametroID=" + this.IDParametro + "&Fase=" + this.Fase;
            this.SyncAjaxCallerData(link, this.SUCCESSSPCDataLoad.bind(this));
        },
        SUCCESSSPCDataLoad: function (Jdata) {
            Jdata = this.ParseSPCData(Jdata, "#");
            var valori =
                    {
                        x: Jdata.time,
                        y: Jdata.valori,
                        type: 'scatter',
                        name: "",
                        line: {color: 'rgb(0,58,107)', width: 1}
                    };
            var limSup =
                    {
                        x: Jdata.time,
                        y: Jdata.limSup,
                        type: 'scatter',
                        name: "",
                        line: {color: 'rgb(167,25,48)', width: 1}
                    };
            var limInf =
                    {
                        x: Jdata.time,
                        y: Jdata.limInf,
                        type: 'scatter',
                        name: "",
                        line: {color: 'rgb(167,25,48)', width: 1}
                    };
            var layout = {
                title: 'Grafico SPC',
                showlegend: false,
                xaxis: {
                    title: 'Ora',
                    showgrid: true,
                    zeroline: false
                },
                yaxis: {
                    title: 'Pesatura',
                    showline: false
                }
            };
            var dataPlot = [valori, limSup, limInf];
            var plotBox = this.getView().byId("plotBox");
            var ID = jQuery.sap.byId(plotBox.getId()).get(0);
            Plotly.newPlot(ID, dataPlot, layout);
            this.RefreshFunction();
        },
        ParseSPCData: function (data, char) {
            for (var key in data) {
                data[key] = data[key].split(char);
                for (var i = data[key].length - 1; i >= 0; i--) {
                    if (data[key][i] === "") {
                        data[key].splice(i, 1);
                    } else {
                        if (key !== "time") {
                            data[key][i] = Number(data[key][i]);
                        }
                    }
                }
            }
            return data;
        },
        SyncAjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "json",
                async: false,
                success: successFunc,
                error: errorFunc
            });
        }

    });
    return SPCController;
});