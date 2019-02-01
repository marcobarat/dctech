sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    var StyleTextTreeTableValueCFR = Text.extend("myapp.control.StyleTextTreeTableValueCFR", {

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
            var id = this.getParent().getId();
            var obj = jQuery.sap.byId(id);
            obj.removeClass("isWarning");
            if (this.getIncluded() === "0") {
                this.removeStyleClass('diffRed');
                this.removeStyleClass('diffLink');
                this.addStyleClass('notIncluded');
            } else {
                this.removeStyleClass('notIncluded');
                if (this.getDiff() === 2) {
                    this.removeStyleClass('diffLink');
                    this.addStyleClass('diffRed');
                    obj.addClass("isWarning");
                } else if (this.getDiff() === 3) {
                    this.removeStyleClass('diffRed');
                    this.addStyleClass('diffLink');
                    obj.addClass("isWarning");
                } else {
                    this.removeStyleClass('diffRed');
                    this.removeStyleClass('diffLink');
                }
            }
        }
    });

    return StyleTextTreeTableValueCFR;
});