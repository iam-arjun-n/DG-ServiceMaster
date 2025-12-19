sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
], (Controller, JSONModel, DateFormat, Fragment) => {
    "use strict";

    return Controller.extend("com.mdg.deloitte.approval.controller.Approval", {
         onInit: function () {
            var oComments = new JSONModel();
            var aComments = [];
            oComments.setData(aComments);
            this.getOwnerComponent().busyDialog.close();
            this.getOwnerComponent().setModel(oComments, "commentModel");
             if (this.getOwnerComponent().getModel("task").getProperty("/TaskDefinitionName").search("Approval") >= 0) {
                this.byId("editbtn").setVisible(false);;
            }
            else {
                this.byId("viewbtn").setVisible(true);;
            }
        },
        onAfterRendering: function () {

            if (this.getOwnerComponent().getModel("context") !== undefined) {
                this.MasterReset();
            } else {
                setTimeout(() => {
                    this.MasterReset();
                }, 1000);
            }

        },
        MasterReset: function () {
            var oContextModel = this.getOwnerComponent().getModel("context");
            if (!oContextModel) {
                return;
            }

            var requestId = oContextModel.getProperty("/reqId");
            if (!requestId) {
                return;
            }
            let Existingcomments = [];
            this.requestType = oContextModel.getProperty("/Type");
            Existingcomments = oContextModel.getProperty("/Comment");
            this.getOwnerComponent().setModel(new JSONModel(Existingcomments), "commentModel");
            this.getView().setModel(new JSONModel(Existingcomments), "commentModel");
            this.getOwnerComponent().selectedReqID = requestId;

            var oMainServiceModel = this.getOwnerComponent().getModel("mainServiceModel");
            if (!oMainServiceModel) {
                return;
            }

            this.getView().setModel(oMainServiceModel);
            this.getOwnerComponent().busyDialog.open();
            oMainServiceModel.read("/ServiceMasterRequests('" + requestId + "')", {
                urlParameters: {
                    "$expand": "serviceMasterItems,serviceMasterItems/ServiceDescriptions"
                },
                success: function (oData) {
                    console.log("Read success", oData);
                    if (oData && oData.serviceMasterItems && oData.serviceMasterItems.results) {
                        var oLocalModel = new sap.ui.model.json.JSONModel({
                            ServiceCollection: oData.serviceMasterItems.results
                        });

                        this.getOwnerComponent().setModel(oLocalModel, "serviceModel");
                    }
                    this.getOwnerComponent().busyDialog.close();
                }.bind(this),
                error: function (oError) {
                    console.error("Read failed", oError);
                    this.getOwnerComponent().busyDialog.close();               
                }
            });
        },
        getUserInfo: function () {
            const url = this.getOwnerComponent().getBaseURL() + "/user-api/attributes";
            var oModel = new JSONModel();
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
                    if (!oModel.getData().email) {
                        oModel.setData(mock);
                    }

                    this.getView().setModel(oModel, "userInfo");
                    this.getOwnerComponent().currentUser = oModel.getData().email;


                })
                .catch(() => {
                    this.getView().setModel(oModel, "userInfo");
                });
        },
        onCommentPost: function (oEvent) {
            var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
            var oComments = this.getView().getModel("commentModel");
            var oDate = new Date();
            var sDate = oFormat.format(oDate);
            // create new entry
            var sValue = oEvent.getParameter("value");
            var aComments = oComments.getData();
            var oEntry = {
                UserName: this.getOwnerComponent().currentUser,
                Date: "" + sDate,
                Text: sValue,
                IsNew: true
            };
            aComments.unshift(oEntry);
            oComments.setData(aComments);
        },


        onSelectionChange: function (oEvent) {
            let blEnabled = false;
            let oSelectedItem = this.byId("tablelist").getSelectedItem();

            if (oSelectedItem) {
                blEnabled = true;
            }


            this.byId("viewbtn").setEnabled(blEnabled);

        },
        viewbom: function () {
            this._mode = "V"; // Add
            this.createServiceRequestModel(this.getView(), this.logonLanguage);
            this.displayDialog("View");
        },
        getServiceObject: function () {
            let objService = {
                ServiceType: "",
                ServiceTypeText: "",
                ServiceTypeKeyText: "",
                ServiceTypeSuggestionItems: [],
                Division: "",
                ServiceCategory: "",
                BaseUnitOfMeasure: "",
                BaseUnitOfMeasureText: "",
                BaseUnitOfMeasureKeyText: "",
                BaseUnitOfMeasureSuggestionItems: [],
                ServiceGroup: "",
                ServiceGroupText: "",
                ServiceGroupKeyText: "",
                ServiceGroupSuggestionItems: [],
                LongText: '',
                ServiceDescriptions: [{
                    ActivityNumber: "",
                    Description: ""
                }],
                UPC: "",
                EANCategory: "",
                EANCategoryText: "",
                EANCategoryKeyText: "",
                EANCategorySuggestionItems: [],
                ShortTextAllowed: false,
                ValuationClass: "",
                TaxIndicator: "",
                Formula: "",
                Graphic: "",
                SSC: "",
                HierarchyServiceNumber: "",
                Wagetype: "",
                PurchasingStatus: "",
                ValidityDate: "",
                Numberator: "",
                Denominator: "",
                SubContractorGroup: "",
                CoastingModel: "",
                UnitOfWork: "",
                TaxTraiffCode: "",
                Edition: ""


            };

            return objService;
        },
        createServiceRequestModel: function (oView, logonLanguage) {
            let objService = this.getServiceObject(logonLanguage);
            let oModel = new JSONModel(objService);
            oView.setModel(oModel, "ServiceRequestModel");
        },
          displayDialog: function (viewType) {
            this.getOwnerComponent().busyDialog.open();

            let dialogTitle = viewType + " Service Details";

            // Checks Service item selected for view type - View, Edit
            var oSelectedItem = this.byId("tablelist").getSelectedItem();
            if (viewType === "View" || viewType === "Edit") {
                if (oSelectedItem) {
                    var oBindingContext = oSelectedItem.getBindingContext("serviceModel");
                    this._editServicePath = oBindingContext.getPath();

                    let objService = JSON.parse(JSON.stringify(oBindingContext.getObject()));
                    this.getView().getModel("ServiceRequestModel").setData(objService);
                    this.getView().getModel("ServiceRequestModel").refresh(true);


                } else {
                    MessageBox.information("Please select the record !")
                    this.getOwnerComponent().busyDialog.close();
                    return;
                }
            }

            if (!this._ServiceObject) {
                this._ServiceObject = this.loadFragment({
                    name: "com.mdg.deloitte.approval.fragments.Data"
                });
            }

            // Displays Service dialog
            this._ServiceObject.then((oDialog) => {
                this.getView().addDependent(oDialog);
                // this.clearServiceUIValueState();
                this.createServiceMessageModel(this.getView());
                this.updateServiceUIFields(viewType);
                oDialog.setTitle(dialogTitle);
                oDialog.open();
                this.getOwnerComponent().busyDialog.close();
            });

        },
        createServiceMessageModel: function (oView) {
            let oModel = new JSONModel({
                messagesLength: 0,
                messages: []
            });
            oView.setModel(oModel, "ServiceMessageModel");
        },
        updateServiceUIFields: function (viewType) {
            let requestType = this.getView().getModel("serviceModel").getProperty("/RequestType");
            let blEditable = false;
            let blVisible = false;

            if (viewType === "View") {
                blEditable = false;
                blVisible = true;
            }
            // this.byId("srvDescripitonLanguage").setEditable(blEditable);
            this.byId("srvdesc").setEditable(blEditable);
            this.byId("idLongDesc").setEditable(blEditable);
            this.byId("uom").setEditable(blEditable);
            this.byId("idshort").setEditable(blEditable);
            this.byId("srvgrp").setEditable(blEditable);
            this.byId("inptformula").setEditable(blEditable);
            this.byId("inptGraphic").setEditable(blEditable);
            this.byId("inptauth").setEditable(blEditable);
            this.byId("srvtype").setEditable(blEditable);
            this.byId("srvcat").setEditable(blEditable);
            this.byId("ssc").setEditable(blEditable);
            this.byId("inptEdition").setEditable(blEditable);
            this.byId("inptHierarchyServiceNumber").setEditable(blEditable);
            this.byId("inptpurstatus").setEditable(blEditable);
            this.byId("inptdate").setEditable(blEditable);
            this.byId("inptUPC").setEditable(blEditable);
            this.byId("inptEANCategory").setEditable(blEditable);
            this.byId("In1").setEditable(blEditable);
            this.byId("In3").setEditable(blEditable);
            this.byId("In4").setEditable(blEditable);
            this.byId("inptsub").setEditable(blEditable);
            this.byId("inptcost").setEditable(blEditable);
            this.byId("In4").setEditable(blEditable);
            this.byId("inptDivision").setEditable(blEditable);
            this.byId("inptValclass").setEditable(blEditable);
            this.byId("inpttaxind").setEditable(blEditable);
            this.byId("inptWagetype").setEditable(blEditable);
            this.byId("inpttaxtrafin").setEditable(blEditable);


        },
        cancelService: function () {
            this._ServiceObject.then((oDialog) => {
                if (this.attribFieldIDs) {
                    this.attribFieldIDs.forEach(id => {
                        this.byId(id).destroy()
                    });
                    this.attribFieldIDs = [];
                }
                oDialog.close()
            });
        },

        getF4Data: function (model, entityset, oFilters) {
            return new Promise((resolve, reject) => {
                model.read(entityset, {
                    filters: oFilters,
                    success: data => resolve(data),
                    error: err => reject(err)
                });
            });
        },

        openF4Dialog: function (F4Title, formattedData, inputId) {
            this.inputId = inputId;
            if (!this.F4Dialog) {
                // Only load the fragment once
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mdg.deloitte.approval.fragments.F4Dialog"
                }).then(oDialog => {
                    this.F4Dialog = oDialog;
                    let view = this.getView();
                    view.addDependent(oDialog);
                    const oModel = new sap.ui.model.json.JSONModel(formattedData);
                    view.setModel(oModel, "F4Model");

                    oDialog.setTitle(F4Title);

                    // Attach event handlers
                    oDialog.attachSearch(this._handleValueHelpSearch, this);
                    oDialog.attachLiveChange(this._handleValueHelpSearch, this);
                    oDialog.attachConfirm(this._handleValueHelpClose, this);
                    oDialog.attachCancel(this._handleValueHelpClose, this);

                    oDialog.open();
                }).catch(err => {
                    MessageBox.error("Failed to load F4 dialog: " + err.message);
                });
            } else {
                // Reuse the existing dialog
                const oModel = new sap.ui.model.json.JSONModel(formattedData);
                this.getView().setModel(oModel, "F4Model");
                this.F4Dialog.setTitle(F4Title);

                // Attach event handlers again in case the dialog was reused
                this.F4Dialog.attachSearch(this._handleValueHelpSearch, this);
                this.F4Dialog.attachLiveChange(this._handleValueHelpSearch, this);
                this.F4Dialog.attachConfirm(this._handleValueHelpClose, this);
                this.F4Dialog.attachCancel(this._handleValueHelpClose, this);

                this.F4Dialog.open();
            }

        },
        _handleValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, sValue),
                    new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, sValue)
                ],
                and: false
            });

            // Apply the filter to the model
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter(oFilter);
        },
        _handleValueHelpClose: function (oEvent) {
            let oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }

            let inputField = this.getView().byId(this.inputId);
            if (inputField) {
                inputField.setValue(oSelectedItem.getTitle());
            }


        },
        onValueHelpRequestUOM: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_BASEUOM",
                filters = [new sap.ui.model.Filter("language", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.weightUnit,
                        "description": item.weightUnitText
                    });
                });
                this.openF4Dialog("Unit Of Measure", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Unit Of Measure: " + err.message);
            });
        },
        onValueHelpRequestMatGrp: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/I_MaterialGroup"
            this.getF4Data(model, entityset).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.MaterialGroup,
                        "description": item.MaterialGroup_Text
                    });
                });
                this.openF4Dialog("Material Group", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Material Group: " + err.message);
            });
        },
        onValueHelpRequestDivision: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_DIVISION",
                filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.DIVISION,
                        "description": item.NAME
                    });
                });
                this.openF4Dialog("Division", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Division: " + err.message);
            });
        },
        onValueHelpRequestValClass: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/I_Prodvaluationclasstxt",
                filters = [new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.ValuationClass,
                        "description": item.ValuationClassDescription
                    });
                });
                this.openF4Dialog("Valuation Class", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Valuation Class: " + err.message);
            });
        },
        onValueHelpRequestFormula: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_FORMULANO",
                filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.FormulaNumber,
                        "description": item.DESCRIPTION
                    });
                });
                this.openF4Dialog("Formula", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Formula: " + err.message);
            });
        },
        onValueHelpRequestTaxTraiffCode: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/I_AE_CNSMPNTAXCTRLCODETXT",
                filters = [new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.ConsumptionTaxCtrlCode,
                        "description": item.ConsumptionTaxCtrlCodeText1,
                        "info": item.CountryCode
                    });
                });
                this.openF4Dialog("Tax Traiff Code", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Tax Traiff Code: " + err.message);
            });
        },
        onValueHelpRequestHierarchyServiceNumber: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_HIERSERVNO"
            this.getF4Data(model, entityset).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.SERVNO,
                        "description": item.HIERARCHYSRVNO
                    });
                });
                this.openF4Dialog("Hierarchy Service Number", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Hierarchy Service Number: " + err.message);
            });
        },
        onValueHelpRequestEANcat: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_EANCATEGORY",
                filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.EAN,
                        "description": item.DESCRIPTION
                    });
                });
                this.openF4Dialog("Ean Category", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Ean Category: " + err.message);
            });
        },
        onValueHelpRequestCoastingModel: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_COSTMODEL",
                filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.COSTMODEL,
                        "description": item.DESCRIPTION,
                        "info": item.SEQNO
                    });
                });
                this.openF4Dialog("Costing Model", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Costing Model: " + err.message);
            });
        },
        onValueHelpRequestServiceType: function (oEvent) {
            let model = this.getOwnerComponent().getModel("masterServiceModel"),
                entityset = "/ZI_SERVCAT",
                filters = [new sap.ui.model.Filter("LANGUAGE", sap.ui.model.FilterOperator.EQ, "EN")];
            this.getF4Data(model, entityset, filters).then(data => {
                let formattedData = [];
                data?.results.forEach(item => {
                    formattedData.push({
                        "title": item.SERVICECATEGORY,
                        "description": item.DESCRIPTION
                    });
                });
                this.openF4Dialog("Service Type", formattedData, oEvent.getSource().getId());
            }).catch(err => {
                MessageBox.error("Failed to load data for Service Type: " + err.message);
            });
        },


    });
});