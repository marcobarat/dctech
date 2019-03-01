sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonSetupAuto", {

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
                fermo: {type: "string"},
                name: {type: "string"} 
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classes = ["buttonGood", "buttonError"];
            var stato = this.getStato();
            var batch = this.getBatch();
            var fermo = this.getFermo();
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            switch (stato) {
                case "red":
                    this.addStyleClass("buttonError");
                    break;
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