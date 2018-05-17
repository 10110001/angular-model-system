define(['../modelSystemModule', 'angular',
  '../lib/template', '../lib/util',
  '../../cons/aliyunCons',
  '../../services/topicService'], function(modelSystemModule, angular, TP, Util, aliyunCons, topicService) {
  var RESPONSE_CODE = aliyunCons.RESPONSE_CODE;
  var global = {
      getTemplate: function() {

      }
    }
    /**
     * 定义渲染器工厂
     * @param {[type]} action [description]
     */

  function BizComponentRender(component) {
    this.component = component;
    if (angular.isFunction(this.component.component)) {
      this.component.component = this.component.component(this.component, this.component.rawData);
    }
  }

  BizComponentRender.prototype = {
    constructor: BizComponentRender,
    renderComponent: function(component) {
      var html = TP.tmpl(this.getRenderTemplate(component), this.getRenderData(component)) || "";
      return html;
    },
    getRenderTemplate: function(component) {
      var templates = bizComopnentRenderConf.renderTemplates,
        templateName = 'bizComponent';
      return templates[templateName];
    },
    getComponentHtml: function(component) {
      return global.getTemplate(component);
    },
    getToolbarHtml: function(component) {
      var toolbarHtml = "";
      if (component && component.toolbar) {
        toolbarHtml = '<div toolbar tool-bar-model="toolbar"></div>';
      }
      return toolbarHtml;
    },
    getRenderData: function(component) {
      var component = this.component || component;
      var renderData = {};
      var toolbarPosition = component.getToolbarPosition() || "right";
      renderData = {
        componentClass: component.getClass(),
        attributes: this.getAttrsHtml(),
        headerClass: component.getHeaderClass(),
        toolbarPosition: toolbarPosition == "left" ? "pull-left" : "pull-right",
        toolbarClass: component.getToolbarClass(),
        toolbarHtml: this.getToolbarHtml(component),
        titleClass: component.getTitleClass(),
        title: component.getTitle(),
        componentBodyClass: component.getComponentBodyClass(),
        componentHtml: this.getComponentHtml(component),
        rawData: this.getRawDataHtml()
      }
      return renderData;
    },
    getAttrsHtml: function(component) {
      var component = this.component || component,
        attrs = component.attrs,
        attrsString = "";
      if (attrs) {
        for (var attr in attrs) {
          if (attrs.hasOwnProperty(attr)) {
            attrsString += attr + '="' + attrs[attr] + '" ';
          }
        }
      }
      return attrsString;
    },
    getRawDataHtml: function() {}
  }

  BizComponentRender.init = function(configs) {
    !this.constructors && (this.constructors = {});
    var renders = configs.renders;
    !angular.isObject(renders) && (renders = {});
    for (var i in renders) {
      if (renders.hasOwnProperty(i)) {
        Util.inherit(renders[i], BizComponentRender);
      }
    }
    angular.extend(this.constructors, renders);
    BizComponentRender.prototype.renderTemplates = configs.renderTemplates;
  }

  BizComponentRender.factory = function(type) {
    type == false ? type = "normal" : "";
    return this.constructors[type] || BizComponentRender;
  }

  BizComponentRender.registRender = function(name, constructor) {
    if (!this.constructors[name]) {
      constructor = Util.inherit(constructor, BizComponentRender);
      this.constructors[name] = constructor;
    }
  }


  /**
   * 普通类型渲染器
   * @param {[type]} model [description]
   */
  function NormalRender(component) {
    BizComponentRender.call(this, component)
  }

  NormalRender.prototype = {
    constructor: NormalRender

  }

  function GridRender(component) {
    BizComponentRender.call(this, component);
  }
  GridRender.prototype = {
    constructor: GridRender,
    getComponentHtml: function(component) {
      var renderData = {
        bizType: component.bizType,
        bizAction: component.bizAction,
        modelType: component.modelType
      }
      return TP.tmpl('<div item-grid biz-type="<%=bizType%>" biz-action="<%=bizAction%>" biz-model="bizModel" model-type="<%=modelType%>"></div>', renderData);
    }
  }

  function ChartRender(component) {
    BizComponentRender.call(this, component);
  }

  ChartRender.prototype = {
    constructor: ChartRender,
    getComponentHtml: function(component) {
      var renderData = {
          bizType: component.bizType,
          bizAction: component.bizAction,
          modelType: component.modelType
        }
        // <div aliyun-console-chart chart-created="chartCreated(chart)" config="chartConfig"></div>'
      return TP.tmpl('<div ms-chart biz-type="<%=bizType%>" biz-action="<%=bizAction%>" biz-model="bizModel" model-type="<%=modelType%>" ></div>', renderData);
    }
  }
  /**
   * 开发人员可以做个性化配置的渲染器配置项
   * @type {Object}
   */
  var bizComopnentRenderConf = {
    renders: {
      custom: NormalRender,
      grid: GridRender,
      chart: ChartRender
    },
    BizComponentRender: BizComponentRender,
    renderTemplates: {
      bizComponent: [
          '<div bind-once>',
            '<div class="console-biz-component <%=componentClass%>" <%=attributes%> >',
              '<%if(title){%>',
              '<div class="console-title <%=headerClass%>">',
                '<div class="<%=toolbarPosition%> <%=toolbarClass%>">',
                  '<%=toolbarHtml%>',
                '</div>',
                '<h5 class="<%=titleClass%>">',
                '<%=title%>',
                '</h5>',
              '</div>',
              '<%}%>',
              '<div class="<%=componentBodyClass%>" >',
                '<div ng-class="{noVisibility:loadingComponent}">',
                  '<div data-ng-if="!requestFail">',
                    '<%=componentHtml%>',
                  '</div>',
                  '<div data-ng-hide="requestFail">',
                    '<div data-ng-bind="failInfo"></div>',
                  '</div>',
                '</div>',
                '<div data-ng-if="loadingComponent" aliyun-loading size="48" style="position:absolute; top:0px; margin-top:100px;"></div>',
              '</div>',
            '</div>',
          '</div>'
      ].join(' '),
      action: [

      ].join(' '),
      menu: [

      ].join('')
    }
  }

  function getBizComponentModel(scope, modelService, bizType) {
    if (scope.bizComponentModel) {
      return scope.bizComponentModel;
    }
    if (modelService) {
      return modelService.getModel(bizType, "BizComponentModel");
    }
  }
  modelSystemModule.constant("bizComopnentRenderConf", bizComopnentRenderConf)
    .directive('bizComponent', ['$compile', '$injector', 'modelDefineService', 'modelFactory',
      function($compile, $injector, modelDefineService, modelFactory) {
        return {
          restrict: 'A',
          scope: {
            bizComponentModel: "=",
            rawData: "=",
            renderWatch: "="
          },
          controller: ['$scope', '$templateCache', 'bizComopnentRenderConf','aliyunCommonTopicService',
            function($scope, $templateCache, bizComopnentRenderConf, topicService) {
              //赋予渲染器运行时扩展的能力
              BizComponentRender.init(bizComopnentRenderConf);

              /**
               * 渲染工具栏按钮
               * @param  {Object} action  按钮
               * @param  {Object} rawData 业务数据
               * @return {string}         渲染生成的HTML字符串
               */
              function renderBizComponent(component, rawData) {

                var componentType = component.getType() || "";
                var renderer = new(BizComponentRender.factory(componentType))(component);
                return renderer.renderComponent(component);
              }
              /**
               * 获取工具栏模型自己定义的模板
               * @param  {Object} BizComponentModel 工具栏模型
               * @return {string}              工具栏模型自己定义的模板
               */
              function getTemplate(BizComponentModel) {
                var template = BizComponentModel.template ? BizComponentModel.template : BizComponentModel.templateUrl ? $templateCache.get(BizComponentModel.templateUrl) : "";
                return template;
              }

              function getComponentTemplate(component) {
                var cpt = component;
                var componentTemplate = cpt.componentTemplate || (cpt.componentTemplateUrl ? $templateCache.get(cpt.componentTemplateUrl) : "");
                if (componentTemplate) {
                  return componentTemplate;
                } else {
                  return "";
                }
              }

              global.getTemplate = getComponentTemplate;
              /**
               * 渲染工具栏
               * @param  {Object} BizComponentModel 工具栏模型
               * @param  {Array} actions      按钮组
               * @param  {Object} rawData      业务数据
               * @return {DOM Object}          经过渲染的Dom对象
               */
              $scope.renderBizComponent = function(component) {
                var template = getTemplate(component);
                if (template) {
                  if (angular.isFunction(component.prepareDataForTemplate)) {
                    component.prepareDataForTemplate(component, $scope);
                    return angular.element(template);
                  }
                } else {
                  var html = renderBizComponent(component);
                  return angular.element(html);
                }
              }

              $scope.initBizComponent = function(scope,bizComponentModel) {
                injectBizModel(scope, bizComponentModel);
                initEvents(scope, bizComponentModel);
              }

              function injectBizModel(scope, bizComponentModel) {
                //获取业务模型
                var bizType = bizComponentModel.getBizType(),
                  bizAction = bizComponentModel.getBizAction(),
                  bizModel = modelFactory.getModel(bizType, "BizModel");

                //劫持业务模型并修改
                if (bizModel) {
                  scope.loadingComponent = true;
                  var cloneAllProperty = true;
                  var _bizModel = Util.deepClone({}, bizModel, cloneAllProperty);
                  var actionModel = _bizModel.getActionModel(bizAction);
                  if (actionModel) {
                    actionModel._getActionParam = actionModel.getActionParam;
                    actionModel.getActionParam = function() {
                      var args = Array.prototype.slice.call(arguments, 0),
                        params = actionModel._getActionParam.apply(actionModel, args);
                      !params && (params = {});
                      params.__bizComponentId = bizComponentModel.getId();
                      return params;
                    }
                    scope.bizModel = _bizModel;
                  }
                }else{
                  scope.loadingComponent = false;
                  scope.requestFail = false;
                }
              }

              function initEvents (scope, bizComponentModel) {
                var bizComponentId = bizComponentModel.getId();
                topicService.subscribe("BizComponent:"+bizComponentId + ":requestFail",function  () {
                  scope.loadingComponent = false;
                  scope.requestFail = true;
                });
                topicService.subscribe("BizComponent:"+bizComponentId + ":requestSuccess",function  () {
                  scope.loadingComponent = false;
                  scope.requestFail = false;
                })
                scope.$on("$destroy",function  () {

                })
              }
            }
          ],
          link: function(scope, element, attrs) {

            var model = getBizComponentModel(scope, modelFactory, attrs.bizType);
            if (!model) {
              throw new Error("bizComponentModel is needed for the bizComponent directive")
            }
            var bizComponentModel = modelDefineService.defBizComponentModel(model);
            angular.extend(scope, bizComponentModel);
            //初始化业务容器
            scope.initBizComponent(scope,bizComponentModel);

            function render() {
              var componentDom = scope.renderBizComponent(bizComponentModel);
              element.append(componentDom);
              $compile(element.contents())(scope);
            }
            scope.$watch("renderWatch", function(value) {
              render();
            })
          }
        }
      }
    ]).provider('BizComponentRenderExtend', ['bizComopnentRenderConf',
      function(bizComopnentRenderConf) {
        var renders = bizComopnentRenderConf.renders;
        return {
          extend: function(name, constructor) {
            var render = renders[name];
            if (!render) {
              renders[name] = constructor;
            }
          },
          $get: function() {
            return BizComponentRender;
          }
        }
      }
    ]).factory('modelSystemBizComponentHttpInterceptor',['$q', '$rootScope','aliyunCommonTopicService', function($q, $rootScope, topicService){
        return{
          'response': function(result){
            var data = result.data;
            var config = result.config;
            //TODO:需要考虑POST的情况
            var bizComponentId = config.params && config.params.__bizComponentId || 0;
            if(bizComponentId){
              if(config && data &&  data.code == RESPONSE_CODE.SUCCESS){
                topicService.publish("BizComponent:" + bizComponentId+":requestSuccess");
                return result;
              }else{
                topicService.publish("BizComponent:" + bizComponentId+":requestFail");
                return false;
              }
            }
            return result;
          },
          'responseError': function(rejection){
            topicService.publish();
            return $q.reject(rejection)
          }
        }
      }]);

    modelSystemModule.config(['$httpProvider', function($httpProvider){
      $httpProvider.interceptors.push('modelSystemBizComponentHttpInterceptor');
    }])
})
