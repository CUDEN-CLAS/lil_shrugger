/**
 * Create an event bus to emit events across the application.
 */
var bus = new Vue();

/**
 * Makes a request to Atlas.
 *
 * @param baseURL
 * @param endpoint
 * @param query
 * @param method
 * @param body
 * @param etag
 * @returns {Promise.<TResult>}
 */
function atlasRequest(baseURL, endpoint, query = '', method = 'GET', body = null, etag = null) {

  // Setup headers to send to Atlas.
  let headers = new Headers();
  let auth = btoa(localStorage.getItem('atlas-username') + ':' + localStorage.getItem('atlas-password'));
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', 'Basic ' + auth);

  // The etag is only needed when doing write operations.
  if (method === "PATCH" || method === "PUT" || method === 'DELETE') {
    headers.set('If-Match', etag);
  }

  let myInit = {
    method: method,
    headers: headers,
    mode: 'cors',
    //cache: 'default',
    timeout: 15,
  };

  // If body, then add it.
  if (body != null) {
    myInit.body = body;
  }

  // Send different request based on if GET.
  // GET requests can have paging links.
  if (method !== "GET") {

    return fetch(baseURL + endpoint + query, myInit)
      .then(handleErrors)
      .then(response => response.json())
      .catch((error) => {
        bus.$emit('onMessage', {
          text: 'Error in Atlas Request: ' + error,
          alertType: 'alert-danger'
        });
        console.log(error)
      })

  } else {

    // This function returns the data based on the current page.
    let foo = function (pageLink = null) {
      // Use paging link if it exists.
      // The paging link contains the endpoint and query.
      let url = '';
      if (pageLink !== null) {
        url = baseURL + pageLink;
      } else {
        url = baseURL + endpoint + query;
      }

      return Promise.resolve(
        fetch(url, myInit)
          .then(handleErrors)
          .then(response => response.json())
          .catch((error) => {
            bus.$emit('onMessage', {
              text: 'Error in Atlas Request: ' + error,
              alertType: 'alert-danger'
            });
            console.log(error);
          })
      );
    };

    // This is a wrapper function so all of the data can be returned neatly.
    let fetchData = function () {
      // This function does the actual looping through the paging links until
      // it gets to the last page and then exits.
      let recursiveFetch = function (finalData, pageLink) {
        // Call Atlas with the correct page link.
        return foo(pageLink)
          .then(handleErrors)
          .then(function (data) {
            // By pushing the data to an array that exists in recursion, we
            // can return the compiled array.
            // Trying to return a variable outside this lexical scope won't work
            // Since that would be declared synchronously.
            finalData.push(data._items);

            // Check if more pages exist.
            if (data._links.next) {
              return recursiveFetch(finalData, data._links.next.href);
            } else {
              return finalData;
            }
          })
          .catch(error => console.log(error));
      };

      // Finally call recursive function and return a promise with the data in it.
      return recursiveFetch([], null);
    };

    // Pass the resolved promise along.
    return fetchData();
  }
}

/**
 * This function can be placed before any call to an external service or when
 * performing an operation that might fail.
 *
 * @param response
 * @returns {*}
 */
function handleErrors(response) {
  if (!response.ok) {
    // @todo Figure out why the Vue object is being passed in as a response.
    console.log(response);
    //bus.$emit('onMessage', {text: 'Error in Atlas Request: ' + response, alertType: 'alert-danger'});
    //throw Error(response.statusText);
  }
  return response;
}

/**
 * Pauses execution for specified number of milliseconds.
 *
 * @param ms
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
