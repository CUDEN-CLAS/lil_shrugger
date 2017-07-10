/**
 * Creates a listing component for data in a table.
 */
Vue.component('listing', {
  template: '#listing',
  props: {
    data: Array,
    columns: {
      type: Array,
      required: true
    },
    filterKey: String,
    editKeys: Array,
    selectKeys: Array,
    callback: String,
  },
  data: function () {
    var sortOrders = {}
    this.columns.forEach(function (key) {
      sortOrders[key] = 1
    })
    return {
      sortKey: '',
      sortOrders: sortOrders,
    }
  },
  computed: {
    filteredData: function () {
      var sortKey = this.sortKey
      var order = this.sortOrders[sortKey] || 1
      var data = this.data

      if (sortKey) {
        data = data.slice().sort(function (a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1) * order
        })
      }
      return data
    },
    resultCount: function () {
      return this.filteredData.length;
    },
    dataObjects: function () {
      // Transform data in array to object for comparison later.
      // @todo Remove this function and do this in filteredData().
      let realData = {};
      this.filteredData.forEach(function (element, index) {
        realData[index] = {};
        for (obj in element) {
          realData[index][obj] = element[obj];
        }
      });
      return realData;
    }
  },
  filters: {
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    },
  },
  methods: {
    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    }
  }
});

/**
 * Creates a button component with comfirm step.
 */
Vue.component('row', {
  template: '#a-row',
  props: {
    data: Object,
    dataArray: Array,
    editKeys: Array,
    selectKeys: Array,
    columns: Array,
    oldData: Array,
    selectOptions: {
      type: Object,
      default: function () {
        return siteConfig.selectOptions
      }
    },
    callback: String,
    editProp: {
      type: Boolean,
      default: false
    },
  },
  data: function () {
    return {
      edit: this.editProp
    }
  },
  created: function () {
    // Accepts own row component and cancels edit mode.
    bus.$on('confirmButtonSuccess', function (that) {
      that.edit = false;
    });
  },
  computed: {
    params: function () {
      return {
        previous: this.oldData,
        current: this.data,
      }
    }
  },
  methods: {
    link: function (value, key) {
      if (key === 'path') {
        return '<a href="' + siteConfig['expressEnvironments'][localStorage.getItem('env')] + value + '">' + value + '</a>';
      }
      return value;
    },
    selectType: function (index) {
      if (this.selectKeys.indexOf(index) !== -1) {
        return true;
      }
      return false;
    },
    showEdit: function (index = null) {
      if (this.edit) {
        if (index === null || this.editKeys.indexOf(index) !== -1) {
          return true;
        }
      }
      return false;
    },
    showDefault: function (index = null) {
      if (!this.edit || this.editKeys.indexOf(index) === -1 && index !== null) {
        return true;
      }
      return false;
    },
    makeEdit: function () {
      this.edit = true;
    },
    cancelEdit: function () {
      this.edit = false;
    }
  }
});

/**
 * Creates a button component with comfirm step.
 */
Vue.component('confirm-button', {
  template: '#confirm-button',
  props: {
    label: String,
    callback: String,
    row: {
      type: Object,
      default: function () {
        return {}
      }
    },
    params: Object,
    confirmProp: {
      type: Boolean,
      default: false
    },
    finalProp: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      confirmed: this.confirmProp,
      finaled: this.finalProp
    }
  },
  methods: {
    callMeMaybe: function (callback, params) {
      // Emit whatever event the button confirmed.
      bus.$emit(callback, params);

      // Send event for row component to cancel edit functionality.
      bus.$emit('confirmButtonSuccess', this.row);

      // Cancel edit mode within confirm button component.
      this.cancel();
    },
    confirm: function () {
      this.confirmed = true;
    },
    final: function () {
      this.finaled = true;
    },
    cancel: function () {
      this.confirmed = false;
      this.finaled = false;
    }
  }
});

Vue.component('message-area', {
  template: '<div><div :class="[bsAlert, message.alertType]" v-for="(message, index) in messages">{{message.text}}<button type="button" class="close" aria-label="Close" @click="close(index)"><span aria-hidden="true">&times;</span></button></div></div>',
  props: {
    messages: {
      type: Array,
      default: []
    },
    bsAlert: {
      type: String,
      default: 'alert'
    }
  },
  methods: {
    close: function (index) {
      this.messages.splice(index, 1);
    }
  }
});

var alert = new Vue({
  el: '#alert',
  data: {
    messages: []
  },
  created() {
    // To use this anywhere: bus.$emit('onMessage', {text: 'You have deleted a site.', alertType: 'alert-info'});
    // You can use any available bootstrap alert classes: alert-info, alert-success, alert-danger, etc.
    bus.$on('onMessage', function (params) {
      alert.messages.push(params);
    });
  }
});
