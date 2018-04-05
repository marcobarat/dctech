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
        bool_expanded: null,

        onInit: function () {
            this.getSplitAppObj().toDetail(this.createId("Home"));
//            this.bool_expanded = false;
        },

        onAfterRendering: function () {
            if (this.bool_expanded !== null) {
                this.PresaInCarico();
                this.pippo = this.getView().byId("TreeTableBasic");
                var that = this;
                this.pippo.addEventDelegate(
                        {onAfterRendering: function () {
                                if (that.bool_expanded == false) {
                                    that.onExpandFirstLevel();
//                                that.onAfterRendering();
                                } else {
                                    that.onMiao();
                                }
                            }
                        });
            }
        },

        PresaInCarico: function () {
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.oModel = new JSONModel("model/Clothing.json");
            this.getView().setModel(this.oModel);

            this.bool_expanded = false;
            this.pippo = this.getView().byId("TreeTableBasic");

            //this.onAfterRendering();

//            this.onExpandFirstLevel();
//            this.onMiao();
//            this.pippo = this.getView().byId("TreeTableBasic");
//            var JSON_data = this.oModel.getProperty("/");
//            this.onExpandFirstLevel();
//            this.onMiao();
//            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));

        },

        onExpandFirstLevel: function () {
            this.pippo = this.getView().byId("TreeTableBasic");
            this.pippo.expandToLevel(100);
            this.bool_expanded = true;
        },

        onMiao: function () {
            this.pippo = this.getView().byId("TreeTableBasic");

            this.total = this.pippo._iBindingLength;
            alert(this.total);
            var temp;
            for (var i = this.total - 1; i >= 0; i--) {
                temp = this.pippo.getContextByIndex(i).getObject();
                if (temp.expand == 0) {
                    this.pippo.collapse(i);
                }
            }
//            this.bool_expanded = false;
//            this.PresaInCarico();
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
        }
    });
    return TmpController;
});
