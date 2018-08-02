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
                diff: {type: "number", defaultValue: 0},
                discr: {type: "string", defaultValue: ""},
                included: {type: "string", defaultValue: "1"}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.TextRenderer.render(oRm, oControl);
        },

        onAfterRendering: function () {

            if (this.getIncluded() === "0") {
                this.removeStyleClass('diffRed');
                this.addStyleClass('notIncluded');
            } else {
                this.removeStyleClass('notIncluded');
                if (this.getDiff() === 2 && this.getDiscr() !== "") {
                    this.addStyleClass('diffRed');
                } else {
                    this.removeStyleClass('diffRed');
                }
            }
        }
    });

    return StyleTextTreeTableAttr;
});