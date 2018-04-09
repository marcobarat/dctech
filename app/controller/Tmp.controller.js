sap.ui.define([
    'jquery.sap.global',
    'sap/m/MessageToast',
    'sap/ui/core/routing/History',
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/json/JSONModel"
], function (jQuery, MessageToast, History, Controller, JSONModel) {
    "use strict";
    var TmpController = Controller.extend("myapp.controller.Tmp", {

//        TreeNames: { 
//            TreeTable_PresaInCarico:
//                    {
//                name:"TreeTable_PresaInCarico",
//                FlagCollapseNotRelevant:1
//            },
//        TreeTable_FinePredisposizione1: {name:"TreeTable_FinePredisposizione1", FlagCollapseNotRelevant:1},
//        { TreeTable_FinePredisposizione2: {name:"TreeTable_FinePredisposizione2", FlagCollapseNotRelevant:1}

//        }

        FlagCollapseNotRelevant_PresaInCarico: 1,

        oModel_PresaInCarico: null,
        View_PresaInCarico: null,
        total_PresaInCarico: null,
        FlagPresaInCarico: null,
        AllExpanded_PresaInCarico: 0,

        FlagFinePredisposizione1: null,
        oModel_FinePredisposizione1: null,
        View_FinePredisposizione1: null,
        total_FinePredisposizione1: null,
        AllExpanded_FinePredisposizione1: 0,
        FlagFinePredisposizione2: null,
        oModel_FinePredisposizione2: null,
        View_FinePredisposizione2: null,
        total_FinePredisposizione2: null,
        AllExpanded_FinePredisposizione2: 0,

        onInit: function () {
            this.getSplitAppObj().toDetail(this.createId("Home"));
            this.FlagPresaInCarico = null;
        },

        PresaInCarico: function () {
            if (this.FlagPresaInCarico == null) {

                this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
                this.oModel_PresaInCarico = new JSONModel("model/SKU.json");
                this.getView().setModel(this.oModel_PresaInCarico);
                this.View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
                this.View_PresaInCarico.expandToLevel(100);
                this.FlagPresaInCarico = 0;
                this.FlagCollapseNotRelevant_PresaInCarico = 1;
                this.FlagFinePredisposizione1 = null;
                this.FlagFinePredisposizione2 = null;
            }
        },
        CollapseNotRelevant: function () {
            if (this.FlagCollapseNotRelevant_PresaInCarico == 1 && this.View_PresaInCarico !== null) {
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                oGlobalBusyDialog.open();
                this.View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
                this.total = this.View_PresaInCarico._iBindingLength;
                var temp;
                for (var i = this.total - 1; i >= 0; i--) {
                    temp = this.View_PresaInCarico.getContextByIndex(i).getObject();
                    if (temp.expand == 0) {
                        this.View_PresaInCarico.collapse(i);
                    }
                }
                oGlobalBusyDialog.close();
                this.FlagCollapseNotRelevant_PresaInCarico = 0;
            }
        },
        CollapseAll_PresaInCarico: function () {
            this.View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
            this.View_PresaInCarico.collapseAll();
            this.AllExpanded_PresaInCarico = 0;
            var button = this.getView().byId("collapseButton");
            button.setEnabled(false);
        },
        ExpandAll_PresaInCarico: function () {
            this.View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
            this.View_PresaInCarico.expandToLevel(100);
            this.AllExpanded_PresaInCarico = 1;
            var button = this.getView().byId("collapseButton");
            button.setEnabled(true);
        },
        ShowRelevant_PresaInCarico: function () {
            this.FlagCollapseNotRelevant_PresaInCarico = 1;
            this.CollapseNotRelevant_PresaInCarico();
            var button = this.getView().byId("collapseButton");
            button.setEnabled(false);
        },
        FinePredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));
            this.FlagPresaInCarico = null;
            if (this.FlagFinePredisposizione1 == null) {

                this.oModel_FinePredisposizione1 = new JSONModel("model/SKU.json");
                this.getView().setModel(this.oModel_FinePredisposizione1);
                this.View_FinePredisposizione1 = this.getView().byId("TreeTable_FinePredisposizione1");
                this.View_FinePredisposizione1.expandToLevel(100);
                this.FlagFinePredisposizione1 = 0;
                this.FlagCollapseNotRelevant_FinePredisposizione1 = 1;
            }

            if (this.FlagFinePredisposizione2 == null) {

                this.oModel_FinePredisposizione2 = new JSONModel("model/SKU.json");
                this.getView().setModel(this.oModel_FinePredisposizione2);
                this.View_FinePredisposizione2 = this.getView().byId("TreeTable_FinePredisposizione2");
                this.View_FinePredisposizione2.expandToLevel(100);
                this.FlagFinePredisposizione2 = 0;
                this.FlagCollapseNotRelevant_FinePredisposizione2 = 1;
            }
        },
//        CollapseNotRelevant_FinePredisposizione1: function () {
//            if (this.FlagCollapseNotRelevant_FinePredisposizione1 == 1 && this.View_FinePredisposizione1 !== null) {
//                var oGlobalBusyDialog = new sap.m.BusyDialog();
//                oGlobalBusyDialog.open();
//                this.View_FinePredisposizione1 = this.getView().byId("TreeTable_FinePredisposizione1");
//                this.total = this.View_FinePredisposizione1._iBindingLength;
//                var temp;
//                for (var i = this.total - 1; i >= 0; i--) {
//                    temp = this.View_FinePredisposizione1.getContextByIndex(i).getObject();
//                    if (temp.expand == 0) {
//                        this.View_FinePredisposizione1.collapse(i);
//                    }
//                }
//                oGlobalBusyDialog.close();
//                this.FlagCollapseNotRelevant_FinePredisposizione1 = 0;
//            }
//        },
        CollapseAll_FinePredisposizione1: function () {
            this.View_FinePredisposizione1 = this.getView().byId("TreeTable_FinePredisposizione1");
            this.View_FinePredisposizione1.collapseAll();
            this.AllExpanded_FinePredisposizione1 = 0;
            var button = this.getView().byId("collapseButton_FinePredisposizione1");
            button.setEnabled(false);
        },
        ExpandAll_FinePredisposizione1: function () {
            this.View_FinePredisposizione1 = this.getView().byId("TreeTable_FinePredisposizione1");
            this.View_FinePredisposizione1.expandToLevel(100);
            this.AllExpanded_FinePredisposizione1 = 1;
            var button = this.getView().byId("collapseButton_FinePredisposizione1");
            button.setEnabled(true);
        },
        ShowRelevant_FinePredisposizione1: function () {
            this.FlagCollapseNotRelevant_FinePredisposizione1 = 1;
            this.CollapseNotRelevan_FinePredisposizione1();
            var button = this.getView().byId("collapseButton_FinePredisposizione1");
            button.setEnabled(false);
        },
//        CollapseNotRelevant_FinePredisposizione2: function () {
//            if (this.FlagCollapseNotRelevant_FinePredisposizione2 == 1 && this.View_FinePredisposizione2 !== null) {
//                var oGlobalBusyDialog = new sap.m.BusyDialog();
//                oGlobalBusyDialog.open();
//                this.View_FinePredisposizione2 = this.getView().byId("TreeTable_FinePredisposizione2");
//                this.total = this.View_FinePredisposizione2._iBindingLength;
//                var temp;
//                for (var i = this.total - 1; i >= 0; i--) {
//                    temp = this.View_FinePredisposizione2.getContextByIndex(i).getObject();
//                    if (temp.expand == 0) {
//                        this.View_FinePredisposizione2.collapse(i);
//                    }
//                }
//                oGlobalBusyDialog.close();
//                this.FlagCollapseNotRelevant_FinePredisposizione2 = 0;
//            }
//        },
        CollapseAll_FinePredisposizione2: function () {
            this.View_FinePredisposizione2 = this.getView().byId("TreeTable_FinePredisposizione2");
            this.View_FinePredisposizione2.collapseAll();
            this.AllExpanded_FinePredisposizione2 = 0;
            var button = this.getView().byId("collapseButton_FinePredisposizione2");
            button.setEnabled(false);
        },
        ExpandAll_FinePredisposizione2: function () {
            this.View_FinePredisposizione2 = this.getView().byId("TreeTable_FinePredisposizione2");
            this.View_FinePredisposizione2.expandToLevel(100);
            this.AllExpanded_FinePredisposizione2 = 1;
            var button = this.getView().byId("collapseButton_FinePredisposizione2");
            button.setEnabled(true);
        },
        ShowRelevant_FinePredisposizione2: function () {
            this.FlagCollapseNotRelevant_FinePredisposizione2 = 1;
            this.CollapseNotRelevan_FinePredisposizione2();
            var button = this.getView().byId("collapseButton_FinePredisposizione2");
            button.setEnabled(false);
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
//                this.View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
//                var that = this;
//                this.View_PresaInCarico.addEventDelegate(
//                        {onAfterRendering: function () {
//                                that.View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
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
//            var View_PresaInCarico = this.getView().byId("TreeTable_PresaInCarico");
//            View_PresaInCarico.expandToLevel(100);
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
