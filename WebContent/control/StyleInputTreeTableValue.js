sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/InputBase"
], function (Control, Label, InputBase) {
    "use strict";

    var StyleInputTreeTableValue = InputBase.extend("myapp.control.StyleInputTreeTableValue", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                diff: {type: "number", defaultValue: 0}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.InputBaseRenderer.render(oRm, oControl);
        },

        onAfterRendering: function () {

            if (this.getDiff() === 1) {
                this.addStyleClass('diffStandard');
            } else {
                this.removeStyleClass('diffStandard');
            }
        }
    });

    return StyleInputTreeTableValue;
});