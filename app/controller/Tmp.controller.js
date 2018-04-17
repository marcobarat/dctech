sap.ui.define([
    'jquery.sap.global',
    'sap/m/MessageToast',
    'sap/ui/core/routing/History',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/StyleInputTreeTableValue',
    'myapp/control/CustomTreeTable'
], function (jQuery, MessageToast, History, Controller, JSONModel, StyleInputTreeTableValue, CustomTreeTable) {
    "use strict";
    var TmpController = Controller.extend("myapp.controller.Tmp", {

        View: null,
        ModelBatch: null,
        ModelSetupOld: null,
        ModelSetupNew: null,
        total: null,
        oGlobalBusyDialog: new sap.m.BusyDialog(),
        TabContainer: null,
        openedTabs: null,
        nextTab: null,

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
//            data.array = this.ExpandArray(data);
            this.ModelBatch.setProperty("/", data);
        },
        FillModelSetupOld: function (data) {
//            data.array = this.ExpandArray(data);
            this.ModelSetupOld.setProperty("/", data);
        },
        FillModelSetupNew: function (data) {
//            data.array = this.ExpandArray(data);
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

            this.TabContainer = this.getView().byId("TabContainer");

//            setTimeout(function () {
//                var oTabStrip = that.getAggregation("_tabStrip");
//                var oItems = oTabStrip.getItems();
//                for (var i = 0; i < 2; i++) {
//                    var oCloseButton = oItems[i].getAggregation("_closeButton");
//                    oCloseButton.setVisible(false);
//                }
//            }, 0);

            var that = this;
            setTimeout(function () {
                var oTabStrip = that.TabContainer.getAggregation("_tabStrip");
                var oItems = oTabStrip.getItems();
                for (var i = 0; i < 2; i++) {
                    var oCloseButton = oItems[i].getAggregation("_closeButton");
                    oCloseButton.setVisible(false);
                }
            }, 0);

            this.TabContainer.getAggregation("_tabStrip").getAggregation("_select").setVisible(false);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
            this.openedTabs = [];
            this.nextTab = "tab4";

        },
        LinkClick: function (event) {
            var clicked_row = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_row.expand == 2 && clicked_column == 1) {
                var tabContainer = this.getView().byId("TabContainer");
                var Item = new sap.m.TabContainerItem({id: this.nextTab});
                this.openedTabs.push(this.nextTab);
                this.nextTab = this.NewTabName(this.nextTab);
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
//            this.getSplitAppObj().toDetail(this.createId("FinePredisposizione"));
            this.TabContainer = this.getView().byId("TabContainer");
            var length = this.TabContainer.getItems().length;
            var array = [];
            for (var i = 0; i < length; i++) {
                var id = this.TabContainer.getItems()[i].getId();
                if (this.openedTabs.indexOf(id) > -1) {
                    var item = this.TabContainer.getItems()[i];
                    array.push(item);
                }
            }
            for (i = 0; i < array.length; i++) {
                this.TabContainer.removeItem(array[i]);
            }
            this.openedTabs = [];
            var that = this;
            setTimeout(function () {
                var oTabStrip = that.TabContainer.getAggregation("_tabStrip");
                var oItems = oTabStrip.getItems();
                for (var i = 0; i < 3; i++) {
                    var oCloseButton = oItems[i].getAggregation("_closeButton");
                    oCloseButton.setVisible(false);
                }
            }, 0);
            
            this.openedTabs.push("tab3");
            var Item = new sap.m.TabContainerItem({
                id: "tab3"});
            Item.setName("Conferma predisposizione");
            var Panel = new sap.m.Panel();
            var TreeTable = new CustomTreeTable({
                id: "TreeTable_FinePredisposizione",
                rows: "{path:'TreeTable_FinePredisposizione>/', parameters: {arrayNames:['attributi']}}",
                selectionMode: "MultiToggle",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 10,
                columns: [
                    new sap.ui.table.Column({
                        label: "Attributi",
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{TreeTable_FinePredisposizione>name}"})}),
                    new sap.ui.table.Column({
                        label: "Valore",
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{TreeTable_FinePredisposizione>value}"})}),
                    new sap.ui.table.Column({
                        label: "Modifica",
                        width: "5rem",
                        template: new StyleInputTreeTableValue({
                            value: "{= ${TreeTable_FinePredisposizione>modify} === '1' ? ${TreeTable_FinePredisposizione>value}: ''}",
                            diff: "{TreeTable_FinePredisposizione>modify}",
                            editable: "{= ${TreeTable_FinePredisposizione>modify} === '1'}"})}),
                    new sap.ui.table.Column({
                        label: "Sigle",
                        width: "5rem",
                        template: new sap.m.Input({
                            placeholder: "{= ${TreeTable_FinePredisposizione>code} === '1' ? ${TreeTable_FinePredisposizione>codePlaceholder}: ''}",
                            editable: "{= ${TreeTable_FinePredisposizione>code} === '1'}",
                            value: "{TreeTable_FinePredisposizione>codeValue}"})})
                ]
            });
            Panel.addContent(TreeTable);
            var Button = new sap.m.Button({
                text: "Conferma",
                width: "100%",
                press: [this.ConfermaPredisposizione, this]});
            Panel.addContent(Button);
            Item.addContent(Panel);
            this.TabContainer.addItem(Item);
            this.TabContainer.setSelectedItem(Item);
            this.FillTreeTable(this.ModelSetupNew, "TreeTable_FinePredisposizione");
        },
        NewTabName: function (string) {
            var next_num = Number(string.substring(3, string.length)) + 1;
            return "tab" + next_num;
        },
        UpdateTabs: function (event) {
            var id_tab = event.getSource().getSelectedItem();
            var index = this.openedTabs.indexOf(id_tab);
            if (index > -1) {
                this.openedTabs.splice(index, 1);
            }
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
//        Expander: function (name) {
//            this.View = this.getView().byId(name);
//            this.View.expandToLevel(100);
//        },
        FillTreeTable: function (model, TreeName) {
            this.getView().setModel(model, TreeName);
            this.View = this.getView().byId(TreeName);
//            this.oGlobalBusyDialog.open();
//            setTimeout(jQuery.proxy(this.Expander, this, TreeName), 200);
//            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, TreeName), 400);
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

//        ExpandArray: function (JSON_file) {
//            var array = [];
//            var temp;
//            for (var key in JSON_file) {
//                temp = JSON_file[key];
//                if (typeof temp.expand != "undefined") {
//                    array.push(temp.expand);
//                }
//                if (typeof JSON_file[key] === "object") {
//                    var subarray = this.ExpandArray(JSON_file[key]);
//                    array = array.concat(subarray);
//                }
//            }
//            return array;
//        }

    });

    return TmpController;
}
);
    