MathJax.Hub.Config({
  showProcessingMessages: false,
  tex2jax: {
    inlineMath: [['$','$']],
    displayMath: [['$$', '$$']],
    ignoreClass: ".*",
    processClass: "mathjax"
  },
  TeX: {
    equationNumbers: {
      autoNumber: "AMS"
    }
  }
});

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function (code) {
    return hljs.highlightAuto(code).value;
  }
});

var Preview = {
  delay: 50,

  input: null,
  preview: null,
  buffer: null,

  timeout: [],
  isRunning: [],
  oldText: [],

  numberOfElements: null,

  markdownEnabled: true,
  mathjaxEnabled: true,
  forceUpdate: false,

  Init: function () {
    this.input = document.getElementsByClassName("markjax-input");
    this.preview = document.getElementsByClassName("markjax-preview");
    this.buffer = document.getElementsByClassName("markjax-preview-buffer");

    this.numberOfElements = this.preview.length;
    for (var i = 0; i < this.numberOfElements; i++) {
      this.input[i].setAttribute("markjax-index", i);
      this.preview[i].setAttribute("markjax-index", i);
      this.buffer[i].setAttribute("markjax-index", i);
    }
  },

  Update: function (index) {
    if (this.timeout[index]) {
      clearTimeout(this.timeout[index]);
    }

    this.timeout[index] = setTimeout(
      MathJax.Callback(["CreatePreview", Preview, index]), this.delay
    );
  },

  UpdateAll: function () {
    for (var i = 0; i < this.numberOfElements; i++) {
      this.Update(i);
    }
  },

  CreatePreview: function (index) {
    this.timeout[index] = null;
    if (this.isRunning[index]) {
      return;
    }

    var text;
    if (this.input[index].classList.contains("markjax-editor")) {
      text = this.input[index].value;
    } else {
      text = this.input[index].innerHTML.replace(/&lt;/mg, '<').replace(/&gt;/mg, '>');
    }

    if (!this.forceUpdate && text === this.oldText[index]) {
      return;
    }

    this.oldText[index] = text;
    this.isRunning[index] = true;

    if (this.markdownEnabled === true) {
      this.buffer[index].innerHTML = marked(this.EscapeTex(text));
      $(this.buffer[index]).find("*").not("code").addClass("mathjax");
    } else {
      this.buffer[index].innerHTML = text;
    }

    if (this.mathjaxEnabled === true) {
      MathJax.Hub.Queue(
        ["Typeset", MathJax.Hub, this.buffer[index]],
        ["PreviewDone", this, index],
        ["resetEquationNumbers", MathJax.InputJax.TeX]
      );
    } else {
      this.PreviewDone(index);
    }
  },

  PreviewDone: function (index) {
    this.isRunning[index] = false;
    Preview.forceUpdate = false;
    this.preview[index].innerHTML = this.buffer[index].innerHTML;
  },

  EscapeTex: function(text) {
    var re = /(\n|\r\n|\r)*(\${1,2})((?:\\.|[^$])*)\2(\n|\r\n|\r)*/g;
    var out = text.replace(re, function(m, c1, c2, c3, c4){
      c3 = c3.replace(/_/g, '\\_')
           .replace(/</g, '&lt;')
           .replace(/\|/g, '\\vert ')
           .replace(/\[/g, '\\lbrack ')
           .replace(/\\{/g, '\\lbrace ')
           .replace(/\\}/g, '\\rbrace ')
           .replace(/\\\\/g, '\\\\\\\\');
      var start = (c2 == '$') ? c2 : '\n\n' + c2;
      var end = (c2 == '$') ? c2 : c2 + '\n\n';
      return start + c3 + end;
    });
    return out;
  }
};

$(document).ready(function() {
  Preview.Init();
  Preview.UpdateAll();

  autosize($("textarea.markjax-editor.markjax-input"));
  $('.modal-trigger').leanModal();

  $(".btn.modal-trigger").on("click", function() {
    $("#fullscreen-preview .modal-content").html($(".markjax-editor.markjax-preview").html());
  });

  $("#column_view").on("change", function() {
    $(".input-column").removeClass("s12 m12 l12");
    $(".preview-column").removeClass("s12 m12 l12");
    $(".input-column").addClass("s6 m6 l6");
    $(".preview-column").addClass("s6 m6 l6");
  });
  $("#stream_view").on("change", function() {
    $(".input-column").removeClass("s6 m6 l6");
    $(".preview-column").removeClass("s6 m6 l6");
    $(".input-column").addClass("s12 m12 l12");
    $(".preview-column").addClass("s12 m12 l12");
  });

  $(".markjax-editor.markjax-input").on("keyup", function(){
    Preview.Update(parseInt(this.getAttribute("markjax-index")));
  });

  $("#select-markdown").on("change", function() {
    Preview.markdownEnabled = this.checked;
    Preview.forceUpdate = true;
    Preview.UpdateAll();
  });
  $("#select-mathjax").on("change", function() {
    Preview.mathjaxEnabled = this.checked;
    Preview.forceUpdate = true;
    Preview.UpdateAll();
  });

  $("textarea.markjax-editor.markjax-input").keydown(function(e) {
    if(e.keyCode === 9) { // tab was pressed
      // get caret position/selection
      var start = this.selectionStart;
      var end = this.selectionEnd;

      var $this = $(this);
      var value = $this.val();

      // set textarea value to: text before caret + tab + text after caret
      $this.val(value.substring(0, start) + "  " + value.substring(end));

      // put caret at right position again (add one for the tab)
      this.selectionStart = this.selectionEnd = start + 2;

      // prevent the focus lose
      e.preventDefault();
    }
  });
});
