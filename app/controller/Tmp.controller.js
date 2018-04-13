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
        ModelBatch: null,
        ModelSetupOld: null,
        ModelSetupNew: null,
        total: null,
        oGlobalBusyDialog: new sap.m.BusyDialog(),
        onInit: function () {
            this.getSplitAppObj().toDetail(this.createId("Home"));
            this.ModelBatch = new JSONModel({});
            this.getView().setModel(this.ModelBatch, "ModelBatch");
            var param = {};
            var req = jQuery.ajax({
                url: "model/SKU.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            var tempfunc = jQuery.proxy(this.FillModelBatch, this);
            req.done(tempfunc);


            this.ModelSetupOld = new JSONModel({});
            this.getView().setModel(this.ModelSetupOld, "ModelSetupOld");
            param = {};
            req = jQuery.ajax({
                url: "model/allestimentoOld.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            tempfunc = jQuery.proxy(this.FillModelSetupOld, this);
            req.done(tempfunc);


            this.ModelSetupNew = new JSONModel({});
            this.getView().setModel(this.ModelSetupNew, "ModelSetupNew");
            param = {};
            req = jQuery.ajax({
                url: "model/allestimentoNew.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            tempfunc = jQuery.proxy(this.FillModelSetupNew, this);
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
            this.FillTreeTable(this.ModelBatch, "TreeTable_PresaInCarico");
        },
        FillModelBatch: function (data) {
            this.ModelBatch.setProperty("/", data);
        },
        FillModelSetupOld: function (data) {
            this.ModelSetupOld.setProperty("/", data);
        },
        FillModelSetupNew: function (data) {
            this.ModelSetupNew.setProperty("/", data);
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
            this.FillTreeTable(this.ModelBatch, "TreeTable_PresaInCarico1");
            this.FillTreeTable(this.ModelSetupOld, "TreeTable_ConfermaSetupOld");
            this.FillTreeTable(this.ModelSetupNew, "TreeTable_ConfermaSetupNew");
            this.getView().byId("panel_processi").addStyleClass("stylePanelYellow");
            this.getView().byId("ButtonPresaInCarico").setEnabled(false);
            this.getView().byId("ButtonFinePredisposizione").setEnabled(true);

            var oTabContainer = this.getView().byId("TabContainer");
            oTabContainer.addEventDelegate({
                onAfterRendering: function () {
                    var oTabStrip = this.getAggregation("_tabStrip");
                    var oItems = oTabStrip.getItems();
                    for (var i = 0; i < 2; i++) {
                        var oCloseButton = oItems[i].getAggregation("_closeButton");
                        oCloseButton.setVisible(false);
                    }
                }
            }, oTabContainer);
        },
        LinkClick: function (event) {
            var clicked_row = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_row.expand == 2 && clicked_column == 1) {
                var tabContainer = this.getView().byId("TabContainer");
                var Item = new sap.m.TabContainerItem();
                Item.setName(clicked_row.value);
                var image = new sap.m.Image();
                image.setSrc("img/dececco.jpg");
                image.setWidth("60%");
                Item.addContent(image);
                tabContainer.addItem(Item);
                tabContainer.setSelectedItem(Item);
            }
        },

//        onItemSelected: function (event) {
//            var container = this.getView().byId("TabContainer");
//            var nameSelected = container.getSelectedItem();
//            var length = container.getItems().length;
//            var sId0 = container.getItems()[0].sId;
//            var sId1 = container.getItems()[1].sId;
//            if (sIdSelected == sId0 || sIdSelected == sId1) {
////                for (var i = length-1;i > 1; i++) {
////                    this.getView().byId("TabContainer").removeItem(container.getItems()[i]);
////                }
//            }
//        },

        FinePredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));
            this.FillTreeTable(this.ModelSetupNew, "TreeTable_FinePredisposizione");
        },
        ConfermaPredisposizione: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            this.getView().byId("panel_processi").addStyleClass("stylePanelGreen");
//            this.getView().byId("progressBar").addStyleClass("customText");
//            this.getView().byId("ButtonFinePredisposizione").setEnabled(false);
//            this.getView().byId("ButtonModificaCondizioni").setEnabled(true);
//            this.getView().byId("ButtonFermo").setEnabled(true);
//            this.getView().byId("ButtonRiavvio").setEnabled(true);
//            this.getView().byId("ButtonCausalizzazione").setEnabled(true);
//            this.getView().byId("ButtonChiusuraConfezionamento").setEnabled(true);
        },
        ModificaCondizioni: function () {
            this.ModelSetupNew = this.getView().getModel("ModelSetupNew");
            this.getSplitAppObj().toDetail(this.createId("ModificaCondizioni"));
            this.FillTreeTable(this.ModelSetupNew, "TreeTable_ModificaCondizioni");
        },
        ConfermaModifica: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
        },
        SPCGraph: function () {
            alert("Grafico SPC");
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
