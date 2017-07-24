
/**
 * Import navbar HTML and insert into DOM of pages.
 *
 * @type {Element}
 */
let link = document.querySelector('link[href="src/partials/navbar.html"]');
let content = link.import;
let el = content.querySelector('script');
document.querySelector('body').appendChild(el.cloneNode(true));


/**
 * Creates a button component with comfirm step.
 */
Vue.component('atlas-navbar', {
  template: '#a-navbar',
  props: {
    routes: {
      type: Array,
      default: routes
    },
    environments: {
      type: Object,
      default: siteConfig.atlasEnvironments
    }
  },
  computed: {
    selectedEnv: function () {
      return siteConfig.atlasEnvironments[localStorage.getItem('env')];
    }
  },
  methods: {
    callMeMaybe: function (callback, params) {
      window[callback](params);
      this.cancel();
    },
    cancel: function () {
      this.confirmed = false;
      this.finaled = false;
    },
    changeEnv: function (event) {
      localStorage.setItem('env', event.target.value);
      bus.$emit('switchEnv', event.target.value);
    }
  }
});

let navbar = new Vue({
  el: '#atlas-navbar',
  data: {
    routes: routes,
    environments: siteConfig.atlasEnvironments
  }
});
