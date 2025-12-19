sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/mdg/deloitte/servicemaster/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.mdg.deloitte.servicemaster.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

         init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            // Gets userinfo details
            this.getUserInfo();

            // Set Busy Dialog
            this.busyDialog = new sap.m.BusyDialog();
            this.busyDialog.open();
        },
        /**
            * Function to fetch the current user ID
            * Supports SAP Fiori Launchpad, SAP BTP, and fallback options
            * @public
            */
        getBaseURL: function () {
            var appId = this.getManifestEntry("/sap.app/id");
            var appPath = appId.replace(/\./g, "/");
            var appModulePath = sap.ui.require.toUrl(appPath);
            return appModulePath;
        },


        getUserInfo: function () {
            const url = this.getBaseURL() + "/user-api/attributes";
            var oModel = new sap.ui.model.json.JSONModel();
            var mock = {
                firstname: "Dummy",
                lastname: "User",
                email: "dummy.user@com",
                name: "dummy.user@com",
                displayName: "Dummy User (dummy.user@com)"
            };

            oModel.loadData(url);
            oModel.dataLoaded()
                .then(() => {
                    let userData = oModel.getData();

                    // Ensure data is valid, else set mock data
                    if (!userData || !userData.email) {
                        console.warn("User data is empty. Using mock data.");
                        oModel.setData(mock);
                    }

                    this.setModel(oModel, "userInfo");
                    this.currentUser = oModel.getData().email;
                })
                .catch(() => {
                    console.error("Failed to load user data. Using mock data.");
                    oModel.setData(mock);
                    this.setModel(oModel, "userInfo");
                });

        }
    });
});