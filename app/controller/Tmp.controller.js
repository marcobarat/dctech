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

//      VARIABILI GLOBALI
        View: null,
        ModelBatch: null,
        ModelSetupOld: null,
        ModelSetupNew: null,
        ModelFaults: null,
        ModelFaultsNoCause: null,
        total: null,
        oGlobalBusyDialog: new sap.m.BusyDialog(),
        TabContainer: null,
        CheckFermo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        CheckSingoloCausa: [],
        CheckTotaleCausa: 0,
        id_split: null,
        discr: null,
        Item: null,
        TreeTable: null,
        Button: null,
        Panel: null,
//      NELL'ONINIT CARICO I VARI MODELLI E FACCIO TUTTE LE CHIAMATE AJAX

//------------------------------------------------------------------------------

        onInit: function () {

//          CARICAMENTO MODELLO DEL BATCH DI SEMILAVORATO
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
//          CARICAMENTO MODELLO DELL'ALLESTIMENTO LINEA PRECEDENTE
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
//          CARICAMENTO MODELLO DELL'ALLESTIMENTO LINEA CORRENTE
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
//          CARICAMENTO MODELLO DEI GUASTI AVVENUTI
            this.ModelFaults = new JSONModel({});
            this.getView().setModel(this.ModelFaults, "ModelFaults");
            this.ModelFaultsNoCause = new JSONModel({});
            this.getView().setModel(this.ModelFaultsNoCause, "ModelFaultsNoCause");
            param = {};
            req = jQuery.ajax({
                url: "model/guasti.json",
                data: param,
                method: "GET",
                dataType: "json",
                async: true,
                Selected: true
            });
            tempfunc = jQuery.proxy(this.FillModelFaults, this);
            req.done(tempfunc);
//            DA CANCELLARE
//            this.getView().byId("ButtonFinePredisposizione").setEnabled(false);
            this.getView().byId("ButtonModificaCondizioni").setEnabled(true);
            this.getView().byId("ButtonFermo").setEnabled(true);
            this.getView().byId("ButtonRiavvio").setEnabled(true);
            this.getView().byId("ButtonCausalizzazione").setEnabled(true);
            this.getView().byId("ButtonChiusuraConfezionamento").setEnabled(true);
        },
//        DI SEGUITO LE 4 FUNZIONI CHE CARICANO I MODELLI CON I JSON FILES
        FillModelBatch: function (data) {
            this.ModelBatch.setProperty("/", data);
        },
        FillModelSetupOld: function (data) {
            this.ModelSetupOld.setProperty("/", data);
        },
        FillModelSetupNew: function (data) {
            this.ModelSetupNew.setProperty("/", data);
        },
        FillModelFaults: function (data) {
            var dataAll = JSON.parse(JSON.stringify(data));
            var dataReduced = JSON.parse(JSON.stringify(data));
            dataAll = this.AddTimeGaps(dataAll);
            this.ModelFaults.setProperty("/", dataAll);
            dataReduced = this.RemoveCaused(dataReduced);
            dataReduced = this.AddTimeGaps(dataReduced);
            this.ModelFaultsNoCause.setProperty("/", dataReduced);
        },
//------------------------------------------------------------------------------


//        RICHIAMATO DAL BOTTONE "PRESA IN CARICO NUOVO CONFEZIONAMENTO"
        PresaInCarico: function () {
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.FillTable(this.ModelBatch, "TreeTable_PresaInCarico");
        },
//        RICHIAMATO DAL BOTTONE "CONFERMA" NELLA SCHERMATA DI PRESA IN CARICO
//          Questa funzione assegna i modelli alle TreeTables, rimuove la possibilità di
//          chiudere le tabs e imposta il colore giallo al pannello laterale.
        ConfermaBatch: function () {
            this.getSplitAppObj().toDetail(this.createId("ConfermaBatch"));
            this.FillTable(this.ModelBatch, "TreeTable_AttributiPredisposizione");
            this.FillTable(this.ModelSetupOld, "TreeTable_ConfermaSetupOld");
            this.FillTable(this.ModelSetupNew, "TreeTable_ConfermaSetupNew");
            this.getView().byId("panel_processi").addStyleClass("stylePanelYellow");
            this.getView().byId("ButtonPresaInCarico").setEnabled(false);
            this.getView().byId("ButtonFinePredisposizione").setEnabled(true);
            this.TabContainer = this.getView().byId("TabContainer");
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
//      RICHIAMATO QUANDO VIENE CLICCATO UN TESTO DI TIPO LINK
//        Questa funzione controlla in quale riga/colonna si è cliccato e, se
//        c'è un link, lancia l'evento di creare una nuova tab chiudible con al
//        momento un'immagine.
        LinkClick: function (event) {
            var clicked_row = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_row.expand == 2 && clicked_column == 1) {
                this.TabContainer = this.getView().byId("TabContainer");
                var Item = new sap.m.TabContainerItem();
//                var Item = new sap.m.TabContainerItem({id: this.nextTab});
//                this.openedTabs.push(this.nextTab);
//                this.nextTab = this.NewTabName(this.nextTab);
                Item.setName(clicked_row.value);
                var image = new sap.m.Image();
                image.setSrc("img/dececco.jpg");
                image.setWidth("60%");
                Item.addContent(image);
                this.TabContainer.addItem(Item);
                this.TabContainer.setSelectedItem(Item);
            }
        },
//------------------------------------------------------------------------------
//        
//        
//        RICHIAMATO DAL PULSANTE "FINE PREDISPOSIZIONE INIZIO CONFEZIONAMENTO"
//          Questa funzione chiude innanzitutto tutte le tabs chiudibili e crea una nuova tab
//          nella quale viene messa la TreeTabledi fine predisposizione ed il bottone
//          di conferma. Alla fine aggiunge il tab al tab container e rimuove tutti i
//          pulsanti che possono chiudere le tabs.
        FinePredisposizione: function () {

            this.TabContainer = this.getView().byId("TabContainer");
            var length = this.TabContainer.getItems().length;
            var array = [];
            for (var i = 2; i < length; i++) {
                array.push(this.TabContainer.getItems()[i]);
            }
            for (i = 0; i < array.length; i++) {
                this.TabContainer.removeItem(array[i]);
            }
//            this.openedTabs = [];
//
//            this.openedTabs.push("tab3");

            if (!this.Item) {
                this.Item = new sap.m.TabContainerItem({
                    id: "tab3"});
            }
            this.Item.setName("Conferma predisposizione");
            if (!this.Panel) {
                this.Panel = new sap.m.Panel();
            }
            if (!this.TreeTable) {
                this.TreeTable = new CustomTreeTable({
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
            }
            if (!this.Button) {
                this.Button = new sap.m.Button({
                    text: "Conferma",
                    width: "100%",
                    press: [this.ConfermaPredisposizione, this]});
                this.Panel.addContent(this.TreeTable);
                this.Panel.addContent(this.Button);
            }


            this.Item.addContent(this.Panel);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.FillTable(this.ModelSetupNew, "TreeTable_FinePredisposizione");
            var that = this;
            setTimeout(function () {
                var oTabStrip = that.TabContainer.getAggregation("_tabStrip");
                var oItems = oTabStrip.getItems();
                for (var i = 0; i < 3; i++) {
                    var oCloseButton = oItems[i].getAggregation("_closeButton");
                    oCloseButton.setVisible(false);
                }
            }, 0);
        },
//      RICHIAMATO DAL PULSANTE CONFERMA ALLA FINE DELLA PREDISPOSIZIONE
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
//------------------------------------------------------------------------------

//      RICHIAMATO DAL PULSANTONE VERDE A FIANCO DELLA PROGRESS BAR
        SPCGraph: function () {
            alert("Grafico SPC");
        },
//------------------------------------------------------------------------------
//      
//      RICHIAMATO DAL PULSANTE "MODIFICA CONDIZIONI OPERATIVE"
//          Questa funzione permette dimodificare le condizioni operative in corso d'opera
        ModificaCondizioni: function () {
            this.ModelSetupNew = this.getView().getModel("ModelSetupNew");
            this.getSplitAppObj().toDetail(this.createId("ModificaCondizioni"));
            this.FillTable(this.ModelBatch, "TreeTable_AttributiModifica");
            this.FillTable(this.ModelSetupNew, "TreeTable_ModificaCondizioni");
            this.TabContainer = this.getView().byId("TabContainer-mod");
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
            this.Item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(this.Item);
        },
//      RICHIAMATO DAL PULSANTE DI CONFERMA NELLE MODIFICHE
        ConfermaModifica: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
        },
//------------------------------------------------------------------------------

//      RICHIAMATO DAL PULSANTE "FERMO"
        Fermo: function (event) {
            this.getSplitAppObj().toDetail(this.createId("Fermo"));
            this.discr = event.getParameters().id;
            if (this.discr.indexOf("ButtonFermo") > -1) {
                this.Item = {};
                var now = new Date();
                this.Item.inizio = this.DateToStandard(now);
            }
        },
//      FUNZIONE CHE GESTISCE LA SELEZIONE DEI CHECKBOX
        ChangeCheckedFermo: function (event) {
            var id = event.getSource().getId();
            var root_name = "CBFermo";
            this.id_split = this.SplitId(id, root_name);
            var old_index = this.CheckFermo.indexOf(1);
            if (old_index > -1) {
                var old_CB = this.getView().byId(this.id_split[0] + root_name + String(old_index + 1));
                old_CB.setSelected(false);
                this.CheckFermo[old_index] = 0;
            }
            if (old_index !== this.id_split[2] - 1) {
                this.CheckFermo[this.id_split[2] - 1] = 1;
            }
            var selected_index = this.CheckFermo.indexOf(1);
            var button = this.getView().byId("ConfermaFermo");
            if (selected_index > -1) {
                button.setEnabled(true);
            } else {
                button.setEnabled(false);
            }
        },
//      RICHIAMATO DAL PULSANTE DI CONFERMA NEL FERMO
        ConfermaFermo: function () {
            var CB = this.getView().byId(this.id_split[0] + this.id_split[1]);
            if (this.discr.indexOf("ButtonFermo") > -1) {
                this.Item.causa = CB.getProperty("text");
                this.getView().byId("panel_processi").addStyleClass("stylePanelRed");
                this.getSplitAppObj().toDetail(this.createId("Fault"));
                this.getView().byId("ButtonPresaInCarico").setEnabled(false);
                this.getView().byId("ButtonFinePredisposizione").setEnabled(false);
                this.getView().byId("ButtonModificaCondizioni").setEnabled(false);
                this.getView().byId("ButtonFermo").setEnabled(false);
                this.getView().byId("ButtonRiavvio").setEnabled(true);
                this.getView().byId("ButtonCausalizzazione").setEnabled(false);
                this.getView().byId("ButtonChiusuraConfezionamento").setEnabled(true);
            } else {
                var data = this.ModelFaultsNoCause.getData();
                var data_All = this.ModelFaults.getData();
                for (var i in this.CheckSingoloCausa) {
                    if (this.CheckSingoloCausa[i] > 0) {
                        data.guasti[i].causa = CB.getProperty("text");
                        for (var j in data_All.guasti) {
                            if (data.guasti[i].inizio === data_All.guasti[j].inizio) {
                                data_All.guasti[j].causa = CB.getProperty("text");
                                break;
                            }
                        }
                    }
                }
                this.ModelFaultsNoCause.setProperty("/", data);
                this.ModelFaults.setProperty("/", data_All);
                this.UpdateFaultsModels();
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
            }
        },
//------------------------------------------------------------------------------

//      RICHIAMATO DAL PULSANTE "RIAVVIO"
        Riavvio: function () {
            this.FillTable(this.ModelSetupNew, "TreeTable_RipristinoCondizioni");
            this.getSplitAppObj().toDetail(this.createId("RipristinoCondizioni"));
            var now = new Date();
            this.Item.fine = this.DateToStandard(now);
            this.AggiornaGuasti();
        },
//      FUNZIONE CHE AGGIORNA IL MODELLO DEI GUASTI
        AggiornaGuasti: function () {
            this.Item.intervallo = this.MillisecsToStandard(this.StandardToMillisecs(this.Item.fine) - this.StandardToMillisecs(this.Item.inizio));
            var faults = this.ModelFaults.getData();
            faults.Totale.tempoGuastoTotale[0] = this.MillisecsToStandard(this.StandardToMillisecs(faults.Totale.tempoGuastoTotale[0]) + this.StandardToMillisecs(this.Item.intervallo));
            faults.guasti.push(this.Item);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        ConfermaRipristino: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            this.getView().byId("ButtonModificaCondizioni").setEnabled(true);
            this.getView().byId("ButtonFermo").setEnabled(true);
            this.getView().byId("ButtonRiavvio").setEnabled(false);
            this.getView().byId("ButtonCausalizzazione").setEnabled(true);
            this.getView().byId("ButtonChiusuraConfezionamento").setEnabled(true);
            this.getView().byId("panel_processi").addStyleClass("stylePanelGreen");
        },

//------------------------------------------------------------------------------
//      
//      RICHIAMATO DAL PULSANTE "CAUSALIZZAZIONE FERMI AUTOMATICI"
        Causalizzazione: function () {
            this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));
            this.FillTable(this.ModelFaultsNoCause, "TotaleTable");
            this.FillTable(this.ModelFaultsNoCause, "SingoliTable");
            this.CheckSingoloCausa = [];
            for (var i in this.ModelFaultsNoCause.getData().guasti) {
                this.CheckSingoloCausa.push(0);
            }
            this.getView().byId("TotaleTable").setSelectionMode(sap.ui.table.SelectionMode.None);
            this.getView().byId("SingoliTable").setSelectionMode(sap.ui.table.SelectionMode.None);
        },
//      FUNZIONE CHE GESTISCE LA SELEZIONE DEI CHECKBOX
        ChangeCheckedCausa: function (event) {
            var id = event.getSource().getId();
            var CB = this.getView().byId(id);
            var root_name_totale = "CBTotaleCausa";
            var i, temp_id;
            if (id.indexOf(root_name_totale) > -1) {
                for (i in this.CheckSingoloCausa) {
                    temp_id = this.getView().byId("SingoliTable").getAggregation("rows")[i].getAggregation("cells")[4].getId();
                    this.getView().byId(temp_id).setSelected(CB.getSelected());
                    this.getView().byId(temp_id).setEnabled(!CB.getSelected());
                }
                if (CB.getSelected()) {
                    this.CheckTotaleCausa = 1;
                    for (i in this.CheckSingoloCausa) {
                        this.CheckSingoloCausa[i] = 1;
                    }
                } else {
                    this.CheckTotaleCausa = 0;
                    for (i in this.CheckSingoloCausa) {
                        this.CheckSingoloCausa[i] = 0;
                    }
                }
            } else {
                var discr_id = event.getSource().getParent().getId();
                for (i in this.CheckSingoloCausa) {
                    temp_id = event.getSource().getParent().getParent().getAggregation("rows")[i].getId();
                    if (discr_id === temp_id) {
                        break;
                    }
                }
                if (CB.getSelected()) {
                    this.CheckSingoloCausa[i] = 1;
                } else {
                    this.CheckSingoloCausa[i] = 0;
                }
            }
            temp_id = 0;
            temp_id += this.CheckTotaleCausa;
            for (i in this.CheckSingoloCausa) {
                temp_id += this.CheckSingoloCausa[i];
            }
            if (temp_id > 0) {
                this.getView().byId("ConfermaCausalizzazione").setEnabled(true);
            } else {
                this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
            }
        },
//      RICHIAMATO DAL PULSANTE DI ESCI NELLA CAUSALIZZAZIONE
        EsciCausalizzazione: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
        },
//      FUNZIONE CHE AGGIORNA I MODELLI DEI GUASTI
        UpdateFaultsModels: function () {
            var data_NOcause = this.ModelFaultsNoCause.getData();
            for (var i = data_NOcause.guasti.length - 1; i >= 0; i--) {
                var temp_item = data_NOcause.guasti[i];
                if (temp_item.causa !== "") {
                    data_NOcause.guasti.splice(i, 1);
                    data_NOcause.Totale.tempoGuastoTotale[0] = this.MillisecsToStandard(this.StandardToMillisecs(data_NOcause.Totale.tempoGuastoTotale[0]) - this.StandardToMillisecs(temp_item.intervallo));
                }
            }
            this.ModelFaultsNoCause.setProperty("/", data_NOcause);
        },
//------------------------------------------------------------------------------


//      !!!!!  FUNZIONI CONDIVISE DA PIU' FRAMES  !!!!!

//      FUNZIONI CHE AGISCONO SUL FRONT-END

//      Funzione che collassa tutti i nodi della treetable
        CollapseAll: function (event) {
            var name = event.getSource().data("mydata");
            this.View = this.getView().byId(name);
            this.View.collapseAll();
        },
//      Funzione che espande tutti i nodi della treetable
        ExpandAll: function (event) {
            var name = event.getSource().data("mydata");
            this.View = this.getView().byId(name);
            this.View.expandToLevel(100);
        },
//      Funzione richiamata da "non conformi" che prima espande tutti i nodi della treetable e poi richiude i non rilevanti 
        ShowRelevant: function (event) {
            var name = event.getSource().data("mydata");
            this.View = this.getView().byId(name);
            this.View.expandToLevel(100);
            this.oGlobalBusyDialog.open();
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, name), 400);
        },
//      Funzione che collassa i nodi della treetable non rilevanti
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
//      FUNZIONI CHE AGISCONO INTERNAMENTE

//      Funzione che va ad associare il modello alla rispettiva treetable
        FillTable: function (model, TableName) {
            this.getView().setModel(model, TableName);
//            this.View = this.getView().byId(TableName);
//            this.oGlobalBusyDialog.open();
//            setTimeout(jQuery.proxy(this.Expander, this, TreeName), 200);
//            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, TreeName), 400);
        },
//      Funzione che calcola il time gap di tutti i guasti e li ritorna come array
        AddTimeGaps: function (data) {
            var millisec_diff = [];
            var start, end;
            for (var iter in data.guasti) {
                start = new Date(data.guasti[iter].inizio);
                end = new Date(data.guasti[iter].fine);
                millisec_diff.push(end - start);
                data.guasti[iter].inizio = this.DateToStandard(start);
                data.guasti[iter].fine = this.DateToStandard(end);
            }
            var temp;
            var sum = 0;
            var arrayGaps = [];
            for (iter in millisec_diff) {
                temp = millisec_diff[iter];
                sum += temp;
                arrayGaps.push(this.MillisecsToStandard(temp));
            }
            for (var i = 0; i < arrayGaps.length; i++) {
                data.guasti[i].intervallo = arrayGaps[i];
            }
            data.Totale = {};
            data.Totale.tempoGuastoTotale = [this.MillisecsToStandard(sum)];
            data.Totale.causaleTotale = [""];
            return data;
        },
//        Funzione che rimuove l'offset del giorno in millisecondi
//        DateToMillisecNoOffset: function(date) {
//            var year = date.getFullYear();
//            var month = date.getMonth();
//            var day = date.getDate();
//            var offset = new Date(year,month,day).getTime();
//            return (date.getTime() - offset);
//        },
//      Funzione che estrae il formato standard dal formato ISO
        DateToStandard: function (date) {
            var hours = this.StringTime(date.getHours());
            var mins = this.StringTime(date.getMinutes());
            var secs = this.StringTime(date.getSeconds());
            return (hours + ":" + mins + ":" + secs);
        },
//      Funzione che converte orario HH:MM:SS in millisecondi 
        StandardToMillisecs: function (val) {
            var hours = Number(val.substring(0, 2));
            var mins = Number(val.substring(3, 5));
            var secs = Number(val.substring(6, 8));
            return ((secs * 1000) + (mins * 60 * 1000) + (hours * 60 * 60 * 1000));
        },
//      Funzione che converte millisecondi in orario HH:MM:SS
        MillisecsToStandard: function (val) {
            var hours = Math.floor(val / 1000 / 60 / 60);
            val -= hours * 1000 * 60 * 60;
            var mins = Math.floor(val / 1000 / 60);
            val -= mins * 1000 * 60;
            var secs = Math.floor(val / 1000);
            val -= secs * 1000;
            var string_hours, string_mins, string_secs;
            if (val !== 0) {
                console.log("C'è un problema");
            } else {
                string_hours = this.StringTime(hours);
                string_mins = this.StringTime(mins);
                string_secs = this.StringTime(secs);
            }
            return (string_hours + ":" + string_mins + ":" + string_secs);
        },
//      Funzione che aggiunge uno zero se ore, minuti o secondi sono < 10
        StringTime: function (val) {
            if (val < 10) {
                return  ('0' + String(val));
            } else {
                return  String(val);
            }
        },
//      Funzione che converte orario nel formato ISO
        FormatDateISO: function (date) {
            var year = this.StringTime(date.getFullYear());
            var month = this.StringTime(date.getMonth() + 1);
            var day = this.StringTime(date.getDate());
            var hours = this.StringTime(date.getHours());
            var mins = this.StringTime(date.getMinutes());
            var secs = this.StringTime(date.getSeconds());
            return (year + "-" + month + "-" + day + "T" + hours + ":" + mins + ":" + secs);
        },
//      Funzione che rimuove i guasti non causalizzati
        RemoveCaused: function (data) {
            for (var i = data.guasti.length - 1; i >= 0; i--) {
                if (data.guasti[i].causa !== "") {
                    data.guasti.splice(i, 1);
                }
            }
            return data;
        },
//      Funzione per splittare l'id da XML
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
        },
//      Funzione che permette di cambiare pagina nello SplitApp
        getSplitAppObj: function () {
            var result = this.byId("SplitAppDemo");
            if (!result) {
                jQuery.sap.log.info("SplitApp object can't be found");
            }
            return result;
        },
//      Funzione pèr tornare alla scheda precedente
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
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

////      Genera il nuovo nome da mettere alle tab aperte in modo da non avere 
//        NewTabName: function (string) {
//            var next_num = Number(string.substring(3, string.length)) + 1;
//            return "tab" + next_num;
//        },
//        
////      Quando viene chiusa un tab, viene rimosso il suo ID da questo array
//        UpdateTabs: function (event) {
//            var id_tab = event.getSource().getSelectedItem();
//            var index = this.openedTabs.indexOf(id_tab);
//            if (index > -1) {
//                this.openedTabs.splice(index, 1);
//            }
//        },

//        Expander: function (name) {
//            this.View = this.getView().byId(name);
//            this.View.expandToLevel(100);
//        },

    });
    return TmpController;
}
);
