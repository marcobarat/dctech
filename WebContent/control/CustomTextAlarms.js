sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    return Text.extend("myapp.control.CustomTextAlarms", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                isAlarm: {type: "string"},
                isActive: {type: "string"},
                isBlock: {type: "string"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var id = this.getParent().getId();
            var classes = ["isAlarm", "isWarning"];
            for (var i = 0; i < classes.length; i++) {
                jQuery.sap.byId(id).removeClass(classes[i]);
            }
            if (this.getIsAlarm() === "1" && this.getIsActive() === "1") {
                if (this.getIsBlock() === "1") {
                    jQuery.sap.byId(id).addClass("isAlarm");
                } else {
                    jQuery.sap.byId(id).addClass("isWarning");
                }
            }
            if (sap.m.Text.prototype.onAfterRendering) {
                sap.m.Text.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
            }
        }
    });
});