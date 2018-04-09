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
        FlagPresaInCarico: null,
        FlagCollapseNotRelevant: null,
        AllExpanded: 0,

        onInit: function () {
            this.getSplitAppObj().toDetail(this.createId("Home"));
        },

        PresaInCarico: function () {
            if (this.FlagPresaInCarico == null) {

                this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
                this.oModel = new JSONModel("model/SKU.json");
                this.getView().setModel(this.oModel);

                this.pippo = this.getView().byId("TreeTableBasic");
                this.pippo.expandToLevel(100);

                this.FlagPresaInCarico = 0;
                this.FlagCollapseNotRelevant = 1;
            }
        },

        CollapseNotRelevant: function () {
            if (this.FlagCollapseNotRelevant == 1 && this.pippo !== null) {
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                oGlobalBusyDialog.open();
                this.pippo = this.getView().byId("TreeTableBasic");
                this.total = this.pippo._iBindingLength;
                var temp;
                for (var i = this.total - 1; i >= 0; i--) {
                    temp = this.pippo.getContextByIndex(i).getObject();
                    if (temp.expand == 0) {
                        this.pippo.collapse(i);
                    }
                }
                oGlobalBusyDialog.close();
                this.FlagCollapseNotRelevant = 0;
            }
        },

        CollapseAll: function () {
            this.pippo = this.getView().byId("TreeTableBasic");
            this.pippo.collapseAll();
            this.AllExpanded = 0;
            var button = this.getView().byId("collapseButton");
            button.setEnabled(false);
        },

        ExpandAll: function () {
            this.pippo = this.getView().byId("TreeTableBasic");
            this.pippo.expandToLevel(100);
            this.AllExpanded = 1;
            var button = this.getView().byId("collapseButton");
            button.setEnabled(true);
        },

        ShowRelevant: function () {
            this.FlagCollapseNotRelevant = 1;
            this.CollapseNotRelevant();
            var button = this.getView().byId("collapseButton");
            button.setEnabled(false);
        },

        onAfterRendering: function () {
            this.CollapseNotRelevant();
        },

        FinePredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));
            this.FlagPresaInCarico = null;
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

        //        onAfterRendering: function () {
//            if (this.bool_expanded == true) {
////                this.PresaInCarico();
//                this.pippo = this.getView().byId("TreeTableBasic");
//                var that = this;
//                this.pippo.addEventDelegate(
//                        {onAfterRendering: function () {
//                                that.pippo = this.getView().byId("TreeTableBasic");
//                                that.onMiao();
//                            }
//                        });
//            }
//        },

        // fare expand e basta nell'after rendering e provare a vedere se funzia
//        onClick: function () {
//            this.PresaInCarico();
//            $(window.document).ready(this.onMiao());
////            this.getOwnerComponent().getRouter().navTo("PresaInCarico", {}, true);
//
//        },

        //        onExpandFirstLevel: function () {
//            var pippo = this.getView().byId("TreeTableBasic");
//            pippo.expandToLevel(100);
//            if (sap.ui.getCore().byId("PresaInCarico") !== null) {
//
//                sap.ui.getCore().byId("PresaInCarico").destroy();
//
//            } else {
//                this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
//            }
//            this.onMiao();
////            this.bool_expanded = true;
//        },


    });
    return TmpController;
});
