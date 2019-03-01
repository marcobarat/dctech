sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonSetupMan", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                stato: {type: "string"},
                batch: {type: "string"},
                fermo: {type: "string"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classGood = "buttonGood";
            var stato = this.getStato();
            var batch = this.getBatch();
            this.removeStyleClass(classGood);
            var fermo = this.getFermo();
            switch (stato) {
                case "green":
                    this.addStyleClass("buttonGood");
                    break;
                default:
                    break;
            }
            if (batch !== "" && (fermo === "Disponibile.Fermo" || fermo === "Disponibile.Attrezzaggio" || fermo === "Disponibile.Lavorazione")) {
                this.setEnabled(true);
            } else {
                this.setEnabled(false);
            }
        }
    });
});