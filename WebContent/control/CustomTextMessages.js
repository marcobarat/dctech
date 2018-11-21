sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    return Text.extend("myapp.control.CustomTextMessages", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                origine: {type: "string"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var origin = this.getOrigine();
            var classes = ["textCT", "textOP"];
            for (var i = 0; i < classes.length; i++) {
                this.removeStyleClass(classes[i]);
            }
            switch (origin) {
                case "OPERATORE":
                    this.addStyleClass("textOP");
                    break;
                default:
                    this.addStyleClass("textCT");
                    break;
            }
            if (sap.m.Text.prototype.onAfterRendering) {
                sap.m.Text.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
            }
        }
    });
});