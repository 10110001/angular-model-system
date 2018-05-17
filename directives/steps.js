/**
 * Created by hekexue on 2015-6-13.
 *
 * Step指令
 *
 * 配置项如下：
 *
 * config={
 *   rawData:{},
 *   steps:[{
 *     id:"",//步骤的ID
 *     isDynamicStep:false,//标记是否为动态步骤，可以配置false，也可以不设置这个属性
 *     order:1,//步骤顺序
 *     title:"",//步骤title
 *     template:"",//步骤模板
 *
 *     templateUrl:"",//步骤模板URL，相当于一个指令的模板的Url
 *     //设置动态指令编译时候的数据
 *     // 可以看做是指令的controller，原来写在指令controller里面的任何代码，都可以在这里写。
 *     // templateUrl(或者template) 和 setCompileData配合，相当于创建了一个指令
 *     setCompileData:function(scope, rawData, attrs, $injector, currentStep){
 *     },
 *
 *     //在当前步骤激活之前执行的方法
 *     beforeActive:function(currentStep, stepFrom) {
 *     },
 *     //在当前步骤激活之后执行的方法
 *     afterActive:function(currentStep, stepFrom) {
 *     },
 *     //“下一步”之前的方法，如果返回false，则不会执行真正的下一步方法
 *     beforeNext:function(currentStep, btn){
 *     },
 *     //“下一步”之后的方法
 *     afterNext:function(currentStep, btn){
 *     },
 *     //“上一步”之前的方法，如果返回false，则不会执行真正的上一步方法
 *     beforePre:function(currentStep, btn){
 *     },
 *     //“上一步”之后的方法
 *     afterPre:function(currentStep, btn){
 *     },
 *     //“完成”之前的方法，如果返回false，则不会执行真正的完成方法
 *     beforeFinish:function(currentStep, btn){
 *     },
 *     //“完成”之后的方法
 *     afterFinish:function(currentStep, btn){
 *     },
 *     //当前步骤需要的按钮数组，已有的 “上一步”、“下一步”、“完成”可以直接用下面的pre、next、finish引用；如果想要添加额外的自己的按钮，可以自己定义，位置使用order控制
 *     buttons:["pre","next","finish",{
 *       name:"",
 *       text:"",
 *       order:1,
 *       handler:function(){
 *       }
 *     }],
 *   },{
 *      id: "",
 *      isDynamicStep: true,//动态步骤
 *      order: 2,
 *      title: "",//如果下面在子步骤有title，则在步骤激活时，被子步骤替换
 *      //获取应该激活的子步骤的key，在当前动态步骤真正被激活之前会被调用
 *      getActiveStepKey:function(currentStep, stepFrom){
 *      },
 *      //子步骤的配置数组，最终根据getActiveStepKey 返回的key决定哪个激活，子步骤配置项和普通step配置项一样
 *      dynamicSteps: [{
 *        id: "",
 *        rawData: {},
 *        title: "",
 *        template: "",
 *        // templateUrl: "",
 *        setCompileData: function() {},
 *        beforeActive:function() {},
 *        afterActive:function() {},
 *        beforeNext: function() {},
 *        afterNext: function() {},
 *        beforePre: function() {},
 *        afterPre: function() {},
 *        beforeFinish: function() {},
 *        afterFinish: function() {}
 *          // buttons: ["pre", "next", "finish", {
 *          //   name: "",
 *          //   text: "",
 *          //   order: 1,
 *          //   handler: function() {}
 *          // }]
 *      }, {
 *        rawData: {},
 *        id: "",
 *        title: "",
 *        template: "",
 *        // templateUrl: "",
 *        setCompileData: function() {},
 *        beforeActive:function() {},
 *        afterActive:function() {},
 *        beforeNext: function() {},
 *        afterNext: function() {},
 *        beforePre: function() {},
 *        afterPre: function() {},
 *        beforeFinish: function() {},
 *        afterFinish: function() {}
 *          // buttons: ["pre", "next", "finish", {
 *          //   name: "",
 *          //   text: "",
 *          //   order: 1,
 *          //   handler: function() {}
 *          // }]
 *      }]
 * }
 */

define(['angular', './directives', '../lib/util', '../../services/i18nService', '../modelSystemCore'], function(angular, directiveModule, util, i18nService) {
  var i18nInstance = i18nService.getI18n('modelSystem.steps');
  //TODO:提供provider 允许开发者在自己的应用里面扩展 StepPanel 类
  directiveModule.directive('aliyunConsoleSteps', steps);
  directiveModule.controller('aliyunConsole.stepsController', stepsController, '$$baseController');
  steps.$inject = ["$compile"];
  stepsController.$inject = ['$scope', '$injector', '$q'];


  //TODO:提供机制允许开发者扩展、配置这些按钮的文字，特别是 jumpTo的按钮
  var defaultButtons = {
    pre: {
      id: 'pre',
      text: i18nInstance.i18n('pre'), //"上一步",
      order: 5,
      disabled: false,
      handler: function() {
        this.step && this.step.pre(this);
      }
    },
    next: {
      id: 'next',
      text: i18nInstance.i18n("next"), //"下一步",
      order: 10,
      disabled: false,
      handler: function() {
        this.step && this.step.next(this);
      }
    },
    finish: {
      id: 'finish',
      text: i18nInstance.i18n("finish"), //"完成",
      order: 15,
      disabled: false,
      handler: function() {
        this.step && this.step.finish(this);
      }
    },
    jumpTo: {
      id: 'jumpTo',
      text: i18nInstance.i18n("jumpTo"), // "跳转到",
      order: 20,
      disabled: false,
      handler: function(stepId) {
        this.step && this.step.jumpTo(this, stepId);
      }
    },
    cancel: {
      id: 'cancel',
      text: i18nInstance.i18n("cancel"), //"取消",
      order: 0,
      disabled: false,
      handler: function() {
        this.step && this.step.cancel(this);
      }
    }
  }

  /**
   * Step类
   * @param {Object} step      当前步骤区域初始化数据配置项
   * @param {Object} preStep   上一个步骤的Step的实例（注意不是初始化数据配置项，而是已经实例化以后的实例）
   * @param {Object} $scope    当前指令的$scope
   * @param {Object} $injector $inector服务
   */
  function StepPanel(step, preStep, realSteps, $scope, $injector) {
    //TODO: 添加防止通过step配置项复写核心方法的机制，检测到黑名单内的核心方法，则delete掉，保护内部的封装，如果有扩展的需要，很简单，定义新的子类就好了
    angular.extend(this, step);
    this.order = this.order * 1;
    this.rawData = null;

    //定义内部私有属性
    var _rawData = step.rawData || {};
    var _stepsMap = realSteps;
    var _nextStep = null;
    var _preStep = preStep;

    //定义内部私有属性的getter和setter
    this.getRawData = function() {
      return _rawData;
    }
    this.setRawData = function(key, value) {
      if (angular.isObject(key) && !value) {
        _rawData = key;
      } else {
        _rawData[key] = value;
      }
    }
    this.getNextStep = function() {
      return _nextStep;
    }
    this.setNextStep = function(nextStep) {
      _nextStep = nextStep;
    }
    this.getPreStep = function() {
      return _preStep;
    }
    this.getStep = function(stepId) {
      if (stepId === this.id) {
        return this
      }
      return _stepsMap[stepId];
    }

    this.passed = false;

    var buttons = this.initButtons();
    buttons = buttons.sort(function(x, y) {
      return x.order - y.order;
    })
    angular.forEach(buttons, function(btn, index) {
      buttons[btn.id] = btn;
    })
    this.buttons = buttons;
    var $templateCache = $injector.get("$templateCache");
    this._$q = $injector.get("$q");
    this.initTemplate($templateCache);
    this._dialogService = $injector.get('aliyunDialog');

    this.initDynamicDirective();
  }


  //TODO:整理所有下划线的私有方法，定义在构造函数中做保护，否则会被外界传入的参数复写
  StepPanel.prototype = {
    constructor: StepPanel,
    /**
     * 初始化按钮，主要用于子类复写
     * @return {[type]}
     */
    initButtons: function() {
      return this.buttons || [];
    },
    /**
     * 获取某个按钮
     * @param  {String} btnId 按钮Id
     * @return {Object}       对应按钮的实例
     */
    getButton: function(btnId) {
      return this.buttons[btnId];
    },

    /**
     * 初始化某个步骤的模板
     * @param  {Object} $templateCache Angular 的templateCache
     * @return {[type]}
     */
    initTemplate: function($templateCache) {
      var template = this.template || $templateCache.get(this.templateUrl);
      this.template = template;
    },
    /**
     * 初始化动态指令所需要的配置数据
     * @return {[type]}
     */
    initDynamicDirective: function() {
      var me = this;
      this.dynamicDirectiveConfig = {
        rawData: this.getRawData(),
        directiveModel: {
          template: this.getContentHtml(),
          setCompileData: function(scope, rawData, attrs, $injector) {
            var args = Array.prototype.slice.call(arguments, 0);
            args.push(me);
            me.setCompileData.apply(me, args);
          }
        }
      }
    },
    /**
     * 合并用户定义的按钮和Step类自己默认的按钮，按照order字段排序展示
     * @return {[type]}
     */
    mergeButtons: function() {
      var buttons = [];
      if (this.buttons) {
        //读取并合并
        for (var j = 0, btn = null; btn = this.buttons[j]; j++) {
          if (angular.isString(btn)) {
            btn = defaultButtons[btn];
            btn && buttons.push(new StepButton(btn, this));
          } else if (angular.isObject(btn)) {
            buttons.push(new StepButton(btn, this));
          }
        }
      }
      return buttons;
    },
    /**
     * 获取某个步骤的HTML模板
     * @return {[type]}
     */
    getContentHtml: function() {
      return this.template;
    },
    isActive: function() {
      return this.actived;
    },
    isPassed: function() {
      return this.passed;
    },
    /**
     * 在某个步骤激活之前执行的方法，可以返回false，则后续的active方法不会执行；如果不返回任何值，或者返回true，则会继续执行active；也可以返回promise；
     * @param  {Object} currentStep 当前要激活的步骤实例
     * @param  {Object} stepFrom  上一个激活的步骤实例，可能是“上一步“对应的Step，也可能是”下一步“对应的Step
     * @return {Boolean/Promise}           开发者自己根据业务需求决定返回数据
     */
    beforeActive: function(currentStep, stepFrom) {
      return true
    },
    /**
     * 真正的”Active“方法，严禁子类中复写该方法
     * @param  {Object} stepFrom 上一个激活的步骤实例
     * @return {[type]}
     */
    _active: function(stepFrom) {
      var me = this;
      // this.$timeout(function() {
      me.actived = true;
      return me.afterActive(me, stepFrom);
      // })
    },
    /**
     * 激活当前步骤，入口方法，严禁复写这个方法
     * @param  {Object} stepFrom 上一个激活的步骤实例
     * @return {[type]}
     */
    active: function(stepFrom) {
      var beforeActive = this.beforeActive(this, stepFrom);
      if (beforeActive === false) {
        return;
      }
      if (beforeActive === undefined || beforeActive === null || beforeActive === true) {
        //如果返回结果是 布尔值true，或者不返回任何结果，则立即执行_active方法；
        return this._active(stepFrom);
      }

      if (angular.isObject(beforeActive) && angular.isFunction(beforeActive)) {
        //如果返回结果是 Object且then是方法，则用promise方式执行
        var me = this;
        var deferred = this._$q.deferr();
        beforeActive.then(function() {
          deferred.resolve(me._active(stepFrom));
        })
        return deferred.promise;
      }
    },
    /**
     * 激活某个步骤之后执行的方法
     * @param  {Object} currentStep 当前要激活的步骤实例
     * @param  {[type]} stepFrom  上一个激活的步骤实例
     * @return {[type]}
     */
    afterActive: function(currentStep, stepFrom) {

    },
    /**
     * 禁用当前的步骤
     * @return {[type]}
     */
    deactive: function() {
      this.actived = false;
    },
    /**
     * 点击下一步按钮跳转到下一个步骤之前的方法，可以通过复写该方法实现业务逻辑
     * @param  {Object} currentStep 当前激活的步骤实例
     * @param  {Object} btn       点击的按钮
     * @return {Boolean/Promise}  开发者自己根据业务需求决定返回数据
     */
    beforeNext: function(currentStep, btn) {
      return true;
    },
    /**
     * 真正的”下一步“方法，严禁子类中复写该方法
     * @param  {Object} stepFrom 上一个激活的步骤实例
     * @return {[type]}
     */
    _next: function(btn) {
      this.deactive();
      this.passed = true;
      var nextStep = this.getNextStep();
      nextStep && nextStep.active(this);
      return this.afterNext(this, btn)
    },
    /**
     * 点击下一步按钮执行的方法，入口方法，严禁复写这个方法
     * @param  {Object} btn     "下一步"按钮实例
     * @return {[type]}
     */
    next: function(btn) {
      var beforeNext = this.beforeNext(this, btn);
      var me = this;
      if (beforeNext === false) {
        return;
      }
      if (beforeNext || beforeNext === undefined || beforeNext === null) {
        return this._next(btn);
      }

      if (angular.isObject(beforeNext) && angular.isFunction(beforeNext.then)) {
        var deferred = this._$q.defer();
        beforeNext.then(function(result) {
          deferred.resolve(me._next(btn));
        })
        return deferred.promise;
      }
    },
    /**
     * 点击下一步按钮之后执行的方法，可以通过复写该方法实现业务需求
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {[type]} btn       "下一步"按钮实例
     * @return {[type]}
     */
    afterNext: function(currentStep, btn) {

    },

    /**
     * 点击上一步按钮跳转到上一个步骤之前的方法，可以通过复写该方法实现业务逻辑
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {Object} btn       点击的按钮
     * @return {Boolean/Promise}  开发者自己根据业务需求决定返回数据
     */
    beforePre: function(currentStep, btn) {
      return true;
    },
    /**
     * 真正的”上一步“方法，严禁子类中复写该方法
     * @param  {Object} btn     ”上一步“按钮
     * @return {[type]}
     */
    _pre: function(btn) {
      this.deactive();
      this.passed = false;
      var preStep = this.getPreStep();
      preStep && preStep.active(this);
      return this.afterPre(this, btn);
    },
    /**
     * 点击上一步按钮执行的方法，入口方法，严禁复写这个方法
     * @param  {Object} btn   “上一步”按钮实例
     * @return {[type]}
     */
    pre: function(btn) {
      var beforePre = this.beforePre(this, btn);
      var me = this;
      if (beforePre === false) {
        return;
      }

      if (beforePre === true || beforePre === undefined || beforePre === null) {
        return this._pre(btn)
      }

      if (angular.isObject(beforePre) && angular.isFunction(beforePre.then)) {
        var deferred = this._$q.defer();
        beforePre.then(function(result) {
          deferred.resolve(me._pre(btn));
        })
        return deferred.promise;
      }
    },
    /**
     * 点击上一步按钮之后执行的方法，可以通过复写该方法实现业务需求
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {[type]} btn       "上一步"按钮实例
     * @return {[type]}
     */
    afterPre: function(currentStep, btn) {

    },

    /**
     * 点击“跳转到某一步”按钮跳转到某个步骤之前的方法，可以通过复写该方法实现业务逻辑
     * @param  {Object} currentStep           当前的步骤实例
     * @param  {Object} btn                 点击的按钮
     * @param  {Object} jumpToStepId       要跳转过去的目标步骤的ID
     * @return {Boolean/Promise}            开发者自己根据业务需求决定返回数据
     */
    beforeJumpTo: function(currentStep, btn, jumpToStepId) {
      return true;
    },
    /**
     * 真正的”跳转到某一步“方法，严禁子类中复写该方法
     * @param  {Object} btn                当前按钮实例
     * @param  {Object} jumpToStepId       要跳转过去的目标步骤的ID
     * @return {[type]}
     */
    _jumpTo: function(btn, jumpToStepId) {
      this.deactive();
      //获取要跳转的目标Step
      var jumpToStep = this.getStep(jumpToStepId);
      if (!jumpToStep) {
        console.error('Directive steps: "' + jumpToStepId + '" is not exist, check your step configs');
        return;
      }

      //目标Step和当前Step的order比较，确定当前Step是否passed
      if (jumpToStep.order * 1 > this.order * 1) {
        this.passed = true;
      } else {
        this.passed = false;
      }

      //激活要跳转的目标Step
      jumpToStep.active(this);
      return this.afterJumpTo(this, btn);
    },
    /**
     * 点击“跳转到某一步”按钮执行的方法，入口方法，严禁复写这个方法
     * @param  {Object} jumpToStepId       要跳转过去的目标步骤的ID
     * @param  {Object} btn                 “上一步”按钮实例
     * @return {[type]}
     */
    jumpTo: function(jumpToStepId, btn) {
      var beforeJumpTo = this.beforeJumpTo(this, btn);
      var me = this;
      if (beforeJumpTo === false) {
        return;
      }

      if (beforeJumpTo === true || beforeJumpTo === undefined || beforeJumpTo === null) {
        return this._jumpTo(btn, jumpToStepId);
      }

      if (angular.isObject(beforeJumpTo) && angular.isFunction(beforeJumpTo.then)) {
        var deferred = this._$q.defer();
        beforeJumpTo.then(function(result) {
          deferred.resolve(me._jumpTo(btn, jumpToStepId));
        })
        return deferred.promise;
      }
    },
    /**
     * 点击“跳转到某一步”按钮之后执行的方法，可以通过复写该方法实现业务需求
     * @param  {Object} currentStep           当前的步骤实例
     * @param  {[type]} btn                 "上一步"按钮实例
     * @param  {[type]} jumpToStepId       要跳转过去的目标步骤的ID
     * @return {[type]}
     */
    afterJumpTo: function(currentStep, btn, jumpToStepId) {

    },

    /**
     * 点击“取消”按钮之前的方法，可以通过复写该方法实现业务逻辑
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {Object} btn       点击的按钮
     * @return {Boolean/Promise}  开发者自己根据业务需求决定返回数据
     */
    beforeCancel: function(currentStep, btn) {
      return this._dialogService.showMessageDialog({
        title: i18nInstance.i18n("cancelTitle"), //"流程退出提醒",
        message: i18nInstance.i18n("cancelMsg") // "您确定要退出当前流程吗？"
      }).result;
    },
    /**
     * 真正的”取消“方法，严禁子类中复写该方法
     * @param  {Object} btn     ”取消“按钮
     * @return {[type]}
     */
    _cancel: function(btn) {
      //TODO：弹框提示用户是否要退出流程

      //
      return this.afterCancel(this, btn);
    },
    /**
     * 点击取消按钮执行的方法，入口方法，严禁复写这个方法
     * @param  {Object} btn             “取消”按钮实例
     * @return {[type]}
     */
    cancel: function(btn) {
      var beforeCancel = this.beforeCancel(this, btn);
      var me = this;
      if (beforeCancel === false) {
        return;
      }

      if (beforeCancel === true || beforeCancel === undefined || beforeCancel === null) {
        return this._cancel(btn);
      }

      if (angular.isObject(beforeCancel) && angular.isFunction(beforeCancel.then)) {
        var deferred = this._$q.defer();
        beforeCancel.then(function(result) {
          deferred.resolve(me._cancel(btn));
        })
        return deferred.promise;
      }
    },
    /**
     * 点击取消按钮之后执行的方法，可以通过复写该方法实现业务需求
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {[type]} btn       "取消"按钮实例
     * @return {[type]}
     */
    afterCancel: function(currentStep, btn) {
      console.log('Directive Step: customise your own "afterCancel" method')
    },
    /**
     * 点击完成按钮真正执行完成逻辑之前的方法，可以通过复写该方法实现业务逻辑
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {Object} btn       点击的按钮
     * @return {Boolean/Promise}  开发者自己根据业务需求决定返回数据
     */
    beforeFinish: function(currentStep, btn) {
      return true;
    },
    /**
     * 真正的”完成“方法，严禁子类中复写该方法
     * @param  {Object} btn     “完成”按钮
     * @return {[type]}
     */
    _finish: function(btn) {
      btn.disabled = true;
      return this.afterFinish();
    },
    /**
     * 点击完成按钮执行的方法，入口方法，严禁复写这个方法
     * @param  {Object} btn   “完成”按钮实例
     * @return {[type]}
     */
    finish: function(btn) {
      var beforeFinish = this.beforeFinish(this, btn);
      var me = this;
      if (beforeFinish === false) {
        return;
      }

      if (beforeFinish === true || beforeFinish === undefined || beforeFinish === null) {
        return this._finish(btn)
      }

      if (angular.isObject(beforeFinish) && angular.isFunction(beforeFinish.then)) {
        var deferred = this._$q.defer();
        beforeFinish.then(function(result) {
          deferred.resolve(me._finish(btn));
        })
        return deferred.promise;
      }
    },
    /**
     * 点击完成按钮，执行完成逻辑之后执行的方法，可以通过复写该方法实现业务需求
     * @param  {Object} currentStep 当前的步骤实例
     * @param  {[type]} btn       "完成"按钮实例
     * @return {[type]}
     */
    afterFinish: function(currentStep, btn) {

    }
  }

  /**
   * 第一步 类
   */
  function FirstStep() {
    StepPanel.apply(this, arguments);
    this.actived = true;
  }

  FirstStep.prototype = {
    constructor: FirstStep,
    initButtons: function() {
      var buttons = this.buttons;
      if (angular.isArray(buttons)) {
        if (buttons.length == 0) {
          buttons.push(new NextButton(defaultButtons.next, this));
        } else {
          buttons = this.mergeButtons();
        }
        return buttons;
      } else {
        return []
      }
    },
    pre: function() {
      throw new Error("First step: can't go to pre step because it's the first step")
    }
  }

  /**
   * 中间某一步 类
   */
  function MiddleStep() {
    StepPanel.apply(this, arguments);
    this.actived = false;
    this.passed = false;
  }

  MiddleStep.prototype = {
    constructor: MiddleStep,
    initButtons: function() {
      var buttons = this.buttons;
      if (angular.isArray(buttons)) {
        if (buttons.length == 0) {
          buttons.push(new PreButton(defaultButtons.pre, this));
          buttons.push(new NextButton(defaultButtons.next, this));
        } else {
          buttons = this.mergeButtons();
        }
        return buttons;
      } else {
        return []
      }
    }
  }


  /**
   * 最后一步 类
   */
  function LastStep() {
    StepPanel.apply(this, arguments);
    this.actived = false;
    this.passed = false;
  }

  LastStep.prototype = {
    constructor: LastStep,
    initButtons: function() {
      var buttons = this.buttons;
      if (angular.isArray(buttons)) {
        if (buttons.length == 0) {
          buttons.push(new PreButton(defaultButtons.pre, this));
          buttons.push(new FinishButton(defaultButtons.finish, this));
        } else {
          buttons = this.mergeButtons();
        }
        return buttons;
      } else {
        return []
      }
    },
    _active: function(stepFrom) {
      var me = this;
      // this.$timeout(function() {
      me.actived = true;
      // me.buttons[me.buttons.length - 1].disabled = false;
      return me.afterActive(me, stepFrom);
      // })
    },
    next: function() {
      throw new Error("LastStep: Can't go to next step because it's the last step")
    }
  }


  /**
   * 动态步骤类
   *
   * 这里的DynamicStep其实只是一个壳子，根据业务情况动态切换不同的子步骤
   * 策略就是每次激活的时候，根据条件重新动态把已经实例化的某个步骤标记位当前激活的步骤，然后把动态步骤上父类中定义的方法都代理到真正激活的步骤上
   * 这样对于和DynamicStep交互的其他Step而言，根本不知道它是经过动态计算而得到的，屏蔽了内部实现和变动，只通过标准接口和外部交互
   */
  function DynamicStep() {
    StepPanel.apply(this, arguments);
    var args = Array.prototype.slice.call(arguments, 0);
    var overwriteList = {
      active: false
    }

    var _originThis = args[0];

    var me = this;

    //确定要生成的Step类型，最后一个参数确定
    var stepType = args.pop();
    //初始化动态步骤自己的数据结构
    var _subSteps = [];

    var Constructor = function() {};
    switch (stepType) {
      case 0:
        Constructor = FirstStep;
        break;
      case 1:
        Constructor = MiddleStep;
        break;
      case 2:
        Constructor = LastStep;
    }

    //1、定义私有变量
    var _activedSubKey = "";
    var _activedSubStep = null;



    //2、代理子步骤的方法，把不是DynamicStep自己定义在prototype里面的方法（即那些DynamicStep父类的方法）统统代理出去，代理给真正激活的某个子步骤
    function delegate(i) {
      // this[i] = (function(i) {
      //     return function() {
      //       var args = Array.prototype.slice.call(arguments, 0);
      //       _activedSubStep && angular.isFunction(_activedSubStep[i]) && _activedSubStep[i].apply(_activedSubStep, args);
      //     }
      //   })(i);
      me[i] = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        return _activedSubStep && angular.isFunction(_activedSubStep[i]) && _activedSubStep[i].apply(_activedSubStep, args);
      }
    }

    var delegateObject = this.constructor.prototype;
    //在代理对象上，添加另外几个私有方法，因为这几个私有方法不在 this.constructor.prototype上，但是必须代理到真正激活的步骤上面
    angular.forEach([
      'getRawData',
      'setRawData',
      'getNextStep',
      'setNextStep',
      'getPreStep',
      'getStep'
    ], function(item, index) {
      delegate(item);
    })

    var me = this;
    for (var i in delegateObject) {
      if (!delegateObject.hasOwnProperty(i) && overwriteList[i] !== false) {
        delegate(i);
      }
    }

    //3、复写父类的setNextStep方法，把下一步的实例分别赋给每个子步骤
    this.setNextStep = function(nextStep) {
      for (var i = 0, step = null; step = _subSteps[i]; i++) {
        step.setNextStep(nextStep);
      }
    }


    //4、定义私有方法
    this._getActivedSubkey = function() {
      return _activedSubKey;
    }
    this._setActivedSubKey = function(activedSubKey) {
      _activedSubKey = activedSubKey;
    }
    this._getActivedSubStep = function() {
      return _activedSubStep;
    }
    this._setActivedSubStep = function(activeSubStep) {
      //如果返回的需要激活的子步骤是布尔类型的false，则说明不需要做激活动作，直接返回
      if (activeSubStep === false) {
        return;
      }
      this._setActivedSubKey(activeSubStep.id);
      _activedSubStep = activeSubStep;

      //把子步骤需要对外暴露的属性暴露出来
      this.buttons = _activedSubStep.buttons;
      this.title = _activedSubStep.title ? _activedSubStep.title : this.title;
      this.dynamicDirectiveConfig = _activedSubStep.dynamicDirectiveConfig;
      _activedSubStep.order = _activedSubStep.order || this.order
    }

    this._getSubStep = function(key) {
      var step = _subSteps[key];
      if (!step) {
        throw new Error('Dynamic Step:The step named "' + key + '" that you want to active does not exist')
      }
      return step;
    }

    //5、实例化动态步骤下的各个子步骤
    var dynamicSteps = _originThis.dynamicSteps;
    for (var i = 0, step = null; step = dynamicSteps[i]; i++) {
      step = new Constructor(step, args[1], args[2], args[3], args[4]);
      _subSteps.push(step);
      _subSteps[step.id] = step;
      if (step.isDefault) {
        this._setActivedSubStep(step);
      }
    }
  }

  DynamicStep.prototype = {
    constructor: DynamicStep,
    /**
     * 获取需要被激活的子步骤
     * @param  {Object} stepFrom 之前的一个步骤
     * @return {Object/Boolean}   应该激活的子步骤，或者布尔值 false；
     * 当返回值为false时，标明当前步骤已经有了合适的子步骤，不需要再重复做激活操作
     */
    _getStepShouldAcitve: function(stepFrom) {
      var subKeyNeedToActive = "";

      //如果是从当前步骤之后的步骤激活的，说明是后面的步骤点击“上一步”或者“跳转”过来的，所以当前步骤已经确定了该使用哪个子步骤作为激活项，
      //所以不用再去做 _setActiveStep的操作，减少无谓的操作
      if (stepFrom.order * 1 > this.order * 1) {
        return false;
      }

      //获取开发者给出的实际应该激活的步骤的key，判断和当前key是否一样，一样则跳过 _setActiveStep操作
      if (angular.isFunction(this.getActiveStepKey)) {
        subKeyNeedToActive = this.getActiveStepKey(this, stepFrom);
      }

      if (this._getActivedSubkey() == subKeyNeedToActive) {
        return false;
      } else {
        var subStepToActive = this._getSubStep(subKeyNeedToActive);
        return subStepToActive;
      }
    },
    isActive: function() {
      var activedSubstep = this._getActivedSubStep();
      return activedSubstep && activedSubstep.actived;
    },
    isPassed: function() {
      var activedSubstep = this._getActivedSubStep();
      return activedSubstep && activedSubstep.passed;
    },
    _active: function(stepFrom) {
      //激活之前，获取当前应该激活的步骤实例
      var subStep = this._getStepShouldAcitve(stepFrom);
      //设置当前应该激活步骤实例到 this上面
      this._setActivedSubStep(subStep);
      if (subStep === false) {
        subStep = this._getActivedSubStep();
      }

      subStep.actived = true;

      return this.afterActive(this, stepFrom);
    }
  }

  util.inherit(FirstStep, StepPanel);
  util.inherit(LastStep, StepPanel);
  util.inherit(MiddleStep, StepPanel);
  util.inherit(DynamicStep, StepPanel);
  /**
   * 按钮类
   * @param {Object} button 按钮配置项
   * @param {Object} step   按钮所在的某一个步骤的实例
   */
  function StepButton(button, step) {
    angular.extend(this, button);
    if (!this.id) {
      throw new Error('Step Directive: step button must have an "id" property');
    }
    this._show = true
    this.step = step;
  }

  StepButton.prototype = {
    constructor: StepButton,
    handler: function() {

    },
    disable: function() {
      this.disabled = true;
    },
    enable: function() {
      this.disabled = false;
    },
    setEnable: function(enable) {
      this.disabled = !enable;
    },
    show: function() {
      this._show = true
    },
    hide: function() {
      this._show = false
    }
  }

  /**
   * “下一步”按钮类
   */
  function NextButton() {
    StepButton.apply(this, arguments);
    var me = this;
    this.handler = function() {
      me.step && me.step.next(me);
    }
  }

  /**
   * "上一步" 按钮类
   */
  function PreButton() {
    StepButton.apply(this, arguments);

    var me = this;
    this.handler = function() {
      me.step && me.step.pre(me);
    }
  }

  /**
   * “完成”按钮类
   */
  function FinishButton() {
    StepButton.apply(this, arguments);
    var me = this;
    this.handler = function() {
      me.step && me.step.finish(me);
    }
  }

  util.inherit(NextButton, StepButton);
  util.inherit(PreButton, StepButton);
  util.inherit(FinishButton, StepButton);


  function stepsController($scope, $injector) {
    this.$parent.$constructor.call(this, $scope);
    var config = $scope.config || this.$getModel($scope.stepModel, "StepModel");

    if (!config) {
      throw new Error('directive "steps" need "config" data ')
    }
    if (config && !angular.isArray(config.steps)) {
      throw new Error('Data type error:"steps" proprety of config should be an array');
    }

    var steps = config.steps.sort(function(x, y) {
      return x.order - y.order
    });

    //处理每个步骤中的按钮
    var preStep = null,
      nextStep = null,
      len = steps.length;

    if (len < 2) {
      throw new Error("Steps only have one step!!! Trust me, you don't want to use this 'Steps' directive under this circumstance");
    }
    if (len > 6) {
      throw new Error("Steps too many!! Please simplify your product interaction");
    }

    //根据配置项数据的步骤数设置每个步骤title的宽度样式，不用ngStyle的原因是有坑，所以用这种方式计算“应该使用的栅格系统”
    var widthCls = "col-sm-";
    switch (len) {
      case 2:
      case 3:
      case 4:
      case 6:
        this.widthCls = widthCls + (12 / len);
        break;
      case 5:
        this.widthCls = widthCls + "2";
        break;
      default:
        this.widthCls = widthCls + "1";
    }
    var realSteps = [];
    var Contructor = function() {}
    for (var i = 0, step = null; step = steps[i]; i++) {
      if (!step.type) {
        //根据Step在数组中的位置，确定其构造函数
        var innerType = 0;
        preStep = realSteps[i - 1];
        if (i == 0) {
          innerType = 0;
          Contructor = FirstStep;
        }
        if (i > 0 && i != len - 1) {
          innerType = 1;
          Contructor = MiddleStep;
        }
        if (i == len - 1) {
          innerType = 2;
          Contructor = LastStep;
        }
        if (step.isDynamicStep) {
          step = new DynamicStep(step, preStep, realSteps, $scope, $injector, innerType);
        } else {
          //根据Step配置项等参数，实例化当前步骤
          step = new Contructor(step, preStep, realSteps, $scope, $injector);
        }


        if (!step.id) {
          throw new Error('Directive Steps: Every "step" config must have a "id" property')
        }
        if (realSteps[step.id]) {
          throw new Error('Directive Steps: There has been an id named "' + step.id + ' registed", current step can not be initialized');
        }

        realSteps.push(step);
        realSteps[step.id] = step;
        preStep && preStep.setNextStep(step);
      } else {
        //TODO:根据step配置项中的type属性的值获取构造函数，这样可以给开发者一个自己扩展Step类的实例化的机会
      }
    }

    this.steps = realSteps;

  }



  function steps($compile) {
    return {
      scope: {
        config: "=",
        stepModel: "@"
      },
      controller: "aliyunConsole.stepsController as vm",
      templateUrl: 'scripts/template/steps.html',
      link: function(scope, elem, attrs) {
        // $compile(elem.contents())(scope);
      }
    }
  }
})
