sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonSetupCompleto", {

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
                fermo: {type: "string"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var batch = this.getBatch();
            var fermo = this.getFermo();
            if (batch !== "" && (fermo === "Disponibile.Fermo" || fermo === "Disponibile.Attrezzaggio" || fermo === "Disponibile.Lavorazione")) {
                this.setEnabled(true);
            } else {
                this.setEnabled(false);
            }
        }
    });
});