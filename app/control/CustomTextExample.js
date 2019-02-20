sap.ui.define([
    "sap/m/Text"
], function (Text) {

    return Text.extend("myapp.control.CustomTextExample", {

        metadata: {
            events: {
                press: {}
            },

            properties: {
                color: {type: "string"}
            }
        },
        
        onAfterRendering: function () {
            var color = this.getColor();
            var classes = ["red", "green"];
            for (var i = 0; i < classes.length; i++) {
                this.removeStyleClass(classes[i]);
            }
            switch (color) {
                case "red":
                    this.addStyleClass("red");
                    break;
                default:
                    this.addStyleClass("green");
                    break;
            }
            if (sap.m.Text.prototype.onAfterRendering) {
                sap.m.Text.prototype.onAfterRendering.apply(this, arguments);
            }
        },
        onclick: function () {
            this.firePress();
        }
    });
});