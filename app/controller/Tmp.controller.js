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
        View: null,
        total: null,
        oGlobalBusyDialog: new sap.m.BusyDialog(),

        onInit: function () {
            this.getSplitAppObj().toDetail(this.createId("Home"));
        },
        PresaInCarico: function () {
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.FillTreeTable("model/SKU.json", "TreeTable_PresaInCarico");
        },
        CollapseNotRelevant: function (TreeName) {

            this.View = this.getView().byId(TreeName);
            this.total = this.View._iBindingLength;
            var temp;
            for (var i = this.total - 1; i >= 0; i--) {
                temp = this.View.getContextByIndex(i).getObject();
                if (temp.expand == 0) {
                    this.View.collapse(i);
                }
            }
            this.oGlobalBusyDialog.close();
        },
        CollapseAll: function (event) {
            var name = event.getSource().data("mydata");
            this.View = this.getView().byId(name);
            this.View.collapseAll();
        },
        ExpandAll: function (event) {
            var name = event.getSource().data("mydata");
            this.View = this.getView().byId(name);
            this.View.expandToLevel(100);
        },
        ShowRelevant: function (event) {
            var name = event.getSource().data("mydata");
            this.View = this.getView().byId(name);
            this.View.expandToLevel(100);
            this.oGlobalBusyDialog.open();
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, name), 400);
        },
        FinePredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));

            this.FillTreeTable("model/SKU.json", "TreeTable_FinePredisposizione1");
            this.FillTreeTable("model/SKU.json", "TreeTable_FinePredisposizione2");
        },
        LinkClick: function (event) {
            var clicked_row = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_row.expand == 2 && clicked_column == 1) {
                alert(clicked_row.value);
            }
        },
        Expander: function (name) {
            this.View = this.getView().byId(name);
            this.View.expandToLevel(100);
        },
        FillTreeTable: function (model_path, TreeName) {
            this.oModel = new JSONModel(model_path);
            this.getView().setModel(this.oModel);
            this.View = this.getView().byId(TreeName);
            this.oGlobalBusyDialog.open();

            setTimeout(jQuery.proxy(this.Expander, this, TreeName), 200);
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, TreeName), 400);
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

    });
    return TmpController;
});
