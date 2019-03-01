sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomBatchButton", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                batch: {type: "string"},
                batchSelected: {type: "string"},
//                seq: {type: "string"},
//                minSeq: {type: "string"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            if (sap.m.Button.prototype.onAfterRendering) {
                sap.m.Button.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
            }
            var batch = this.getBatch();
            var batchSelected = this.getBatchSelected();
            if (typeof batch !== "undefined" && typeof batchSelected !== "undefined") {
                var classes = ["styleButtonBatchesTransfer", "styleButtonBatchesRecall"];
                for (var i = 0; i < classes.length; i++) {
                    this.removeStyleClass(classes[i]);
                }
                if (batchSelected !== "") {
                    if (batch !== batchSelected) {
                        this.setText("Trasferisci");
                        this.addStyleClass("styleButtonBatchesTransfer");
                        this.setEnabled(false);
                    } else {
                        this.setText("Richiama");
                        this.addStyleClass("styleButtonBatchesRecall");
                        this.setEnabled(true);
                    }
                } else {
                    this.setText("Trasferisci");
                    this.addStyleClass("styleButtonBatchesTransfer");
                    this.setEnabled(true);
                }
            }
        }
    });
});