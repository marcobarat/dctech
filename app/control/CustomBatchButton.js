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
                seq: {type: "string"},
                minSeq: {type: "string"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            if (sap.m.Button.prototype.onAfterRendering) {
                sap.m.Button.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
            }
            var batchSelected = this.getBatchSelected();
            var seq = this.getSeq();
            var minSeq = this.getMinSeq();
            if (typeof batchSelected !== "undefined") {
                var classes = ["styleButtonBatchesTransfer", "styleButtonBatchesRecall"];
                for (var i = 0; i < classes.length; i++) {
                    this.removeStyleClass(classes[i]);
                }
                if (seq === minSeq) {
                    if (batchSelected === "") {
                        this.setText("Trasferisci");
                        this.addStyleClass("styleButtonBatchesTransfer");
                        this.setEnabled(true);
                    } else {
                        this.setText("Richiama");
                        this.addStyleClass("styleButtonBatchesRecall");
                        this.setEnabled(true);
                    }
                } else {
                    this.setText("Trasferisci");
                    this.addStyleClass("styleButtonBatchesTransfer");
                    this.setEnabled(false);
                }
            }
        }
    });
});