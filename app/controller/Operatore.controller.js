sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/CustomTreeTable',
    'sap/m/MessageToast',
    'myapp/control/CustomSPCButton'
], function (jQuery, Controller, JSONModel, CustomTreeTable, MessageToast, CustomSPCButton) {
    "use strict";
    var OperatoreController = Controller.extend("myapp.controller.Operatore", {

//      VARIABILI GLOBALI
        ISLOCAL: 0,
        ISATTR: 0,
        IDsTreeTables: new JSONModel({}),
        LineDetails: {Linea: "Coppia 05", idLinea: "1", Descrizione: "Penne mezzane rigate 241 - Astuccio 3000gr", Destinazione: "HBEX COMERCIAL EXPORTADORA E IMPORTAD. LTDA"},
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
        ClosingDialog: null,
        SPCDialog: null,
        Fase: null,
        Allarme: null,
        SPCText: null,
        index: null,
        GenSPCProgress: null,
        Counter: 10,
        SPCCounter: null,
        SPCTimer: null,
        TIMER: null,
        STOPSPC: null,
//------------------------------------------------------------------------------

        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("Operatore").attachPatternMatched(this.Starter, this);
        },
        Starter: function () {
            this.ModelDetailPages = new JSONModel({});
            clearInterval(this.TIMER);
            this.IDsTreeTables.setProperty("/IDs/", {});
            for (var key in this.IDsTreeTables.getData().IDs) {
                this.IDsTreeTables.getData().IDs[key] = 0;
            }
            sap.ui.getCore().setModel(this.IDsTreeTables, "IDsTreeTables");
            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
            sap.ui.getCore().setModel({ISLOCAL: this.ISLOCAL}, "ISLOCAL");
            this.ISATTR = Number(jQuery.sap.getUriParameters().get("ISATTR"));
            var link;
            if (this.ISLOCAL === 1) {
                this.ModelDetailPages.setProperty("/DettaglioLinea/", this.LineDetails);
                if (this.ISATTR === 1) {
                    link = "model/JSON_SKUBatch_ATTR.json";
                } else {
                    link = "model/JSON_SKUBatch.json";
                }
                this.AjaxCallerData(link, this.LOCALCheckStatus.bind(this));
            } else {
                this.ModelDetailPages.setProperty("/DettaglioLinea/", sap.ui.getCore().getModel("Global").getData());
                this.RefreshFunction(0);
            }

            var clockL2 = this.getView().byId("clockL2");
            var time = this.GetOra();
            clockL2.setText(time);
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    var time = that.GetOra();
                    clockL2.setText(time);
                    if (that.ISLOCAL !== 1) {
                        that.Counter++;
                        if (that.Counter >= 10) {
                            that.RefreshFunction();
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
//        -------------------------------------------------------------------------------------------
//        ------------------------- FUNZIONE CICLICA CHE CONTROLLA LO STATO -------------------------
//        -------------------------------------------------------------------------------------------


        RefreshFunction: function (msec) {
            this.Counter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            var data = this.ModelDetailPages.getData();
            if (typeof data.Linea === "undefined") {
                this.State = "";
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/StatusLinea&Content-Type=text/json&LineaID=" + data.DettaglioLinea.idLinea + "&OutputParameter=JSON";
            } else {
                if (data.Linea.StatoLinea === "Disponibile.AttesaPresaInCarico" || data.Linea.StatoLinea === "Disponibile.Vuota") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/StatusLinea&Content-Type=text/json&LineaID=" + data.DettaglioLinea.idLinea + "&OutputParameter=JSON";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/StatusLineaFast&Content-Type=text/json&LineaID=" + data.DettaglioLinea.idLinea + "&OutputParameter=JSON";
                }
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.SyncAjaxCallerData(link, this.CheckStatus.bind(this));
        },
        CheckStatus: function (Jdata) {
            this.ModelDetailPages.setProperty("/Linea/", Jdata);
            var link, key;
            var model = this.ModelDetailPages.getData();
            var data = model.Linea;
            model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": data.Batch.Descrizione, "destinazione": data.Batch.Destinazione};
            this.SetSizeDestinazione(data.Batch.Destinazione);
            model.Intestazione.StatoLinea = this.SetLinea(data.StatoLinea);
            this.ModelDetailPages.setProperty("/Intestazione/", model.Intestazione);
            if (typeof data.SKUattuale.attributi !== "undefined") {
                data.SKUattuale = this.RecursiveJSONComparison(data.SKUstandard, data.SKUattuale, "attributi");
                data.SKUattuale = this.RecursiveParentExpansion(data.SKUattuale);
                this.exp = 0;
                data.SKUattuale = this.RecursiveJSONExpansionFinder(data.SKUattuale);
                if (this.exp === 1) {
                    this.AddColorDescrizione("red");
                } else {
                    this.AddColorDescrizione("");
                }
                var SKU = {"SKUattuale": data.SKUattuale, "SKUstandard": data.SKUstandard};
                this.ModelDetailPages.setProperty("/SKU/", SKU);
            }

            if (data.StatoLinea !== "Disponibile.Vuota" && data.StatoLinea !== "NonDisponibile") {

                if (data.Batch.IsAttrezzaggio === "0") {
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
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/OEE_SPCBatchInCorso&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&OutputParameter=JSON";
                            this.SyncAjaxCallerData(link, this.SUCCESSLavorazioneOEE.bind(this));
                            break;
                        case "Disponibile.Fermo":
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/OEEBatchInCorso&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                            this.SyncAjaxCallerData(link, this.SUCCESSFermoOEE.bind(this));
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
                for (key in this.IDsTreeTables.getData().IDs) {
                    this.IDsTreeTables.getData().IDs[key] = 0;
                }
                switch (data.StatoLinea) {
                    case "Disponibile.Vuota":
                        this.GlobalBusyDialog.close();
                        this.getSplitAppObj().toDetail(this.createId("Home"));
                        this.SwitchColor("");
                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                        break;
                    case "NonDisponibile":
                        this.SwitchColor("red");
                        this.getSplitAppObj().toDetail(this.createId("Home"));
                        model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": "NON DISPONIBILE", "conforme": ""};
                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                        break;
                }
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.State = this.ModelDetailPages.getData().Linea.StatoLinea;
            this.Counter = 0;
        },
        SUCCESSLavorazioneOEE: function (Jdata) {
            if (Jdata.OEE.avanzamento >= 100) {
                Jdata.OEE.avanzamento = 100;
            }
            this.AddSpaces(Jdata.OEE);
            this.ModelDetailPages.setProperty("/DatiOEE/", Jdata.OEE);
            this.ModelDetailPages.setProperty("/DatiSPC/", Jdata.SPC);
            if (this.State !== "Disponibile.Lavorazione") {
                sap.ui.getCore().byId("ButtonFermo").setText("Fermo");
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.SwitchColor("green");
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                this.FermiAutomaticiCheck("Disponibile.Lavorazione");
            }
            this.BarColor(Jdata.OEE);
            if (typeof sap.ui.getCore().byId("SPCButton1") === 'undefined') {
                this.CreateSPCButton(Jdata.SPC);
            }
            this.SPCColor(Jdata.SPC);
        },
        SUCCESSFermoOEE: function (Jdata) {
            if (Jdata.avanzamento >= 100) {
                Jdata.avanzamento = 100;
            }
            if (this.SPCDialog) {
                if (this.SPCDialog.isOpen()) {
                    this.CloseSPCDialog();
                }
            }
            this.GlobalBusyDialog.close();
            this.AddSpaces(Jdata);
            this.ModelDetailPages.setProperty("/DatiOEE/", Jdata);
            var data = this.ModelDetailPages.getData().Linea;
            if (this.State !== "Disponibile.Fermo") {
                sap.ui.getCore().byId("ButtonFermo").setText("Modifica causale fermo");
                if (data.CausaleEvento === "---") {
                    this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO AUTOMATICO");
                } else {
                    this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO - " + data.CausaleEvento);
                }
                this.SwitchColor("red");
                this.getSplitAppObj().toDetail(this.createId("Fault"));
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
        },
        SUCCESSChiusura: function (Jdata) {
            this.GlobalBusyDialog.close();
            this.ModelDetailPages.setProperty("/ParametriChiusura/", Jdata);
            this.SwitchColor("brown");
            this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.EnableButtons(["ButtonCausalizzazione"]);
            this.FermiAutomaticiCheck("Disponibile.Svuotamento");
            var that = this;
            setTimeout(function () {
                that.ExpandAll(null, "TreeTable_Chiusura");
            }, 100);
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
//        success: jQuery.proxy(this.WrapperSuccessFunc, this, successFunc),
//        WrapperSuccessFunc: function (successFunc, Jdata) {
//            if (jQuery.isXMLDoc(Jdata)) {
//                Jdata = JSON.parse(Jdata.documentElement.textContent);
//            }
//            successFunc(Jdata);
//        },
//        ---------------------------------------------------------------------
//        ---------------------------  DETAIL PAGES  --------------------------
//        ---------------------------------------------------------------------


//        -------------------------  PRESA IN CARICO  -------------------------       




//        RICHIAMATO DAL BOTTONE "PRESA IN CARICO NUOVO CONFEZIONAMENTO"
        PresaInCarico: function () {

            var std = this.ModelDetailPages.getData().SKU.SKUstandard;
            var bck = this.ModelDetailPages.getData().SKU.SKUattuale;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
            this.EnableButtons([]);
            this.getSplitAppObj().toDetail(this.createId("PresaInCarico"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, "TreeTable_PresaInCarico");
            }, 500);
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
                this.GlobalBusyDialog.open();
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchPresoInCarico&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshFunction.bind(this));
            }
        },
//        -------------------------  ATTREZZAGGIO LINEA  -------------------------       




        PredisposizioneLinea: function () {

            this.TabContainer = this.getView().byId("TabContainer");
            var tab = this.TabContainer.getItems()[2];
            if (typeof tab !== "undefined") {
                this.TabContainer.removeItem(tab);
                this.Item.destroyContent();
            }
            if (sap.ui.getCore().byId("TreeTable_FinePredisposizione")) {
                sap.ui.getCore().byId("TreeTable_FinePredisposizione").destroy();
            }
            this.RemoveClosingButtons(2);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
            this.ModelDetailPages.setProperty("/SetupLinea/", {});
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_Setup.json";
                this.SwitchColor("yellow");
                this.EnableButtons(["ButtonFinePredisposizione"]);
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreCombo&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
            }
            this.AjaxCallerData(link, this.SUCCESSSetup.bind(this));
        },
        SUCCESSSetup: function (Jdata) {
            var std = Jdata.Old;
            var bck = Jdata.New;
            var mod = JSON.parse(JSON.stringify(Jdata.New));
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveLinkValue(bck);
            bck = this.RecursiveNotIncludedExpansion(bck);
            bck = this.RecursiveParentExpansion(bck);
            std = this.RecursiveStandardAdapt(std, bck);
            mod = this.RecursiveLinkRemoval(mod);
            mod = this.RecursiveModifyExpansion(mod);
            mod = this.RecursiveParentExpansion(mod);
            mod = this.RecursivePropertyAdder(mod, "valueModify");
            mod = this.RecursivePropertyCopy(mod, "valueModify", "value");
            if (this.ModelDetailPages.getData().Linea.Batch.IsAttrezzaggio === "0") {
                mod = this.RecursivePropertyAdder(mod, "codeValueModify");
            }
            this.backupSetupModify = JSON.parse(JSON.stringify(mod));
            this.ModelDetailPages.setProperty("/SetupLinea/Old/", std);
            this.ModelDetailPages.setProperty("/SetupLinea/New/", bck);
            this.ModelDetailPages.setProperty("/SetupLinea/Modify/", mod);
            if (this.ModelDetailPages.getData().Linea.Batch.IsAttrezzaggio === "0") {
                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLinea"));
            } else {
                this.getSplitAppObj().toDetail(this.createId("PredisposizioneLineaAttrezzaggio"));
            }
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.ModelDetailPages.refresh();
            var that = this;
            setTimeout(function () {
                var VS;
                if (that.ModelDetailPages.getData().Linea.Batch.IsAttrezzaggio === "0") {
                    VS = ["TreeTable_ConfermaSetupOld", "TreeTable_ConfermaSetupNew"];
                } else {
                    VS = ["TreeTable_AttrezzaggioOld", "TreeTable_AttrezzaggioNew"];
                }
                for (var i = 0; i < VS.length; i++) {
                    that.ShowRelevant(null, VS[i]);
                }
                that.GlobalBusyDialog.close();
            }, 500);
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
                value: "{GeneralModel>valueModify}",
                type: "Text",
                maxLength: 30});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "{GeneralModel>codePlaceholder}",
                editable: "{= ${GeneralModel>code} === 1}",
                value: "{GeneralModel>codeValue}",
                type: "Text",
                maxLength: 30});
            inputCodeValue.addStyleClass("diffStandard");
            var TT = "TreeTable_FinePredisposizione";
            this.IDsTreeTables.getData().IDs.TreeTable_FinePredisposizione = 0;
            var btn1, btn2, btn3, btn4;
            var TreeTable = new CustomTreeTable({
                id: TT,
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableColumnReordering: false,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 10,
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
                            text: "{GeneralModel>name}",
                            maxLines: 1}).addStyleClass("verticalAlignment")}),
                    new sap.ui.table.Column({
                        label: "VALORE",
                        resizable: false,
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}",
                            maxLines: 1,
                            tooltip: "{GeneralModel>value}"}).addStyleClass("verticalAlignment")}),
                    new sap.ui.table.Column({
                        label: "MODIFICA",
                        resizable: false,
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "MATRICOLA/LOTTO",
                        resizable: false,
                        width: "5rem",
                        template: inputCodeValue})
                ]
            });
            TreeTable.addStyleClass("defaultHeight");
            btn1.addStyleClass("TTButton");
            btn2.addStyleClass("TTButton");
            btn3.addStyleClass("TTButton");
            btn4.addStyleClass("TTButton");
            var hbox = new sap.m.HBox({});
            var vb3 = new sap.m.VBox({width: "47%"});
            var vb4 = new sap.m.VBox({width: "6%"});
            var vb5 = new sap.m.VBox({width: "47%"});
            var bt2 = new sap.m.Button({
                text: "Annulla",
                width: "100%",
                press: [this.AnnullaPredisposizione, this]});
            bt2.addStyleClass("annullaButton");
            var bt3 = new sap.m.Button({
                text: "Conferma",
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
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, TT);
            }, 500);
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
            this.IDsTreeTables.getData().IDs.TreeTable_FinePredisposizione = 0;
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

                var link;
                this.GlobalBusyDialog.open();
                if (this.ISLOCAL === 1) {
                    this.AjaxCallerData("model/JSON_Progress.json", this.LOCALInProgress.bind(this));
                } else {
                    var XMLstring = this.XMLSetupUpdates(data, this.ModelDetailPages.getData().DettaglioLinea.idLinea, this.ModelDetailPages.getData().Linea.Batch.SKUID);
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=0&OutputParameter=JSON";
                    this.SyncAjaxCallerData(link, this.SUCCESSConfermaAttrezzaggio.bind(this));
                }
            } else {
                MessageToast.show("Tutti i codici Lotto/Matricola devono essere inseriti.");
            }
        },
        SUCCESSConfermaAttrezzaggio: function (Jdata) {
            this.ModelDetailPages.setProperty("/SuccessConfermaAttrezzaggio/", Jdata);
            if (Jdata.error === 0) {
                this.RefreshFunction(0);
            } else {
                alert(Jdata.errorMessage);
            }
            this.GlobalBusyDialog.close();
        },
        //        -------------------------  LAVORAZIONE  -------------------------       



//      RICHIAMATO DAL PULSANTONE VERDE A FIANCO DELLA PROGRESS BAR
        SPCGraph: function (event, indice) {
            this.STOPSPC = 0;
            clearInterval(this.SPCTimer);
            this.SPCCounter = 5;
            var data = this.ModelDetailPages.getData();
            this.indexSPC = indice;
            this.idBatch = data.Linea.Batch.BatchID;
            this.idLinea = data.DettaglioLinea.idLinea;
            this.ParametroID = data.DatiSPC[this.indexSPC].parametroId;
            this.DescrizioneParametro = data.DatiSPC[this.indexSPC].descrizioneParametro;
            this.SPCDialog = this.getView().byId("SPCWindow");
            if (!this.SPCDialog) {
                this.SPCDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.SPCWindow", this);
                this.getView().addDependent(this.SPCDialog);
            }
            this.SPCDialog.open();
            this.SPCDataCaller();
            var that = this;
            this.SPCTimer = setInterval(function () {
                try {
                    that.SPCCounter++;
                    if (that.STOPSPC === 0 && that.SPCCounter >= 5) {
                        that.SPCRefresh();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        SUCCESSSPCDataLoad: function (Jdata) {
            var isEmpty;
            this.Allarme = this.ModelDetailPages.getData().DatiSPC[this.indexSPC].allarme;
            this.Fase = this.ModelDetailPages.getData().DatiSPC[this.indexSPC].fase;
            this.Avanzamento = this.ModelDetailPages.getData().DatiSPC[this.indexSPC].avanzamento;
            if (Jdata.valori === "") {
                isEmpty = 1;
            } else {
                isEmpty = 0;
                Jdata = this.ParseSPCData(Jdata, "#");
                if (this.Fase === "1") {
                    Jdata = this.Phase1(Jdata);
                }
                this.ModelDetailPages.setProperty("/DatiSPC/Data/", Jdata);
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
            this.SPCDialogFiller(isEmpty);
            if (this.STOPSPC === 0) {
                this.SPCCounter = 0;
            }
        },
        SPCRefresh: function (msec) {
            this.SPCCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.SPCDataCaller.bind(this), msec);
        },
        SPCDataCaller: function () {
            if (this.SPCDialog) {
                if (this.SPCDialog.isOpen()) {
                    var data = this.ModelDetailPages.getData();
                    var link;
                    if (this.ISLOCAL === 1) {
                        link = "model/JSON_SPCData.json";
                    } else {
                        if (typeof data.DatiSPC[this.indexSPC].parametroId !== "undefined") {
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SPCDataPlot&Content-Type=text/json&OutputParameter=JSON&LineaID=" + data.DettaglioLinea.idLinea + "&ParametroID=" + data.DatiSPC[this.indexSPC].parametroId;
                        }
                    }
                    this.SyncAjaxCallerData(link, this.SUCCESSSPCDataLoad.bind(this));
                }
            }
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
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, "TreeTable_ModificaCondizioni");
            }, 500);
        },
//      RICHIAMATO DAL PULSANTE DI ANNULLA NELLE MODIFICHE
        AnnullaModifica: function () {
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
            if (this.State === "Disponibile.Lavorazione" || this.LOCALState === "Disponibile.Lavorazione") {
                this.getSplitAppObj().toDetail(this.createId("InProgress"));
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                this.FermiAutomaticiCheck("Disponibile.Lavorazione");
            } else if (this.State === "Disponibile.Fermo" || this.LOCALState === "Disponibile.Fermo") {
                this.getSplitAppObj().toDetail(this.createId("Fault"));
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
            }
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
                if (this.State === "Disponibile.Lavorazione" || this.LOCALState === "Disponibile.Lavorazione") {
                    this.getSplitAppObj().toDetail(this.createId("InProgress"));
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                    this.FermiAutomaticiCheck("Disponibile.Lavorazione");
                } else if (this.State === "Disponibile.Fermo" || this.LOCALState === "Disponibile.Fermo") {
                    this.getSplitAppObj().toDetail(this.createId("Fault"));
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                }
                if (this.ISLOCAL !== 1) {
//                    if (this.SPCDialog) {
//                        if (typeof this.SPCDialog !== "undefined") {
//                            this.getView().byId("headerSPCWindow").setText("Campionamento in corso: 0/50");
////                            this.SPCDialog.destroyContent();
////                            this.SPCDialog = null;
//                        }
//                    }
                    var XMLstring = this.XMLSetupUpdates(data, this.ModelDetailPages.getData().DettaglioLinea.idLinea, this.ModelDetailPages.getData().Linea.Batch.SKUID);
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=1&OutputParameter=JSON";
                    this.AjaxCallerData(link, this.SUCCESSConfermaModifica.bind(this));
                    this.RefreshFunction(0);
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
        Fermo: function (event) {
            var name = event.getSource().getProperty("text");
            var link;
            if (name === "Fermo") {
                this.discr = "FermoManuale";
            } else {
                this.discr = "CambioCausaleFermo";
            }
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermo&Content-Type=text/json&OutputParameter=JSON&IsManuale=1";
            }
            this.AjaxCallerData(link, this.SUCCESSFermo.bind(this));
        },
        CambioCausaleFermo: function () {
            this.discr = "CambioCausaleFermo";
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
//            var L1_height = String(Math.round(100 / rows)) + "%";
            var L3_width = String(Math.round(100 / cols)) + "%";
            var index = 0;
            this.CheckFermo = [];
            for (var i = 0; i < rows; i++) {
                L2_hbox = new sap.m.HBox();
                for (var j = 0; j < cols; j++) {
                    title = new sap.m.Text({text: data[index].gerarchia});
                    title.addStyleClass("customText");
                    title.addStyleClass("underlineOEE");
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
                        CB.addStyleClass("customTextFermi");
                        L3_vbox.addItem(CB);
                    }
                    L2_hbox.addItem(L3_vbox);
                    index++;
                    if (index === data.length) {
                        break;
                    }
                }
                L1_vbox = new sap.m.VBox(/*{height: L1_height}*/);
                L1_vbox.addItem(new sap.m.HBox({height: '2rem'}));
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
            } else if (this.discr === "CambioCausaleFermo") {
                this.getSplitAppObj().toDetail(this.createId("Fault"));
                this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
            this.outerVBox.destroyItems();
        },
//      RICHIAMATO DAL PULSANTE DI CONFERMA NEL FERMO
        ConfermaFermo: function () {
            this.GlobalBusyDialog.open();
            var CB = sap.ui.getCore().byId(this.id_split[1]);
            var idGross = CB.getId();
            var root = "CBFermo";
            var id = idGross.substring(root.length, idGross.length);
            var link;
            if (this.discr === "FermoManuale") {
                this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO - " + CB.getProperty("text"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.GlobalBusyDialog.close();
                if (this.ISLOCAL === 1) {
                    this.Item = {};
                    var now = new Date();
                    this.Item.inizio = this.DateToStandard(now);
                    this.Item.causa = CB.getProperty("text");
                    this.SwitchColor("red");
                    this.getSplitAppObj().toDetail(this.createId("Fault"));
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                    this.LOCALState = "Disponibile.Fermo";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchInFermoManuale&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&CausaleEventoID=" + id;
                    this.SyncAjaxCallerVoid(link, this.RefreshFunction.bind(this));
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
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdateLogCausale&Content-Type=text/json&ListLogID=" + string + "&CausaleID=" + id;
                    this.AjaxCallerVoid(link, this.Causalizzazione.bind(this));
                }
            } else if (this.discr === "CambioCausaleFermo") {
                if (this.ISLOCAL === 1) {
                    this.LOCALState = "Disponibile.Fermo";
                    this.getSplitAppObj().toDetail(this.createId("Fault"));
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
                    this.ModelDetailPages.setProperty("/CausaFermo/", "FERMO - " + CB.getProperty("text"));
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangeFermo&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&CausaleID=" + id;
                    this.State = "";
                    this.AjaxCallerVoid(link, this.RefreshFunction.bind(this));
//                    this.AjaxCallerVoid(link, this.SUCCESSCauseChange.bind(this));
                }
            }
            this.outerVBox.destroyItems();
        },
//        SUCCESSCauseChange: function () {
//            this.getSplitAppObj().toDetail(this.createId("Fault"));
//            this.EnableButtons(["ButtonModificaCondizioni", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
//        },
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
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, "TreeTable_RipristinoCondizioni");
            }, 500);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        AnnullaRipristino: function () {
            this.getSplitAppObj().toDetail(this.createId("Fault"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonChiusuraConfezionamento"]);
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA"
        ConfermaRipristino: function () {
            this.GlobalBusyDialog.open();
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
                    this.GlobalBusyDialog.open();
                    var XMLstring = this.XMLSetupUpdates(data, this.ModelDetailPages.getData().DettaglioLinea.idLinea, this.ModelDetailPages.getData().Linea.Batch.SKUID);
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=2&OutputParameter=JSON";
                    this.SyncAjaxCallerData(link, this.SUCCESSConfermaRipristino.bind(this));
                    this.RefreshFunction(0);
                }
            } else {
                MessageToast.show("Non puoi confermare codici Lotto/Matricola vuoti.");
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            }
        },
        SUCCESSConfermaRipristino: function (Jdata) {
            this.ModelDetailPages.setProperty("/SuccessRiavvio/", Jdata);
            if (Jdata.error === 0) {
                this.RefreshFunction(0);
            } else {
                alert(Jdata.errorMessage);
            }
            this.GlobalBusyDialog.close();
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
            var rows_number = this.ModelDetailPages.getProperty(this.getView().byId("SingoliTable").getBindingInfo("rows").path).length;
            if (rows_number > 9) {
                this.getView().byId("vbox_table").addStyleClass("scrollingbarTransparent");
            } else {
                this.getView().byId("vbox_table").removeStyleClass("scrollingbarTransparent");
            }
            this.getView().byId("vbox_table").destroyItems();
            if (this.ModelDetailPages.getData().FermiNonCausalizzati.fermi.length === 0) {
                var text = new sap.m.Text({
                    text: "Tutti i fermi automatici sono stati causalizzati",
                    textAlign: "Center"
                });
                text.addStyleClass("customText");
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
                table.addStyleClass("causeText");
                this.getView().byId("vbox_table").addItem(table);
            }
            this.getSplitAppObj().toDetail(this.createId("Causalizzazione"));
            this.GlobalBusyDialog.close();
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
                if (this.ModelDetailPages.getData().Linea.StatoLinea === "Disponibile.Lavorazione") {
                    this.getSplitAppObj().toDetail(this.createId("InProgress"));
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
                    this.FermiAutomaticiCheck("Disponibile.Lavorazione");
                } else if (this.ModelDetailPages.getData().Linea.StatoLinea === "Disponibile.Svuotamento") {
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
            this.ClosingDialog = this.getView().byId("AskClosing");
            if (!this.ClosingDialog) {
                this.ClosingDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.AskClosing", this);
                this.getView().addDependent(this.ClosingDialog);
            }
            this.ClosingDialog.addStyleClass("dialogStyle");
            this.ClosingDialog.open();
        },
//      RICHIAMATO DAL PULSANTE "CONFERMA CHIUSURA CONFEZIONAMENTO"
        ConfermaChiusuraConfezionamento: function () {
            this.ClosingDialog.close();
            if (this.ISLOCAL === 1) {
                this.SwitchColor("brown");
                this.getSplitAppObj().toDetail(this.createId("ChiusuraConfezionamento"));
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.EnableButtons(["ButtonCausalizzazione"]);
                this.FermiAutomaticiCheck("Disponibile.Svuotamento");
                this.LOCALState = "Disponibile.Svuotamento";
                this.LOCALAggiornaChiusura();
            } else {
                this.GlobalBusyDialog.open();
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchInChiusura&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshFunction.bind(this));
            }
        },
//      RICHIAMATO DAL PULSANTE "ANNULLA CHIUSURA CONFEZIONAMENTO"
        AnnullaChiusuraConfezionamento: function () {
            this.ClosingDialog.close();
        },
        SvuotaLinea: function () {
            this.GlobalBusyDialog.open();
            var temp = {"linea": this.ModelDetailPages.getData().DettaglioLinea.Linea, "descrizione": "", "conforme": ""};
            this.ModelDetailPages.setProperty("/Intestazione/", temp);
            this.IDsTreeTables.setProperty("/IDs/", {});
            sap.ui.getCore().setModel(this.IDsTreeTables);
            if (this.ISLOCAL === 1) {
                this.getSplitAppObj().toDetail(this.createId("Home"));
                this.SwitchColor("");
                this.DestroyButtons();
                this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                this.LOCALState = "Disponibile.Vuota";
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchChiuso&Content-Type=text/json&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
                this.SyncAjaxCallerVoid(link, this.RefreshFunction.bind(this));
            }
            this.getOwnerComponent().getRouter().navTo("Main");
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
            var std = this.ModelDetailPages.getData().SKU.SKUstandard;
            var bck = this.ModelDetailPages.getData().SKU.SKUattuale;
            bck = this.RecursiveJSONComparison(std, bck, "attributi");
            bck = this.RecursiveParentExpansion(bck);
            this.EnableButtonsAttr([]);
            this.getSplitAppObj().toDetail(this.createId("BatchAttrezzaggio"));
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, "TreeTable_BatchAttrezzaggio");
            }, 500);
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
                this.SyncAjaxCallerVoid(link, this.RefreshFunction.bind(this));
            }
        },

//      -------------------------- ATTREZZAGGIO --------------------------

        PredisposizioneLineaAttrezzaggio: function () {
            this.GlobalBusyDialog.open();
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            var tab = this.TabContainer.getItems()[2];
            if (typeof tab !== "undefined") {
                this.TabContainer.removeItem(tab);
                this.Item.destroyContent();
            }
            if (sap.ui.getCore().byId("TreeTable_FinePredisposizioneAttrezzaggio")) {
                sap.ui.getCore().byId("TreeTable_FinePredisposizioneAttrezzaggio").destroy();
            }
            this.RemoveClosingButtons(2);
            var item = this.TabContainer.getItems()[1];
            this.TabContainer.setSelectedItem(item);
            this.ModelDetailPages.setProperty("/SetupLinea/", {});
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_SetupOld.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchForOperatoreCombo&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea;
            }
            this.AjaxCallerData(link, this.SUCCESSSetup.bind(this));
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
                value: "{GeneralModel>valueModify}",
                type: "Text",
                maxLength: 30});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "{GeneralModel>codePlaceholder}",
                editable: "{= ${GeneralModel>code} === 1}",
                value: "{GeneralModel>codeValue}",
                type: "Text",
                maxLength: 30});
            inputCodeValue.addStyleClass("diffStandard");
            var TT = "TreeTable_FinePredisposizioneAttrezzaggio";
            this.IDsTreeTables.getData().IDs.TreeTable_FinePredisposizioneAttrezzaggio = 0;
            var btn1, btn2, btn3, btn4;
            var TreeTable = new CustomTreeTable({
                id: TT,
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableColumnReordering: false,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 10,
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
                            text: "{GeneralModel>name}",
                            maxLines: 1})}),
                    new sap.ui.table.Column({
                        label: "VALORE",
                        resizable: false,
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}",
                            maxLines: 1,
                            tooltip: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "MODIFICA",
                        resizable: false,
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "MATRICOLA/LOTTO",
                        resizable: false,
                        width: "5rem",
                        template: inputCodeValue})
                ]
            });
            TreeTable.addStyleClass("defaultHeight");
            btn1.addStyleClass("TTButton");
            btn2.addStyleClass("TTButton");
            btn3.addStyleClass("TTButton");
            btn4.addStyleClass("TTButton");
            var hbox = new sap.m.HBox({});
            var vb1 = new sap.m.VBox({width: "47%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "47%"});
            var bt1 = new sap.m.Button({
                text: "Annulla",
                width: "100%",
                press: [this.AnnullaAttrezzaggio, this]});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                text: "Conferma",
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
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, TT);
            }, 500);
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
                value: "{= ${GeneralModel>modify} === 1 ? '#ND': ''}",
                type: "Text",
                maxLength: 30});
            inputValueMod.addStyleClass("diffStandard");
            var inputCodeValue = new sap.m.Input({
                placeholder: "",
                editable: "{= ${GeneralModel>code} === 1}",
                value: "",
                type: "Text",
                maxLength: 30});
            inputCodeValue.addStyleClass("diffStandard");
            var TT = "TreeTable_FinePredisposizioneAttrezzaggio";
            this.IDsTreeTables.getData().IDs.TreeTable_FinePredisposizioneAttrezzaggio = 0;
            var btn1, btn2, btn3, btn4;
            var TreeTable = new CustomTreeTable({
                id: TT,
                rows: "{path:'GeneralModel>/SetupLinea/Modify', parameters: {arrayNames:['attributi']}}",
                selectionMode: "None",
                collapseRecursive: true,
                enableColumnReordering: false,
                enableSelectAll: false,
                ariaLabelledBy: "title",
                visibleRowCount: 10,
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
                            text: "{GeneralModel>name}",
                            maxLines: 1})}),
                    new sap.ui.table.Column({
                        label: "VALORE",
                        resizable: false,
                        width: "5rem",
                        template: new sap.m.Text({
                            text: "{GeneralModel>value}",
                            maxLines: 1,
                            tooltip: "{GeneralModel>value}"})}),
                    new sap.ui.table.Column({
                        label: "MODIFICA",
                        resizable: false,
                        width: "5rem",
                        template: inputValueMod}),
                    new sap.ui.table.Column({
                        label: "MATRICOLA/LOTTO",
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
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, TT);
            }, 500);
        },
        AnnullaAttrezzaggio: function () {
            this.EnableButtonsAttr(["ButtonSospensioneAttrezzaggio", "ButtonFinePredisposizioneAttrezzaggio"]);
            this.TabContainer = this.getView().byId("TabContainerAttrezzaggio");
            var tab = this.TabContainer.getItems()[2];
            this.TabContainer.removeItem(tab);
            this.TabContainer.setSelectedItem(this.TabContainer.getItems()[1]);
            this.Item.destroyContent();
            var data = JSON.parse(JSON.stringify(this.backupSetupModify));
            this.IDsTreeTables.getData().IDs.TreeTable_FinePredisposizioneAttrezzaggio = 0;
            this.ModelDetailPages.setProperty("/SetupLinea/Modify", data);
        },
        ConfermaAttrezzaggio: function (event, source) {
            var data = this.ModelDetailPages.getData().SetupLinea.Modify;
            data = this.RecursivePropertyCopy(data, "value", "valueModify");
            this.codeCheck = 0;
            data = this.RecursiveJSONCodeCheck(data, "codeValue");
            if (this.codeCheck === 1 && source === 'F') {
                MessageToast.show("Tutti i codici Lotto/Matricola devono essere inseriti.");
            } else {
                if (this.ISLOCAL === 1) {
                    this.getSplitAppObj().toDetail(this.createId("ConfermaAttrezzaggio"));
                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                    this.SwitchColor("brown");
                    this.EnableButtonsAttr([]);
                } else {
                    this.GlobalBusyDialog.open();
                    var XMLstring = this.XMLSetupUpdates(data, this.ModelDetailPages.getData().DettaglioLinea.idLinea, this.ModelDetailPages.getData().Linea.Batch.SKUID);
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ChangePredisposizione&Content-Type=text/json&xml=" + XMLstring + "&LineaID=" + this.ModelDetailPages.getData().DettaglioLinea.idLinea + "&Case=3&OutputParameter=JSON";
                    this.AjaxCallerData(link, this.SUCCESSConfermaAttrezzaggio.bind(this));
                }
            }
        },
        // ------------------------ CHIUSURA ------------------------

        FineAttrezzaggio: function () {
            this.IDsTreeTables.setProperty("/IDs/", {});
            sap.ui.getCore().setModel(this.IDsTreeTables);
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
                this.AjaxCallerVoid(link, this.RefreshFunction.bind(this));
            }
            this.getOwnerComponent().getRouter().navTo("Main");
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
                sap.ui.getCore().byId(ButtonIDs[i]).removeStyleClass("styleDisabledButton");
            }
            for (i in vec) {
                sap.ui.getCore().byId(vec[i]).setEnabled(true);
            }
            for (i in ButtonIDs) {
                if (sap.ui.getCore().byId(ButtonIDs[i]).getEnabled() === false) {
                    sap.ui.getCore().byId(ButtonIDs[i]).addStyleClass("styleDisabledButton");
                }
            }
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
                sap.ui.getCore().byId(ButtonIDs[i]).removeStyleClass("styleDisabledButton");
            }
            for (i in vec) {
                sap.ui.getCore().byId(vec[i]).setEnabled(true);
            }
            for (i in vec) {
                if (sap.ui.getCore().byId(ButtonIDs[i]).getEnabled() === false) {
                    sap.ui.getCore().byId(ButtonIDs[i]).addStyleClass("styleDisabledButton");
                }
            }
        },
        SetSizeDestinazione: function (string) {
            var textDestinazione;
            var size = 0;
            var specials = [" ", ".", ",", "'", ":", ";", "-", "(", ")"];
            for (var i in string) {
                if (specials.indexOf(string[i]) > -1) {
                    size += 0.5;
                } else {
                    size += 1;
                }
            }
            for (var j = 0; j < 13; j++) {
                textDestinazione = this.getView().byId("destinazione" + String(j));
                if (size < 34) {
                    textDestinazione.removeStyleClass("textTopReduced1");
                    textDestinazione.removeStyleClass("textTopReduced2");
                    textDestinazione.addStyleClass("textTop");
                } else if (size >= 34 && size < 42) {
                    textDestinazione.removeStyleClass("textTop");
                    textDestinazione.removeStyleClass("textTopReduced2");
                    textDestinazione.addStyleClass("textTopReduced1");
                } else {
                    textDestinazione.removeStyleClass("textTop");
                    textDestinazione.removeStyleClass("textTopReduced1");
                    textDestinazione.addStyleClass("textTopReduced2");
                }
            }
        },
        SetLinea: function (state) {
            var data = this.ModelDetailPages.getData().Linea;
            switch (state) {
                case "Disponibile.Vuota":
                    return "VUOTA";
                case "NonDisponibile":
                    return "NON DISPONIBILE";
                case "Disponibile.AttesaPresaInCarico":
                    return "PRESA IN CARICO";
                case "Disponibile.Attrezzaggio":
                    return "ATTREZZAGGIO";
                case "Disponibile.Lavorazione":
                    return "CONFEZIONAMENTO";
                case "Disponibile.Fermo":
                    if (data.CausaleEvento === "---") {
                        return "FERMO AUTOMATICO";
                    } else {
                        return "FERMO - " + data.CausaleEvento;
                    }
                    break;
                case "Disponibile.Svuotamento":
                    return "SVUOTAMENTO";
            }
        },
        AddColorDescrizione: function (color) {
            var IDs = ["HomeDescrizione", "PresaInCaricoDescrizione", "PredisposizioneLineaDescrizione", "InProgressDescrizione", "ModificaCondizioniDescrizione", "FermoDescrizione", "CausalizzazioneDescrizione", "FaultDescrizione", "RipristinoCondizioniDescrizione", "ChiusuraConfezionamentoDescrizione", "BatchAttrezzaggioDescrizione", "PredisposizioneLineaAttrezzaggioDescrizione", "ConfermaAttrezzaggioDescrizione"];
            var obj;
            for (var i = 0; i < IDs.length; i++) {
                obj = this.getView().byId(IDs[i]);
                obj.removeStyleClass("diffRed");
                if (color === "red") {
                    obj.addStyleClass("diffRed");
                }
            }
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
        CreateButtons: function () {
            var vbox = this.getView().byId("panel_processi");
            var btn, btn_vbox;
            var IDs = ["ButtonPresaInCarico", "ButtonFinePredisposizione", "ButtonModificaCondizioni", "ButtonFermo", "ButtonRiavvio", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"];
            var texts = ["Presa in carico nuovo confezionamento", "Fine predisposizione inizio confezionamento", "Visualizza / Modifica condizioni operative", "Fermo", "Riavvio", "Causalizzazione fermi automatici", "Chiusura confezionamento svuotamento linea"];
            var press = [[this.PresaInCarico, this], [this.FinePredisposizione, this], [this.ModificaCondizioni, this], [this.Fermo, this], [this.Riavvio, this], [this.Causalizzazione, this], [this.ChiusuraConfezionamento, this]];
            var classes = ["styleLongButton", "styleLongButton", "styleLongButton", "styleButton", "styleButton", "styleLongButton", "styleVeryLongButton"];
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
            var classes = ["styleLongButton", "styleButton", "styleLongButton"];
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
                if (typeof View === "undefined") {
                    View = this.getView().byId(TT);
                }
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
                    if (typeof Views[i].getContextByIndex(j) !== "undefined") {
                        temp = Views[i].getContextByIndex(j).getObject();
                        if (temp.expand === 0) {
                            Views[i].collapse(j);
                        }
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
        XMLSetupUpdates: function (setup, idLinea, idSKU) {
            var heading = "<Parameters>" +
                    "<LineaID>" + idLinea + "</LineaID>" +
                    "<SKUID>" + idSKU + "</SKUID>" +
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
            var View, txt;
            var path = event.getParameters().rowBindingContext.sPath;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = sap.ui.getCore().byId(TT);
            }
            var clicked_row = event.getParameters().rowIndex;
            var clicked_column = event.getParameters().columnIndex;
            switch (clicked_column) {
                case "0":
                    if (!View.isExpanded(clicked_row)) {
                        View.expand(clicked_row);
                    } else {
                        View.collapse(clicked_row);
                    }
                    break;
                case "1":
                    txt = this.ModelDetailPages.getProperty(path).value;
                    if (txt !== "") {
                        MessageToast.show(txt, {duration: 10000});
                    }
                    break;
                case "2":
                    txt = this.ModelDetailPages.getProperty(path).codeValue;
                    if (txt !== "") {
                        MessageToast.show(txt, {duration: 10000});
                    }
                    break;
            }
        },
//      ----------------    FUNZIONI ATTREZZAGGIO    ----------------

        LinkClick: function (event) {
            var ViewsIDs = this.GetViewsIds(event.getSource().data("mydata"));
            var Views = [this.getView().byId(ViewsIDs[0]), this.getView().byId(ViewsIDs[1])];
            var clicked_row = event.getParameters().rowIndex;
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
                var binding = event.getParameters().rowBindingContext.getObject();
                if (binding.expand === 3) {
                    var Item = new sap.m.TabContainerItem();
                    Item.setName(binding.value);
                    var image = new sap.m.Image();
                    image.setSrc("img/dececco.jpg");
                    image.setWidth("40%");
                    Item.addContent(image);
                    this.TabContainer.addItem(Item);
                    this.TabContainer.setSelectedItem(Item);
                } else {
                    if (binding.value !== "") {
                        MessageToast.show(binding.value, {duration: 10000});
                    }
                }
            }
        },
        COUPLEDTreeTableIconPress: function (event) {
            var ViewsIDs = this.GetViewsIds(event.getSource().data("mydata"));
            var View = this.getView().byId(ViewsIDs[1]);
            var clicked_row = event.getParameters().rowIndex;
            if (!View.isExpanded(clicked_row)) {
                View.expand(clicked_row);
            } else {
                View.collapse(clicked_row);
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
        AddSpaces: function (data) {
            var toMod = ["OEE", "qualita", "efficienza", "disponibilita"];
            if (data.OEE !== "attesa dati") {
                for (var i in toMod) {
                    data[toMod[i]] = data[toMod[i]] + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0";
                }
            }
        },
        BarColor: function (data) {
            var bar = this.getView().byId("progressBar");
            switch (data.barColor) {
                case "yellow":
                    bar.setState("Warning");
                    break;
                case "green":
                    bar.setState("Success");
                    break;
                case "orange":
                    bar.setState("Error");
                    break;
            }
        },
        CreateSPCButton: function (data) {
            var vbox = this.getView().byId("SPCButton");
            vbox.destroyItems();
            var bt1, bt2, hbox, vb1, vb2;
            if (data.length === 1) {
                bt1 = new CustomSPCButton({
                    id: "SPCButton1",
                    width: "100%",
                    press: [0, this.SPCGraph, this]});
                bt1.addStyleClass("SPCButtonColorYellow");
                bt1.addStyleClass("borderBlue");
                vbox.addItem(bt1);
            } else if (data.length === 2) {
                hbox = new sap.m.HBox({
                    width: "100%",
                    height: "100%"
                });
                vb1 = new sap.m.VBox({
                    width: "50%",
                    height: "100%"
                });
                vb2 = new sap.m.VBox({
                    width: "50%",
                    height: "100%"
                });
                bt1 = new CustomSPCButton({
                    id: "SPCButton1",
                    width: "100%",
                    press: [0, this.SPCGraph, this]});
                bt1.addStyleClass("SPCButtonColorYellow");
                bt1.addStyleClass("borderBlue");
                bt2 = new CustomSPCButton({
                    id: "SPCButton2",
                    width: "100%",
                    press: [1, this.SPCGraph, this]});
                bt2.addStyleClass("SPCButtonColorYellow");
                bt2.addStyleClass("borderBlue");
                vb1.addItem(bt1);
                vb2.addItem(bt2);
                hbox.addItem(vb1);
                hbox.addItem(vb2);
                vbox.addItem(hbox);
            }
        },
        SPCColor: function (data) {
            var CSS_classesButton = ["SPCButtonColorGreen", "SPCButtonColorYellow", "SPCButtonPhase1", "SPCButtonContent", "DualSPCButtonContent"];
            var btn;
            for (var b = 0; b < data.length; b++) {
                btn = sap.ui.getCore().byId("SPCButton" + String(b + 1));
                for (var i = 0; i < CSS_classesButton.length; i++) {
                    btn.removeStyleClass(CSS_classesButton[i]);
                }
                switch (data[b].fase) {
                    case "1":
                        if (btn.getIcon() !== "img/triangolo_buco.png") {
                            btn.setIcon("img/triangolo_buco.png");
                        }
                        btn.setText(data[b].numeroCampionamenti);
                        btn.addStyleClass("SPCButtonPhase1");
                        if (data.length === 1) {
                            btn.addStyleClass("SPCButtonContent");
                        } else {
                            btn.addStyleClass("DualSPCButtonContent");
                        }
                        btn.addStyleClass("SPCButtonColorYellow");
                        break;
                    case "2":
                        btn.setIcon("");
                        btn.setText("");
                        if (data[b].allarme === "0") {
                            btn.addStyleClass("SPCButtonColorGreen");
                        } else if (data[b].allarme === "1") {
                            btn.addStyleClass("SPCButtonColorYellow");
                        }
                        break;
                    default:
                        btn.setIcon("img/triangolo_buco.png");
                        btn.setText(0);
                        btn.addStyleClass("SPCButtonPhase1");
                        if (data.length === 1) {
                            btn.addStyleClass("SPCButtonContent");
                        } else {
                            btn.addStyleClass("DualSPCButtonContent");
                        }
                        btn.addStyleClass("SPCButtonColorYellow");
                        break;
                }
            }
        },
        SPCDialogFiller: function (discr) {
            var textHeader = this.getView().byId("headerSPCWindow");
            textHeader.setText(String(this.DescrizioneParametro));
            var samplingHeader = this.getView().byId("samplingSPC");
            if (Number(this.Fase) === 1) {
                samplingHeader.setText("Campionamento in corso: " + String(this.Avanzamento) + "/50");
            } else {
                samplingHeader.setText("");
            }
            if (discr !== 1) {
                var plotBox = this.getView().byId("plotBox");
                var alarmButton = this.getView().byId("alarmButton");
                if (Number(this.Fase) === 2 && Number(this.Allarme) === 1) {
                    alarmButton.setEnabled(true);
                    alarmButton.removeStyleClass("chiudiButton");
                    alarmButton.addStyleClass("allarmeButton");
                } else {
                    alarmButton.setEnabled(false);
                    alarmButton.removeStyleClass("allarmeButton");
                    alarmButton.addStyleClass("chiudiButton");
                }
                if (!((Number(this.Fase) === 1) && (this.ModelDetailPages.getData().DatiSPC.Data.valori.length < 50))) {
                    var data = this.ModelDetailPages.getData().DatiSPC.Data;
                    var result = this.PrepareDataToPlot(data, this.Fase);
                    var ID = jQuery.sap.byId(plotBox.getId()).get(0);
                    Plotly.newPlot(ID, result.dataPlot, result.layout);
                }
            }
        },
        ParseSPCData: function (data, char) {
            for (var key in data) {
                data[key] = data[key].split(char);
                for (var i = data[key].length - 1; i >= 0; i--) {
                    if (data[key][i] === "") {
                        data[key].splice(i, 1);
                    } else {
                        if (key !== "time") {
                            data[key][i] = Number(data[key][i]);
                        }
                    }
                }
            }
            return data;
        },
        Phase1: function (data) {
            data.MR = [];
            var avg = 0;
            var i, temp;
            data.MR.push(0);
            for (i = 0; i < data.valori.length - 1; i++) {
                temp = Math.abs(data.valori[i + 1] - data.valori[i]);
                data.MR.push(temp);
                avg += temp;
            }
            avg /= (data.MR.length);
            data.MRBound = [];
            for (i = 0; i < data.MR.length; i++) {
                data.MRBound.push(3.267 * avg);
            }
            data.MRTime = JSON.parse(JSON.stringify(data.time));
            return data;
        },
        RemoveAlarm: function () {
            this.STOPSPC = 1;
            clearInterval(this.SPCTimer);
            var alarmButton = this.getView().byId("alarmButton");
            alarmButton.setEnabled(false);
            alarmButton.removeStyleClass("allarmeButton");
            alarmButton.addStyleClass("chiudiButton");
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ResetSPCAlarm&Content-Type=text/json&BatchID=" + this.idBatch + "&ParametroID=" + this.ParametroID;
            this.AjaxCallerVoid(link, this.RefreshFunction.bind(this));
            this.CloseSPCDialog();
        },
        CloseSPCDialog: function () {
            this.STOPSPC = 1;
            clearInterval(this.SPCTimer);
            this.SPCDialog.close();
        },
        PrepareDataToPlot: function (Jdata, fase) {
            var dataPlot, layout;
            var valori = {
                x: Jdata.time,
                y: Jdata.valori,
                type: 'scatter',
                line: {color: 'rgb(0,58,107)', width: 1}
            };
            var limSup = {
                x: Jdata.time,
                y: Jdata.limSup,
                type: 'scatter',
                line: {color: 'rgb(167,25,48)', width: 1}
            };
            var limInf = {
                x: Jdata.time,
                y: Jdata.limInf,
                type: 'scatter',
                line: {color: 'rgb(167,25,48)', width: 1}
            };
            dataPlot = [valori, limSup, limInf];
            layout = {
                showlegend: false,
                autosize: true,
                xaxis: {
                    showgrid: true,
                    zeroline: false
                },
                yaxis: {
                    showgrid: true,
                    zeroline: false
//                    showline: false
                }
            };
            if (fase === "1") {
                var MR = {
                    x: Jdata.MRTime,
                    y: Jdata.MR,
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    line: {color: 'rgb(0,58,107)', width: 1}
                };
                var MRBound = {
                    x: Jdata.MRTime,
                    y: Jdata.MRBound,
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    line: {color: 'rgb(167,25,48)', width: 1}
                };
                dataPlot.push(MR);
                dataPlot.push(MRBound);
                layout.yaxis.domain = [0.6, 1];
                layout.xaxis2 = {};
                layout.yaxis2 = {};
                layout.xaxis2.anchor = "y2";
                layout.yaxis2.domain = [0, 0.4];
            } else {
                if (Number(this.Allarme) === 0) {
                    layout.xaxis.linecolor = "rgb(124,162,149)";
                    layout.yaxis.linecolor = "rgb(124,162,149)";
                } else {
                    layout.xaxis.linecolor = "rgb(255,211,0)";
                    layout.yaxis.linecolor = "rgb(255,211,0)";
                }
                layout.xaxis.linewidth = 4;
                layout.xaxis.mirror = true;
                layout.yaxis.linewidth = 4;
                layout.yaxis.mirror = true;
            }
            return {dataPlot: dataPlot, layout: layout};
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
            var nhour = today.getHours();
            var nmin = today.getMinutes();
            if (nmin <= 9) {
                nmin = "0" + nmin;
            }
            if (nhour <= 9) {
                nhour = "0" + nhour;
            }
            return "" + nhour + ":" + nmin;
        },
//      ----------------    FUNZIONI RICORSIVE    ----------------

        RecursiveJSONComparison: function (std, bck, arrayName) {
            var tempJSON;
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    if (typeof std === "undefined") {
                        tempJSON = {};
                    } else {
                        tempJSON = std[key];
                    }
                    bck[key] = this.RecursiveJSONComparison(tempJSON, bck[key], arrayName);
                } else {
                    switch (key) {
                        case "value":
                            if (typeof std === "undefined") {
                                if (bck.expand !== 3) {
                                    bck.expand = 2;
                                }
                            } else {
                                if (((typeof std[key] === "undefined") || (bck[key] !== std[key])) && bck.expand !== 3) {
                                    bck.expand = 2;
                                }
                            }
                            break;
                        case "isIncluded":
                            if (((typeof std[key] === "undefined") || (bck[key] !== std[key])) && bck.expand !== 3) {
                                bck.expand = 1;
                            }
                            break;
                    }
                }
            }
            return bck;
        },
        RecursiveNotIncludedExpansion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveNotIncludedExpansion(json[key]);
                } else {
                    if (key === "isIncluded") {
                        if (json[key] === "0") {
                            json.expand = 1;
                            json.value = "INATTIVO";
                        }
                    }
                }
            }
            return json;
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
        RecursiveLinkValue: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveLinkValue(json[key]);
                } else {
                    if (key === "expand") {
                        if (json[key] === 3) {
                            json.value = "dececco.jpg";
                        }
                    }
                }
            }
            return json;
        },
        RecursiveStandardAdapt: function (std, bck) {
            for (var key in std) {
                if (typeof std[key] === "object") {
                    switch (key) {
                        case "expand":
                            if (bck[key] > 0) {
                                std[key] = 1;
                            }
                            break;
                        case "isIncluded":
                            if (std[key] === "0") {
                                std.value = "INATTIVO";
                            }
                            break;
                    }
                    std[key] = this.RecursiveStandardAdapt(std[key], bck[key]);
                } else {
                    switch (key) {
                        case "expand":
                            if (bck[key] > 0) {
                                std[key] = 1;
                            }
                            break;
                        case "isIncluded":
                            if (std[key] === "0") {
                                std.value = "INATTIVO";
                            }
                            break;
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

            this.ModelDetailPages.setProperty("/Linea/", Jdata);
            var model = this.ModelDetailPages.getData();
            var data = model.Linea;
            model.Intestazione = {"linea": model.DettaglioLinea.Linea, "descrizione": model.DettaglioLinea.Descrizione, "destinazione": model.DettaglioLinea.Destinazione};
//            var descr = data.SKUattuale.attributi[2].attributi[2].value + " " + data.SKUattuale.attributi[2].attributi[3].value + " " + data.SKUattuale.attributi[3].attributi[0].value;
//            model.Intestazione.descrizione = descr;
            this.SetSizeDestinazione(model.DettaglioLinea.Destinazione);
            data.SKUattuale = this.RecursiveJSONComparison(data.SKUstandard, data.SKUattuale, "attributi");
            data.SKUattuale = this.RecursiveParentExpansion(data.SKUattuale);
            this.exp = 0;
            data.SKUattuale = this.RecursiveJSONExpansionFinder(data.SKUattuale);
            model.SKU = {};
            model.SKU.SKUattuale = data.SKUattuale;
            model.SKU.SKUstandard = data.SKUstandard;
            if (this.exp === 1) {
                this.AddColorDescrizione("red");
            } else {
                this.AddColorDescrizione("");
            }
            this.ModelDetailPages.setProperty("/Intestazione/", model.Intestazione);
            if (data.Batch.IsAttrezzaggio === "0") {
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
            this.GlobalBusyDialog.close();
            Jdata.tempoFermiAutomatici = this.ModelDetailPages.getData().FermiNonCausalizzati.Totale.tempoGuastoTotale;
            this.ModelDetailPages.setProperty("/DatiOEE/", Jdata);
            this.getSplitAppObj().toDetail(this.createId("InProgress"));
            this.AddSpaces(Jdata);
            this.SwitchColor("green");
            this.BarColor(Jdata);
            this.EnableButtons(["ButtonModificaCondizioni", "ButtonFermo", "ButtonCausalizzazione", "ButtonChiusuraConfezionamento"]);
            this.FermiAutomaticiCheck();
            this.getView().setModel(this.ModelDetailPages, "GeneralModel");
            this.LOCALState = "Disponibile.Lavorazione";
            var vbox = this.getView().byId("SPCButton");
            var bt1 = new CustomSPCButton({
                id: "SPCButton1",
                width: "85%",
                press: [0, this.SPCGraph, this]});
            bt1.addStyleClass("SPCButtonColorGreen");
            vbox.addItem(bt1);
            this.ModelDetailPages.setProperty("/DatiSPC/", {});
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
//            this.IDsTreeTables.setProperty("/IDs/", []);
            for (var key in this.IDsTreeTables.getData().IDs) {
                this.IDsTreeTables.getData().IDs[key] = 0;
            }
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
    }
    );
    return OperatoreController;
});