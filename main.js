let App = {
  $createContactForm: $('#create_contact'),
  $editContactForm:   $('#edit_contact'),
  
  compile: function() {
    $templates = $('script[type="text/x-handlebars"]');
    $templates.each((index, template) => {
      let html = $(template).html();
      let compiledTemplate = Handlebars.compile(html);
      let id = $(template).attr('id').replace('_template', '');
      
      $(`#${id}`).append(compiledTemplate);
    });
  },

  hideForms: function() {
    this.$createContactForm.hide();
    this.$editContactForm.hide();
  },

  displayContacts: function() {
    if (this.anyContacts()) {
      $('#no_contacts').hide();
      $('#list_contacts').show();
    } else {
      $('#no_contacts').show();
      $('#list_contacts').hide();
    }
  },

  anyContacts: function() {
    if (localStorage.getItem('contacts') === null) {return false}
    return !(localStorage.getItem('contacts') === '[]');
  },

  init: function() {
    this.compile();
    this.hideForms();
    this.displayContacts();
  },
}

$(function() {
  App.init();
});