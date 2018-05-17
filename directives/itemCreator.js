//TODO:需要做抽象优化，支持弹框方式和内嵌方式。默认弹框方式。
define(['../modelSystemModule', 'angular', 'common/helper/responsePreHandler', '../../services/i18nService'],
  function(directiveModule, angular, responsePreHandler, i18nService) {

    var i18nInstance = i18nService.getI18n('modelSystem.simpleForm');
    var i18n = {
      ok: i18nInstance.i18n(true, 'common.lb.confirm'),
      cancel: i18nInstance.i18n(true, 'common.lb.cancel')
    }

    function error(msg) {
      throw new Error(msg || "");
    }
    directiveModule.controller('aliyunItemCreatorController', ['$scope', '$attrs', '$q', 'modelFactory', '$injector', function($scope, $attrs, $q, modelFactory, $injector) {
      var bizType = $scope.bizType || $attrs.bizType,
        bizAction = $scope.bizAction || $attrs.bizAction,
        modelType = $scope.formModelId || $scope.modelType || $attrs.bizAction || bizType;
      var bizModel = modelFactory.getModel(bizType, "BizModel"),
        formModel = $scope.formModel || modelFactory.getModel(modelType, "FormModel"),
        actionModel = $scope.actionModel || bizModel ? bizModel.getActionModel(bizAction) : modelFactory.getModel($scope.actionModelId, "BizActionModel");

      // if (!bizType) {
      //   !angular.isString(bizType) && error("'simpleForm' directive need the bizType but can not get it. check if the service name is right  or config Object is right");
      // }
      if (!actionModel) {
        throw new Error("the 'itemCreator' directive need a 'biz-action' attribute to work");
      }
      if (!formModel) {
        !angular.isObject(formModel) && error("'simpleForm' directive need the formModel but can not get it. check if the service name is right or config Object is right");
      }
      var me = this;

      me.dialog = $attrs.dialog == "true" ? true : false;
      $scope.initCreator = function(scope) {
        scope.rawData = $scope.rawData;
        scope.i18n = i18n;
        scope.$actionModel = actionModel;
        scope.viewModel = {
          dialog: $attrs.dialog == "true" ? true : false,
          formModel: formModel,
          formInvalid: false,
          submitForm: function() {
            //submitForm这个方法被赋值给 scope.viewModel，所以这里的this指向 scope.viewModel
            if (!this.formInvalid) {
              var currentScope = this.currentScope;
              var options = {
                method: "POST",
                postMessage: actionModel.postMessage || "",
                successMessage: actionModel.successMessage || "",
                data: actionModel.getActionParam(scope.rawData, currentScope)
              };
              //如果显示定义了隐藏默认错误弹框信息，则使用actionModel中的配置；如果没有显示定义，则判断是否定义了responseHandler,如果定义了，则隐藏，如果没有定义，则显示
              var hideDefaultErroDialog = actionModel.hideDefaultErroDialog !== undefined ? actionModel.hideDefaultErroDialog : (actionModel.responseHandler && actionModel.responseHandler != angular.emptyFunction  ? true : false);
              var responseHandler = (actionModel.responseHandler && actionModel.responseHandler == angular.emptyFunction) ? responsePreHandler.responsePreHandler : actionModel.responseHandler;
              var deferred = $q.defer();
              var promise = deferred.promise;
              if (angular.isFunction(actionModel.handler)) {
                actionModel.handler(scope.rawData, currentScope);
              } else
              //兼容已有写法
              if (bizModel && angular.isString(actionModel.handler)) {
                bizModel.bizService[actionModel.handler](options).then(function(result) {
                  var result = responseHandler(result, $injector, true, hideDefaultErroDialog) || result.data;
                  currentScope.$emit(bizType + ":actionExecuted", bizAction, result);
                  if (angular.isFunction(actionModel.afterActionExecuted)) {
                    actionModel.afterActionExecuted(result, currentScope);
                  }
                  deferred.resolve(result);
                });
              } else if (actionModel && angular.isFunction(actionModel.request)) {
                actionModel.request(options).then(function(result) {
                  var result = responseHandler(result, $injector, true, hideDefaultErroDialog) || result.data;
                  currentScope.$emit(bizType + ":actionExecuted", bizAction, result);
                  if (angular.isFunction(actionModel.afterActionExecuted)) {
                    actionModel.afterActionExecuted(result, currentScope);
                  }
                  deferred.resolve(result);
                })
              }
              return promise;
            }
          },
          currentScope: scope
        };
        actionModel.injectController($scope.rawData, scope, $injector);
      }
    }]);

    directiveModule.directive("itemCreator", ['$compile', '$injector', 'aliyunDialog', 'modelFactory', '$templateCache',
      function($compile, $injector, aliyunDialog, modelFactory, $templateCache) {
        return {
          restrict: "A",
          controller: "aliyunItemCreatorController as vm",
          scope: {
            //废弃写法，不推荐使用
            bizType: "@",
            bizAction: "@",
            modelType: "@",

            //新写法，推荐使用
            dialog: "@",
            actionModelId: "@",
            formModelId: "@",
            actionModel: "=",
            formModel: "=",
            rawData: "="
          },
          link: function(scope, elem, attrs) {
            var dialog = scope.vm.dialog;
            var url = "scripts/template/itemCreator.html";
            if (dialog) {
              elem.on("click", function(event) {
                event.preventDefault();
                aliyunDialog.showDialogByUrl(url, function(dialogScope) {
                  scope.initCreator(dialogScope);
                  aliyunDialog.formIsSubmiting = false;
                  dialogScope.viewData = {
                    title: dialogScope.$actionModel.name
                  }
                  dialogScope.eventHandler = function(result) {
                    if (result == true && !aliyunDialog.formIsSubmiting && !dialogScope.viewModel.formInvalid) {
                      aliyunDialog.formIsSubmiting = true;
                      dialogScope.viewModel.submitForm().then(function() {
                        aliyunDialog.formIsSubmiting = false;
                        dialogScope.close();
                      });
                    }
                  }
                }, {});
              })
            } else {
              scope.initCreator(scope);
              var html = $templateCache.get(url) || "";
              var formElement = angular.element(html);
              elem.append(formElement);
              $compile(elem.contents())(scope);
            }
          }
        }
      }
    ]);
  });
