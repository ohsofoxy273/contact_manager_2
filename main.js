function Contact(id, name, phone, email, tags=[]) {
  this.id    = id;
  this.name  = name;
  this.phone = phone;
  this.email = email;
  this.tags  = tags;
}

Contact.prototype = {
  getNextID: function() {
    let lastId = 0;
    if (Contacts.anyContacts()) {
      let lastId = Contacts.list.slice(-1)[0]['id'];
    }
    return lastId;
  }, 
};

let Contacts = {
  list: JSON.parse(localStorage.getItem('contacts')) || [],

  anyContacts: function() {
    return this.list.length > 0;
  },

  add: function(contactObject) {
    if (this.anyContacts()) {
      let contactsArray = this.list;
      let lastId = contactsArray.slice(-1)[0]['id'];
      contactObject.id = Number(lastId) + 1;
      contactsArray.push(contactObject);
      localStorage.setItem('contacts', JSON.stringify(contactsArray));
    } else {
      contactObject.id = 0;
      localStorage.setItem('contacts', JSON.stringify([contactObject]));
    }
    this.list = JSON.parse(localStorage.getItem('contacts'));
  },

  edit: function(contactObject) {
    let id = contactObject.id;
    let contactsArray = this.list;
    for (let i = 0; i < contactsArray.length; i++) {
      if (Number(contactsArray[i]['id']) === Number(id)) {
        contactsArray[i] = contactObject;
        break;
      }
    }
    localStorage.setItem('contacts', JSON.stringify(contactsArray));
  },

  delete: function(id) {
    let contactsArray = this.list;
    for (let i = 0; i < contactsArray.length; i++) {
      if (Number(contactsArray[i]['id']) === Number(id)) {
        contactsArray.splice(i, 1);
        break;
      }
    }
    localStorage.setItem('contacts', JSON.stringify(contactsArray));
  },
}

let Tags = {
  list: [],
  active: [],

  add: function(tag) {
    this.list.push(tag);
  },

  addActive: function(tag) {
    this.active.push(tag);
  },

  removeActive: function(tag) {
    let idx = this.active.indexOf(tag);
    this.active.splice(idx, 1);
  },

}

let App = {
  $createContactForm: $('#create_contact'),
  $editContactForm:   $('#edit_contact'),
  
  compile: function(contact) {
    $templates = $('script[type="text/x-handlebars"]');
    $templates.each((index, template) => {
      let html = $(template).html();
      let compiledTemplate = Handlebars.compile(html);
      let id = $(template).attr('id').replace('_template', '');
      $(`#${id}`).empty();
      if (id === 'contacts') {
        $(`#${id}`).append(compiledTemplate({contacts: (contact || Contacts.list)}));
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
    if (Contacts.anyContacts()) {
      $('#no_contacts').hide();
      $('#list_contacts').show();
    } else {
      $('#no_contacts').show();
      $('#list_contacts').hide();
    }
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
        Contacts.delete(id);
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
      let formParams = self.submitForm.call(this, self);
      if (formParams && self.isFormType.call(this, 'create')) {
        let id;
        contactTags = [];
        let contact = new Contact(id, formParams.name, formParams.phone, formParams.email, contactTags);
        formParams.tags.forEach(tag => {
          contact.tags.push(tag);
          if (!Tags.list.some(tags => tags === tag)) {
            Tags.list.push(tag);
          }
        });
        
        contact.id =  contact.getNextID();
        Contacts.add(contact);
      } else if (formParams && self.isFormType.call(this, 'edit')) {
        Contacts.edit(formParams);
      }
      $(this).closest('form')[0].reset();
      self.compile();
      self.hideForms();
    });

    $('input#search').focus(function() {
      self.searchInput();
    });

    $('dt.tag').click(function(e) {
      let active = $(this).hasClass('active');
      let notActive = !active;
      let text = $(this).text();
      if (notActive) {
        Tags.addActive(text);
      } else {
        Tags.removeActive(text);
      }
      self.displayActiveClass();
      self.addActiveClass();
    });
  },

  addActiveClass() {
    $('dt.tag').each((idx, tag) => {
      if (Tags.active.includes($(tag).text())) {
        $(tag).addClass('active');
      }
    });
  },

  displayActiveClass: function() {
    let contacts = [];
    
    Contacts.list.forEach(contact => {
      let contactHasAllTheActiveTags = Tags.active.every( r => contact.tags.indexOf(r) >= 0);
      if (contactHasAllTheActiveTags) {
        contacts.push(contact);
      }
    });

    this.compile(contacts);
    this.displayContacts();
  },

  submitForm: function(self) {
    let form = $(this).closest('form');
    let [name, email, phone, tags] = [self.formVal("name", form), self.formVal("email", form), self.formVal("phone", form), self.tagValues(form)];
    let id;

    if (form.find('input[type="hidden"]').length > 0) {
      id = form.find('input[type="hidden"]').val();
    }

    if (id) {
      return { id: id, name: name, email: email, phone: phone, tags: tags} 
    } else {
      return { name: name, email: email, phone: phone, tags, tags } 
    }
  },

  formVal: function(string, form) {
    return form.find(`input[name="${string}"]`).val();
  },

  tagValues: function(form) {
    let tagVals = form.find(`input[name="tags"]`).val();
    let tags = tagVals.split(',').map(string => string.trim());
    if (tags.length === 0 || (tags.length === 1 && tags[0] === '')) {
      return [];
    } else {
      return tags;
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
    let contactsArray = Contacts.list;
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