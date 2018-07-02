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

            var model = new JSONModel({});
            var param = {};
            var req = jQuery.ajax({
                url: "model/JSON_Main.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            var tempfunc = jQuery.proxy(this.FillModel, this, model);
            req.done(tempfunc);

            this.getView().setModel(model);

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
        FillModel: function (model, data) {
            model.setProperty("/", data);
            this.JSONLinee.setData(data);
        }


    });
    return MainController;
});