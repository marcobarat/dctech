sap.ui.define([
    'jquery.sap.global',
    'sap/m/MessageToast',
    'sap/ui/core/routing/History',
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/json/JSONModel"
], function (jQuery, MessageToast, History, Controller, JSONModel) {
    "use strict";
    var TmpController = Controller.extend("myapp.controller.Tmp", {

        View: null,
        ModelBatchOld: null,
        ModelBatchNew: null,
        ModelSetup: null,
        total: null,
        oGlobalBusyDialog: new sap.m.BusyDialog(),

        onInit: function () {
            this.getSplitAppObj().toDetail(this.createId("Home"));

            this.ModelBatchOld = new JSONModel({});
            this.getView().setModel(this.ModelBatchOld, "ModelBatchOld");
            var param = {};
            var req = jQuery.ajax({
                url: "model/SKU.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            var tempfunc = jQuery.proxy(this.FillModelBatchOld, this);
            req.done(tempfunc);

            this.ModelBatchNew = new JSONModel({});
            this.getView().setModel(this.ModelBatchNew, "ModelBatchNew");
            param = {};
            req = jQuery.ajax({
                url: "model/SKU_1.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            tempfunc = jQuery.proxy(this.FillModelBatchNew, this);
            req.done(tempfunc);

            this.ModelSetup = new JSONModel({});
            this.getView().setModel(this.ModelSetup, "ModelSetup");
            param = {};
            req = jQuery.ajax({
                url: "model/allestimento.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            tempfunc = jQuery.proxy(this.FillModelSetup, this);
            req.done(tempfunc);


//            DA CANCELLARE
//            this.getView().byId("ButtonFinePredisposizione").setEnabled(false);
            this.getView().byId("ButtonModificaCondizioni").setEnabled(true);
            this.getView().byId("ButtonFermo").setEnabled(true);
            this.getView().byId("ButtonRiavvio").setEnabled(true);
            this.getView().byId("ButtonCausalizzazione").setEnabled(true);
            this.getView().byId("ButtonChiusuraConfezionamento").setEnabled(true);
        },
        PresaInCarico: function () {
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.FillTreeTable(this.ModelBatchNew, "TreeTable_PresaInCarico");
        },
        FillModelBatchOld: function (data) {
            this.ModelBatchOld.setProperty("/", data);
        },
        FillModelBatchNew: function (data) {
            this.ModelBatchNew.setProperty("/", data);
        },
        FillModelSetup: function (data) {
            this.ModelSetup.setProperty("/", data);
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
        ConfermaBatch: function () {
            this.getSplitAppObj().toDetail(this.createId("ConfermaBatch"));
            this.FillTreeTable(this.ModelBatchNew, "TreeTable_ConfermaBatchOld");
            this.FillTreeTable(this.ModelBatchOld, "TreeTable_ConfermaBatchNew");
//            document.getElementById('panel_processi').classList.add('stylePanelYellow');
            this.getView().byId("panel_processi").addStyleClass("stylePanelYellow");
            this.getView().byId("ButtonPresaInCarico").setEnabled(false);
            this.getView().byId("ButtonFinePredisposizione").setEnabled(true);
        },
        LinkClick: function (event) {
            var clicked_row = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_row.expand == 2 && clicked_column == 1) {
                alert(clicked_row.value);
            }
        },

        FinePredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));
            this.FillTreeTable(this.ModelSetup, "TreeTable_FinePredisposizione");
        },

        ConfermaPredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            this.getView().byId("panel_processi").addStyleClass("stylePanelGreen");
//            this.getView().byId("ButtonFinePredisposizione").setEnabled(false);
//            this.getView().byId("ButtonModificaCondizioni").setEnabled(true);
//            this.getView().byId("ButtonFermo").setEnabled(true);
//            this.getView().byId("ButtonRiavvio").setEnabled(true);
//            this.getView().byId("ButtonCausalizzazione").setEnabled(true);
//            this.getView().byId("ButtonChiusuraConfezionamento").setEnabled(true);
        },

        ModificaCondizioni: function () {
            this.ModelSetup = this.getView().getModel("ModelSetup");
            this.getSplitAppObj().toDetail(this.createId("ModificaCondizioni"));
            this.FillTreeTable(this.ModelSetup, "TreeTable_ModificaCondizioni");
        },

        ConfermaModifica: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
        },

        Expander: function (name) {
            this.View = this.getView().byId(name);
            this.View.expandToLevel(100);
        },
        FillTreeTable: function (model, TreeName) {
            this.getView().setModel(model, TreeName);
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
