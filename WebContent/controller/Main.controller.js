sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Controller, JSONModel) {
    "use strict";
    var MainController = Controller.extend("myapp.controller.Main", {
        Global: new JSONModel(),
        JSONLinee: new JSONModel(),

        onInit: function () {

            this.getOwnerComponent().setModel(this.Global, "Global");
            this.SyncAjaxCallerData("/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON", this.DoNothing.bind(this), this.RefreshPage.bind(this));
            this.SyncAjaxCallerData("model/JSON_Main.json", this.FillModel.bind(this));

        },
        GoToOperatore: function (event) {
            var line_num = event.getSource().getProperty("title");
            var chooser;
            for (var i = 0; i < this.JSONLinee.getData().linee.length; i++) {
                if (this.JSONLinee.getData().linee[i].linea === line_num) {
                    chooser = this.JSONLinee.getData().linee[i].idlinea;
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
        DoNothing: function () {
            console.log("");
        },
        RefreshPage: function () {
            location.reload(true);
        },
        FillModel: function (data) {
            var model = new JSONModel({});
            model.setProperty("/", data);
            this.JSONLinee.setData(data);
            this.getView().setModel(model);
        }


    });
    return MainController;
});