sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    var RedTextTreetable = Text.extend("myapp.control.RedTextTreetable", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                diff: {type: "boolean", defaultValue: false}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.TextRenderer.render(oRm, oControl);
        },

        onAfterRendering: function () {

            if (this.getDiff() === true) {
                this.addStyleClass('diffStandard');
            } else {
                this.removeStyleClass('diffStandard');
            }
        }
    });

    return RedTextTreetable;
});