sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/routing/History',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/StyleInputTreeTableValue',
    'myapp/control/CustomTreeTable',
    'sap/m/MessageToast'
], function (jQuery, History, Controller, JSONModel, StyleInputTreeTableValue, CustomTreeTable, MessageToast) {
    "use strict";
    var TmpController = Controller.extend("myapp.controller.Operatore", {

//      VARIABILI GLOBALI
        Global: null,
        ModelDetailPages: new JSONModel({}),
        View: null,
        total: null,
        oGlobalBusyDialog: new sap.m.BusyDialog(),
        TabContainer: null,
        CheckFermo: null,
        CheckSingoloCausa: [],
        CheckTotaleCausa: 0,
        id_split: null,
        discr: null,
        Item: null,
        TreeTable: null,
        Button: null,
        Panel: null,
        CLOSED: 0,
        backupSetupModify: null,
        outerVBox: null,
        dataXML: null,
        exp: null,
        codeCheck: null,
        State: null,
//      NELL'ONINIT CARICO I VARI MODELLI E FACCIO TUTTE LE CHIAMATE AJAX

//------------------------------------------------------------------------------

        onInit: function () {


//            this.ModelDetailPages.setProperty("/SKUBatch/", {});
//            this.AjaxCallerData("model/SKU_standard.json", this.ModelDetailPages, "/SKUBatch/SKUstandard/");
//            this.AjaxCallerData("model/SKU_backend.json", this.ModelDetailPages, "/SKUBatch/SKUattuale/");
//            this.AjaxCallerData("model/JSON_Intestazione.json", this.ModelDetailPages, "/Intestazione/");


//            this.AjaxCallerData("model/allestimentoOld.json", this.ModelDetailPages, "/SetupLinea/Old/");
//            this.AjaxCallerData("model/allestimentoNew.json", this.ModelDetailPages, "/SetupLinea/New/");
//            this.AjaxCallerData("model/allestimentoNew.json", this.ModelDetailPages, "/SetupLinea/Modify/");
//            if (this.Global.getData().Choice === "Produzione") {
////                this.ModelDetailPages.setProperty("/Causalizzazione/", {});
////                this.AjaxCallerData("model/JSON_FermoTestiNew.json", this.ModelDetailPages, "/Fermi/");
//                this.AjaxCallerData("model/guasti.json", this.ModelDetailPages, "/Causalizzazione/", true);
////                this.EnableButtons(["ButtonPresaInCarico"]);
//            } else if (this.Global.getData().Choice === "Attrezzaggio") {
//                this.ModelDetailPages.setProperty("/FineAttrezzaggio/", {});
//                this.EnableButtons(["ButtonBatchAttrezzaggio"]);
//            }

            this.RefreshCall(this);
            setInterval(this.RefreshCall.bind(this), 5000);
//            this.getSplitAppObj().toDetail(this.createId("Home"));
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
        },
        RefreshCall: function () {
//            this.Global = this.getOwnerComponent().getModel("Global");
            var global = {"Linea": "Linea 1", "idLinea": "1"};
            this.ModelDetailPages.setProperty("/Globale/", global);
//            this.ModelDetailPages.setProperty("/Globale/", {});
//            this.ModelDetailPages.setProperty("/Globale/Linea", this.Global.getData().Linea);
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/StatusLinea&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea + "&OutputParameter=JSON";
            this.AjaxCallerData(link, this.ModelDetailPages, "/SKUBatch/");
            var model = this.ModelDetailPages.getData();
            var data = model.SKUBatch;
            model.Intestazione = {"linea": model.Globale.Linea, "descrizione": "", "conforme": ""};
            if (data.StatoLinea !== "Disponibile.Vuota" && data.StatoLinea !== "NonDisponibile") {

                var descr = data.SKUattuale.attributi[2].attributi[2].value + " " + data.SKUattuale.attributi[2].attributi[3].value + " " + data.SKUattuale.attributi[3].attributi[0].value;
                model.Intestazione.descrizione = descr;
                data.SKUattuale = this.RecursiveJSONComparison(data.SKUstandard, data.SKUattuale, "attributi");
                data.SKUattuale = this.RecursiveParentExpansion(data.SKUattuale);
                this.exp = 0;
                data.SKUattuale = this.RecursiveJSONExpansionFinder(data.SKUattuale);
                if (this.exp === 1) {
                    model.Intestazione.conforme = "***";
                }

                if (data.Batch[0].IsAttrezzaggio === "0") {
                    switch (data.StatoLinea) {
                        case "Disponibile.AttesaPresaInCarico":
                            if (this.State !== "Disponibile.AttesaPresaInCarico") {
                                this.SwitchColor("");
                                this.SwitchColorAttrezzaggio("");
                                this.EnableButtons(["ButtonPresaInCarico"]);
                            }
                            break;
                        case "Disponibile.Attrezzaggio":
                            if (this.State !== "Disponibile.Attrezzaggio") {
                                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLinea"));
                                this.SwitchColor("yellow");
                                this.SwitchColorAttrezzaggio("");
                                this.DisableButtons(["ButtonPresaInCarico"]);
                                this.EnableButtons(["ButtonFinePredisposizione"]);
                                this.PredisposizioneLinea();
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                            }
                            break;
                        case "Disponibile.Lavorazione":
                            this.AjaxCallerData("model/JSON_Progress.json", this.ModelDetailPages, "/InProgress/");
                            if (this.State !== "Disponibile.Lavorazione") {
                                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                                this.SwitchColor("green");
                                this.SwitchColorAttrezzaggio("");
                                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                            }
                            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                            break;
                        case "Disponibile.Fermo":
                            if (this.State !== "Disponibile.Fermo") {
                                if (typeof this.ModelDetailPages.getData().CausaFermo === "undefined") {
                                    this.ModelDetailPages.setProperty("/CausaFermo/", data.CausaleEvento);
                                }
                                this.SwitchColor("red");
                                this.SwitchColorAttrezzaggio("");
                                this.getSplitAppObj().toDetail(this.createId("Fault"));
                                this.EnableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                            }
                            break;
                        case "Disponibile.Svuotamento":
                            if (this.State !== "Disponibile.Svuotamento") {
                                if (typeof this.ModelDetailPages.getData().Causalizzazione === "undefined") {
//                                    this.Causalizzazione();
                                    this.ModelDetailPages.setProperty("/Causalizzazione/", {});
                                    link = "XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausa&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
                                    this.AjaxCallerData(link, this.ModelDetailPages, "/Causalizzazione/NoCause/");
                                    var dataC = this.ModelDetailPages.getData().Causalizzazione.NoCause;
                                    dataC = this.AddTimeGaps(dataC);
                                    this.ModelDetailPages.setProperty("/Causalizzazione/NoCause/", dataC);
                                }
                                this.AjaxCallerData("model/JSON_Chiusura.json", this.ModelDetailPages, "/Chiusura/");
                                this.SwitchColor("brown");
                                this.SwitchColorAttrezzaggio("");
                                this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                                this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonChiusuraConfezionamento"]);
                                this.EnableButtons(["ButtonCausalizzazione"]);
                                this.AggiornaChiusura();
                            }
                            break;
                    }
                } else {
                    switch (data.StatoLinea) {
                        case "Disponibile.AttesaPresaInCarico":
                            if (this.State !== "Disponibile.AttesaPresaInCarico") {
                                this.SwitchColor("");
                                this.SwitchColorAttrezzaggio("");
                                this.EnableButtons(["ButtonBatchAttrezzaggio"]);
                            }
                            break;
                        case "Disponibile.Attrezzaggio":
                            if (this.State !== "Disponibile.Attrezzaggio") {
                                this.getSplitAppObj().toDetail(this.createId("BatchAttrezzaggio"));
                                this.SwitchColor("");
                                this.SwitchColorAttrezzaggio("yellow");
                                this.PredisposizioneLineaAttrezzaggio();
                                this.EnableButtons(["ButtonFinePredisposizioneAttrezzaggio", "ButtonSospensioneAttrezzaggio"]);
                                this.DisableButtons(["ButtonBatchAttrezzaggio"]);
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                            }
                            break;
                        case "Disponibile.Svuotamento":
                            if (this.State !== "Disponibile.Svuotamento") {
                                this.getSplitAppObj().toDetail(this.createId("ConfermaAttrezzaggio"));
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                                this.SwitchColorAttrezzaggio("brown");
                                this.SwitchColor("");
                            }
                            break;
                        default:
                            console.log("C'è un problema.");
                    }
                }
            } else {
                switch (data.StatoLinea) {
                    case "Disponibile.Vuota":
                        this.getSplitAppObj().toDetail(this.createId("Home"));
                        this.SwitchColor("");
                        this.DisableButtons(["ButtonPresaInCarico", "ButtonFinePredisposizione", "ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                        break;
                    case "NonDisponibile":
                        this.SwitchColor("");
                        this.SwitchColorAttrezzaggio("");
                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                        break;
                }
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.State = data.StatoLinea;
        },
//        FUNZIONE CHE CHIAMA IL BACKEND PER SCRIVERE NEI LOGS
        AjaxCallerVoid: function (address) {
            jQuery.ajax({
                url: address,
                async: false
            });
        },
//        DI SEGUITO LE 2 FUNZIONI CHE CARICANO I MODELLI CON I JSON FILES
        AjaxCallerData: function (addressOfJSON, model, targetAddress) {
//            if (faults === undefined) {
//                faults = false;
//            }
            var req = jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "json",
                async: false
            });
            var passer = {};
            passer.model = model;
            passer.target = targetAddress;
//            passer.faults = faults;
            var tempfunc = jQuery.proxy(this.FillModel, this, passer);
            req.done(tempfunc);
        },
        FillModel: function (struct, data) {
            var model = struct.model;
            var target = struct.target;
//            var faults = struct.faults;
//            if (!faults) {
            model.setProperty(target, data);
//            } else {
//                var dataAll = JSON.parse(JSON.stringify(data));
//                var dataReduced = JSON.parse(JSON.stringify(data));
//                dataAll = this.AddTimeGaps(dataAll);
//                model.setProperty(target + "All/", dataAll);
//                dataReduced = this.RemoveCaused(dataReduced);
//                dataReduced = this.AddTimeGaps(dataReduced);
//                model.setProperty(target + "NoCause/", dataReduced);
//            }
        },
//------------------------------------------------------------------------------


//        RICHIAMATO DAL BOTTONE "PRESA IN CARICO NUOVO CONFEZIONAMENTO"
        PresaInCarico: function () {

            var std = this.ModelDetailPages.getData().SKUBatch.SKUstandard;
            var bck = this.ModelDetailPages.getData().SKUBatch.SKUattuale;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
//            this.ModelDetailPages.setProperty("/SKUBatch/SKUattuale", bck);
            this.DisableButtons(["ButtonPresaInCarico"]);
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
        },
//        RICHIAMATO DAL BOTTONE "CONFERMA" NELLA SCHERMATA DI PRESA IN CARICO
//          Questa funzione assegna i modelli alle TreeTables, rimuove la possibilità di
//          chiudere le tabs e imposta il colore giallo al pannello laterale.
        ConfermaBatch: function () {

            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchPresoInCarico&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
        },
        PredisposizioneLinea: function () {
//            this.getSplitAppObj().toDetail(this.createId("ConfermaBatch"));
            this.TabContainer = this.getView().byId("TabContainer");
            this.RemoveClosingButtons(2);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
            this.ModelDetailPages.setProperty("/SetupLinea/", {});
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreOld&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerData(link, this.ModelDetailPages, "/SetupLinea/Old/");
            link = "XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreNew&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerData(link, this.ModelDetailPages, "/SetupLinea/New/");
            this.ModelDetailPages.setProperty("/SetupLinea/Modify/", JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.New)));
            var std = this.ModelDetailPages.getData().SetupLinea.Old;
            var bck = this.ModelDetailPages.getData().SetupLinea.New;
            var mod = this.ModelDetailPages.getData().SetupLinea.Modify;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
            std = this.RecursiveStandardAdapt(std, bck);
            mod = this.RecursiveLinkRemoval(mod);
            mod = this.RecursiveModifyExpansion(mod);
            mod = this.RecursiveParentExpansion(mod);
            mod = this.RecursivePropertyAdder(mod, "valueModify");
            mod = this.RecursivePropertyAdder(mod, "codeValueModify");
            mod = this.RecursivePropertyCopy(mod, "valueModify", "value");
            this.backupSetupModify = JSON.parse(JSON.stringify(mod));
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.SwitchColor("yellow");
//            this.ModelDetailPages.setProperty("/SetupLinea/Old", std);
//            this.ModelDetailPages.setProperty("/SetupLinea/New", bck);
//            this.ModelDetailPages.setProperty("/SetupLinea/Modify", mod);
//            this.EnableButtons(["ButtonFinePredisposizione"]);
        },
//        RICHIAMATO DAL PULSANTE "FINE PREDISPOSIZIONE INIZIO CONFEZIONAMENTO"
//          Questa funzione chiude innanzitutto tutte le tabs chiudibili e crea una nuova tab
//          nella quale viene messa la TreeTabledi fine predisposizione ed il bottone
//          di conferma. Alla fine aggiunge il tab al tab container e rimuove tutti i
//          pulsanti che possono chiudere le tabs.
        FinePredisposizione: function () {

            this.TabContainer = this.getView().byId("TabContainer");
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var length = this.TabContainer.getItems().length;
            var tab;
            for (var i = length - 1; i > 1; i--) {
                tab = this.TabContainer.getItems()[i];
                this.TabContainer.removeItem(tab);
            }
            this.Item = new sap.m.TabContainerItem({});
            this.Item.setName("Conferma predisposizione");
            this.Panel = new sap.m.Panel();
            var inputValueMod = new sap.m.Input({
                editable: "{= ${GeneralModel>modify} === 1}",
                visible: "{= ${GeneralModel>modify} === 1}",
//                editable: "{= ${GeneralModel>modify} === '1'}",
//                visible: "{= ${GeneralModel>modify} === '1'}",
                value: "{GeneralModel>valueModify}"});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "{GeneralModel>codePlaceholder}",
                editable: "{= ${GeneralModel>code} === 1}",
//                editable: "{= ${GeneralModel>code} === '1'}",
                value: "{GeneralModel>codeValue}"});
            inputCodeValue.addStyleClass("diffStandard");
            this.TreeTable = new CustomTreeTable({
                id: "TreeTable_FinePredisposizione",
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 8,
                columns: [
                    new sap.ui.table.Column({
                        label: "Attributi",
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>name}"})}),
                    new sap.ui.table.Column({
                        label: "Valore",
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "Modifica",
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "Sigle",
                        width: "5rem",
                        template: inputCodeValue})
                ]
            });
            var hbox = new sap.m.HBox({});
            var vb1 = new sap.m.VBox({width: "20%"});
            var vb2 = new sap.m.VBox({width: "7%"});
            var vb3 = new sap.m.VBox({width: "35%"});
            var vb4 = new sap.m.VBox({width: "3%"});
            var vb5 = new sap.m.VBox({width: "35%"});
            var bt1 = new sap.m.Button({
                text: "Default",
                width: "100%",
                press: [this.RestoreDefault, this]});
            var bt2 = new sap.m.Button({
                text: "Annulla",
                width: "100%",
                press: [this.AnnullaPredisposizione, this]});
            var bt3 = new sap.m.Button({
                text: "Conferma",
                width: "100%",
                press: [this.ConfermaPredisposizione, this]});
//            var bt3 = new sap.m.Button({
//                text: "Conferma",
//                width: "100%",
//                press: [this.RefreshCall, this]});
            vb5.addItem(bt3);
            vb3.addItem(bt2);
            vb1.addItem(bt1);
            vb2.addItem(new sap.m.Text({}));
            vb4.addItem(new sap.m.Text({}));
            hbox.addItem(vb1);
            hbox.addItem(vb2);
            hbox.addItem(vb3);
            hbox.addItem(vb4);
            hbox.addItem(vb5);
            this.Panel.addContent(this.TreeTable);
            this.Panel.addContent(hbox);
            this.Item.addContent(this.Panel);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.RemoveClosingButtons(3);
            this.DisableButtons(["ButtonFinePredisposizione"]);
        },
//      RICHIAMATO DAL PULSANTE ANNULLA ALLA FINE DELLA PREDISPOSIZIONE
        AnnullaPredisposizione: function () {
            this.EnableButtons(["ButtonFinePredisposizione"]);
            this.TabContainer = this.getView().byId("TabContainer");
            var tab = this.TabContainer.getItems()[2];
            this.TabContainer.removeItem(tab);
            this.TabContainer.setSelectedItem(this.TabContainer.getItems()[1]);
            this.Item.destroyContent();
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
        },
//      RICHIAMATO DAL PULSANTE CONFERMA ALLA FINE DELLA PREDISPOSIZIONE
        ConfermaPredisposizione: function () {

            var setupData = this.ModelDetailPages.getData().SKUBatch.Batch;
            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            data = this.RecursivePropertyCopy(data, "value", "valueModify");
            data = this.RecursivePropertyCopy(data, "codeValueModify", "codeValue");
            this.backupSetupModify = JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.Modify));
            this.codeCheck = 0;
            data = this.RecursiveJSONCodeCheck(data);
            if (this.codeCheck === 0) {





                var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchInizioLavorazione&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
                this.AjaxCallerVoid(link);
                var XMLstring = this.XMLSetupUpdates(data);
                link = "XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&batchid=" + setupData.BatchID + "&SKUID=" + setupData.SKUID + "&xml=" + XMLstring;
                this.AjaxCallerVoid(link);
                this.RefreshCall();
//                this.getSplitAppObj().toDetail(this.createId("InProgress"));
//                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//                this.SwitchColor("green");
//                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
            } else {
                MessageToast.show("Tutti i codici Lotto/Matricola devono essere inseriti.");
            }
        },
        RecursivePropertyCopy: function (data, P1, P2) {
            for (var key in data) {
                if (typeof data[key] === "object") {
                    data[key] = this.RecursivePropertyCopy(data[key], P1, P2);
                } else {
                    data[P1] = data[P2];
                }
            }
            return data;
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
            if (typeof this.ModelDetailPages.getData().SetupLinea === "undefined") {
                this.ModelDetailPages.setProperty("/SetupLinea/", {});
                var link = "XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreNew&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
                this.AjaxCallerData(link, this.ModelDetailPages, "/SetupLinea/Modify/");
            }

            this.getSplitAppObj().toDetail(this.createId("ModificaCondizioni"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.TabContainer = this.getView().byId("TabContainer-mod");
            this.RemoveClosingButtons(2);
            this.Item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(this.Item);
            this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
        },
//      RICHIAMATO DAL PULSANTE DI ANNULLA NELLE MODIFICHE
        AnnullaModifica: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
        },
//      RICHIAMATO DAL PULSANTE DI CONFERMA NELLE MODIFICHE
        ConfermaModifica: function () {
            var setupData = this.ModelDetailPages.getData().SKUBatch.Batch;
            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            data = this.RecursivePropertyCopy(data, "value", "valueModify");
            data = this.RecursivePropertyCopy(data, "codeValue", "codeValueModify");
            this.backupSetupModify = JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.Modify));
            var XMLstring = this.XMLSetupUpdates(data);
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&batchid=" + setupData.BatchID + "&SKUID=" + setupData.SKUID + "&xml=" + XMLstring;
            this.AjaxCallerVoid(link);
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
        },
//------------------------------------------------------------------------------

//      RICHIAMATO DAL PULSANTE "FERMO"
        FermoCall: function () {
            this.discr = "FermoManuale";
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/GetListaFermi&Content-Type=text/json&OutputParameter=JSON&IsManuale=1";
            this.AjaxCallerData(link, this.ModelDetailPages, "/Fermi/");
            this.Fermo();
        },
        Fermo: function () {
            this.getSplitAppObj().toDetail(this.createId("Fermo"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var data = this.ModelDetailPages.getData().Fermi.gerarchie;
            var num_gerarchie = data.length;
            var ID, CB;
            var cols = 2;
            var rows = Math.ceil(num_gerarchie / cols);
            this.outerVBox = this.getView().byId("vboxFermo");
            var hbox = new sap.m.HBox({height: "100%"});
            var vb1 = new sap.m.VBox({width: "15%"});
            var VB1 = new sap.m.VBox({width: "85%"});
            var L1_vbox, L2_hbox, L3_vbox, title, subdata;
            var L1_height = String(Math.round(100 / rows)) + "%";
            var L3_width = String(Math.round(100 / cols)) + "%";
            var index = 0;
            this.CheckFermo = [];
            for (var i = 0; i < rows; i++) {
                L2_hbox = new sap.m.HBox();
                for (var j = 0; j < cols; j++) {
                    title = new sap.m.Text({text: data[index].gerarchia});
                    title.addStyleClass("customTextFermo");
                    L3_vbox = new sap.m.VBox({width: L3_width});
                    L3_vbox.addItem(title);
                    subdata = data[index].attributi;
                    for (var k = 0; k < subdata.length; k++) {
                        ID = "CBFermo" + subdata[k].id;
                        this.CheckFermo[ID] = 0;
                        CB = new sap.m.CheckBox({
                            id: ID,
                            text: subdata[k].fermo,
                            select: [this.ChangeCheckedFermo, this],
                            selected: false});
                        L3_vbox.addItem(CB);
                    }
                    L2_hbox.addItem(L3_vbox);
                    index++;
                    if (index === data.length) {
                        break;
                    }
                }
                L1_vbox = new sap.m.VBox({height: L1_height});
                L1_vbox.addItem(L2_hbox);
                VB1.addItem(L1_vbox);
            }
            hbox.addItem(vb1);
            hbox.addItem(VB1);
            this.outerVBox.addItem(hbox);
            var hbox1 = new sap.m.HBox({});
            var vb0 = new sap.m.VBox({width: "47%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "47%"});
            var bt1 = new sap.m.Button({
                id: "AnnullaFermo",
                text: "Annulla",
                width: "100%",
                enabled: true,
                press: [this.AnnullaFermo, this]});
            var bt2 = new sap.m.Button({
                id: "ConfermaFermo",
                text: "Conferma",
                width: "100%",
                enabled: false,
                press: [this.ConfermaFermo, this]});
            vb3.addItem(bt2);
            vb0.addItem(bt1);
            vb2.addItem(new sap.m.Text({}));
            hbox1.addItem(vb0);
            hbox1.addItem(vb2);
            hbox1.addItem(vb3);
            this.outerVBox.addItem(hbox1);
            this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
        },
//      FUNZIONE CHE GESTISCE LA SELEZIONE DEI CHECKBOX
        ChangeCheckedFermo: function (event) {
            var id = event.getSource().getId();
            var root_name = "CBFermo";
            this.id_split = this.SplitId(id, root_name);
            var old_id = this.GetActiveCB();
            if (typeof old_id === "string") {
                var old_CB = sap.ui.getCore().byId(old_id);
                old_CB.setSelected(false);
                this.CheckFermo[old_id] = 0;
            }
            if (old_id !== this.id_split[1]) {
                this.CheckFermo[this.id_split[1]] = 1;
            }
            var selected_index = this.GetActiveCB();
            var button = sap.ui.getCore().byId("ConfermaFermo");
            if (typeof selected_index === "string") {
                button.setEnabled(true);
            } else {
                button.setEnabled(false);
            }
        },
        GetActiveCB: function () {
            var res = 0;
            for (var key in this.CheckFermo) {
                if (this.CheckFermo[key] === 1) {
                    res = key;
                    break;
                }
            }
            return res;
        },
//      RICHIAMATO DAL PULSANTE DI ANNULLA NEL FERMO
        AnnullaFermo: function () {
            if (this.discr === "FermoManuale") {
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            } else if (this.discr === "FermoAutomatico") {
                this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));
                this.UncheckCause();
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
            this.outerVBox.destroyItems();
        },
//      RICHIAMATO DAL PULSANTE DI CONFERMA NEL FERMO
        ConfermaFermo: function () {
            var CB = sap.ui.getCore().byId(this.id_split[1]);
            var idGross = CB.getId();
            var root = "CBFermo";
            var id = idGross.substring(root.length, idGross.length);
            var link;
            if (this.discr === "FermoManuale") {

                this.ModelDetailPages.setProperty("/CausaFermo/", CB.getProperty("text"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchInFermoManuale&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea + "&CausaleEventoID=" + id;
                this.AjaxCallerVoid(link);
                this.RefreshCall();
//                this.Item = {};
//                var now = new Date();
//                this.Item.inizio = this.DateToStandard(now);
//                this.Item.causa = CB.getProperty("text");
//                this.SwitchColor("red");
//                this.getSplitAppObj().toDetail(this.createId("Fault"));
//                this.EnableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
            } else if (this.discr === "FermoAutomatico") {

                var string = this.GetStringIDFermiAuto(this.CheckSingoloCausa);
                link = "XMII/Runner?Transaction=DeCecco/Transactions/UpdateLogFermiAutoSenzaCausale&Content-Type=text/json&ListLogID=" + string + "&CausaleID=" + id;
                this.AjaxCallerVoid(link);
//                var data = this.ModelDetailPages.getData().Causalizzazione.NoCause;
//                var data_All = this.ModelDetailPages.getData().Causalizzazione.All;
//                for (var i in this.CheckSingoloCausa) {
//                    if (this.CheckSingoloCausa[i].checked > 0) {
//                        data.fermi[i].causa = CB.getProperty("text");
//                        for (var j in data_All.fermi) {
//                            if (data.fermi[i].inizio === data_All.fermi[j].inizio) {
//                                data_All.fermi[j].causa = CB.getProperty("text");
//                                break;
//                            }
//                        }
//                    }
//                }
//                this.ModelDetailPages.setProperty("/Causalizzazione/NoCause/", data);
//                this.ModelDetailPages.setProperty("/Causalizzazione/All/", data_All);
//                this.UpdateFaultsModels();
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
                this.Causalizzazione();
//                this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));

//                if (this.ModelDetailPages.getData().Causalizzazione.NoCause.fermi.length === 0) {
//                    this.getView().byId("TotaleTable").destroy();
//                    var text = new sap.m.Text({
//                        text: "Tutti i fermi automatici sono stati causalizzati",
//                        textAlign: "Center"
//                    });
//                    text.addStyleClass("textTop");
//                    var flexy = new sap.m.FlexBox({
//                        alignItems: "Start",
//                        justifyContent: "Center"
//                    });
//                    flexy.addItem(text);
//                    this.getView().byId("vbox_table").addItem(flexy);
//                }
            }
            this.outerVBox.destroyItems();
        },
        GetStringIDFermiAuto: function (vec) {
            var IDs = [];
            var i;
            for (i in vec) {
                if (vec[i].checked > 0) {
                    IDs.push(vec[i].id);
                }
            }
            var string = "";
            if (IDs.length === 1) {
                string = String(IDs[0]);
            } else {
                for (i in IDs) {
                    string += (String(IDs[i]) + "#");
                }
                string = string.substring(0, string.length - 1);
            }
            return string;
        },
//------------------------------------------------------------------------------

//      RICHIAMATO DAL PULSANTE "RIAVVIO"
        Riavvio: function () {
            if (typeof this.ModelDetailPages.getData().SetupLinea === "undefined") {
                this.ModelDetailPages.setProperty("/SetupLinea/", {});
                var link = "XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreNew&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
                this.AjaxCallerData(link, this.ModelDetailPages, "/SetupLinea/Modify/");
            }
            this.getSplitAppObj().toDetail(this.createId("RipristinoCondizioni"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.DisableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
        },
//      FUNZIONE CHE AGGIORNA IL MODELLO DEI GUASTI
        AggiornaGuasti: function () {
            this.Item.intervallo = this.MillisecsToStandard(this.StandardToMillisecs(this.Item.fine) - this.StandardToMillisecs(this.Item.inizio));
            var faults = this.ModelDetailPages.getData().Causalizzazione.All;
            faults.Totale.tempoGuastoTotale = this.MillisecsToStandard(this.StandardToMillisecs(faults.Totale.tempoGuastoTotale) + this.StandardToMillisecs(this.Item.intervallo));
            faults.fermi.push(this.Item);
            this.ModelDetailPages.setProperty("/Causalizzazione/All/", faults);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        AnnullaRipristino: function () {
            this.getSplitAppObj().toDetail(this.createId("Fault"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.EnableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        ConfermaRipristino: function () {
            var setupData = this.ModelDetailPages.getData().SKUBatch.Batch;
            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            data = this.RecursivePropertyCopy(data, "value", "valueModify");
            data = this.RecursivePropertyCopy(data, "codeValue", "codeValueModify");
            this.backupSetupModify = JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.Modify));
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchRiavvio&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            var XMLstring = this.XMLSetupUpdates(data);
            link = "XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&batchid=" + setupData.BatchID + "&SKUID=" + setupData.SKUID + "&xml=" + XMLstring;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
//            var now = new Date();
//            this.Item.fine = this.DateToStandard(now);
//            this.AggiornaGuasti();
//            this.getSplitAppObj().toDetail(this.createId("InProgress"));
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
//            this.SwitchColor("green");
        },
//------------------------------------------------------------------------------
//      
//      RICHIAMATO DAL PULSANTE "CAUSALIZZAZIONE FERMI AUTOMATICI"
        Causalizzazione: function () {

            this.ModelDetailPages.setProperty("/Causalizzazione/", {});
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausa&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerData(link, this.ModelDetailPages, "/Causalizzazione/NoCause/");
            var data = this.ModelDetailPages.getData().Causalizzazione.NoCause;
            data = this.AddTimeGaps(data);
            this.ModelDetailPages.setProperty("/Causalizzazione/NoCause/", data);
            if (this.ModelDetailPages.getData().Causalizzazione.NoCause.fermi.length === 0) {
                if (typeof this.getView().byId("TotaleTable") !== "undefined") {
                    this.getView().byId("TotaleTable").destroy();
                    var text = new sap.m.Text({
                        text: "Tutti i fermi automatici sono stati causalizzati",
                        textAlign: "Center"
                    });
                    text.addStyleClass("textTop");
                    var flexy = new sap.m.FlexBox({
                        alignItems: "Start",
                        justifyContent: "Center"
                    });
                    flexy.addItem(text);
                    this.getView().byId("vbox_table").addItem(flexy);
                }
            }

            this.CheckSingoloCausa = [];
            var i;
            var temp = {};
            for (i in this.ModelDetailPages.getData().Causalizzazione.NoCause.fermi) {
                temp.id = this.ModelDetailPages.getData().Causalizzazione.NoCause.fermi[i].LogID;
                temp.checked = 0;
                this.CheckSingoloCausa.push(temp);
            }
            this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.UncheckCause();
            this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
        },
//      FUNZIONE CHE GESTISCE LA SELEZIONE DEI CHECKBOX
        ChangeCheckedCausa: function (event) {
            var id = event.getSource().getId();
            var CB = this.getView().byId(id);
            var root_name_totale = "CBTotaleCausa";
            var i, temp_id;
            if (id.indexOf(root_name_totale) > -1) {
                for (i in this.CheckSingoloCausa) {
//                    temp_id = this.getView().byId("SingoliTable").getAggregation("items")[i].getAggregation("cells")[4].getId();
                    temp_id = this.getView().byId("SingoliTable").getAggregation("rows")[i].getAggregation("cells")[4].getId();
                    this.getView().byId(temp_id).setSelected(CB.getSelected());
                    this.getView().byId(temp_id).setEnabled(!CB.getSelected());
                }
                if (CB.getSelected()) {
                    this.CheckTotaleCausa = 1;
                    for (i in this.CheckSingoloCausa) {
                        this.CheckSingoloCausa[i].checked = 1;
                    }
                } else {
                    this.CheckTotaleCausa = 0;
                    for (i in this.CheckSingoloCausa) {
                        this.CheckSingoloCausa[i].checked = 0;
                    }
                }
            } else {
                var discr_id = event.getSource().getParent().getId();
                for (i in this.CheckSingoloCausa) {
//                    temp_id = event.getSource().getParent().getParent().getAggregation("items")[i].getId();
                    temp_id = event.getSource().getParent().getParent().getAggregation("rows")[i].getId();
                    if (discr_id === temp_id) {
                        break;
                    }
                }
                if (CB.getSelected()) {
                    this.CheckSingoloCausa[i].checked = 1;
                } else {
                    this.CheckSingoloCausa[i].checked = 0;
                }
            }
            temp_id = 0;
            for (i in this.CheckSingoloCausa) {
                temp_id += this.CheckSingoloCausa[i].checked;
            }
            if (temp_id > 0) {
                this.getView().byId("ConfermaCausalizzazione").setEnabled(true);
            } else {
                this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
            }
        },
        UncheckCause: function () {
            var i, temp_id;
            for (i in this.CheckSingoloCausa) {
//                    temp_id = this.getView().byId("SingoliTable").getAggregation("items")[i].getAggregation("cells")[4].getId();
                temp_id = this.getView().byId("SingoliTable").getAggregation("rows")[i].getAggregation("cells")[4].getId();
                this.getView().byId(temp_id).setSelected(false);
                this.getView().byId(temp_id).setEnabled(true);
            }
            if (typeof this.getView().byId("TotaleTable") !== "undefined") {
                this.getView().byId("CBTotaleCausa").setSelected(false);
                this.getView().byId("CBTotaleCausa").setEnabled(true);
            }
            this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
        },
//      RICHIAMATO DAL PULSANTE DI CAUSALIZZA
        Causalizza: function () {
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/GetListaFermi&Content-Type=text/json&OutputParameter=JSON&IsManuale=0";
            this.AjaxCallerData(link, this.ModelDetailPages, "/Fermi/");
            this.discr = "FermoAutomatico";
            this.Fermo();
        },
//      RICHIAMATO DAL PULSANTE DI ESCI NELLA CAUSALIZZAZIONE
        EsciCausalizzazione: function () {
            if (this.ModelDetailPages.getData().SKUBatch.StatoLinea === "Disponibile.Lavorazione") {
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
            } else if (this.ModelDetailPages.getData().SKUBatch.StatoLinea === "Disponibile.Svuotamento") {
                this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonChiusuraConfezionamento"]);
                this.EnableButtons(["ButtonCausalizzazione"]);
            }
//            if (this.CLOSED === 0) {
//                this.getSplitAppObj().toDetail(this.createId("InProgress"));
//                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
//            } else {
//                this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
//                this.AggiornaChiusura();
//                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//                this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonChiusuraConfezionamento"]);
//                this.EnableButtons(["ButtonCausalizzazione"]);
//            }
        },
//      FUNZIONE CHE AGGIORNA I MODELLI DEI GUASTI
        UpdateFaultsModels: function () {
            var data_NOcause = this.ModelDetailPages.getData().Causalizzazione.NoCause;
            var i;
            for (i = data_NOcause.fermi.length - 1; i >= 0; i--) {
                var temp_item = data_NOcause.fermi[i];
                if (temp_item.causa !== "") {
                    data_NOcause.fermi.splice(i, 1);
                    data_NOcause.Totale.tempoGuastoTotale = this.MillisecsToStandard(this.StandardToMillisecs(data_NOcause.Totale.tempoGuastoTotale) - this.StandardToMillisecs(temp_item.intervallo));
                }
            }
            this.CheckSingoloCausa = [];
            var temp = {};
            for (i in data_NOcause.fermi) {
                temp.id = data_NOcause.fermi[i].LogID;
                temp.checked = 0;
                this.CheckSingoloCausa.push(temp);
            }
            data_NOcause.Totale.select = false;
            this.ModelDetailPages.setProperty("/Causalizzazione/NoCause/", data_NOcause);
        },
//------------------------------------------------------------------------------
//      
//      RICHIAMATO DAL PULSANTE "CHIUSURA CONFEZIONAMENTO"
        ChiusuraConfezionamento: function () {

            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchInChiusura&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
//            this.CLOSED = 1;
//            this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
//            this.AggiornaChiusura();
//            this.SwitchColor("brown");
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.DisableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonChiusuraConfezionamento"]);
//            this.EnableButtons(["ButtonCausalizzazione"]);
        },
        ConfermaChiusura: function () {
            var temp = {"linea": this.ModelDetailPages.getData().Globale.Linea, "descrizione": "", "conforme": ""};
            this.ModelDetailPages.setProperty("/Intestazione/", temp);
            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchChiuso&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
//            this.getSplitAppObj().toDetail(this.createId("Home"));
//            this.SwitchColor("");
//            this.DisableButtons(["ButtonPresaInCarico", "ButtonFinePredisposizione", "ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
        },
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------


//-------------------------------  ATTREZZAGGIO  -------------------------------


        BatchAttrezzaggio: function () {
            this.getSplitAppObj().toDetail(this.createId("BatchAttrezzaggio"));
            var std = this.ModelDetailPages.getData().SKUBatch.SKUstandard;
            var bck = this.ModelDetailPages.getData().SKUBatch.SKUattuale;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
//            this.ModelDetailPages.setProperty("/SKUBatch/SKUattuale", bck);
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.SwitchColor("");
            this.DisableButtons(["ButtonBatchAttrezzaggio"]);
        },
        //        RICHIAMATO DAL BOTTONE "CONFERMA" NELLA SCHERMATA DI PRESA IN CARICO
//          Questa funzione assegna i modelli alle TreeTables, rimuove la possibilità di
//          chiudere le tabs e imposta il colore giallo al pannello laterale.
        ConfermaBatchAttrezzaggio: function () {

            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchPresoInCarico&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
        },
        PredisposizioneLineaAttrezzaggio: function () {
            this.getSplitAppObj().toDetail(this.createId("PredisposizioneLineaAttrezzaggio"));
            var std = this.ModelDetailPages.getData().SetupLinea.Old;
            var bck = this.ModelDetailPages.getData().SetupLinea.New;
            var mod = this.ModelDetailPages.getData().SetupLinea.Modify;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
            std = this.RecursiveStandardAdapt(std, bck);
            mod = this.RecursiveLinkRemoval(mod);
            mod = this.RecursiveModifyExpansion(mod);
            mod = this.RecursiveParentExpansion(mod);
//            this.ModelDetailPages.setProperty("/SetupLinea/Old", std);
//            this.ModelDetailPages.setProperty("/SetupLinea/New", bck);
//            this.ModelDetailPages.setProperty("/SetupLinea/Modify", mod);
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.SwitchColorAttrezzaggio("yellow");
//            this.EnableButtons(["ButtonFinePredisposizioneAttrezzaggio", "ButtonSospensioneAttrezzaggio"]);
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            this.RemoveClosingButtons(2);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
        },
//        RICHIAMATO DAL PULSANTE "FINE PREDISPOSIZIONE INIZIO CONFEZIONAMENTO"
//          Questa funzione chiude innanzitutto tutte le tabs chiudibili e crea una nuova tab
//          nella quale viene messa la TreeTabledi fine predisposizione ed il bottone
//          di conferma. Alla fine aggiunge il tab al tab container e rimuove tutti i
//          pulsanti che possono chiudere le tabs.
        FinePredisposizioneAttrezzaggio: function () {

            var data = {"stringa": "solo predisposizione"};
            this.ModelDetailPages.setProperty("/FineAttrezzaggio/", data);
            this.DisableButtons(["ButtonSospensioneAttrezzaggio"]);
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var length = this.TabContainer.getItems().length;
            var tab;
            for (var i = length - 1; i > 1; i--) {
                tab = this.TabContainer.getItems()[i];
                this.TabContainer.removeItem(tab);
            }
            this.Item = new sap.m.TabContainerItem({});
            this.Item.setName("Conferma predisposizione");
            this.Panel = new sap.m.Panel();
            this.TreeTable = new CustomTreeTable({
                id: "TreeTable_FinePredisposizioneAttrezzaggio",
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 8,
                columns: [
                    new sap.ui.table.Column({
                        label: "Attributi",
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>name}"})}),
                    new sap.ui.table.Column({
                        label: "Valore",
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "Modifica",
                        width: "5rem",
                        template: new StyleInputTreeTableValue({
                            value: "{= ${GeneralModel>modify} === 1 ? ${GeneralModel>value}: ''}",
//                            value: "{= ${GeneralModel>modify} === '1' ? ${GeneralModel>value}: ''}",
                            diff: "{GeneralModel>modify}",
                            editable: "{= ${GeneralModel>modify} === 1}"})}),
//                            editable: "{= ${GeneralModel>modify} === '1'}"})}),
                    new sap.ui.table.Column({
                        label: "Sigle",
                        width: "5rem",
                        template: new sap.m.Input({
                            placeholder: "{= ${GeneralModel>code} === 1 ? ${GeneralModel>codePlaceholder}: ''}",
                            editable: "{= ${GeneralModel>code} === 1}",
//                            placeholder: "{= ${GeneralModel>code} === '1' ? ${GeneralModel>codePlaceholder}: ''}",
//                            editable: "{= ${GeneralModel>code} === '1'}",
                            value: "{GeneralModel>codeValue}"})})
                ]
            });
            var hbox = new sap.m.HBox({});
            var vb1 = new sap.m.VBox({width: "47%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "47%"});
            var bt1 = new sap.m.Button({
                text: "Annulla",
                width: "100%",
                press: [this.AnnullaAttrezzaggio, this]});
            var bt2 = new sap.m.Button({
                text: "Conferma",
                width: "100%",
                press: [this.ConfermaAttrezzaggio, this]});
            vb3.addItem(bt2);
            vb1.addItem(bt1);
            vb2.addItem(new sap.m.Text({}));
            hbox.addItem(vb1);
            hbox.addItem(vb2);
            hbox.addItem(vb3);
            this.Panel.addContent(this.TreeTable);
            this.Panel.addContent(hbox);
            this.Item.addContent(this.Panel);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.RemoveClosingButtons(3);
            this.DisableButtons(["ButtonSospensioneAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio"]);
        },
        SospensioneAttrezzaggio: function () {

            var data = {"stringa": "sospensione predisposizione"};
            this.ModelDetailPages.setProperty("/FineAttrezzaggio/", data);
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var length = this.TabContainer.getItems().length;
            var tab;
            for (var i = length - 1; i > 1; i--) {
                tab = this.TabContainer.getItems()[i];
                this.TabContainer.removeItem(tab);
            }
            this.Item = new sap.m.TabContainerItem({});
            this.Item.setName("Sospensione predisposizione");
            this.Panel = new sap.m.Panel();
            this.TreeTable = new CustomTreeTable({
                id: "TreeTable_FinePredisposizioneAttrezzaggio",
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 8,
                columns: [
                    new sap.ui.table.Column({
                        label: "Attributi",
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>name}"})}),
                    new sap.ui.table.Column({
                        label: "Valore",
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "Modifica",
                        width: "5rem",
                        template: new StyleInputTreeTableValue({
                            value: "{= ${GeneralModel>modify} === 1 ? '#ND': ''}",
//                            value: "{= ${GeneralModel>modify} === '1' ? '#ND': ''}",
                            diff: "{GeneralModel>modify}",
                            editable: "{= ${GeneralModel>modify} === 1}"})}),
//                            editable: "{= ${GeneralModel>modify} === '1'}"})}),
                    new sap.ui.table.Column({
                        label: "Sigle",
                        width: "5rem",
                        template: new sap.m.Input({
                            placeholder: "",
                            editable: "{= ${GeneralModel>code} === 1}",
//                            editable: "{= ${GeneralModel>code} === '1'}",
                            value: ""})})
                ]
            });
            var hbox = new sap.m.HBox({});
            var vb1 = new sap.m.VBox({width: "47%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "47%"});
            var bt1 = new sap.m.Button({
                text: "Annulla",
                width: "100%",
                press: [this.AnnullaAttrezzaggio, this]});
            var bt2 = new sap.m.Button({
                text: "Conferma",
                width: "100%",
                press: [this.ConfermaAttrezzaggio, this]});
            vb3.addItem(bt2);
            vb1.addItem(bt1);
            vb2.addItem(new sap.m.Text({}));
            hbox.addItem(vb1);
            hbox.addItem(vb2);
            hbox.addItem(vb3);
            this.Panel.addContent(this.TreeTable);
            this.Panel.addContent(hbox);
            this.Item.addContent(this.Panel);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.RemoveClosingButtons(3);
            this.DisableButtons(["ButtonSospensioneAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio"]);
        },
        AnnullaAttrezzaggio: function () {
            this.EnableButtons(["ButtonSospensioneAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio"]);
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            var tab = this.TabContainer.getItems()[2];
            this.TabContainer.removeItem(tab);
            this.TabContainer.setSelectedItem(this.TabContainer.getItems()[1]);
            this.Item.destroyContent();
        },
        ConfermaAttrezzaggio: function () {

            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchInChiusura&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
//            this.getSplitAppObj().toDetail(this.createId("ConfermaAttrezzaggio"));
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.SwitchColorAttrezzaggio("brown");
        },
        FineAttrezzaggio: function () {

            var link = "XMII/Runner?Transaction=DeCecco/Transactions/BatchChiuso&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().Globale.idLinea;
            this.AjaxCallerVoid(link);
            this.RefreshCall();
//            this.getSplitAppObj().toDetail(this.createId("Home"));
//            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//            this.SwitchColorAttrezzaggio("");
        },
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------


//      !!!!!  FUNZIONI CONDIVISE DA PIU' FRAMES  !!!!!

//      FUNZIONI CHE AGISCONO SUL FRONT-END

//      RICHIAMATO QUANDO VIENE CLICCATO UN TESTO DI TIPO LINK
//        Questa funzione controlla in quale riga/colonna si è cliccato e, se
//        c'è un link, lancia l'evento di creare una nuova tab chiudible con al
//        momento un'immagine.
        LinkClick: function (event) {
            var clicked_row = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_row.expand === 3 && clicked_column === 1) {
                var Item = new sap.m.TabContainerItem();
                Item.setName(clicked_row.value);
                var image = new sap.m.Image();
                image.setSrc("img/dececco.jpg");
                image.setWidth("60%");
                Item.addContent(image);
                this.TabContainer.addItem(Item);
                this.TabContainer.setSelectedItem(Item);
            }
        },
        AggiornaChiusura: function () {
            var data = this.ModelDetailPages.getData();
            var index = this.GetIndex(data.Chiusura.attributi, "Totale tempi di fermo");
//            data.Chiusura.attributi[index].value = data.Causalizzazione.All.Totale.tempoGuastoTotale;
            var index1 = this.GetIndex(data.Chiusura.attributi[index].attributi, "Tempi di fermo non causalizzati");
            data.Chiusura.attributi[index].attributi[index1].value = data.Causalizzazione.NoCause.Totale.tempoGuastoTotale;
            this.ModelDetailPages.setProperty("/", data);
        },
        EnableButtons: function (vec) {
            for (var i in vec) {
                this.getView().byId(vec[i]).setEnabled(true);
            }
        },
        DisableButtons: function (vec) {
            for (var i in vec) {
                this.getView().byId(vec[i]).setEnabled(false);
            }
        },
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
            this.View.expandToLevel(20);
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
                if (temp.expand === 0) {
                    this.View.collapse(i);
                }
            }
            this.oGlobalBusyDialog.close();
        },
        RestoreDefault: function () {
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
        },
//      FUNZIONI CHE AGISCONO INTERNAMENTE

//      Funzione che calcola il time gap di tutti i guasti e li ritorna come array
        AddTimeGaps: function (data) {
            var millisec_diff = [];
            var start, end;
            for (var iter in data.fermi) {
                start = new Date(data.fermi[iter].inizio);
                end = new Date(data.fermi[iter].fine);
                millisec_diff.push(end - start);
                data.fermi[iter].inizio = this.DateToStandard(start);
                data.fermi[iter].fine = this.DateToStandard(end);
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
                data.fermi[i].intervallo = arrayGaps[i];
            }
            data.Totale = {};
            data.Totale.tempoGuastoTotale = this.MillisecsToStandard(sum);
            data.Totale.causaleTotale = "";
            data.Totale.select = false;
            return data;
        },
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
            for (var i = data.fermi.length - 1; i >= 0; i--) {
                data.fermi[i].select = false;
                if (data.fermi[i].causa !== "") {
                    data.fermi.splice(i, 1);
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
        },
        GetIndex: function (array, name) {
            for (var key in array) {
                if (array[key].name === name) {
                    break;
                }
            }
            return key;
        },
        RemoveClosingButtons: function (n_tabs) {
            var oTabStrip = this.TabContainer.getAggregation("_tabStrip");
            var oItems = oTabStrip.getItems();
            for (var i = 0; i < n_tabs; i++) {
                var oCloseButton = oItems[i].getAggregation("_closeButton");
                oCloseButton.setVisible(false);
            }
            this.TabContainer.getAggregation("_tabStrip").getAggregation("_select").setVisible(false);
        },
        SwitchColor: function (color) {
            var CSS_classes = ["stylePanelYellow", "stylePanelGreen", "stylePanelRed", "stylePanelBrown"];
            var panel = this.getView().byId("panel_processi");
            for (var col in CSS_classes) {
                panel.removeStyleClass(CSS_classes[col]);
            }
            switch (color) {
                case "yellow":
                    panel.addStyleClass("stylePanelYellow");
                    break;
                case "green":
                    panel.addStyleClass("stylePanelGreen");
                    break;
                case "red":
                    panel.addStyleClass("stylePanelRed");
                    break;
                case "brown":
                    panel.addStyleClass("stylePanelBrown");
                    break;
            }
        },
        SwitchColorAttrezzaggio: function (color) {
            var CSS_classes = ["stylePanelYellow", "stylePanelGreen", "stylePanelRed", "stylePanelBrown"];
            var panel = this.getView().byId("panel_attrezzaggio");
            for (var col in CSS_classes) {
                panel.removeStyleClass(CSS_classes[col]);
            }
            switch (color) {
                case "yellow":
                    panel.addStyleClass("stylePanelYellow");
                    break;
                case "green":
                    panel.addStyleClass("stylePanelGreen");
                    break;
                case "red":
                    panel.addStyleClass("stylePanelRed");
                    break;
                case "brown":
                    panel.addStyleClass("stylePanelBrown");
                    break;
            }
        },
        RecursiveJSONComparison: function (std, bck, arrayName) {
            for (var key in std) {
                if (typeof std[key] === "object") {
                    bck[key] = this.RecursiveJSONComparison(std[key], bck[key], arrayName);
                } else {
                    if (key === "value") {
                        if (bck[key] !== std[key]) {
                            bck.expand = 2;
                        }
                    }
                }
            }
            return bck;
        },
        RecursiveParentExpansion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    this.exp = 0;
                    json[key] = this.RecursiveJSONExpansionFinder(json[key]);
                    if (typeof json[key].expand !== "undefined" && json[key].expand === 0) {
//                        json[key].expand = String(this.exp);
                        json[key].expand = this.exp;
                    }
                    json[key] = this.RecursiveParentExpansion(json[key]);
                }
            }
            return json;
        },
        RecursiveJSONExpansionFinder: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONExpansionFinder(json[key]);
                } else {
                    if (key === "expand") {
                        if (json[key] > 0) {
//                        if (json[key] !== "0") {
                            this.exp = 1;
                        }
                    }
                }
            }
            return json;
        },
        RecursiveStandardAdapt: function (std, bck) {
            for (var key in std) {
                if (typeof std[key] === "object") {
                    if (key === "expand") {
                        if (bck[key] > 0) {
//                        if (bck[key] !== "0") {
                            std[key] = 1;
                        }
                    }
                    std[key] = this.RecursiveStandardAdapt(std[key], bck[key]);
                } else {
                    if (key === "expand") {
                        if (bck[key] > 0) {
//                        if (bck[key] !== "0") {
                            std[key] = 1;
                        }
                    }
                }
            }
            return std;
        },
        RecursiveLinkRemoval: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveLinkRemoval(json[key]);
                } else {
                    if (key === "expand") {
                        if (json[key] === 3) {
                            json[key] = 0;
                        }
                    }
                }
            }
            return json;
        },
        RecursiveModifyExpansion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveModifyExpansion(json[key]);
                } else {
                    if (key === "modify" || key === "code") {
                        if (json[key] === 1) {
                            json.expand = 1;
                        }
                    }
                }
            }
            return json;
        },
        RecursivePropertyAdder: function (json, prop_name) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursivePropertyAdder(json[key], prop_name);
                } else {
                    json[prop_name] = "";
                }
            }
            return json;
        },
        XMLSetupUpdates: function (setup) {
            var heading = "<Parameters>" +
                    "<LineaID>1</LineaID>" +
                    "<SKUID>1</SKUID>" +
                    "<ParameterList>";
            var bottom = "</ParameterList>" +
                    "</Parameters>";
            this.dataXML = [];
            setup = this.RecursiveJSONChangesFinder(setup);
            var body = "";
            for (var i in this.dataXML) {
                body += "<Parameter>";
                for (var key in this.dataXML[i]) {
                    body += "<" + key + ">" + String(this.dataXML[i][key]) + "</" + key + ">";
                }
                body += "</Parameter>";
            }
            return (heading + body + bottom);
        },
        RecursiveJSONChangesFinder: function (setup) {
            var temp = {};
            for (var key in setup) {
                if (typeof setup[key] === "object") {
                    setup[key] = this.RecursiveJSONChangesFinder(setup[key]);
                } else {
                    if (typeof setup.code !== "undefined") {
                        if (setup.code === 1 || setup.modify === 1) {
                            if (setup.code === 1) {
                                if (setup.codePlaceholder === "Lotto") {
                                    temp.Type = "l";
                                } else if (setup.codePlaceholder === "Matricola") {
                                    temp.Type = "m";
                                }
                            } else if (setup.modify === 1) {
                                temp.Type = "v";
                            }
                            temp.IDParametro = setup.id;
                            temp.ValueML = setup.codeValue;
                            temp.Value = setup.value;
                            if (temp !== this.dataXML[this.dataXML.length - 1]) {
                                this.dataXML.push(temp);
                            }
                        }
                    }
                }
            }
            return setup;
        },
        RecursiveJSONCodeCheck: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONCodeCheck(json[key]);
                } else {
                    if (key === "code") {
                        if (json[key] === 1) {
                            if (json.codeValue === "") {
                                this.codeCheck = 1;
                                break;
                            }
                        }
                    }
                }
            }
            return json;
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
