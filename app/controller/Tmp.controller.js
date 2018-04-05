sap.ui.define([
    'jquery.sap.global',
    'sap/m/MessageToast',
    'sap/ui/core/routing/History',
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/json/JSONModel"
], function (jQuery, MessageToast, History, Controller, JSONModel) {
    "use strict";
    var TmpController = Controller.extend("myapp.controller.Tmp", {

        oModel: null,
        pippo: null,
        total: null,
        onInit: function () {

            this.getSplitAppObj().toDetail(this.createId("Home"));


        },
        onMiao: function () {
            alert(this.total);
            var temp;
            for (var i = this.total - 1; i >= 0; i--) {
                temp = this.pippo.getContextByIndex(i).getObject();
                if (temp.expand == 0) {
                    this.pippo.collapse(i);
                }
            }
        },

        onExpandFirstLevel: function () {
            this.pippo.expandToLevel(100);
            this.total = this.pippo._iBindingLength;
            alert(this.total);
            //pippo.expand(2);
//            pippo.expandToLevel(10);
//            pippo.collapse(0);
//            pippo.collapse(2);
//            pippo.collapse(3);
        },

        PresaInCarico: function () {
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.oModel = new JSONModel("model/Clothing.json");
            this.getView().setModel(this.oModel);
            this.pippo = this.getView().byId("TreeTableBasic");
            var JSON_data = this.oModel.getProperty("/");
//            var n_levels = this.ReturnLevels("categories",JSON_data);
//            console.log(n_levels);
//            var indexes = ReturnIndexes("categories" , JSON_data);
            this.onExpandFirstLevel();
            this.onMiao();

        },

        FinePredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));
        },
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
        },
        getSplitAppObj: function () {
            var result = this.byId("SplitAppDemo");
            if (!result) {
                jQuery.sap.log.info("SplitApp object can't be found");
            }
            return result;
        },
        ReturnLevels: function (arrayName, JSON_file) {
            var levels = 1;
            var obj = JSON_file;
            var keys = Object.keys(obj);
            var discr = null;
            while (obj !== discr) {
                if (keys.indexOf(arrayName) > -1) {
                    levels += 1;
                }
                discr = obj;
                obj = obj[keys[0]];
                keys = Object.keys(obj);
            }
            return levels;
        }
//        ReturnIndexes: function (arrayName , JSON_file) {
//            var keys = Object.keys(JSON_data);
//        }
    });
    return TmpController;
});
