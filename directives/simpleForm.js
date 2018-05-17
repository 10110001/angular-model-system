/**
 * SimpleForm
 *
 *
 * formConfig= {
 *

    name: "vpcForm",//表单名称，必填项。可以通过 $scope.vpcForm  获取到表单
    fields: [{
      fieldId: 'id', //id
      name: "name", //表单控件的名称
      label: i18nHelper.i18n('vpc.models.VpcForm.name.label'), //表单控件的lebel, 专有网络名称
      type: "text", //表单元素的类型，可以是原有的表单元素，也可以是directive，可选的字段有："label", "text", "password", "textArea", "select", "checkboxList",
      "radioList", "aliyunOnOff", "datePicker", "timePicker", "numberSpinner"
      bindType: "ng-model", //bindonce,{{}},ng-model三种方式可选。默认不填则使用  ng-model="字段name"的方式绑定
      fieldCls: "",//添加在字段上的样式名，可以写多个，用空格分隔开
      attributes: ["", ""], // 这个属性可以写任意多个 HTML语言的dom 自定义属性，形式为 xxx="yyy"，可以配置为：['ng-model="rawData.test"','ng-if="rawData.showField"']。这个配置用来满足各种灵活的写HTMLattribute的需求。
      helpInfo: i18nHelper.i18n('vpc.models.SwitchData.name.helpInfo'), // 这个是每个字段的输入提示信息。
      //验证器配置 exp 属性支持自己填写 validator，类似于直接在HTML上编写。validateInfo是错误提示信息
      validators: [{
        exp: 'ng-maxlength="128"',
        validateInfo: i18nHelper.i18n('vpc.models.SwitchData.name.maxlength') // 名称最长128个字符
      }, {
        exp: 'ng-minlength="2"',
        validateInfo: i18nHelper.i18n('vpc.models.SwitchData.name.minlength') // 名称最少需要2个字符
      }, {
        type: "ngRequire"
      }, {
        exp: 'ng-pattern="/(^[a-z]|^[A-Z]|^[\u4e00-\u9fa5])[a-zA-Z0-9_\u4e00-\u9fa5-]*?$/"',
        validateInfo: i18nHelper.i18n('vpc.models.SwitchData.name.pattern') // 名称不符合格式要求
      }]
    }, {
      name: "description",
      label: i18nHelper.i18n('vpc.models.SwitchForm.description.lable'), // 描述
      type: "textArea",
      displayOrder: 3,
      bindType: "ng-model",
      fieldCls: "",
      attributes: ["", ""],
      helpInfo: i18nHelper.i18n('vpc.models.SwitchForm.description.helpInfo'), // 描述可以为空；或填写2-256个字符，不能以http://和https://开头
      validators: [{
        exp: 'ng-minlength="2"',
        validateInfo: i18nHelper.i18n('vpc.models.SwitchData.description.minlength')
      }, {
        exp: 'ng-maxlength="256"',
        validateInfo: i18nHelper.i18n('vpc.models.SwitchData.description.maxlength')
      },{
        exp:"prevent-http-text",
        validatorName:"startWithHttp",
        validateInfo: i18nHelper.i18n('vpc.models.SwitchForm.description.validateInfo') // 不能以http://或https://开头
      }, {
        exp: 'ng-pattern="/(^[a-z]|^[A-Z]|^[\u4e00-\u9fa5])[a-zA-Z0-9_\u4e00-\u9fa5-\\s]*?$/"',
        validateInfo: i18nHelper.i18n('vpc.models.SwitchForm.description.pattern')
      }]
    }, {
      name: "netSegment",
      label: i18nHelper.i18n('vpc.models.SwitchForm.cidrBlock.lable'), // 网段
      type: "select",
      defaultIndex: "",
      defaultOption: {value:"default",text: i18nHelper.i18n('vpc.models.VpcForm.netSegment.label')}, // 请选择网段
      displayOrder: 2,
      bindType: "ng-model",
      fieldCls: "",
      ngOptions:'ng-options="item for item in formData.netSegments"',
      attributes: [''],
      helpInfo: "<span class='text-warning'><span class='icon-warning-1' style='margin-right:5px;'></span>"+ i18nHelper.i18n('vpc.models.VpcForm.netSegment.helpInfo')+"</span>", // 一旦创建成功，网段不能修改
      validators: [{
        type: "ngRequire"
      }]
    }]
  }
 *
 * }
 */

define(['../modelSystemModule', 'angular', '../lib/template', '../lib/util', 'common/helper/responsePreHandler', '../../services/i18nService'],
  function(directiveModule, angular, TP, util, responsePreHandler, i18nService) {
    var i18nInstance = i18nService.getI18n('modelSystem.simpleForm');
    var i18n = {
      required: i18nInstance.i18n('required')
    }
    var $ngTemplateCache = null;
    var CONST = {
      FORM_TEMPLATE: [
        '<form <%=attributes%> novalidate class="<%=inlineForm === true? "form-inline": "form-horizontal"%>  <%=formCls%>"',
        'role="form"',
        'name="<%=formName%>"',
        '>',
        '<%=fields%>',
        '</form>'
      ].join(''),
      FORM_FIELD_WRAPER_TEMPLATE: [
        '<div <%=field.formGroupAttrs%> class="form-group <%=field.fieldWraperCls||""%>" >',
        '<%if(!field.noLabel){%>',
        '<label class="col-sm-<%=field.labelSpan || 3%> control-label" for="<%=field.fieldId%>">',
        '<%if(field.label){%>',
        ' <%if(!field.allowEmpty){%>',
        ' <span class="text-danger">*</span>',
        ' <%}%>',
        ' <span><%=field.label || ""%></span>：',
        '<%}%>',
        '</label>',
        '<%}%>',
        '<div class="col-sm-<%=field.fieldSpan || 5%>">',
        //  字段起始
        '<%=field.fieldHtml%>',
        //  字段帮助信息起始
        '<span class="help-block" id="help-info-<%=field.fieldId%>">',
        '<%=field.helpInfo%>',
        '</span>',
        '</div>',
        //验证信息起始
        '<%=field.validateInfos%>',
        '</div>'
      ].join(''),
      FORM_FIELD_TEMPLATE: {
        label: [
          '<div',
          '    <%=attributes%>',
          '    <%=dataBind%>',
          '    class="form-control-static <%=fieldCls%>"',
          '    id="<%=fieldId%>" >',
          '</div>'
        ].join(''),
        text: [
          '<input',
          '    name="<%=name%>"',
          '    <%=validators%>',
          '    <%=attributes%>',
          '    <%=dataBind%>',
          '    class="form-control <%=fieldCls%>"',
          '    id="<%=fieldId%>"',
          '    aria-describedby="help-info-<%=fieldId%>"',
          '/>'
        ].join(''),
        password: [
          '<input',
          '    name="<%=name%>"',
          '    type="password"',
          '    <%=validators%>',
          '    <%=attributes%>',
          '    <%=dataBind%>',
          '    class="form-control <%=fieldCls%>"',
          '    id="<%=fieldId%>"',
          '/>'
        ].join(''),
        textArea: [
          '<textarea',
          '    name="<%=name%>"',
          '    <%=validators%>',
          '    <%=attributes%>',
          '    <%=dataBind%>',
          '    class="form-control <%=fieldCls%>"',
          '    id="<%=fieldId%>" >',
          '</textarea>'
        ].join(''),
        select: [
          '<select',
          '    name="<%=name%>"',
          '    <%=validators%>',
          '    <%=attributes%>',
          '    <%=dataBind%>',
          '    <%=ngOptions%>',
          '    id="<%=fieldId%>"',
          '    class="form-control <%=fieldCls%>"',
          '>',
          '<%if(defaultOption){%>',
          '<option selected value="<%=(defaultOption && defaultOption.value) || ""%>"><%=(defaultOption && defaultOption.text) || defaultOption%></option>',
          '<%}%>',
          '</select>'
        ].join(''),
        checkboxList: [
          //没有想清楚常用方式，例如是单独出现还是一组一起出现，formModel应该如何定义数据结构来生成对应的HTML，暂时不实现
        ].join(''),
        radioList: [
          '<div class="form-control-static"><span class="margin-right-3" ng-repeat="item in rawData.<%=name%>s">',
          '<input ',
          ' class="margin-right"',
          ' name="<%=name%>"',
          ' type="radio"',
          ' <%=validators%>',
          ' <%=attributes%>',
          ' <%=dataBind%>',
          ' value="{{item.value}}"',
          ' id="{{item.name}}"',
          ' >',
          '<label class="{{item.cls}}" for="{{item.name}}" >{{item.text}}</label></span></div>'
          //没有想清楚常用方式，例如是单独出现还是一组一起出现，formModel应该如何定义数据结构来生成对应的HTML，暂时不实现
        ].join(''),
        aliyunOnOff: [
          '<div class="form-control-static">',
          '<div aliyun-on-off ',
          '     <%=attributes%>',
          '     <%=dataBind%>',
          '  >',
          '</div>',
          '</div>'
        ].join(''),
        datePicker: [
          '<p class="input-group">',
          //输入框起始
          '<input type="text" ',
          '    name="<%=name%>"',
          '     <%=validators%>',
          /*以下为可以使用的attribute，从console项目的demo中摘取，和原来直接写HTML的方式没有任何区别
            定义的attributes 会按照开发人员写的内容原样输出到HTML中
          // '   min="\'2013 - 08 - 22 \'"',
          // '   max="\'2014 - 02 - 22 \'"',
          // '   show-weeks="false"',
          // '   show-button-bar="false"',
          // '   toggle-weeks-text="周" ',
          // '   current-text="今天"',
          // '   clear-text="清除" ',
          // '   close-text="确定"',
          // '   datepicker-popup="yyyy-MM-dd"',
          */
          '     <%=attributes%>',
          '     <%=dataBind%>',
          '     class="form-control <%=fieldCls%>"',
          '   >',
          //按钮起始
          '<span class="input-group-btn">',
          '<button class="btn btn-default"><i class="glyphicon glyphicon-calendar"></i></button>',
          '</span>',
          '</p>'
        ].join(''),
        timePicker: [
          '<div timepicker',
          '   name="<%=name%>"',
          '   <%=validators%>',
          '   <%=attributes%>',
          '   <%=dataBind%>',
          '   class="form-control <%=fieldCls%>"',
          '></div>'
        ].join(''),
        numberSpinner: [
          '<div aliyun-number-spinner ',
          '    name="<%=name%>"',
          '   <%=validators%>',
          '   <%=attributes%>',
          /* attributes 可以取如下值
          '   input-size="4"',
          '   min="1"',
          '   max="1200"',
          '   value="10"',
          '   stepper="5"',
          */
          '   <%=dataBind%>',
          '   class="form-control <%=fieldCls%>"',
          '></div>'
        ].join('')
      },
      FORM_FIELD_VALIDATE: {
        wraper: [
          '<div class="help-block col-sm-<%=(validateInfoSpan || 4) %>" ng-show="<%=formName%>.<%=fieldName%>.$dirty && <%=formName%>.<%=fieldName%>.$invalid">',
          '<%=validateInfos%>',
          '</div>'
        ].join(''),
        item: [
          '<div class="error text-danger" ng-show="<%=formName%>.<%=fieldName%>.$error.<%=validatorName%>">',
          '<span class="icon-no-2 rds-database-icon"></span>',
          '<%if(dynamicHelpInfo){%>',
          '<span bo-html="<%=validateInfo%>"></span>',
          '<%}else{%>',
          '<span><%=validateInfo%></span>',
          '<%}%>',
          '</div>'
        ].join(''),
        DEFAULTS: {
          ngMinlength: {
            validatorName: "minlength"
          },
          ngPattern: {
            validatorName: "pattern"
          },
          ngMaxlength: {
            validatorName: "maxlength"
          },
          ngRequire: {
            exp: 'ng-required = "true"',
            validateInfo: i18n.required, //"不能为空",
            validatorName: "required"
          }
        }
      }
    }

    function error(msg) {
      throw new Error(msg || "");
    }



    /*定义表单元素工厂类*/
    function FormFieldFactory() {}
    FormFieldFactory.subs = [];
    FormFieldFactory.prototype = {
      constructor: FormFieldFactory,
      TP: TP,
      getTemplateEngine: function() {
        return TP;
      },
      getFormTemplateConst: function() {
        return CONST;
      },
      getFormFieldFactory: function() {
        return FormFieldFactory;
      },
      /**
       * 根据定义的表单验证元数据集合判断字段是否允许为空
       * @param  {Array} validators 表单验证元数据集合
       * @return {Boolean}            是否允许字段为空
       */
      allowEmpty: function(validators) {
        if (angular.isArray(validators)) {
          var allowEmpty = true;
          angular.forEach(validators, function(item, i) {
            if (item.type == "ngRequire") {
              allowEmpty = false;
            }
            if (item.exp && item.exp.indexOf("ngRequire") === "0" && item.exp.indexOf("true") > 0) {
              allowEmpty = false;
            }
          })
          return allowEmpty;
        } else {
          return true;
        }
      },
      /**
       * 初始化表单元素的验证器
       * @param  {Object} fieldInfo 表单元素的元数据
       * @return {Object}           表单验证相关的信息，包括验证表达式和对应的错误提示信息HTML片段
       */
      initValidators: function(fieldInfo) {
        var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
        var MOZ_HACK_REGEXP = /^moz([A-Z])/;

        /**
         * Converts snake_case to camelCase.
         * Also there is special case for Moz prefix starting with upper case letter.
         * @param name Name to normalize
         */
        function camelCase(name) {
          return name.
          replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
            return offset ? letter.toUpperCase() : letter;
          }).
          replace(MOZ_HACK_REGEXP, 'Moz$1');
        }

        /**
         * 获取表单校验器的名称
         * @param  {Object} validator 表单校验器数据结构
         * @return {String}           表单校验器名称
         */
        function getTag(validator) {
          var tag;
          //如果校验元数据中包含type信息，则直接根据type 获取信息
          var tag = "";
          if (validator.type) {
            tag = validator.type;
          } else if (validator.exp) {
            //如果表单校验元数据中只包含表达式，则根据表达式获取对应的校验类型，再去获取对应的基本信息
            var tag = validator.exp.split("=")[0];
            if (tag && tag.length > 0) {
              tag = camelCase(tag);
            }
          }
          return tag;
        }
        /**
         * 根据表单验证模型获取其基本信息
         * @param  {String} validatorTag 表单校验器的名称
         * @return {Object}           表单校验基本信息
         */
        function getValidatorInfo(tag) {
          //如果不存在，则返回一个空属性值的对象，免去后续代码做合法性校验的步骤
          return CONST.FORM_FIELD_VALIDATE.DEFAULTS[tag] || {
            exp: '',
            validateInfo: "",
            validatorName: ""
          };
        }

        var me = this,
          validators = fieldInfo.validators,
          marks = [],
          infos = [],
          validateInfos = "",
          validInfoWraperTmpl = CONST.FORM_FIELD_VALIDATE.wraper,
          validateInfoTmpl = CONST.FORM_FIELD_VALIDATE.item;
        if (angular.isArray(validators)) {
          angular.forEach(validators, function(item, index) {
              //循环表单验证元数据数组
              var validatorTag = getTag(item),
                defaultInfo = getValidatorInfo(validatorTag);
              item.validatorName = item.validatorName ? item.validatorName : (defaultInfo.validatorName || validatorTag);
              if (item.type && !item.exp) {
                item.exp = defaultInfo.exp;
              }
              item.validateInfo = item.validateInfo ? item.validateInfo : defaultInfo.validateInfo;
              //将元数据的表达式放到marks数组，用来直接生成DOM元素上的验证标记
              marks.push(item.exp || "");
              item.formName = me.attributes.formName;
              item.fieldName = me.attributes.name;
              item.dynamicHelpInfo = item.dynamicHelpInfo === true ? true : false;
              //渲染对应的表单验证错误提示信息
              infos.push(TP.tmpl(validateInfoTmpl, item));
            })
            //将每个表单验证的错误提示信息使用统一的HTML 结构包裹起来，用来统一控制显示、隐藏
          validateInfos = TP.tmpl(validInfoWraperTmpl, {
            formName: fieldInfo.formName,
            fieldName: fieldInfo.name,
            validateInfoSpan: fieldInfo.validateInfoSpan || null,
            validateInfos: infos.join('')
          });
        }
        this.validators = {
          marks: marks.join(" "),
          validateInfos: validateInfos
        }
        return this.validators;
      },
      /**
       * 获取表单验证器
       * @return {Object} 当前表单元素对应的验证器
       */

      initDataBind: function(fieldInfo) {
        if (fieldInfo.dataBind) {
          return;
        }
        if (fieldInfo.ngModel) {
          fieldInfo.dataBind = 'ng-model = "' + fieldInfo.ngModel + '"';
          return;
        }
        var bindType = fieldInfo.bindType || "ng-model";
        if (bindType) {
          switch (bindType) {
            case "ng-model":
              fieldInfo.dataBind = 'ng-model = "' + "rawData." + fieldInfo.name + '"';
              break;
            case "{{}}":
              fieldInfo.dataBind = "{{rawData." + fieldInfo.name + '}}';
              break;
            case "bo-text":
              fieldInfo.dataBind = 'bo-bind = "' + "rawData." + fieldInfo.name + '"';
              break;
            case 'ng-bind':
              fieldInfo.dataBind = 'ng-bind = "' + "rawData." + fieldInfo.name + '"';
              break;
          }
        }
      },
      getValidators: function() {
        return this.validators;
      },
      /**
       * 获取表单元素的渲染数据
       * @param  {Object} fieldInfo 表单元素的元数据信息
       * @return {Object}           渲染一个表单元素所需要的信息
       */
      getFieldRenderData: function(fieldInfo) {
        var validators = this.getValidators(),
          renderData = angular.extend({
            name: "",
            validators: "",
            attributes: "",
            dataBind: "",
            fieldCls: "",
            fieldId: ""
          }, fieldInfo || {});
        renderData.attributes = angular.isArray(renderData.attributes) && renderData.attributes.join(" ");
        renderData.validators = validators && validators.marks || "";
        return renderData;
      },
      /**
       * 渲染表单元素本身
       * @param  {String} fieldName 表单元素的名称，例如 text, select 等等
       * @return {String}           表单元素渲染后的HTML文档
       */
      renderFieldElement: function(fieldName) {
        var fieldRenderData = this.getFieldRenderData(this.attributes);
        return TP.tmpl(this.fieldHtmlTemplate, fieldRenderData);
      },
      /**
       * 获取表单元素的包裹DOM对应的HTML模板
       * @return {string} 包裹表单元素的HTML模板
       */
      getFieldWraper: function() {
        //这里的或写法是为了兼容之前的错误拼写
        return this.attributes.fieldWraperTemplate || this.attributes.fieldWraperTmplate;
      },
      /**
       * 获取一个表单元素的渲染后的html片段
       * @return {String} 表单元素的渲染后的html片段
       */
      html: function() {
        return this.htmlStr ? this.htmlStr : (this.htmlStr = TP.tmpl(this.htmlTmplate, {
          field: this.attributes
        }));
      },
      /**
       * 获取一个表单元素的HTML模板
       * @return {String} 表单元素的HTML模板
       */
      htmlTmplate: function() {
        return this.htmlTmplate;
      }
    }

    /*定义工厂类的类方法*/

    /**
     * 定义表单元素工厂子类
     * @param  {String} formFieldName 表单元素名称
     * @param  {function} constructor   表单元素工厂的构造函数
     * @return {[type]}               [description]
     */
    FormFieldFactory.define = function(formFieldName, constructor) {

      !angular.isString(formFieldName) && error("formFieldName should be string") ||
        !angular.isFunction(constructor) && error("constructor of the formField should be function");
      //如果已经注册过，则报错，提示子类不可以同名
      if (angular.isFunction(FormFieldFactory.subs[formFieldName])) {
        error("the subclass of FormFieldFactory has already registed by name :'" + formFieldName + "'")
      }
      // constructor.prototype = FormFieldFactory.prototype;
      // constructor.prototype.constructor = constructor;
      constructor = util.inherit(constructor, FormFieldFactory);
      FormFieldFactory.subs[formFieldName] = constructor;
    }

    /**
     * 获取子类实例的借口
     * @param  {String} fieldType  表单元素类型
     * @param  {Object} fieldInfo 表单元素的元数据
     * @return {Object}           表单元素实例
     */
    FormFieldFactory.factory = function(fieldType) {
      var FactoryClass = FormFieldFactory.subs[fieldType];
      if (!FactoryClass) {
        throw new Error('SimpleForm ERROR: Contructor "' + fieldType + '" not registed in FormFieldFactory.')
      }
      return FactoryClass;
    }


    /*定义各个表单元素子类。
      出于后续扩展性的考虑，所以采用了工厂方法来实现，而没有采用键值对形式的MAP去实现。
      今后的开发人员可以直接调用FormFieldFactory.define来完成扩展或重写
    */
    angular.forEach(["label", "text", "password", "textArea", "select", "checkboxList",
      "radioList", "aliyunOnOff", "datePicker", "timePicker", "numberSpinner"
    ], function(item, index) {
      FormFieldFactory.define(item, function(fieldInfo) { //表单元素子类的构造函数


        //将表单元数据克隆到子类的attributes对象上
        this.attributes = angular.extend({}, fieldInfo);

        //记录所属表单的名称，多处渲染都需要用到
        this.attributes.formName = fieldInfo.formName;
        //select类的字段做特殊化处理
        if (item === "select") {
          this.attributes.defaultOption = this.attributes.defaultOption || "";
          this.attributes.ngOptions = this.attributes.ngOptions || "";
        }
        if (item === "label" && !this.attributes.bindType) {
          this.attributes.bindType = "bo-text";
        }
        //初始化模板
        this.fieldHtmlTemplate = CONST.FORM_FIELD_TEMPLATE[item];
        this.fieldWraperTemplate = this.getFieldWraper() || CONST.FORM_FIELD_WRAPER_TEMPLATE;


        //初始化表单元素对应的验证器
        this.initValidators(this.attributes);
        this.initDataBind(this.attributes);
        //渲染表单元素自身的HTML
        this.attributes.fieldHtml = this.renderFieldElement(item);
        this.attributes.formGroupAttrs = angular.isArray(this.attributes.formGroupAttrs) && this.attributes.formGroupAttrs.join(" ") || "";

        //渲染整个表单元素，即包涵外部Wraper结构的表单元素
        this.attributes.validateInfos = this.validators.validateInfos;
        this.attributes.allowEmpty = this.allowEmpty(fieldInfo.validators);
        this.htmlStr = TP.tmpl(this.fieldWraperTemplate, {
          field: this.attributes
        });
      });
    })

    /**
     * 定义自定义字段
     * @param  {Object} fieldInfo 字段元数据信息
     */
    FormFieldFactory.define("customField", function(fieldInfo) {
      //将表单元数据克隆到子类的attributes对象上
      this.attributes = angular.extend({}, fieldInfo);

      //记录所属表单的名称，多处渲染都需要用到
      this.attributes.formName = fieldInfo.formName;

      //初始化模板

      this.fieldWraperTemplate = this.getFieldWraper() || CONST.FORM_FIELD_WRAPER_TEMPLATE;

      //初始化表单元素对应的验证器
      this.initValidators(this.attributes);
      this.initDataBind(this.attributes);
      //渲染表单元素自身的HTML
      this.attributes.fieldHtml = fieldInfo.template ? fieldInfo.template : $ngTemplateCache && fieldInfo.templateUrl ? $ngTemplateCache.get(fieldInfo.templateUrl) : "";

      //渲染整个表单元素，即包涵外部Wraper结构的表单元素
      this.attributes.validateInfos = this.validators.validateInfos;
      this.attributes.allowEmpty = this.allowEmpty(fieldInfo.validators);
      this.htmlStr = TP.tmpl(this.fieldWraperTemplate, {
        field: this.attributes
      });
    })

    /**
     * 表单生成器类，用来定义表单元素处理的基本流程
     */
    function FormGenerator(formTemplateConst, formFieldFactory) {
      this.formTemplateConst = formTemplateConst;
      this.formFieldFactory = formFieldFactory;
      this.templateEngine = TP;
    }

    FormGenerator.prototype = {
      constructor: FormGenerator,
      initFieldFactory: function() {

      },
      generateFormHtml: function(formModel) {
        var templateConst = this.formTemplateConst;
        var template = templateConst.FORM_TEMPLATE;
        var fields = this.generateFormFieldHtml(formModel);
        return TP.tmpl(template, {
          formCls: formModel.formCls || "",
          fields: fields,
          inlineForm: formModel.inlineForm || false,
          attributes: formModel.attributes ? formModel.attributes.join(' ') : "",
          formName: formModel.name || formModel.id
        });
      },
      generateFormFieldHtml: function(formModel) {
        var fieldInfo = formModel.fields,
          //定义表单字段的HTML模板
          field_wrap_template = this.formTemplateConst[formModel.fieldWraperTemplateName] || this.formTemplateConst.FORM_FIELD_WRAPER_TEMPLATE,
          html = [],
          formField = "";
        for (var i = 0, field = null; field = fieldInfo[i]; i++) {
          //将Form的名称赋值给每个表单，后续每个表单渲染时需要用到这个属性
          field.formName = formModel.name || formModel.id;
          field.name = field.name ? field.name : field.id;
          //根据表单元素元数据使用工厂类来获取对应的表单元素实例
          var FieldFactory = this.formFieldFactory.factory(field.type);
          //使用字段自定义的模板或者使用表单生成器的模板。表单生成器的模板来源于用户自己在表单模型上的声明，或者来源于 默认提供的模板
          field.fieldWraperTemplate = field.fieldWraperTemplate || field_wrap_template;
          formField = new FieldFactory(field, this);

          //通过表单元素实例拿到自己的HTML字符串
          html.push(formField.html());
        }
        return html.join('');
      }
    }

    //用来对外暴露做扩展用
    var FormGeneratorConstructor = FormGenerator;

    // /**
    //  * 获取表单元素
    //  * @param  {Object} field 表单元素的元数据
    //  * @return {Object}       表单元素对应的实例
    //  */
    // function getFormField(field) {
    //   var field = FormFieldFactory.factory(field.type, field);
    //   return field;
    // }

    /**
     * 生成表单元素的HMTL
     * @param  {Object} formModel 表单元数据
     * @return {String}           根据表单元数据生成的Form表单各个字段的HMTL
     */
    // function generateFormFieldHtml(formModel) {
    //   var fieldInfo = formModel.fields,
    //     //定义表单字段的HTML模板
    //     template = CONST.FORM_FIELD_WRAPER_TEMPLATE,
    //     html = [],
    //     formField = "";
    //   for (var i = 0, field = null; field = fieldInfo[i]; i++) {
    //     //将Form的名称赋值给每个表单，后续每个表单渲染时需要用到这个属性
    //     field.formName = formModel.name;
    //     //根据表单元素元数据使用工厂类来获取对应的表单元素实例
    //     formField = FormFieldFactory.factory(field.type, field);

    //     html.push(formField.html());

    //   }
    //   return html.join('');
    // }

    /**
     * 生成表单HMTL
     * @param  {Object} formModel 表单元数据
     * @return {String}           根据表单元数据生成的表单HTML片段
     */
    // function generateFormHtml(formModel) {
    //   var template = CONST.FORM_TEMPLATE;
    //   var fields = generateFormFieldHtml(formModel);
    //   return TP.tmpl(template, {
    //     formCls: formModel.formCls || "",
    //     fields: fields,
    //     inlineForm: formModel.inlineForm || false,
    //     attributes: formModel.attributes ? formModel.attributes.join(' ') : "",
    //     formName: formModel.name
    //   });
    // }

    /**
     * 获取表单配置
     * @param  {Object} $scope    [description]
     * @param  {Object} $attrs    指令的属性
     * @param  {Object} $injector injector
     * @return {Object}           表单配置项
     */
    function getFormModel($scope, $attrs, $injector) {
      var formConfig = $scope.formConfig;
      if (!formConfig) {
        var bizType = $attrs.bizType || ($scope.$parent.$bizInfo ? $scope.$parent.$bizInfo.bizType || "" : ""),
          bizAction = $attrs.bizAction || ($scope.$parent.$bizInfo ? $scope.$parent.$bizInfo.bizAction || "" : ""),
          modelService = $injector.get("modelFactory"),
          formModel = "",
          bizModelService = $injector.get("bizModelFactory"),
          bizModel = "",
          actionModel = "";

        if (modelService) {
          formModel = modelService.getModel(bizType, "FormModel");
        }

        if (bizModelService) {
          bizModel = bizModelService.getBizModel(bizType);
        }

        formConfig = {
          bizType: bizType,
          bizAction: bizAction,
          defaultDataName: $attrs.defaultDataName || ($scope.$parent.$bizInfo ? $scope.$parent.$bizInfo.defaultDataName || "" : ""),
          formModel: formModel,
          bizModel: bizModel
        };
      }
      return formConfig;
    }
    directiveModule.constant('aliyunModelSystemFormGeneratorConst', CONST);
    directiveModule.directive('htmlForm', ['$compile', '$injector', '$templateCache',
      function($compile, $injector, $templateCache) {
        $ngTemplateCache = $templateCache;
        return {
          restrict: 'A',
          controller: ["$scope", "$attrs", "$injector", 'aliyunModelSystemFormGeneratorConst',
            function($scope, $attrs, $injector, formTemplateConst) {
              //给指令渲染提供获取表单HTML的方法，包涵缓存机制，避免重复渲染
              $scope.getFormHtml = function(bizType, formModel) {
                var formIdentifier = bizType + formModel.name,
                  formHtml = $templateCache.get(formIdentifier);
                if (!formHtml) {
                  //初始化表单生成器
                  var formGenerator = new FormGeneratorConstructor(formTemplateConst, FormFieldFactory, $templateCache);
                  formHtml = formGenerator.generateFormHtml(formModel);
                  $templateCache.put(formIdentifier, formHtml);
                }
                return formHtml;
              }
            }
          ],
          scope: {
            bizType: '@',
            modelType: '@',
            formModel: "=",
            rawData: "=",
            formInvalid: "=",
            formInited: "&",
            submit: "&onSubmit",
            formInstance: "="
          },
          link: function(scope, element, attrs) {
            var modelFactory = $injector.get("modelFactory");
            var modelType = scope.modelType || scope.bizType;
            var formModel = scope.formModel || modelFactory.getModel(modelType, 'FormModel');

            if (!formModel) {
              console.log("'htmlForm' need formModel or modelType, add a watcher to reinitate directive");
              scope.$watchCollection('[formModel, modelType]', function(values) {
                if (values) {
                  var delayFormModel = values[0];
                  var modelType = values[1];
                  formModel = delayFormModel || modelFactory.getModel(modelType, "FormModel")
                    //TODO:考察是否允许HTMLForm多次init
                  if (formModel) {
                    init(formModel)
                  }
                }
              })
            } else {
              init(formModel);
            }

            function init(model) {
              var formElement = angular.element(scope.getFormHtml(model.bizType, model));
              element.append(formElement);
              scope.rawData = scope.rawData || {};
              $compile(element.contents())(scope);
              scope.formInstance && (scope.formInstance = scope[scope.formModel.id]);
              scope.$$postDigest(function() {
                  angular.isFunction(scope.formInited) && scope.formInited(true);
                })
                // scope.$bizInfo.$form = scope[model.name];
              scope.$watch(model.name + ".$invalid", function() {
                scope.formInvalid !== undefined && (scope.formInvalid = scope[model.name].$invalid);
              });
            }
          }
        }
      }
    ])


    directiveModule.provider('aliyunModelSystemHtmlFormConfig', ['aliyunModelSystemFormGeneratorConst',
      function(formTemplateConst) {
        var extender = {
          $get: function() {

          },
          extendFormGeneratorConst: function(extender) {
            if (angular.isObject(extender)) {
              angular.extend(formTemplateConst, extender);
            } else if (angular.isFunction(extender)) {
              extender(formTemplateConst);
            }
          },
          extendFormGenerator: function(subClass) {
            if (!angular.isFunction(subClass)) {
              throw new Error('TypeError: subClass to extend FormGenerator must be a function');
            }
            FormGeneratorConstructor = util.inherit(subClass, FormGeneratorConstructor);
          },
          extendFormFieldFactory: function(fieldName, fieldConstructor) {
            if (angular.isString(fieldName) && angular.isFunction(fieldConstructor)) {
              FormFieldFactory.define(fieldName, fieldConstructor);
            } else if (angular.isObject(fieldName) && !fieldConstructor) {
              var extendObject = fieldName;
              var fieldConstructor = null;
              for (var fieldName in extendObject) {
                if (extendObject.hasOwnProperty(fieldName)) {
                  fieldConstructor = extendObject[fieldName];
                  if (angular.isFunction(fieldConstructor)) {
                    FormFieldFactory.define(fieldName, fieldConstructor);
                  }
                }
              }
            }
          }
        }
        return extender;
      }
    ]);
  })
