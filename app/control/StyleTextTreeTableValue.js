sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    var StyleTextTreeTableValue = Text.extend("myapp.control.StyleTextTreeTableValue", {

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
                this.removeStyleClass('diffLink');
                this.addStyleClass('notIncluded');
            } else {
                this.removeStyleClass('notIncluded');
                if (this.getDiff() === 2) {
                    this.removeStyleClass('diffLink');
                    this.addStyleClass('diffRed');
                } else if (this.getDiff() === 3) {
                    this.removeStyleClass('diffRed');
                    this.addStyleClass('diffLink');
                } else {
                    this.removeStyleClass('diffRed');
                    this.removeStyleClass('diffLink');
                }
            }
        }
    });

    return StyleTextTreeTableValue;
});