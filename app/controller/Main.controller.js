sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Controller, JSONModel) {
    "use strict";
    var MainController = Controller.extend("myapp.controller.Main", {

        onInit: function () {

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


//            var that = this;
////            var params = jQuery.sap.getUriParameters(window.location.href);
//            var input = "&repartoid=1";
//            var transactionCall = "DeCecco/Transactions/GetAllLinesFromRepartoID";
//            try {
//                jQuery.ajax({
//                    url: "model/JSON_Main.json",
//                    method: "GET",
//                    async: true,
//                    success: function (data, response) {
////                        var jsonObjStr = jQuery(data).find("Row").text();
////                        var jsonObj = JSON.parse(jsonObjStr);
//                        var oModel = new JSONModel({});
//                        that.getView().setModel(oModel);
//                    }
//                });
//            } catch (err) {
//                jQuery.sap.log.debug(err.stack);
//            }

        },
//        error: function () {
//            alert("error");
//        },
//        done: function () {
//            alert("error");
//        },
//        onAfterRendering: function () {
//
//
//        },
        onToTmpPage: function (event) {
            this.getOwnerComponent().getRouter().navTo("tmp");
        },
        onMiao: function (event) {
            var object_selected = event.getSource().mProperties;
            var str = event.getSource().sId;
            var n = str.lastIndexOf("-");
            var position = str.substr(n + 1, str.length);
            alert("Idlinea: " + this.getView().getModel().getData().linee[position].idlinea);
        },
        FillModel: function (model, data) {
            model.setProperty("/", data);
        }

//        onInit: function() {
//
//            var params = jQuery.sap.getUriParameters(window.location.href);
//
//        },
//
//        onAfterRendering: function() {
//
//
//        },
//
//        onToTmpPage: function(event) {
//
//            this.getOwnerComponent().getRouter().navTo("tmp");
//
//        }

    });
    return MainController;
});