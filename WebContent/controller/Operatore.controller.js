sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/CustomTreeTable',
    'sap/m/MessageToast'
], function (jQuery, Controller, JSONModel, CustomTreeTable, MessageToast) {
    "use strict";
    var TmpController = Controller.extend("myapp.controller.Operatore", {

//      VARIABILI GLOBALI
        ISLOCAL: 0,
        ISATTR: 0,
        TIMER: null,
        LineDetails: {"Linea": "Linea 1", "idLinea": "1"},
        ModelDetailPages: new JSONModel({}),
        GlobalBusyDialog: new sap.m.BusyDialog(),
        TabContainer: null,
        CheckFermo: null,
        CheckTotaleCausa: 0,
        id_split: null,
        discr: null,
        Item: null,
        backupSetupModify: null,
        outerVBox: null,
        dataXML: null,
        exp: null,
        codeCheck: null,
        State: null,
        LOCALState: null,
        Dialog: null,
//------------------------------------------------------------------------------

        onInit: function () {

            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
            this.ISATTR = Number(jQuery.sap.getUriParameters().get("ISATTR"));
            this.ModelDetailPages.setProperty("/DettaglioLinea/", this.LineDetails);
            var link;
            if (this.ISLOCAL === 1) {
                if (this.ISATTR === 1) {
                    link = "model/JSON_SKUBatch_ATTR.json";
                } else {
                    link = "model/JSON_SKUBatch.json";
                }
                this.AjaxCallerData(link, this.LOCALCheckStatus.bind(this));
            } else {
                this.RefreshCall();
            }


            var clockL1 = this.getView().byId("clockL1");
            var clockL2 = this.getView().byId("clockL2");
            var date = this.GetData();
            var time = this.GetOra();
            clockL1.setText(date);
            clockL2.setText(time);
            var that = this;
            setInterval(function () {
                var date = that.GetData();
                var time = that.GetOra();
                clockL1.setText(date);
                clockL2.setText(time);
            }, 1000);
        },
//        -------------------------------------------------------------------------------------------
//        ------------------------- FUNZIONE CICLICA CHE CONTROLLA LO STATO -------------------------
//        -------------------------------------------------------------------------------------------





        RefreshFunction: function () {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), 5000);
        },
        RefreshCall: function () {
            if (typeof this.ModelDetailPages.getData().SKUBatch === "undefined") {
                this.State = "";
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/StatusLinea&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&OutputParameter=JSON";
            this.SyncAjaxCallerData(link, this.CheckStatus.bind(this));
        },
        CheckStatus: function (Jdata) {
            this.ModelDetailPages.setProperty("/SKUBatch/", Jdata);
            var link;
            var model = this.ModelDetailPages.getData();
            var data = model.SKUBatch;
            model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": "", "conforme": ""};
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
                this.ModelDetailPages.setProperty("/Intestazione/", model.Intestazione);
                if (data.Batch[0].IsAttrezzaggio === "0") {
                    if (typeof sap.ui.getCore().byId("ButtonBatchAttrezzaggio") !== "undefined") {
                        this.DestroyButtons();
                    }
                    if (typeof sap.ui.getCore().byId("ButtonPresaInCarico") === "undefined") {
                        this.CreateButtons();
                    }

                    switch (data.StatoLinea) {
                        case "Disponibile.AttesaPresaInCarico":
                            if (this.State !== "Disponibile.AttesaPresaInCarico") {
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                                this.getSplitAppObj().toDetail(this.createId("Home"));
                                this.SwitchColor("");
                                this.EnableButtons(["ButtonPresaInCarico"]);
                            }
                            break;
                        case "Disponibile.Attrezzaggio":
                            if (this.State !== "Disponibile.Attrezzaggio") {
                                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLinea"));
                                this.SwitchColor("yellow");
                                this.EnableButtons(["ButtonFinePredisposizione"]);
                                this.PredisposizioneLinea();
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                            }
                            break;
                        case "Disponibile.Lavorazione":
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/OEEBatchInCorso&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                            this.SyncAjaxCallerData(link, this.SUCCESSLavorazioneOEE.bind(this));
                            break;
                        case "Disponibile.Fermo":
                            if (this.State !== "Disponibile.Fermo") {
                                if (data.CausaleEvento === "---") {
                                    this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO AUTOMATICO");
                                } else {
                                    this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO - " + data.CausaleEvento);
                                }
                                this.SwitchColor("red");
                                this.getSplitAppObj().toDetail(this.createId("Fault"));
                                this.EnableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                            }
                            break;
                        case "Disponibile.Svuotamento":
                            if (this.State !== "Disponibile.Svuotamento") {
                                link = "/XMII/Runner?Transaction=DeCecco/Transactions/RiassuntoOperatore&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                                this.SyncAjaxCallerData(link, this.SUCCESSChiusura.bind(this));
                            }
                            break;
                    }
                } else {
                    if (typeof sap.ui.getCore().byId("ButtonPresaInCarico") !== "undefined") {
                        this.DestroyButtons();
                    }
                    if (typeof sap.ui.getCore().byId("ButtonBatchAttrezzaggio") === "undefined") {
                        this.CreateButtonsAttr();
                    }
                    switch (data.StatoLinea) {
                        case "Disponibile.AttesaPresaInCarico":
                            if (this.State !== "Disponibile.AttesaPresaInCarico") {
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                                this.getSplitAppObj().toDetail(this.createId("Home"));
                                this.SwitchColor("");
                                this.EnableButtonsAttr(["ButtonBatchAttrezzaggio"]);
                            }
                            break;
                        case "Disponibile.Attrezzaggio":
                            if (this.State !== "Disponibile.Attrezzaggio") {
                                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLineaAttrezzaggio"));
                                this.SwitchColor("yellow");
                                this.PredisposizioneLineaAttrezzaggio();
                                this.EnableButtonsAttr(["ButtonFinePredisposizioneAttrezzaggio", "ButtonSospensioneAttrezzaggio"]);
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                            }
                            break;
                        case "Disponibile.Svuotamento":
                            if (this.State !== "Disponibile.Svuotamento") {
                                this.getSplitAppObj().toDetail(this.createId("ConfermaAttrezzaggio"));
                                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                                this.SwitchColor("brown");
                                this.EnableButtonsAttr([]);
                            }
                            break;
                        default:
                            console.log("C'è un problema.");
                    }
                }
            } else {
                this.ModelDetailPages.setProperty("/Intestazione/", model.Intestazione);
                if (typeof sap.ui.getCore().byId("ButtonPresaInCarico") !== "undefined" || typeof sap.ui.getCore().byId("ButtonBatchAttrezzaggio") !== "undefined") {
                    this.DestroyButtons();
                }
                switch (data.StatoLinea) {
                    case "Disponibile.Vuota":
                        this.getSplitAppObj().toDetail(this.createId("Home"));
                        this.SwitchColor("");
                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                        break;
                    case "NonDisponibile":
                        this.SwitchColor("red");
                        model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": "NON DISPONIBILE", "conforme": ""};
                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                        break;
                }
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.State = this.ModelDetailPages.getData().SKUBatch.StatoLinea;
            this.RefreshFunction();
        },
        SUCCESSLavorazioneOEE: function (Jdata) {
            if (Jdata.avanzamento >= 100) {
                Jdata.avanzamento = 100;
            }
            this.ModelDetailPages.setProperty("/DatiOEE/", Jdata);
            if (this.State !== "Disponibile.Lavorazione") {
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.SwitchColor("green");
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                this.FermiAutomaticiCheck("Disponibile.Lavorazione");
            }
            this.BarColor(Jdata);
        },
        SUCCESSChiusura: function (Jdata) {
            this.ModelDetailPages.setProperty("/ParametriChiusura/", Jdata);
            this.SwitchColor("brown");
            this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.EnableButtons(["ButtonCausalizzazione"]);
            this.FermiAutomaticiCheck("Disponibile.Svuotamento");
        },
//        ---------------------------------------------------------------------
//        -------------------------  FUNZIONI CALLER  -------------------------
//        ---------------------------------------------------------------------


//        FUNZIONE CHE CHIAMA IL BACKEND PER SCRIVERE NEI LOGS
        AjaxCallerVoid: function (address, Func) {
            var req = jQuery.ajax({
                url: address,
                async: true
            });
            req.always(Func);
        },
//        DI SEGUITO LE 2 FUNZIONI CHE CARICANO I MODELLI CON I JSON FILES
        AjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "json",
                async: true,
                success: successFunc,
                error: errorFunc
            });
        },
        SyncAjaxCallerVoid: function (address, Func) {
            var req = jQuery.ajax({
                url: address,
                async: false
            });
            req.always(Func);
        },
        SyncAjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "json",
                async: false,
                success: successFunc,
                error: errorFunc
            });
        },
//        ---------------------------------------------------------------------
//        ---------------------------  DETAIL PAGES  --------------------------
//        ---------------------------------------------------------------------


//        -------------------------  PRESA IN CARICO  -------------------------       




//        RICHIAMATO DAL BOTTONE "PRESA IN CARICO NUOVO CONFEZIONAMENTO"
        PresaInCarico: function () {

            var std = this.ModelDetailPages.getData().SKUBatch.SKUstandard;
            var bck = this.ModelDetailPages.getData().SKUBatch.SKUattuale;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
            this.EnableButtons([]);
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
        },
//        RICHIAMATO DAL BOTTONE "CONFERMA" NELLA SCHERMATA DI PRESA IN CARICO
//          Questa funzione assegna i modelli alle TreeTables, rimuove la possibilità di
//          chiudere le tabs e imposta il colore giallo al pannello laterale.
        ConfermaBatch: function () {

            var link;
            if (this.ISLOCAL === 1) {
                link = "model/guasti.json";
                this.AjaxCallerData(link, this.LOCALLoadGuasti.bind(this));
                this.LOCALState = "Disponibile.Attrezzaggio";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchPresoInCarico&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshCall.bind(this));
            }
        },
//        -------------------------  ATTREZZAGGIO LINEA  -------------------------       




        PredisposizioneLinea: function () {

            this.TabContainer = this.getView().byId("TabContainer");
            this.RemoveClosingButtons(2);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
            this.ModelDetailPages.setProperty("/SetupLinea/", {});
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_SetupOld.json";
                this.SwitchColor("yellow");
                this.EnableButtons(["ButtonFinePredisposizione"]);
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreOld&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
            }
            this.AjaxCallerData(link, this.SUCCESSOldSetup.bind(this));
        },
        SUCCESSOldSetup: function (Jdata) {
            this.ModelDetailPages.setProperty("/SetupLinea/Old/", Jdata);
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_SetupNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreNew&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
            }
            this.AjaxCallerData(link, this.SUCCESSNewSetup.bind(this));
        },
        SUCCESSNewSetup: function (Jdata) {
            this.ModelDetailPages.setProperty("/SetupLinea/New/", Jdata);
            this.ModelDetailPages.setProperty("/SetupLinea/Modify/", JSON.parse(JSON.stringify(Jdata)));
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
            mod = this.RecursivePropertyCopy(mod, "valueModify", "value");
            if (this.ModelDetailPages.getData().SKUBatch.Batch[0].IsAttrezzaggio === "0") {
                mod = this.RecursivePropertyAdder(mod, "codeValueModify");
            }
            this.backupSetupModify = JSON.parse(JSON.stringify(mod));
            this.ModelDetailPages.setProperty("/SetupLinea/Old/", std);
            this.ModelDetailPages.setProperty("/SetupLinea/New/", bck);
            this.ModelDetailPages.setProperty("/SetupLinea/Modify/", mod);
            if (this.ModelDetailPages.getData().SKUBatch.Batch[0].IsAttrezzaggio === "0") {
                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLinea"));
            } else {
                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLineaAttrezzaggio"));
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            if (this.ModelDetailPages.getData().SKUBatch.Batch[0].IsAttrezzaggio === "0") {
                setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, [this.getView().byId("TreeTable_ConfermaSetupOld"), this.getView().byId("TreeTable_ConfermaSetupNew")]), 0);
            } else {
                setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, [this.getView().byId("TreeTable_AttrezzaggioOld"), this.getView().byId("TreeTable_AttrezzaggioNew")]), 0);
            }
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
            this.Item.setName("CONFERMA PREDISPOSIZIONE");
            var inputValueMod = new sap.m.Input({
                editable: "{= ${GeneralModel>modify} === 1}",
                visible: "{= ${GeneralModel>modify} === 1}",
                value: "{GeneralModel>valueModify}"});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "{GeneralModel>codePlaceholder}",
                editable: "{= ${GeneralModel>code} === 1}",
                value: "{GeneralModel>codeValue}"});
            inputCodeValue.addStyleClass("diffStandard");
            var TT = "TreeTable_FinePredisposizione";
            var btn1, btn2, btn3, btn4;
            var TreeTable = new CustomTreeTable({
                id: TT,
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 11,
                cellClick: [TT, this.TreeTableRowClickExpander, this],
                toolbar: [
                    new sap.m.Toolbar({
                        content: [
                            btn1 = new sap.m.Button({text: "Ripristina valori", press: [this.RestoreDefault, this]}),
                            new sap.m.ToolbarSpacer({}),
                            btn2 = new sap.m.Button({text: "Collassa", press: [TT, this.CollapseAll, this]}),
                            btn3 = new sap.m.Button({text: "Espandi", press: [TT, this.ExpandAll, this]}),
                            btn4 = new sap.m.Button({text: "Da confermare", press: [TT, this.ShowRelevant, this]})
                        ]})],
                columns: [
                    new sap.ui.table.Column({
                        label: "Attributi",
                        resizable: false,
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>name}"})}),
                    new sap.ui.table.Column({
                        label: "Valore",
                        resizable: false,
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "Modifica",
                        resizable: false,
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "Sigle",
                        resizable: false,
                        width: "5rem",
                        template: inputCodeValue})
                ]
            });
            btn1.addStyleClass("TTButton");
            btn2.addStyleClass("TTButton");
            btn3.addStyleClass("TTButton");
            btn4.addStyleClass("TTButton");
            var hbox = new sap.m.HBox({});
            var vb3 = new sap.m.VBox({width: "47%"});
            var vb4 = new sap.m.VBox({width: "6%"});
            var vb5 = new sap.m.VBox({width: "47%"});
            var bt2 = new sap.m.Button({
                text: "ANNULLA",
                width: "100%",
                press: [this.AnnullaPredisposizione, this]});
            bt2.addStyleClass("annullaButton");
            var bt3 = new sap.m.Button({
                text: "CONFERMA",
                width: "100%",
                press: [this.ConfermaPredisposizione, this]});
            bt3.addStyleClass("confermaButton");
            vb5.addItem(bt3);
            vb3.addItem(bt2);
            vb4.addItem(new sap.m.Text({}));
            hbox.addItem(vb3);
            hbox.addItem(vb4);
            hbox.addItem(vb5);
            this.Item.addContent(TreeTable);
            this.Item.addContent(hbox);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.RemoveClosingButtons(3);
            this.EnableButtons([]);
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
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

            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            data = this.RecursivePropertyCopy(data, "value", "valueModify");
            data = this.RecursivePropertyCopy(data, "codeValueModify", "codeValue");
            this.backupSetupModify = JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.Modify));
            this.codeCheck = 0;
            data = this.RecursiveJSONCodeCheck(data, "codeValue");
            if (this.codeCheck === 0) {

                var tab = this.TabContainer.getItems()[2];
                this.TabContainer.removeItem(tab);
                this.Item.destroyContent();
                var link;
                if (this.ISLOCAL === 1) {
                    this.AjaxCallerData("model/JSON_Progress.json", this.LOCALInProgress.bind(this));
                } else {
                    var XMLstring = this.XMLSetupUpdates(data);
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=0";
                    this.SyncAjaxCallerData(link, this.SUCCESSConfermaAttrezzaggio.bind(this));
                }
            } else {
                MessageToast.show("Tutti i codici Lotto/Matricola devono essere inseriti.");
            }
        },
        SUCCESSConfermaAttrezzaggio: function (Jdata) {
            this.ModelDetailPages.setProperty("/SuccessConfermaAttrezzaggio/", Jdata);
            if (Jdata.error === 0) {
                this.RefreshCall();
            } else {
                alert(Jdata.errorMessage);
            }
        },
        //        -------------------------  LAVORAZIONE  -------------------------       



//      RICHIAMATO DAL PULSANTONE VERDE A FIANCO DELLA PROGRESS BAR
        SPCGraph: function () {
            alert("Grafico SPC");
        },
//      RICHIAMATO DAL PULSANTE "MODIFICA CONDIZIONI OPERATIVE"
//          Questa funzione permette dimodificare le condizioni operative in corso d'opera
        ModificaCondizioni: function () {
            if (typeof this.ModelDetailPages.getData().SetupLinea === "undefined") {
                this.ModelDetailPages.setProperty("/SetupLinea/", {});
            }
            if (this.ISLOCAL === 1) {
                this.SUCCESSModificaCondizioni();
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreMod&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.AjaxCallerData(link, this.SUCCESSModificaCondizioni.bind(this));
            }
        },
        SUCCESSModificaCondizioni: function (Jdata) {
            if (this.ISLOCAL !== 1) {
                this.ModelDetailPages.setProperty("/SetupLinea/Modify/", Jdata);
            }
            var mod = this.ModelDetailPages.getData().SetupLinea.Modify;
            mod = this.RecursiveLinkRemoval(mod);
            mod = this.RecursiveModifyExpansion(mod);
            mod = this.RecursiveParentExpansion(mod);
            mod = this.RecursivePropertyAdder(mod, "valueModify");
            mod = this.RecursivePropertyAdder(mod, "codeValueModify");
            mod = this.RecursivePropertyCopy(mod, "valueModify", "value");
            mod = this.RecursivePropertyCopy(mod, "codeValueModify", "codeValue");
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", mod);
            this.backupSetupModify = JSON.parse(JSON.stringify(mod));
            this.getSplitAppObj().toDetail(this.createId("ModificaCondizioni"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.TabContainer = this.getView().byId("TabContainer-mod");
            this.RemoveClosingButtons(2);
            this.Item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(this.Item);
            this.EnableButtons([]);
        },
//      RICHIAMATO DAL PULSANTE DI ANNULLA NELLE MODIFICHE
        AnnullaModifica: function () {
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
            this.FermiAutomaticiCheck("Disponibile.Lavorazione");
        },
//      RICHIAMATO DAL PULSANTE DI CONFERMA NELLE MODIFICHE
        ConfermaModifica: function () {

            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            this.codeCheck = 0;
            data = this.RecursiveJSONCodeCheck(data, "codeValueModify");
            if (this.codeCheck === 0) {

                data = this.RecursivePropertyCopy(data, "value", "valueModify");
                data = this.RecursivePropertyCopy(data, "codeValue", "codeValueModify");
                this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
                this.backupSetupModify = JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.Modify));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                this.FermiAutomaticiCheck("Disponibile.Lavorazione");
                if (this.ISLOCAL !== 1) {
                    var XMLstring = this.XMLSetupUpdates(data);
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=1";
                    this.AjaxCallerData(link, this.SUCCESSConfermaModifica.bind(this));
                }
            } else {
                MessageToast.show("Non puoi confermare codici Lotto/Matricola vuoti.");
            }
        },
        SUCCESSConfermaModifica: function (Jdata) {
            this.ModelDetailPages.setProperty("/SuccessConfermaModifica/", Jdata);
            if (Jdata.error === 1) {
                alert(Jdata.errorMessage);
            }
        },
//        ----------------------  FERMO  ----------------------


//      RICHIAMATO DAL PULSANTE "FERMO"
        Fermo: function () {
            this.discr = "FermoManuale";
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermo&Content-Type=text/json&OutputParameter=JSON&IsManuale=1";
            }
            this.AjaxCallerData(link, this.SUCCESSFermo.bind(this));
        },
        SUCCESSFermo: function (Jdata) {
            this.ModelDetailPages.setProperty("/CausaliFermi/", Jdata);
            this.getSplitAppObj().toDetail(this.createId("Fermo"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var data = this.ModelDetailPages.getData().CausaliFermi.gerarchie;
            var num_gerarchie = data.length;
            var ID, CB;
            var cols = 2;
            var rows = Math.ceil(num_gerarchie / cols);
            this.outerVBox = this.getView().byId("vboxFermo");
            var vvbb1 = new sap.m.VBox({height: "80%", width: "100%"});
            var vvbb2 = new sap.m.VBox({height: "5%", width: "100%"});
            var vvbb3 = new sap.m.VBox({height: "10%", width: "100%"});
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
            vvbb1.addItem(hbox);
            this.outerVBox.addItem(vvbb1);
            this.outerVBox.addItem(vvbb2);
            var hbox1 = new sap.m.HBox({});
            var vb0 = new sap.m.VBox({width: "10%"});
            var vb01 = new sap.m.VBox({width: "37%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "37%"});
            var vb4 = new sap.m.VBox({width: "10%"});
            var bt1 = new sap.m.Button({
                id: "AnnullaFermo",
                text: "ANNULLA",
                width: "100%",
                enabled: true,
                press: [this.AnnullaFermo, this]});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                id: "ConfermaFermo",
                text: "CONFERMA",
                width: "100%",
                enabled: false,
                press: [this.ConfermaFermo, this]});
            bt2.addStyleClass("confermaButton");
            vb3.addItem(bt2);
            vb01.addItem(bt1);
            vb0.addItem(new sap.m.Text({}));
            vb2.addItem(new sap.m.Text({}));
            vb4.addItem(new sap.m.Text({}));
            hbox1.addItem(vb0);
            hbox1.addItem(vb01);
            hbox1.addItem(vb2);
            hbox1.addItem(vb3);
            hbox1.addItem(vb4);
            vvbb3.addItem(hbox1);
            this.outerVBox.addItem(vvbb3);
            this.outerVBox.addItem(vvbb2);
            this.EnableButtons([]);
        },
//      RICHIAMATO DAL PULSANTE DI ANNULLA NEL FERMO
        AnnullaFermo: function () {
            if (this.discr === "FermoManuale") {
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                this.FermiAutomaticiCheck("Disponibile.Lavorazione");
            } else if (this.discr === "FermoAutomatico") {
                this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));
                this.UncheckCause();
                this.EnableButtons([]);
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
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

                this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO - " + CB.getProperty("text"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                if (this.ISLOCAL === 1) {
                    this.Item = {};
                    var now = new Date();
                    this.Item.inizio = this.DateToStandard(now);
                    this.Item.causa = CB.getProperty("text");
                    this.SwitchColor("red");
                    this.getSplitAppObj().toDetail(this.createId("Fault"));
                    this.EnableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                    this.LOCALState = "Disponibile.Fermo";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchInFermoManuale&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&CausaleEventoID=" + id;
                    this.AjaxCallerVoid(link, this.RefreshCall.bind(this));
                }
            } else if (this.discr === "FermoAutomatico") {

                this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
                var vbox = this.getView().byId("vbox_table");
                vbox.destroyItems();
                if (this.ISLOCAL === 1) {
                    var data = this.ModelDetailPages.getData().FermiNonCausalizzati;
                    var data_All = this.ModelDetailPages.getData().FermiTotali;
                    for (var i = 0; i < data.fermi.length; i++) {
                        if (data.fermi[i].select > 0) {
                            data.fermi[i].causa = CB.getProperty("text");
                            for (var j in data_All.fermi) {
                                if (data.fermi[i].inizio === data_All.fermi[j].inizio) {
                                    data_All.fermi[j].causa = CB.getProperty("text");
                                    break;
                                }
                            }
                        }
                    }
                    this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", data);
                    this.ModelDetailPages.setProperty("/FermiTotali/", data_All);
                    this.LOCALUpdateFaultsModels();
                    var dataProgress = this.ModelDetailPages.getData().DatiOEE;
                    dataProgress.tempoFermiAutomatici = this.ModelDetailPages.getData().FermiNonCausalizzati.Totale.tempoGuastoTotale;
                    this.ModelDetailPages.setProperty("/DatiOEE/", dataProgress);
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.Causalizzazione();
                } else {
                    var string = this.GetStringIDFermiAuto();
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdateLogFermiAutoSenzaCausale&Content-Type=text/json&ListLogID=" + string + "&CausaleID=" + id;
                    this.AjaxCallerVoid(link, this.Causalizzazione.bind(this));
                }
            }
            this.outerVBox.destroyItems();
        },
        //        ----------------------  RIAVVIO  ----------------------



//      RICHIAMATO DAL PULSANTE "RIAVVIO"
        Riavvio: function () {
            if (typeof this.ModelDetailPages.getData().SetupLinea === "undefined") {
                this.ModelDetailPages.setProperty("/SetupLinea/", {});
            }
            if (this.ISLOCAL === 1) {
                this.SUCCESSRiavvio();
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreMod&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.AjaxCallerData(link, this.SUCCESSRiavvio.bind(this));
            }
        },
        SUCCESSRiavvio: function (Jdata) {
            if (this.ISLOCAL !== 1) {
                this.ModelDetailPages.setProperty("/SetupLinea/Modify/", Jdata);
            }
            var mod = this.ModelDetailPages.getData().SetupLinea.Modify;
            mod = this.RecursiveLinkRemoval(mod);
            mod = this.RecursiveModifyExpansion(mod);
            mod = this.RecursiveParentExpansion(mod);
            mod = this.RecursivePropertyAdder(mod, "valueModify");
            mod = this.RecursivePropertyAdder(mod, "codeValueModify");
            mod = this.RecursivePropertyCopy(mod, "valueModify", "value");
            mod = this.RecursivePropertyCopy(mod, "codeValueModify", "codeValue");
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", mod);
            this.backupSetupModify = JSON.parse(JSON.stringify(mod));
            this.getSplitAppObj().toDetail(this.createId("RipristinoCondizioni"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.EnableButtons([]);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        AnnullaRipristino: function () {
            this.getSplitAppObj().toDetail(this.createId("Fault"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.EnableButtons(["ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        ConfermaRipristino: function () {

            var link;
            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            this.codeCheck = 0;
            data = this.RecursiveJSONCodeCheck(data, "codeValueModify");
            if (this.codeCheck === 0) {

                data = this.RecursivePropertyCopy(data, "value", "valueModify");
                data = this.RecursivePropertyCopy(data, "codeValue", "codeValueModify");
                this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
                this.backupSetupModify = JSON.parse(JSON.stringify(this.ModelDetailPages.getData().SetupLinea.Modify));
                if (this.ISLOCAL === 1) {
                    this.getSplitAppObj().toDetail(this.createId("InProgress"));
                    var now = new Date();
                    this.Item.fine = this.DateToStandard(now);
                    this.LOCALAggiornaFermi();
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                    this.FermiAutomaticiCheck();
                    this.SwitchColor("green");
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.LOCALState = "Disponibile.Lavorazione";
                } else {
                    var XMLstring = this.XMLSetupUpdates(data);
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=2";
                    this.SyncAjaxCallerData(link, this.SUCCESSConfermaRipristino.bind(this));
                }
            } else {
                MessageToast.show("Non puoi confermare codici Lotto/Matricola vuoti.");
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
        },
        SUCCESSConfermaRipristino: function (Jdata) {
            this.ModelDetailPages.setProperty("/SuccessRiavvio/", Jdata);
            if (Jdata.error === 0) {
                this.RefreshCall();
            } else {
                alert(Jdata.errorMessage);
            }
        },
//        ---------------  CAUSALIZZAZIONE ----------------


//      
//      RICHIAMATO DAL PULSANTE "CAUSALIZZAZIONE FERMI AUTOMATICI"
        Causalizzazione: function () {

            if (this.ISLOCAL === 1) {
                this.SUCCESSCausalizzazione();
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausa&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.AjaxCallerData(link, this.SUCCESSCausalizzazione.bind(this));
            }
        },
        SUCCESSCausalizzazione: function (Jdata) {

            if (this.ISLOCAL !== 1) {
                this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", this.AddTimeGaps(Jdata));
                this.AggiungiSelezioneFermiNonCausalizzati();
            }

            this.getView().byId("vbox_table").destroyItems();
            if (this.ModelDetailPages.getData().FermiNonCausalizzati.fermi.length === 0) {
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
//                }
            } else {
                var tot = this.ModelDetailPages.getData().FermiNonCausalizzati.Totale;
                var table = new sap.m.Table({
                    id: "TotaleTable",
                    columns: [
                        new sap.m.Column({
                            hAlign: "Center",
                            resizable: false,
                            width: "30%"}),
                        new sap.m.Column({
                            hAlign: "Center",
                            resizable: false,
                            width: "15%"}),
                        new sap.m.Column({
                            hAlign: "Center",
                            resizable: false,
                            width: "45%"}),
                        new sap.m.Column({
                            hAlign: "Center",
                            resizable: false,
                            width: "10%"})
                    ]
                });
                table.addStyleClass("mysapMTable");
                var ColumnList = new sap.m.ColumnListItem();
                ColumnList.addCell(new sap.m.Text({text: "Totale Complessivo", textAlign: "Center"}));
                ColumnList.addCell(new sap.m.Text({text: tot.tempoGuastoTotale}));
                ColumnList.addCell(new sap.m.Text({text: tot.causaTotale}));
                ColumnList.addCell(new sap.m.CheckBox({textAlign: "Center", id: "CBTotaleCausa", selected: tot.select, select: [this.ChangeSelezioneTotaleCausalizzazione, this]}));
                ColumnList.addStyleClass("mysapMListTblCell");
                ColumnList.addStyleClass("mysapMText");
                ColumnList.addStyleClass("mysapMCb");
                table.addItem(ColumnList);
                this.getView().byId("vbox_table").addItem(table);
            }
            this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.UncheckCause();
            this.EnableButtons([]);
        },
//      RICHIAMATO DAL PULSANTE DI CAUSALIZZA
        Causalizza: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermo&Content-Type=text/json&OutputParameter=JSON&IsManuale=0";
            }
            this.discr = "FermoAutomatico";
            this.AjaxCallerData(link, this.SUCCESSFermo.bind(this));
        },
//      RICHIAMATO DAL PULSANTE DI ESCI NELLA CAUSALIZZAZIONE
        EsciCausalizzazione: function () {
            if (this.ISLOCAL === 1) {
                if (this.LOCALState === "Disponibile.Lavorazione") {
                    this.getSplitAppObj().toDetail(this.createId("InProgress"));
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                    this.FermiAutomaticiCheck();
                } else if (this.LOCALState === "Disponibile.Svuotamento") {
                    this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
                    this.LOCALAggiornaChiusura();
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.EnableButtons(["ButtonCausalizzazione"]);
                    this.FermiAutomaticiCheck();
                }
            } else {
                if (this.ModelDetailPages.getData().SKUBatch.StatoLinea === "Disponibile.Lavorazione") {
                    this.getSplitAppObj().toDetail(this.createId("InProgress"));
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                    this.FermiAutomaticiCheck("Disponibile.Lavorazione");
                } else if (this.ModelDetailPages.getData().SKUBatch.StatoLinea === "Disponibile.Svuotamento") {
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/RiassuntoOperatore&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                    this.SyncAjaxCallerData(link, this.SUCCESSChiusura.bind(this));
                }
            }

            var vbox = this.getView().byId("vbox_table");
            vbox.destroyItems();
        },
// ----------------- CHIUSURA CONFEZIONAMENTO ---------------------        



//      RICHIAMATO DAL PULSANTE "CHIUSURA CONFEZIONAMENTO"
        ChiusuraConfezionamento: function () {
            this.Dialog = this.getView().byId("AskClosing");
            if (!this.Dialog) {
                this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.AskClosing", this);
                this.getView().addDependent(this.Dialog);
            }
            this.Dialog.open();
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA CHIUSURA CONFEZIONAMENTO"
        ConfermaChiusuraConfezionamento: function () {
            this.Dialog.close();
            if (this.ISLOCAL === 1) {
                this.SwitchColor("brown");
                this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.EnableButtons(["ButtonCausalizzazione"]);
                this.FermiAutomaticiCheck("Disponibile.Svuotamento");
                this.LOCALState = "Disponibile.Svuotamento";
                this.LOCALAggiornaChiusura();
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchInChiusura&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshCall.bind(this));
            }
        },
//      RICHIAMATO DAL PULSANTE "ANNULLA CHIUSURA CONFEZIONAMENTO"
        AnnullaChiusuraConfezionamento: function () {
            this.Dialog.close();
        },
        SvuotaLinea: function () {
            var temp = {"linea": this.ModelDetailPages.getData().DettaglioLinea.Linea, "descrizione": "", "conforme": ""};
            this.ModelDetailPages.setProperty("/Intestazione/", temp);
            if (this.ISLOCAL === 1) {
                this.getSplitAppObj().toDetail(this.createId("Home"));
                this.SwitchColor("");
                this.DestroyButtons();
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.LOCALState = "Disponibile.Vuota";
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchChiuso&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshCall.bind(this));
            }
        },
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------
//-------------------------------  ATTREZZAGGIO INDOMANI  -------------------------------
//---------------------------------------------------------------------------------------


//      -------------------------- PRESA IN CARICO --------------------------
        BatchAttrezzaggio: function () {
            var std = this.ModelDetailPages.getData().SKUBatch.SKUstandard;
            var bck = this.ModelDetailPages.getData().SKUBatch.SKUattuale;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
            this.EnableButtonsAttr([]);
            this.getSplitAppObj().toDetail(this.createId("BatchAttrezzaggio"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
        },
        //        RICHIAMATO DAL BOTTONE "CONFERMA" NELLA SCHERMATA DI PRESA IN CARICO
//          Questa funzione assegna i modelli alle TreeTables, rimuove la possibilità di
//          chiudere le tabs e imposta il colore giallo al pannello laterale.
        ConfermaBatchAttrezzaggio: function () {
            var link;
            if (this.ISLOCAL === 1 && this.ISATTR === 1) {
                this.SwitchColor("yellow");
                this.EnableButtonsAttr(["ButtonFinePredisposizioneAttrezzaggio", "ButtonSospensioneAttrezzaggio"]);
                this.PredisposizioneLineaAttrezzaggio();
                this.LOCALState = "Disponibile.Attrezzaggio";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchPredisposizionePresoInCarico&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshCall.bind(this));
            }
        },
//      -------------------------- ATTREZZAGGIO --------------------------


        PredisposizioneLineaAttrezzaggio: function () {
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            this.RemoveClosingButtons(2);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
            this.ModelDetailPages.setProperty("/SetupLinea/", {});
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_SetupOld.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreOld&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
            }
            this.AjaxCallerData(link, this.SUCCESSOldSetup.bind(this));
        },
//        RICHIAMATO DAL PULSANTE "FINE PREDISPOSIZIONE INIZIO CONFEZIONAMENTO"
//          Questa funzione chiude innanzitutto tutte le tabs chiudibili e crea una nuova tab
//          nella quale viene messa la TreeTabledi fine predisposizione ed il bottone
//          di conferma. Alla fine aggiunge il tab al tab container e rimuove tutti i
//          pulsanti che possono chiudere le tabs.
        FinePredisposizioneAttrezzaggio: function () {

            var data = {"stringa": "SOLO PREDISPOSIZIONE"};
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
            this.Item.setName("CONFERMA PREDISPOSIZIONE");
            var inputValueMod = new sap.m.Input({
                editable: "{= ${GeneralModel>modify} === 1}",
                visible: "{= ${GeneralModel>modify} === 1}",
                value: "{GeneralModel>valueModify}"});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "{GeneralModel>codePlaceholder}",
                editable: "{= ${GeneralModel>code} === 1}",
                value: "{GeneralModel>codeValue}"});
            inputCodeValue.addStyleClass("diffStandard");
            var TT = "TreeTable_FinePredisposizioneAttrezzaggio";
            var btn1, btn2, btn3, btn4;
            var TreeTable = new CustomTreeTable({
                id: TT,
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 11,
                cellClick: [TT, this.TreeTableRowClickExpander, this],
                toolbar: [
                    new sap.m.Toolbar({
                        content: [
                            btn1 = new sap.m.Button({text: "Ripristina valori", press: [this.RestoreDefault, this]}),
                            new sap.m.ToolbarSpacer({}),
                            btn2 = new sap.m.Button({text: "Collassa", press: [TT, this.CollapseAll, this]}),
                            btn3 = new sap.m.Button({text: "Espandi", press: [TT, this.ExpandAll, this]}),
                            btn4 = new sap.m.Button({text: "Da confermare", press: [TT, this.ShowRelevant, this]})
                        ]})],
                columns: [
                    new sap.ui.table.Column({
                        label: "ATTRIBUTI",
                        resizable: false,
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>name}"})}),
                    new sap.ui.table.Column({
                        label: "VALORE",
                        resizable: false,
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "MODIFICA",
                        resizable: false,
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "SIGLE",
                        resizable: false,
                        width: "5rem",
                        template: inputCodeValue})
                ]
            });
            btn1.addStyleClass("TTButton");
            btn2.addStyleClass("TTButton");
            btn3.addStyleClass("TTButton");
            btn4.addStyleClass("TTButton");
            var hbox = new sap.m.HBox({});
            var vb1 = new sap.m.VBox({width: "47%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "47%"});
            var bt1 = new sap.m.Button({
                text: "ANNULLA",
                width: "100%",
                press: [this.AnnullaAttrezzaggio, this]});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                text: "CONFERMA",
                width: "100%",
                press: ['F', this.ConfermaAttrezzaggio, this]});
            bt2.addStyleClass("confermaButton");
            vb3.addItem(bt2);
            vb1.addItem(bt1);
            vb2.addItem(new sap.m.Text({}));
            hbox.addItem(vb1);
            hbox.addItem(vb2);
            hbox.addItem(vb3);
            this.Item.addContent(TreeTable);
            this.Item.addContent(hbox);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.RemoveClosingButtons(3);
            this.EnableButtonsAttr([]);
        },
        SospensioneAttrezzaggio: function () {

            var data = {"stringa": "SOSPENSIONE PREDISPOSIZIONE"};
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
            this.Item.setName("SOSPENSIONE PREDISPOSIZIONE");
            var inputValueMod = new sap.m.Input({
                editable: "{= ${GeneralModel>modify} === 1}",
                visible: "{= ${GeneralModel>modify} === 1}",
                value: "{= ${GeneralModel>modify} === 1 ? '#ND': ''}"});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "",
                editable: "{= ${GeneralModel>code} === 1}",
                value: ""});
            inputCodeValue.addStyleClass("diffStandard");
            var TT = "TreeTable_FinePredisposizioneAttrezzaggio";
            var btn1, btn2, btn3, btn4;
            var TreeTable = new CustomTreeTable({
                id: TT,
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 11,
                cellClick: [TT, this.TreeTableRowClickExpander, this],
                toolbar: [
                    new sap.m.Toolbar({
                        content: [
                            btn1 = new sap.m.Button({text: "Ripristina valori", press: [this.RestoreDefault, this]}),
                            new sap.m.ToolbarSpacer({}),
                            btn2 = new sap.m.Button({text: "Collassa", press: [TT, this.CollapseAll, this]}),
                            btn3 = new sap.m.Button({text: "Espandi", press: [TT, this.ExpandAll, this]}),
                            btn4 = new sap.m.Button({text: "Da confermare", press: [TT, this.ShowRelevant, this]})
                        ]})],
                columns: [
                    new sap.ui.table.Column({
                        label: "ATTRIBUTI",
                        resizable: false,
                        width: "15rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>name}"})}),
                    new sap.ui.table.Column({
                        label: "VALORE",
                        resizable: false,
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "MODIFICA",
                        resizable: false,
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "SIGLE",
                        resizable: false,
                        width: "5rem",
                        template: inputCodeValue})
                ]
            });
            btn1.addStyleClass("TTButton");
            btn2.addStyleClass("TTButton");
            btn3.addStyleClass("TTButton");
            btn4.addStyleClass("TTButton");
            var hbox = new sap.m.HBox({});
            var vb1 = new sap.m.VBox({width: "47%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "47%"});
            var bt1 = new sap.m.Button({
                text: "ANNULLA",
                width: "100%",
                press: [this.AnnullaAttrezzaggio, this]});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                text: "CONFERMA",
                width: "100%",
                press: ['S', this.ConfermaAttrezzaggio, this]});
            bt2.addStyleClass("confermaButton");
            vb3.addItem(bt2);
            vb1.addItem(bt1);
            vb2.addItem(new sap.m.Text({}));
            hbox.addItem(vb1);
            hbox.addItem(vb2);
            hbox.addItem(vb3);
            this.Item.addContent(TreeTable);
            this.Item.addContent(hbox);
            this.TabContainer.addItem(this.Item);
            this.TabContainer.setSelectedItem(this.Item);
            this.RemoveClosingButtons(3);
            this.EnableButtonsAttr([]);
        },
        AnnullaAttrezzaggio: function () {
            this.EnableButtonsAttr(["ButtonSospensioneAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio"]);
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            var tab = this.TabContainer.getItems()[2];
            this.TabContainer.removeItem(tab);
            this.TabContainer.setSelectedItem(this.TabContainer.getItems()[1]);
            this.Item.destroyContent();
        },
        ConfermaAttrezzaggio: function (event, source) {

            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            data = this.RecursivePropertyCopy(data, "value", "valueModify");
            this.codeCheck = 0;
            data = this.RecursiveJSONCodeCheck(data, "codeValue");
            if (this.codeCheck === 1 && source === 'F') {
                MessageToast.show("Tutti i codici Lotto/Matricola devono essere inseriti.");
            } else {
                var tab = this.TabContainer.getItems()[2];
                this.TabContainer.removeItem(tab);
                this.Item.destroyContent();
                if (this.ISLOCAL === 1) {
                    this.getSplitAppObj().toDetail(this.createId("ConfermaAttrezzaggio"));
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.SwitchColor("brown");
                    this.EnableButtonsAttr([]);
                } else {
                    var XMLstring = this.XMLSetupUpdates(data);
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=3";
                    this.AjaxCallerData(link, this.SUCCESSConfermaAttrezzaggio.bind(this));
                }
            }
        },
        // ------------------------ CHIUSURA ------------------------


        FineAttrezzaggio: function () {
            if (this.ISLOCAL === 1) {
                this.getSplitAppObj().toDetail(this.createId("Home"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.SwitchColor("");
                this.EnableButtonsAttr([]);
                this.DestroyButtons();
                var model = this.ModelDetailPages.getData();
                model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": "", "conforme": ""};
                this.ModelDetailPages.setProperty("/Intestazione/", model.Intestazione);
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchPredisposizioneChiuso&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.AjaxCallerVoid(link, this.RefreshCall.bind(this));
            }
        },
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------




//      ----------------------------------------------------------------------
//      -----------------------  FUNZIONI MASTER PAGE  -----------------------
//      ----------------------------------------------------------------------



        EnableButtons: function (vec) {
            var ButtonIDs = ["ButtonPresaInCarico", "ButtonFinePredisposizione", "ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"];
            var i;
            for (i in ButtonIDs) {
                sap.ui.getCore().byId(ButtonIDs[i]).setEnabled(false);
            }
            for (i in vec) {
                sap.ui.getCore().byId(vec[i]).setEnabled(true);
            }
//            for (i in vec) {
//                if (vec[i] !== "ButtonCausalizzazione") {
//                    sap.ui.getCore().byId(vec[i]).setEnabled(true);
//                } else {
//                    if (this.ModelDetailPages.getData().SKUBatch.StatoLinea === "Disoponibile.Lavorazione") {
//                        if (this.ModelDetailPages.getData().DatiOEE.tempoFermiAutomatici !== "0 ore, 0 min, 0 sec") {
//                            sap.ui.getCore().byId(vec[i]).setEnabled(true);
//                        } else {
//                            sap.ui.getCore().byId(vec[i]).setEnabled(false);
//                        }
//                    } else {
//                        if (this.ModelDetailPages.getData().ParametriChiusura.attributi[1].attributi[0].value !== "0 ore, 0 min, 0 sec") {
//                            sap.ui.getCore().byId(vec[i]).setEnabled(true);
//                        } else {
//                            sap.ui.getCore().byId(vec[i]).setEnabled(false);
//                        }
//                    }
//                }
//            }
        },
        FermiAutomaticiCheck: function (stato) {
            var id = "ButtonCausalizzazione";
            var fermiString;
            if (this.ISLOCAL === 1) {
                fermiString = this.ModelDetailPages.getData().FermiNonCausalizzati.Totale.tempoGuastoTotale;
                if (fermiString === "00:00:00") {
                    sap.ui.getCore().byId(id).setEnabled(false);
                }
            } else {
                if (stato === "Disponibile.Lavorazione") {
                    fermiString = this.ModelDetailPages.getData().DatiOEE;
                    if (typeof fermiString !== "undefined") {
                        if (fermiString.tempoFermiAutomatici === "0 ore, 0 min, 0 sec") {
                            sap.ui.getCore().byId(id).setEnabled(false);
                        }
                    }
                } else if (stato === "Disponibile.Svuotamento") {
                    fermiString = this.ModelDetailPages.getData().ParametriChiusura;
                    if (typeof fermiString !== "undefined") {
                        if (fermiString.attributi[1].attributi[0].value === "0 ore, 0 min, 0 sec") {
                            sap.ui.getCore().byId(id).setEnabled(false);
                        }
                    }
                }
            }
        },
        EnableButtonsAttr: function (vec) {
            var ButtonIDs = ["ButtonBatchAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio", "ButtonSospensioneAttrezzaggio"];
            var i;
            for (i in ButtonIDs) {
                sap.ui.getCore().byId(ButtonIDs[i]).setEnabled(false);
            }
            for (i in vec) {
                sap.ui.getCore().byId(vec[i]).setEnabled(true);
            }
        },
        SwitchColor: function (color) {
            var CSS_classes = ["stylePanelYellow", "stylePanelGreen", "stylePanelRed", "stylePanelBrown"];
            var CSS_classes_logo = ["logoBoxYellow", "logoBoxGreen", "logoBoxRed", "logoBoxBrown"];
            var panel = this.getView().byId("panel_processi");
            var logo = this.getView().byId("logoVbox");
            var clock = this.getView().byId("clock");
            for (var col in CSS_classes) {
                panel.removeStyleClass(CSS_classes[col]);
                logo.removeStyleClass(CSS_classes_logo[col]);
                clock.removeStyleClass(CSS_classes_logo[col]);
            }
            switch (color) {
                case "yellow":
                    panel.addStyleClass("stylePanelYellow");
                    logo.addStyleClass("logoBoxYellow");
                    clock.addStyleClass("logoBoxYellow");
                    break;
                case "green":
                    panel.addStyleClass("stylePanelGreen");
                    logo.addStyleClass("logoBoxGreen");
                    clock.addStyleClass("logoBoxGreen");
                    break;
                case "red":
                    panel.addStyleClass("stylePanelRed");
                    logo.addStyleClass("logoBoxRed");
                    clock.addStyleClass("logoBoxRed");
                    break;
                case "brown":
                    panel.addStyleClass("stylePanelBrown");
                    logo.addStyleClass("logoBoxBrown");
                    clock.addStyleClass("logoBoxBrown");
                    break;
            }
        },
        CreateButtons: function () {
            var vbox = this.getView().byId("panel_processi");
            var btn, btn_vbox;
            var IDs = ["ButtonPresaInCarico", "ButtonFinePredisposizione", "ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"];
            var texts = ["Presa in carico nuovo confezionamento", "Fine predisposizione inizio confezionamento", "Modifica condizioni operative", "Fermo", "Riavvio", "Causalizzazione fermi automatici", "Chiusura confezionamento svuotamento linea"];
            var press = [[this.PresaInCarico, this], [this.FinePredisposizione, this], [this.ModificaCondizioni, this], [this.Fermo, this], [this.Riavvio, this], [this.Causalizzazione, this], [this.ChiusuraConfezionamento, this]];
            var classes = ["styleLongButton", "styleLongButton", "styleButton", "styleButton", "styleButton", "styleButton", "styleLongButton"];
            var a = 5;
            var PBt = 10;
            for (var i in IDs) {
                if (i === "0") {
                    btn_vbox = new sap.m.VBox({height: String(a) + "%", width: "100%"});
                    btn_vbox.addItem(new sap.m.Text({}));
                    vbox.addItem(btn_vbox);
                }
                btn = new sap.m.Button({
                    id: IDs[i],
                    text: texts[i],
                    enabled: false,
                    width: "100%",
                    height: "100%",
                    press: press[i]});
                btn.addStyleClass(classes[i]);
                btn_vbox = new sap.m.VBox({height: String(PBt) + "%", width: "100%"});
                btn_vbox.addItem(btn);
                vbox.addItem(btn_vbox);
                if (i === "1" || i === "5") {
                    btn_vbox = new sap.m.VBox({height: String(2 * a) + "%", width: "100%"});
                    btn_vbox.addItem(new sap.m.Text({}));
                    vbox.addItem(btn_vbox);
                }
                if (i === "6") {
                    btn_vbox = new sap.m.VBox({height: String(a) + "%", width: "100%"});
                    btn_vbox.addItem(new sap.m.Text({}));
                    vbox.addItem(btn_vbox);
                }
            }
        },
        CreateButtonsAttr: function () {
            var vbox = this.getView().byId("panel_processi");
            var btn, btn_vbox;
            var IDs = ["ButtonBatchAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio", "ButtonSospensioneAttrezzaggio"];
            var texts = ["Predisposizione nuovo confezionamento", "Fine predisposizione", "Sospensione predisposizione"];
            var press = [[this.BatchAttrezzaggio, this], [this.FinePredisposizioneAttrezzaggio, this], [this.SospensioneAttrezzaggio, this]];
            var classes = ["styleLongButton", "styleButton", "styleButton"];
            var a = 5;
            var PBt = 10;
            for (var i in IDs) {
                if (i === "0") {
                    btn_vbox = new sap.m.VBox({height: String(a) + "%", width: "100%"});
                    btn_vbox.addItem(new sap.m.Text({}));
                    vbox.addItem(btn_vbox);
                }
                btn = new sap.m.Button({
                    id: IDs[i],
                    text: texts[i],
                    enabled: false,
                    width: "100%",
                    height: "100%",
                    press: press[i]});
                btn.addStyleClass(classes[i]);
                btn_vbox = new sap.m.VBox({height: String(PBt) + "%", width: "100%"});
                btn_vbox.addItem(btn);
                vbox.addItem(btn_vbox);
                if (i === "1") {
                    btn_vbox = new sap.m.VBox({height: String(2 * a) + "%", width: "100%"});
                    btn_vbox.addItem(new sap.m.Text({}));
                    vbox.addItem(btn_vbox);
                }
            }
            btn_vbox = new sap.m.VBox({height: String(11 * a) + "%", width: "100%"});
            btn_vbox.addItem(new sap.m.Text({}));
            vbox.addItem(btn_vbox);
        },
        DestroyButtons: function () {
            var vbox = this.getView().byId("panel_processi");
            vbox.destroyItems();
        },
//      -----------------------------------------------------------------------
//      -----------------------  FUNZIONI DETAIL PAGES  -----------------------
//      -----------------------------------------------------------------------


//      ----------------    FUNZIONI CONDIVISE DA PIU' PAGES    ----------------
//      Funzione che permette di cambiare pagina nello SplitApp
        getSplitAppObj: function () {
            var result = this.byId("SplitAppDemo");
            if (!result) {
                jQuery.sap.log.info("SplitApp object can't be found");
            }
            return result;
        },
        CollapseAll: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = sap.ui.getCore().byId(TT);
            }
            View.collapseAll();
        },
//      Funzione che espande tutti i nodi della treetable
        ExpandAll: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = sap.ui.getCore().byId(TT);
            }
            View.expandToLevel(20);
        },
//      Funzione richiamata da "non conformi" che prima espande tutti i nodi della treetable e poi richiude i non rilevanti 
        ShowRelevant: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = sap.ui.getCore().byId(TT);
            }
            View.expandToLevel(20);
            this.GlobalBusyDialog.open();
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, [View]), 0);
        },
//      Funzione che collassa i nodi della treetable non rilevanti
        CollapseNotRelevant: function (Views) {
            var total, temp;
            for (var i = 0; i < Views.length; i++) {
                total = Views[i]._iBindingLength;
                for (var j = total - 1; j >= 0; j--) {
                    temp = Views[i].getContextByIndex(j).getObject();
                    if (temp.expand === 0) {
                        Views[i].collapse(j);
                    }
                }
            }
            this.GlobalBusyDialog.close();
        },
        RestoreDefault: function () {
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
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
        TreeTableRowClickExpander: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = sap.ui.getCore().byId(TT);
            }
            var clicked_row = event.getParameters().rowIndex;
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_column === "0") {
                if (!View.isExpanded(clicked_row)) {
                    View.expand(clicked_row);
                } else {
                    View.collapse(clicked_row);
                }
            }
        },
//      ----------------    FUNZIONI ATTREZZAGGIO    ----------------

        LinkClick: function (event) {
            var ViewsIDs = this.GetViewsIds(event.getSource().data("mydata"));
            var Views = [this.getView().byId(ViewsIDs[0]), this.getView().byId(ViewsIDs[1])];
            var clicked_row = event.getParameters().rowIndex;
            var binding = event.getParameters().rowBindingContext.getObject();
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_column === "0") {
                for (var i = 0; i < Views.length; i++) {
                    if (!Views[i].isExpanded(clicked_row)) {
                        Views[i].expand(clicked_row);
                    } else {
                        Views[i].collapse(clicked_row);
                    }
                }
            } else {
                if (binding.expand === 3) {
                    var Item = new sap.m.TabContainerItem();
                    Item.setName(binding.value);
                    var image = new sap.m.Image();
                    image.setSrc("img/dececco.jpg");
                    image.setWidth("60%");
                    Item.addContent(image);
                    this.TabContainer.addItem(Item);
                    this.TabContainer.setSelectedItem(Item);
                }
            }
        },
        COUPLEDCollapseAll: function (event) {
            var ViewsIDs = this.GetViewsIds(event.getSource().data("mydata"));
            var Views = [this.getView().byId(ViewsIDs[0]), this.getView().byId(ViewsIDs[1])];
            Views[0].collapseAll();
            Views[1].collapseAll();
        },
        COUPLEDExpandAll: function (event) {
            var ViewsIDs = this.GetViewsIds(event.getSource().data("mydata"));
            var Views = [this.getView().byId(ViewsIDs[0]), this.getView().byId(ViewsIDs[1])];
            Views[0].expandToLevel(20);
            Views[1].expandToLevel(20);
        },
        COUPLEDShowRelevant: function (event) {
            var ViewsIDs = this.GetViewsIds(event.getSource().data("mydata"));
            var Views = [this.getView().byId(ViewsIDs[0]), this.getView().byId(ViewsIDs[1])];
            Views[0].expandToLevel(20);
            Views[1].expandToLevel(20);
            this.GlobalBusyDialog.open();
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, Views), 0);
        },
        GetViewsIds: function (string) {
            var IDs = [];
            var comma = string.indexOf(",");
            IDs.push(string.substring(0, comma));
            IDs.push(string.substring(comma + 1, string.length));
            return IDs;
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
//      ----------------    FUNZIONI LAVORAZIONE    ----------------
//      
        BarColor: function (data) {
            var CSS_classesButton = ["progressBarButtonGreen", "progressBarButtonYellow", "progressBarButtonOrange"];
            var button = this.getView().byId("progressBarButton");
            var bar = this.getView().byId("progressBar");
            for (var i = 0; i < CSS_classesButton.length; i++) {
                button.removeStyleClass(CSS_classesButton[i]);
            }
            switch (data.barColor) {
                case "yellow":
                    button.addStyleClass("progressBarButtonYellow");
                    bar.setState("Warning");
                    break;
                case "green":
                    button.addStyleClass("progressBarButtonGreen");
                    bar.setState("Success");
                    break;
                case "orange":
                    button.addStyleClass("progressBarButtonOrange");
                    bar.setState("Error");
                    break;
            }
        },
//      ----------------    FUNZIONI FERMO    ----------------

        GetStringIDFermiAuto: function () {
            var vec = this.ModelDetailPages.getData().FermiNonCausalizzati.fermi;
            var IDs = [];
            var i;
            for (i = 0; i < vec.length; i++) {
                if (vec[i].select > 0) {
                    IDs.push(vec[i].LogID);
                }
            }
            var string = "";
            if (IDs.length === 1) {
                string = String(IDs[0]);
            } else {
                for (i = 0; i < IDs.length; i++) {
                    string += (String(IDs[i]) + "-");
                }
                string = string.substring(0, string.length - 1);
            }
            return string;
        },
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
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
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
//      ----------------    FUNZIONI CAUSALIZZAZIONE    ----------------

        AggiungiSelezioneFermiNonCausalizzati: function () {
            var data = this.ModelDetailPages.getData().FermiNonCausalizzati;
            for (var i = 0; i < data.fermi.length; i++) {
                data.fermi[i].select = false;
                data.fermi[i].enable = true;
            }
            this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", data);
        },
        AddTimeGaps: function (data) {
            var millisec_diff = [];
            var start, end, i;
            for (i = 0; i < data.fermi.length; i++) {
                start = new Date(data.fermi[i].inizio);
                end = new Date(data.fermi[i].fine);
                millisec_diff.push(end - start);
                data.fermi[i].inizio = this.DateToStandard(start);
                data.fermi[i].fine = this.DateToStandard(end);
            }
            var temp;
            var sum = 0;
            var arrayGaps = [];
            for (i = 0; i < millisec_diff.length; i++) {
                temp = millisec_diff[i];
                sum += temp;
                arrayGaps.push(this.MillisecsToStandard(temp));
            }
            for (i = 0; i < arrayGaps.length; i++) {
                data.fermi[i].intervallo = arrayGaps[i];
            }
            data.Totale = {};
            data.Totale.tempoGuastoTotale = this.MillisecsToStandard(sum);
            data.Totale.causaleTotale = "";
            data.Totale.select = false;
            return data;
        },
        ChangeSelezioneTotaleCausalizzazione: function (event) {
            var id = event.getSource().getId();
            var CB = sap.ui.getCore().byId(id);
            var data = this.ModelDetailPages.getData().FermiNonCausalizzati;
            var i, cont;
            if (id === "CBTotaleCausa") {
                for (i = 0; i < data.fermi.length; i++) {
                    data.fermi[i].select = CB.getSelected();
                    data.fermi[i].enable = !CB.getSelected();
                }
                if (CB.getSelected()) {
                    this.CheckTotaleCausa = 1;
                } else {
                    this.CheckTotaleCausa = 0;
                }
            }
            cont = 0;
            for (i = 0; i < data.fermi.length; i++) {
                if (data.fermi[i].select) {
                    cont += 1;
                }
            }
            if (cont > 0) {
                this.getView().byId("ConfermaCausalizzazione").setEnabled(true);
            } else {
                this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
            }
            this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", data);
        },
        UncheckCause: function () {
            var i;
            var data = this.ModelDetailPages.getData().FermiNonCausalizzati;
            for (i = 0; i < data.fermi.length; i++) {
                data.fermi[i].select = false;
                data.fermi[i].enable = true;
            }
            if (typeof sap.ui.getCore().byId("TotaleTable") !== "undefined") {
                sap.ui.getCore().byId("CBTotaleCausa").setSelected(false);
                sap.ui.getCore().byId("CBTotaleCausa").setEnabled(true);
                this.CheckTotaleCausa = 0;
            }
            this.getView().byId("ConfermaCausalizzazione").setEnabled(false);
            this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", data);
        },
//      -----------------------------------------------------------------------
//      -----------------------  FUNZIONI DI SUPPORTO  ------------------------
//      -----------------------------------------------------------------------


//      ----------------    FUNZIONI PER LA GESTIONE DEI TEMPI    ----------------
//      
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
        FromISOToPOD: function (string) {
            var index = string.indexOf("T");
            return string.substring(0, index) + ", " + string.substring(index + 1, string.length);
        },
        GetData: function () {
            var day = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
            var month = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
            var today = new Date();
            var nday = today.getDay(),
                    nmonth = today.getMonth(),
                    ndate = today.getDate(),
                    nyear = today.getYear();
            if (nyear < 1000)
                nyear += 1900;
            return "" + day[nday] + " " + ndate + " " + month[nmonth] + " " + nyear;
        },
        GetOra: function () {
            var today = new Date();
            var nhour = today.getHours(),
                    nmin = today.getMinutes();
//                    nsec = today.getSeconds();
            if (nmin <= 9)
                nmin = "0" + nmin;
//            if (nsec <= 9)
//                nsec = "0" + nsec;
//            return "" + nhour + ":" + nmin + ":" + nsec + "";
            return "" + nhour + ":" + nmin;
        },
//      ----------------    FUNZIONI RICORSIVE    ----------------

        RecursiveJSONComparison: function (std, bck, arrayName) {
            for (var key in std) {
                if (typeof std[key] === "object") {
                    bck[key] = this.RecursiveJSONComparison(std[key], bck[key], arrayName);
                } else {
                    if (key === "value") {
                        if (bck[key] !== std[key] && bck.expand !== 3) {
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
                            std[key] = 1;
                        }
                    }
                    std[key] = this.RecursiveStandardAdapt(std[key], bck[key]);
                } else {
                    if (key === "expand") {
                        if (bck[key] > 0) {
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
                            temp.IDParametro = setup.IDParametro;
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
        RecursiveJSONCodeCheck: function (json, attr) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONCodeCheck(json[key], attr);
                } else {
                    if (key === "code") {
                        if (json[key] === 1) {
                            if (json[attr] === "") {
                                this.codeCheck = 1;
                                break;
                            }
                        }
                    }
                }
            }
            return json;
        },
//      -----------------------------------------------------------------------
//      --------------------------  FUNZIONI LOCALI  --------------------------
//      -----------------------------------------------------------------------

        LOCALCheckStatus: function (Jdata) {

            this.ModelDetailPages.setProperty("/SKUBatch/", Jdata);
            var model = this.ModelDetailPages.getData();
            var data = model.SKUBatch;
            model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": "", "conforme": ""};
            var descr = data.SKUattuale.attributi[2].attributi[2].value + " " + data.SKUattuale.attributi[2].attributi[3].value + " " + data.SKUattuale.attributi[3].attributi[0].value;
            model.Intestazione.descrizione = descr;
            data.SKUattuale = this.RecursiveJSONComparison(data.SKUstandard, data.SKUattuale, "attributi");
            data.SKUattuale = this.RecursiveParentExpansion(data.SKUattuale);
            this.exp = 0;
            data.SKUattuale = this.RecursiveJSONExpansionFinder(data.SKUattuale);
            if (this.exp === 1) {
                model.Intestazione.conforme = "***";
            }
            this.ModelDetailPages.setProperty("/Intestazione/", model.Intestazione);
            if (data.Batch[0].IsAttrezzaggio === "0") {
                this.CreateButtons();
                this.SwitchColor("");
                this.EnableButtons(["ButtonPresaInCarico"]);
            } else {
                this.CreateButtonsAttr();
                this.SwitchColor("");
                this.EnableButtonsAttr(["ButtonBatchAttrezzaggio"]);
            }
            this.LOCALState = "Disponibile.AttesaPresaInCarico";
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
        },
        LOCALLoadGuasti: function (Jdata) {
            var dataReduced = JSON.parse(JSON.stringify(Jdata));
            this.ModelDetailPages.setProperty("/FermiTotali/", this.AddTimeGaps(Jdata));
            dataReduced = this.LOCALRemoveCaused(dataReduced);
            dataReduced = this.AddTimeGaps(dataReduced);
            this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", dataReduced);
            this.AggiungiSelezioneFermiNonCausalizzati();
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var link = "model/JSON_Chiusura.json";
            this.AjaxCallerData(link, this.LOCALLoadChiusura.bind(this));
        },
        LOCALLoadChiusura: function (Jdata) {
            this.ModelDetailPages.setProperty("/ParametriChiusura/", Jdata);
            this.PredisposizioneLinea();
        },
        LOCALInProgress: function (Jdata) {
            Jdata.tempoFermiAutomatici = this.ModelDetailPages.getData().FermiNonCausalizzati.Totale.tempoGuastoTotale;
            this.ModelDetailPages.setProperty("/DatiOEE/", Jdata);
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            this.SwitchColor("green");
            this.BarColor(Jdata);
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
            this.FermiAutomaticiCheck();
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.LOCALState = "Disponibile.Lavorazione";
        },
        LOCALUpdateFaultsModels: function () {
            var data_NOcause = this.ModelDetailPages.getData().FermiNonCausalizzati;
            for (var i = data_NOcause.fermi.length - 1; i >= 0; i--) {
                var temp_item = data_NOcause.fermi[i];
                if (temp_item.causa !== "") {
                    data_NOcause.fermi.splice(i, 1);
                    data_NOcause.Totale.tempoGuastoTotale = this.MillisecsToStandard(this.StandardToMillisecs(data_NOcause.Totale.tempoGuastoTotale) - this.StandardToMillisecs(temp_item.intervallo));
                }
            }
            data_NOcause.Totale.select = false;
            this.ModelDetailPages.setProperty("/FermiNonCausalizzati/", data_NOcause);
        },
        LOCALAggiornaFermi: function () {
            this.Item.intervallo = this.MillisecsToStandard(this.StandardToMillisecs(this.Item.fine) - this.StandardToMillisecs(this.Item.inizio));
            var faults = this.ModelDetailPages.getData().FermiTotali;
            faults.Totale.tempoGuastoTotale = this.MillisecsToStandard(this.StandardToMillisecs(faults.Totale.tempoGuastoTotale) + this.StandardToMillisecs(this.Item.intervallo));
            faults.fermi.push(this.Item);
            this.ModelDetailPages.setProperty("/FermiTotali/", faults);
        },
        LOCALAggiornaChiusura: function () {
            var data = this.ModelDetailPages.getData();
            var index = this.LOCALGetIndex(data.ParametriChiusura.attributi, "Totale tempi di fermo");
            var index1 = this.LOCALGetIndex(data.ParametriChiusura.attributi[index].attributi, "Tempi di fermo non causalizzati");
            data.ParametriChiusura.attributi[index].attributi[index1].value = data.FermiNonCausalizzati.Totale.tempoGuastoTotale;
            this.ModelDetailPages.setProperty("/", data);
        },
        //      Funzione che rimuove i guasti non causalizzati
        LOCALRemoveCaused: function (data) {
            for (var i = data.fermi.length - 1; i >= 0; i--) {
                data.fermi[i].select = false;
                if (data.fermi[i].causa !== "") {
                    data.fermi.splice(i, 1);
                }
            }
            return data;
        },
        LOCALGetIndex: function (array, name) {
            for (var key in array) {
                if (array[key].name === name) {
                    break;
                }
            }
            return key;
        }
    });
    return TmpController;
});
