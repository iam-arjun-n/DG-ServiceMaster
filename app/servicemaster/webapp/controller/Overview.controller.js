sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/Token",
    "sap/ui/model/FilterType",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "com/mdg/deloitte/servicemaster/model/formatter"
], (Controller, Fragment, FilterOperator, Filter, Token, FilterType, MessageBox, JSONModel, Spreadsheet,formatter) => {
    "use strict";

    return Controller.extend("com.mdg.deloitte.servicemaster.controller.Overview", {
          formatter: formatter,
        onInit: function () {
            let that = this;
            this.oBundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
            this.getOwnerComponent().busyDialog.close();
            var globalModel = this.getOwnerComponent().getModel('mainServiceModel');
            this.getView().setModel(globalModel);
            var maxL = this.getView().byId("maxL").getValue();
            if (maxL == 0) {
                maxL = 50;
            }
            globalModel.setSizeLimit(maxL);

            this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            // this._myDelegate = {
            //     "onAfterRendering": function (oEvent) {
            //         let currUser = sap.ushell.Container.getService("UserInfo")?.getEmail()?.toLowerCase();
            //         if (currUser && currUser !== '') {
            //             this.byId("crBy").addToken(new sap.m.Token({
            //                 text: currUser
            //             }));
            //             oEvent?.srcControl?.fireSearch();
            //         }
            //     }
            // };
            // this.byId("filterbar").addEventDelegate(this._myDelegate, this);
        },
        onDefaultAction: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("Create", {
                type: "C",
                key: "C"
            });

        },
        
        navTo: function (view) {
            this.getOwnerComponent().getRouter().navTo(view);
        },

        onCreate: function () {
            this.navTo("Create");
        },  
        onViewObj: function () {
            var oTable = this.getView().byId("tblRequests");
            if (!oTable) {
                MessageBox.error("Table not found. Please check the ID.");
                return;
            }

            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                MessageBox.warning("Please select a record to view details.");
                return;
            }

            var oContext = oSelectedItem.getBindingContext("mainServiceModel");
            if (!oContext) {
                MessageBox.error("Binding context not found. Please check the model binding.");
                return;
            }

            var reqId = oContext.getProperty("requestId");
            if (!reqId) {
                MessageBox.error("Selected record does not contain a valid Request ID.");
                return;
            }

            var oModel = this.getView().getModel("mainServiceModel");
            if (!oModel) {
                MessageBox.error("Model not found. Please check the model binding.");
                return;
            }

            oModel.read("/ServiceMasterRequests('" + reqId + "')", {
                // urlParameters: {
                //     "$expand": "NAV_WORKFLOW_ITEMSET,NAV_WORKFLOW_ITEMSET/NAV_MATERIAL_DATA,NAV_WORKFLOW_ITEMSET/NAV_DOCUMENT_DATA,NAV_WORKFLOW_ITEMSET/NAV_GENERAL_DATA,NAV_WORKFLOW_ITEMSET/NAV_HEADER_DATA,NAV_WORKFLOW_ITEMSET/NAV_BASIC_DATA,NAV_WORKFLOW_ITEMSET/NAV_STATUS_LONG_DATA,NAV_WORKFLOW_COMMENTS"
                // },
                success: (oData) => {

                    if (oData.serviceMasterItems && oData.serviceMasterItems.results) {
                        var structuredData = {
                            ServiceCollection: oData.serviceMasterItems.results
                        };
                        var oLocalModel = new JSONModel();
                        oLocalModel.setData(structuredData);
                        this.getOwnerComponent().setModel(oLocalModel, "serviceModel");
                        this.getOwnerComponent().getRouter().navTo("Create")

                    } else {
                        MessageBox.error("No workflow items found in the response.");
                    }
                },
                error: (oError) => {
                    MessageBox.error("Error fetching details. Please try again.");
                }




            });
        },
        onDisplay: function () {
            const oModel = this.getOwnerComponent().getModel("masterServiceModel");

            const aFilters = [
                new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN")
            ];

            oModel.read("/I_TripServiceNumberVH", {
                filters: aFilters,
                success: function (oData) {
                    if (!oData.results.length) {
                        MessageBox.warning("No Service Numbers found");
                        return;
                    }
                    const oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
                    this.getView().setModel(oJsonModel, "serviceVH");
                    if (!this._oServiceDialog) {
                        this._oServiceDialog = sap.ui.xmlfragment(
                            "com.mdg.deloitte.servicemaster.fragments.ServiceDialog",
                            this
                        );
                        this.getView().addDependent(this._oServiceDialog);
                    }

                    this._oServiceDialog.open();

                }.bind(this),
                error: function () {
                    MessageBox.error("Failed to load Service Numbers");
                }
            });
        },
        onServiceConfirm: function () {
            const oList = sap.ui.getCore().byId("serviceList");
            const oSelectedItem = oList.getSelectedItem();
            if (!oSelectedItem) { 
                MessageBox.warning("Please select a Service Number"); 
                return; 
            }
            let sServiceNumber = oSelectedItem.getTitle();
            sServiceNumber = sServiceNumber.replace(/\D/g, "").padStart(18, "0");
            this._oServiceDialog.close();
            this.getOwnerComponent().getRouter().navTo("Change", { sServiceNumber: sServiceNumber });
        },

        onServiceCancel: function () {
            this._oServiceDialog.close();
        }
    });
});