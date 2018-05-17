define(['../modelSystemModule', 'angular', '../lib/template'], function(modelSystemModule, angular, TP) {

  function inherit(sub, sup) {
    function F() {}
    F.prototype = sup.prototype;
    sub.prototype = new F();
    sub.prototype.constructor = sub;
    return sub;
  }
  /**
   * 渲染工具栏按钮
   * @param  {Object} action  按钮
   * @param  {Object} rawData 业务数据
   * @return {string}         渲染生成的HTML字符串
   */
  function renderToolBarAction(action, rawData) {
    var actionHtml = action.render(rawData);
    if (actionHtml) {
      return actionHtml;
    }
    action.setRawData(rawData);
    var actionType = action.getType() || "";

    var renderer = new(ActionRender.factory(actionType))(action);
    return renderer.renderAction(action);
  }


  /**
   * 定义渲染器工厂
   * @param {[type]} action [description]
   */
  function ActionRender(action) {
    this.action = action;
    if (angular.isFunction(this.action.action)) {
      this.action.action = this.action.action(this.action, this.action.rawData);
    }
  }

  ActionRender.prototype = {
    constructor: ActionRender,
    renderAction: function(action) {
      var html = TP.tmpl(this.getActionTemplate(action), this.getRenderData(action)) || "";
      return html;
    },
    getActionTemplate: function(action) {
      var action = this.action || action,
        actionStatus = "",
        templates = toolbarRenderConf.renderTemplates,
        templateName = '';
      if (action.showTip) {
        templateName = "tipAction";
      } else if (action.getType() == 'menu') {
        templateName = "menu";
      } else if (action.getType() == 'empty') {
        templateName = "empty";
      } else {
        templateName = "action";
      }
      return templates[templateName];
    },
    getRenderData: function(action) {
      var action = this.action || action;
      var renderData = {};
      if (action.showTip) {
        renderData = {
          tipDirection: action.tipDirection || "left",
          tipText: action.tip || "",
          actionClass: action.getClass() || "",
          spmId: action.spmId || "",
          action: this.getActionDirective(action) || "",
          attributes: this.getAttrsHtml() || "",
          rawData: this.getRawDataHtml() || "",
          actionTextClass: action.actionTextClass || "",
          text: action.text || ""
        }
      } else {
        renderData = {
          actionClass: action.getClass() || "",
          spmId: action.spmId || "",
          action: this.getActionDirective(action) || "",
          attributes: this.getAttrsHtml() || "",
          rawData: this.getRawDataHtml() || "",
          actionTextClass: action.actionTextClass || "",
          text: action.text || ""
        }
      }
      return renderData;
    },
    getActionDirective: function(action) {
      var action = this.action || action;
      return action.action;
    },
    getAttrsHtml: function(action) {
      var action = this.action || action,
        attrs = action.attrs,
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
    getRawDataHtml: function() {

    }
  }

  ActionRender.init = function(configs) {
    !this.constructors && (this.constructors = {});
    var renders = configs.renders;
    !angular.isObject(renders) && (renders = {});
    angular.extend(this.constructors, renders);
    ActionRender.prototype.renderTemplates = configs.renderTemplates;
  }

  ActionRender.factory = function(type) {
    type == false ? type = "normal" : "";
    return this.constructors[type] || ActionRender;
  }

  ActionRender.registRender = function(name, constructor) {
    if (!this.constructors[name]) {
      this.constructors[name] = constructor;
    }
  }

  /**
   * 命令类型的按钮渲染器
   * @param {[type]} action [description]
   */
  function CommandRender(action) {
    ActionRender.call(this, action)
  }
  inherit(CommandRender, ActionRender);
  angular.extend(CommandRender.prototype, {
    getActionDirective: function(action) {
      return "inline-command";
    }
  })


  /**
   * 菜单类型按钮渲染器
   * @param {[type]} action [description]
   */
  function MenuRender(action) {
    ActionRender.call(this, action)
  }
  inherit(MenuRender, ActionRender);
  angular.extend(MenuRender.prototype, {
    getRenderData: function(action) {
      return {
        menu: action,
        text: action.text || "",
        actions: action.children || [],
        itemClass: action.menuItemClass || "",
        // renderer: function(act, rawData) {
        //   act.setRawData(rawData);
        //   var actionType = act.getType() || "";
        //   var renderer = new(ActionRender.factory(actionType))(act);
        //   return renderer.renderAction(act);
        // }
        renderer: renderToolBarAction
      };
    }
  })

  function EmptyRender(action) {
    ActionRender.call(this, action)
  }
  inherit(EmptyRender, ActionRender);
  angular.extend(EmptyRender.prototype, {
    getActionDirective: function(action) {
      return "inline-command";
    }
  })

  /**
   * 链接类型按钮渲染器
   * @param {[type]} action [description]
   */
  function LinkRender(action) {
    ActionRender.call(this, action)
  }
  inherit(LinkRender, ActionRender);
  angular.extend(LinkRender.prototype, {
    getActionDirective: function(action) {
      return 'ng-href = " ' + action.action + '"';
    }
  })

  /**
   * 路由链接类型渲染器
   * @param {[type]} action [description]
   */
  function StateLinkRender(action) {
    ActionRender.call(this, action)
  }
  inherit(StateLinkRender, ActionRender);
  angular.extend(StateLinkRender.prototype, {
    getActionDirective: function(action) {
      return 'ui-sref= "' + action.action + '"';
    }
  })

  /**
   * 普通类型渲染器
   * @param {[type]} action [description]
   */
  function NormalRender(action) {
    ActionRender.call(this, action)
  }
  inherit(NormalRender, ActionRender);
  angular.extend(NormalRender.prototype, {
    getActionDirective: function(action) {
      return action.action;
    }
  })


  /**
   * 开发人员可以做个性化配置的渲染器配置项
   * @type {Object}
   */
  var toolbarRenderConf = {
    renders: {
      command: CommandRender,
      menu: MenuRender,
      empty: EmptyRender,
      link: LinkRender,
      stateLink: StateLinkRender,
      normal: NormalRender
    },
    actionRender: ActionRender,
    renderTemplates: {
      tipAction: [
        '<div style="display:inline-block;"',
        'tooltip-placement="<%=tipDirection%>"',
        'tooltip="<%=tipText%>">',
        '<a href="javascript:;"',
        'class="<%=actionClass%>"',
        'aliyun-console-spm spm-id="<%=spmId%>"',
        '<%=action%>',
        '<%=attributes%>',
        '<%=rawData%>',
        '><span class="<%=actionTextClass%>">',
        '<%=text%>',
        '</span></a></div>'
      ].join(' '),
      action: [
        '<a href="javascript:;"',
        'class="<%=actionClass%>"',
        'aliyun-console-spm spm-id="<%=spmId%>"',
        '<%=action%>',
        '<%=attributes%>',
        '<%=rawData%>',
        '><span class="<%=actionTextClass%>">',
        '<%=text%>',
        '</span></a>'
      ].join(' '),
      menu: [
        '<div class="dropdown">',
        '<a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown"><%=text%><span class="caret"></span></a>',
        '<ul class="dropdown-menu">',
        '<%if(actions && actions.length>0){%>',
        '<%for(var i=0, act=null;act=actions[i];i++){%>',
        '<li class="<%=itemClass%>"><%=renderer(act,menu.rawData)%></li>',
        '<%}}%>',
        '</ul>',
        '</div>'
      ].join(''),
      empty: [
        '<div ',
        'class="btn-xs" ',
        '<%=action%>',
        '<%=attributes%>',
        '<%=rawData%>',
        '><span class="<%=actionTextClass%>">',
        '<%=text%>',
        '</span></div>'
      ].join('')
    }
  }

  function getToolbarModel(scope, modelService, modelId) {
    if (scope.toolBarModel) {
      return scope.toolBarModel;
    }
    if (modelService) {
      return modelService.getModel(modelId, "ToolbarModel");
    }
  }
  modelSystemModule.constant("toolbarRenderConf", toolbarRenderConf)
    .directive('toolbar', ['$compile', '$injector', 'modelDefineService', 'modelFactory',
      function($compile, $injector, modelDefineService, modelFactory) {
        return {
          restrict: 'A',
          scope: {
            modelId: "@",
            toolBarModel: "=",
            rawData: "=",
            toolbarWatch: "="
          },
          controller: ['$scope', '$templateCache', 'toolbarRenderConf',
            function($scope, $templateCache, toolbarRenderConf) {
              //赋予渲染器运行时扩展的能力
              ActionRender.init(toolbarRenderConf);


              /**
               * 获取工具栏模型自己定义的模板
               * @param  {Object} toolBarModel 工具栏模型
               * @return {string}              工具栏模型自己定义的模板
               */
              function getToolBarTemplate(toolBarModel) {
                var template = toolBarModel.template ? toolBarModel.template : toolBarModel.templateUrl ? $templateCache.get(toolBarModel.templateUrl) : "";
                return template;
              }

              /**
               * 渲染工具栏
               * @param  {Object} toolBarModel 工具栏模型
               * @param  {Array} actions      按钮组
               * @param  {Object} rawData      业务数据
               * @return {DOM Object}          经过渲染的Dom对象
               */
              $scope.renderToolbar = function(toolBarModel, actions, rawData) {
                var template = getToolBarTemplate(toolBarModel);
                if (template) {
                  if (angular.isFunction(toolBarModel.prepareDataForTemplate)) {
                    toolBarModel.prepareDataForTemplate(toolBarModel, rawData, $scope, $injector);
                  }
                  return angular.element(template);
                } else {
                  var html = [];
                  //获取模型定义的按钮分隔符
                  var separator = toolBarModel.getActionSeparator();
                  for (var i = 0, act = null; act = actions[i]; i++) {
                    //如果当前按钮定义了不要分隔符，且上一个按钮要分隔符，则html栈弹出分隔符；
                    if (act.withPreSeparator === false && actions[i - 1] && actions[i - 1].withSeparator !== false) {
                      html.pop();
                    }
                    html.push(renderToolBarAction(act, rawData));
                    if (act.withSeparator !== false && i < actions.length - 1) {
                      //判断按钮自己是否定义了它后面的分隔符，如果定义了的话，则使用它自己定义的；否则使用工具栏模型定义的分隔符
                      var innerSeparator = angular.isFunction(act.getActionSeparator) ? act.getActionSeparator() : separator;
                      html.push(innerSeparator);
                    }
                  }
                  html = html.join('');
                  return angular.element(html);
                }
              }
            }
          ],
          link: function(scope, element, attrs) {
            var model = getToolbarModel(scope, modelFactory, scope.modelId || attrs.bizType);
            if (!model) {
              throw new Error("toolBarModel is needed for the toolbar directive")
            }
            var toolBarModel = modelDefineService.defToolbarModel(model.bizType, model);

            function toolbar(rawData) {
              //根据业务数据，动态在运行时定义不同的业务状态，及该业务状态下有哪些按钮
              toolBarModel.setActionListOfBizStatusByRawData(rawData, toolBarModel.getActionListByBizStatus());
              //获取数据
              var status = toolBarModel.getModelBizStatus(rawData, scope, $injector),
                //渲染工具条
                actions = toolBarModel.getActionListByBizStatus(status),
                toolbarDom = scope.renderToolbar(toolBarModel, actions, rawData);
              element.empty()
              element.append(toolbarDom);
              $compile(element.contents())(scope);
            }
            scope.$watch("toolbarWatch", function(value) {
              var data = scope.rawData;
              toolbar(data);
            })
          }
        }
      }
    ]).provider('actionRenderExtend', ['toolbarRenderConf',
      function(toolbarRenderConf) {
        var renders = toolbarRenderConf.renders;
        return {
          extend: function(name, constructor) {
            var render = renders[name];
            if (!render) {
              renders[name] = constructor;
            }
          },
          $get: function() {
            return ActionRender;
          }
        }
      }
    ]);
})
