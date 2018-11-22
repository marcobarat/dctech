sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonMessage", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                newMessages: {type: "string", defaultValue: "0"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classes = ["messageButton", "newMessageButton"];
            var newMess = (this.getNewMessages() === "") ? "0" : this.getNewMessages();
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            switch (newMess) {
                case "0":
                    this.addStyleClass("messageButton");
                    this.setText("");
                    break;
                default:
                    this.addStyleClass("newMessageButton");
                    this.setText("");
                    break;
            }
        }
    });
});