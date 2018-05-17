define(['../modelSystemModule', 'angular', '../../helper/responsePreHandler', '../../services/i18nService'],
  function(modelSystemModule, angular, responsePreHandler, i18nService) {

    modelSystemModule.directive('inlineCommand', ['$compile', '$injector', 'modelFactory', 'aliyunDialog',
      function($compile, $injector, modelFactory, aliyunDialog) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            element.on('click', function(event) {
              event.preventDefault();
              var bizType = attrs.bizType,
                action = attrs.action,
                actionModelId = attrs.actionModelId,
                itemField = attrs.itemField;
              if (!bizType && !actionModelId) {
                throw new Error("the 'inlineCommand' directive need a 'biz-type' attribute to work");
              }
              if (!action && !actionModelId) {
                throw new Error("the 'inlineCommand' directive need a 'action' attribute to work");
              }
              if (!itemField) {
                throw new Error("the 'inlineCommand' directive need a 'item-field' attribute to get rawData");
              }
              scope.keyField = attrs.keyField || '';
              var instanceItem = scope[itemField],
                bizInfo = modelFactory.getModel(bizType, "BizModel"),
                actionModel = bizInfo && bizInfo.bizActions && bizInfo.bizActions[action] || modelFactory.getModel(actionModelId, "BizActionModel");


              function defaultCallback(result) {
                scope.$emit(bizType + ":actionExecuted", action, result);
                if (angular.isFunction(actionModel.afterActionExecuted)) {
                  actionModel.afterActionExecuted(result)
                }
              }
              //拼接单行命令的Double Check提示信息
              var dialogOptions = {
                title: actionModel.title || (bizInfo ? (actionModel.name + (i18nService.getLangKey() == "zh" ? '' : ' ') + bizInfo.bizName) : actionModel.name),
                message: actionModel.getConfirmMsg(instanceItem, scope)
              }

              var modalInstance = aliyunDialog.showMessageDialog(dialogOptions, function(dialogScope) {
                angular.isFunction(actionModel.injectController) && actionModel.injectController( instanceItem,dialogScope,$injector)
                dialogScope.bizInfo = bizInfo;
                dialogScope.eventHandler = function(result) {

                  if (result === true) {
                    var params = actionModel.getActionParam(instanceItem, dialogScope);
                    var method = actionModel.requestMethod || "POST";
                    var options = {};
                    method = method.toUpperCase();
                    options.method = method;
                    if (method === "GET") {
                      options.params = params;
                    } else {
                      options.data = params;
                    }
                    options.successMessage = actionModel.successMessage;
                    options.postMessage = actionModel.postMessage;
                    var hideDefaultErroDialog = actionModel.hideDefaultErroDialog !== undefined ? actionModel.hideDefaultErroDialog : (actionModel.responseHandler && actionModel.responseHandler != angular.emptyFunction ? true : false);
                    var responseHandler = (actionModel.responseHandler && actionModel.responseHandler == angular.emptyFunction) ? responsePreHandler.responsePreHandler : actionModel.responseHandler;
                    if (angular.isFunction(actionModel.handler)) {
                      actionModel.handler(options, function(result) {
                        defaultCallback(result);
                      });
                    } else {
                      if (bizInfo) {
                        bizInfo.bizService[actionModel.handler](options).then(function(result) {
                          var result = responsePreHandler.responsePreHandler(result, $injector, true);
                          defaultCallback(result);
                        });
                      } else if (actionModel && angular.isFunction(actionModel.request)) {
                        actionModel.request(options).then(function(result) {
                          var result = responseHandler(result, $injector, true, hideDefaultErroDialog) || result.data;
                          defaultCallback(result);
                        })
                      }
                    }
                  }
                  dialogScope.close();
                }
              }, {});

              modalInstance.result.then(function() {
                element.focus();
              });
            })
          }
        }
      }
    ])
  })
