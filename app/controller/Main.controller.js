sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Controller, JSONModel) {
    "use strict";
    var MainController = Controller.extend("myapp.controller.Main", {
        Global: new JSONModel(),
        JSONLinee: new JSONModel(),
        ISLOCAL: null,
        STOP: 0,
        TIMER: null,
        RefreshCounter: null,
        Reparto: 1,
        Stabilimento: 1,
        GlobalBusyDialog: new sap.m.BusyDialog(),

        onInit: function () {

            this.getOwnerComponent().setModel(this.Global, "Global");
            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
//            if (this.ISLOCAL !== 1) {
//                this.SyncAjaxCallerData("/XMII/Runner?Transaction=DeCecco/Transactions/GetAllLinee&Content-Type=text/json&OutputParameter=JSON", this.FillModel.bind(this), this.RefreshPage.bind(this));
//            }
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("main").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            clearInterval(this.TIMER);
            this.RefreshCounter = 10;
            this.STOP = 0;
//            this.getView().setModel(this.ModelLinea, 'linea');
            this.RefreshCall();
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.RefreshCounter++;
                    if (that.STOP === 0 && that.RefreshCounter >= 10) {
                        that.RefreshFunction();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        RefreshFunction: function (msec) {
            this.RefreshCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_MAIN.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/InCombo/GetOverviewPdcAttualeForTiles&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&RepartoID=" + this.RepartoID + "&OutputParameter=JSON";
            }
            this.SyncAjaxCallerData(link, this.SUCCESSDatiTurni.bind(this), this.RefreshPage.bind(this));
        },
        SUCCESSDatiTurni: function (Jdata) {
            this.JSONLinee.setData(Jdata);
            if (this.ISLOCAL !== 1 && this.STOP === 0) {
                this.RefreshCounter = 0;
            }
            this.getView().setModel(this.JSONLinee, "linee");
        },
        GoToOperatore: function (event) {
            this.GlobalBusyDialog.open();
            clearInterval(this.TIMER);
            this.STOP = 1;
            var path = event.getSource().getBindingContext("linee").sPath;
            var line_num = this.JSONLinee.getProperty(path).linea;
            var chooser;
            for (var i = 0; i < this.JSONLinee.getData().linee.length; i++) {
                if (this.JSONLinee.getData().linee[i].linea === line_num) {
                    chooser = this.JSONLinee.getData().linee[i].lineaID;
                }
            }
            this.Global.setProperty("/", {"Linea": line_num, "idLinea": chooser});
            sap.ui.getCore().setModel(this.Global, "Global");
            this.getOwnerComponent().getRouter().navTo("Operatore");
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
        },
        RefreshPage: function () {
            clearInterval(this.TIMER);
            this.STOP = 1;
            location.reload(true);
        }
//        FillModel: function (data) {
//            this.JSONLinee.setData(data);
//            this.getView().setModel(this.JSONLinee, "linee");
//        }


    });
    return MainController;
});