/**
 * Imports Site Listing HTML into DOM of pages using it.
 *
 * @type {Element}
 */
var link = document.querySelector('link[href="src/partials/listing.html"]');
var content = link.import;
var el = content.querySelector('script');
document.querySelector('body').appendChild(el.cloneNode(true));

/**
 * Gets a list of site records based on environment and pass data to template.
 *
 * @param env
 */
function getSiteRecords(env) {
  // Get response of all site records.
  let response = atlasRequest(getAtlasURL(env), 'sites');

  // Response is a Promise object so we must resolve it to get the data out.
  response.then(function(data){

    // Add links.
    data = addLinks(data);

    // Place site data in table via site-listing template located in site-listing.html.
    let siteListing = new Vue({
      el: '#site-listing',
      data: {
        searchQuery: '',
        gridColumns: ['sid', 'path', 'status'],
        gridData: data._items
      }
    });
  });
}

/**
 * Creates the list of site records based on the environment. Every time the environment
 * changes via the environment selector, the search will update.
 */
$(document).ready(function () {
  getSiteRecords(document.querySelector('.env-list .selected').innerHTML);
});

