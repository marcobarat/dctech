sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    var StyleTextTreeTableAttr = Text.extend("myapp.control.StyleTextTreeTableAttr", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                diff: {type: "string", defaultValue: "0"},
                discr: {type: "string", defaultValue: ""}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.TextRenderer.render(oRm, oControl);
        },

        onAfterRendering: function () {

            if (this.getDiff() === "1" && this.getDiscr() !== "") {
                this.addStyleClass('diffRed');
            } else {
                this.removeStyleClass('diffRed');
                this.removeStyleClass('diffLink');
            }
        }
    });

    return StyleTextTreeTableAttr;
});