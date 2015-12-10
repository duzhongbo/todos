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
      this.save({done: !this.get("done")});
    }

  });











  
  // 数据结合
  var TodoList = Backbone.Collection.extend({

    model: Todo,

    localStorage: new Backbone.LocalStorage("todos-backbone"),

    done: function() {
      return this.where({done: true});
    },

    remaining: function() {
      return this.where({done: false});
    },

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: 'order'

  });

  var Todos = new TodoList;










  // 视图，每个单元小视图
  var TodoView = Backbone.View.extend({

    tagName:  "li",

    template: _.template($('#item-template').html()),
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

    toggleDone: function() {// 状态切换
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

    el: $("#todoapp"),

    statsTemplate: _.template($('#stats-template').html()),

    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      Todos.fetch();
    },

    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

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

    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    addAll: function() {
      Todos.each(this.addOne, this);
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({title: this.input.val()});
      this.input.val('');
    },

    clearCompleted: function() {
      _.invoke(Todos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });

  var App = new AppView;

});