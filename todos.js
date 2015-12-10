$(function(){
  // 数据
  var Todo = Backbone.Model.extend({


    // 默认数据
    defaults: function() {
      return {
        title: "empty todo...",
        order: Todos.nextOrder(),// 建立顺序，知道下一个在哪
        done: false// 开关，哪些已经保存好了，哪些还没有进行保存操作
      };
    },

    toggle: function() {
      this.save({done: !this.get("done")});// 改变一下保存开关的真假，复选框的选中与取消选中
    }

  });











  
  // 数据结合
  var TodoList = Backbone.Collection.extend({

    model: Todo,// 指定模型是哪个模型，哪个对象

    localStorage: new Backbone.LocalStorage("todos-backbone"),// 指定一下同步服务器的方式

    done: function() {// 获取哪些已经完成了
      return this.where({done: true});
    },

    remaining: function() {// 哪些没有完成
      return this.where({done: false});
    },

    nextOrder: function() {// 找到对应的顺序
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: 'order' // 默认的排序方式

  });

  var Todos = new TodoList;










  // 视图，每个单元小视图
  var TodoView = Backbone.View.extend({

    tagName:  "li",// 指定视图的标签

    template: _.template($('#item-template').html()),// 针对一个模型的模板
    // 每个小视图上的事件：1、点击(多选框)；2、双击；3、点击(删除)；4、回车更新；5、失去焦点
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);//发生改变时，渲染方法
      this.listenTo(this.model, 'destroy', this.remove);//发生删除时，移除方法
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));// 渲染模板
      this.$el.toggleClass('done', this.model.get('done'));// 改变状态
      this.input = this.$('.edit');// 输入框编辑状态
      return this;
    },

    toggleDone: function() {// 模型是否要保存，完成还是没完成
      this.model.toggle();
    },

    edit: function() {
      this.$el.addClass("editing"); // 标题变成编辑状态
      this.input.focus();// 标题输入框得到焦点
    },

    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});// 保存数据
        this.$el.removeClass("editing");// 移除输入框编辑状态
      }
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    clear: function() {
      this.model.destroy();
    }

  });














  // 视图，整个应用视图
  var AppView = Backbone.View.extend({

    el: $("#todoapp"),//  整体操作，代理帮到父级

    statsTemplate: _.template($('#stats-template').html()),// 模板，页脚一块

    events: {
      "keypress #new-todo":  "createOnEnter",// 输入框按回车就是创建一个模型(数据)li
      "click #clear-completed": "clearCompleted",// 删除，完成所有完成的的
      "click #toggle-all": "toggleAllComplete"// 全选，对应完成与未完成的切换
    },

    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);// 结合的添加
      this.listenTo(Todos, 'reset', this.addAll);// 集合的更新
      this.listenTo(Todos, 'all', this.render);// 任何操作，都触发

      this.footer = this.$('footer');
      this.main = $('#main');

      Todos.fetch();// 更新服务器数据(本例，是本地数据)
    },

    render: function() {
      var done = Todos.done().length;// 哪些完成了，对应到页脚
      var remaining = Todos.remaining().length; // 哪些没完成，对应到页脚

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    addOne: function(todo) {// 添加一条数据对应的回调
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    addAll: function() {
      Todos.each(this.addOne, this);
    },

    createOnEnter: function(e) {// 回车的时候添加数据
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({title: this.input.val()});
      this.input.val('');
    },

    clearCompleted: function() {// 数据删除操作
      _.invoke(Todos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });

  var App = new AppView;// 调整体视图

});