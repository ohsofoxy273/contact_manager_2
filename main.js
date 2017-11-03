let App = {
  $createContactForm: $('#create_contact'),
  $editContactForm:   $('#edit_contact'),

  retrieveContacts: function() {
    return JSON.parse(localStorage.getItem('contacts'));
  },
  
  compile: function(contact) {
    $templates = $('script[type="text/x-handlebars"]');
    $templates.each((index, template) => {
      let html = $(template).html();
      let compiledTemplate = Handlebars.compile(html);
      let id = $(template).attr('id').replace('_template', '');
      $(`#${id}`).empty();
      if (id === 'contacts') {
        $(`#${id}`).append(compiledTemplate({contacts: (contact || this.retrieveContacts())}));
      } else if (id === 'edit_contact') {
        $(`#${id}`).append(compiledTemplate(contact));
      } else {
        $(`#${id}`).append(compiledTemplate);
      }
    });
    this.bindButtons();
  },

  hideForms: function() {
    this.$createContactForm.hide();
    this.$editContactForm.hide();
    $('#add_contact_and_search').show();
    this.displayContacts();
  },

  displayContacts: function() {
    $('#contacts').slideDown('slow');
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

  showForm: function(form) {
    $('#add_contact_and_search').hide();
    $('#contacts').hide();
    form.slideDown('slow');
  },

  isFormType: function(type) {
    let regexp = new RegExp(type, 'i');
    return $(this).closest('div').attr('id').match(regexp);
  },

  addContact: function(contactObject) {
    if (this.anyContacts()) {
      let contactsArray = JSON.parse(localStorage.getItem('contacts'));
      let lastId = contactsArray.slice(-1)[0]['id'];
      contactObject.id = Number(lastId) + 1;
      contactsArray.push(contactObject);
      localStorage.setItem('contacts', JSON.stringify(contactsArray));
    } else {
      contactObject.id = 0;
      localStorage.setItem('contacts', JSON.stringify([contactObject]));
    }
  },

  editContact: function(contactObject) {
    let id = contactObject.id;
    let contactsArray = this.retrieveContacts();
    for (let i = 0; i < contactsArray.length; i++) {
      if (Number(contactsArray[i]['id']) === Number(id)) {
        contactsArray[i] = contactObject;
        break;
      }
    }
    localStorage.setItem('contacts', JSON.stringify(contactsArray));
  },

  deleteContact: function(id) {
    let contactsArray = this.retrieveContacts();
    for (let i = 0; i < contactsArray.length; i++) {
      if (Number(contactsArray[i]['id']) === Number(id)) {
        contactsArray.splice(i, 1);
        break;
      }
    }
    localStorage.setItem('contacts', JSON.stringify(contactsArray));
  },

  bindButtons: function() {
    let self = this;
    $('.add').click(e => self.showForm(self.$createContactForm));

    $('.edit').click( e => {
      contactSection = $(e.target).closest('section');
      id    = contactSection.data('id');
      name  = contactSection.find('dd.name').text();
      phone = contactSection.find('dd.phone').text();
      email = contactSection.find('dd.email').text();
      tags  = parseTags(contactSection.find('dt.tag'));
      
      contact = { id: id, name: name, phone: phone, email: email, tags: tags}
      self.compile(contact);
      self.showForm(self.$editContactForm);

      function parseTags(tags) {
        return Array.from(tags).map(tag => {
          return $(tag).text();
        }).join(',');
      }
    });

    $('.delete').click(function(e) {
      if (confirm('Are you sure you want to delete this contact?')) {
        contactSection = $(e.target).closest('section');
        id             = contactSection.data('id');
        self.deleteContact(id);
        self.compile();
        self.displayContacts();
      }
    });

    $('.cancel').click(function(e) {
      e.preventDefault();
      $(this).closest('form')[0].reset();
      self.compile();
      self.hideForms();
    });

    $('.submit').click(function(e) {
      e.preventDefault();
      let formParams = self.submitForm.call(this);
      if (formParams && self.isFormType.call(this, 'create')) {
        self.addContact(formParams);
      } else if (formParams && self.isFormType.call(this, 'edit')) {
        self.editContact(formParams)
      }
      $(this).closest('form')[0].reset();
      self.compile();
      self.hideForms();
    });

    $('input#search').focus(function() {
      self.searchInput();
    });

    $('dt.tag').click(function(e) {
      let tagText = $(e.target).text();
      contacts = self.selectContactsByTag(tagText);
      self.compile(contacts);
    });
  },

  selectContactsByTag: function(tagText) {
    let contactsArray = this.retrieveContacts();
    let filteredArray = [];
    let regexp = new RegExp(tagText, 'i');
    for (let i = 0; i < contactsArray.length; i++) {
      let tags = contactsArray[i].tags;
      if (tags.some(tag => tag.match(regexp))) {
        filteredArray.push(contactsArray[i])
      } 
    }
    return filteredArray;
  },

  submitForm: function() {
    let form = $(this).closest('form');
    let [name, email, phone, tags] = [formVal("name"), formVal("email"), formVal("phone"), tagValues()];
    let id;

    if (form.find('input[type="hidden"]').length > 0) {
      id = form.find('input[type="hidden"]').val();
    }

    function formVal(string) {
      return form.find(`input[name="${string}"]`).val();
    }

    function tagValues() {
      let tagVals = form.find(`input[name="tags"]`).val();
      let tags = tagVals.split(',').map(string => string.trim());
      if (tags.length === 0 || (tags.length === 1 && tags[0] === '')) {
        return [];
      } else {
        return tags;
      }
    }

    if (id) {
      return { id: id, name: name, email: email, phone: phone, tags: tags} 
    } else {
      return { name: name, email: email, phone: phone, tags, tags } 
    }
  },

  searchInput: function() {
    let self = this;
    $('input#search').on('keyup', function() {
      let enteredText = $(this).val();
      let contacts = self.filterSearch(enteredText);
      self.compile(contacts);
      self.displayContacts();
    });

  },

  filterSearch: function(string) {
    let contactsArray = this.retrieveContacts();
    let filteredArray = [];
    let regexp = new RegExp(string, 'i');
    for (let i = 0; i < contactsArray.length; i++) {
      let name = contactsArray[i].name;
      if (name.match(regexp)) {
        filteredArray.push(contactsArray[i]);
      }
    }
    return filteredArray;
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