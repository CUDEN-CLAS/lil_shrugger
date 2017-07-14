/**
 * @file
 * Contains functionality for interacting with the GitHub API.
 */

/**
 * Returns an array of CuBoulder repos and branches.
 *
 * @returns {Array}
 */
function getGitHubRepos() {
  let myInit = initializeHeaders();

  // This function returns the data based on the current page.
  let foo = function (pageLink = null) {
    // Use paging link if it exists.
    // The paging link contains the endpoint and query.
    let url = ''
    if (pageLink !== null) {
      url = pageLink
    } else {
      url = 'https://api.github.com/orgs/CuBoulder/repos?per_page=25'
    }

    let link = ''
    return Promise.resolve(
      fetch(url, myInit)
        .then(handleErrors)
        .then(function (response) {
          link = response.headers
          return response.json()
        })
        .then(function (data) {
          return {
            headers: link,
            data: data
          }
        })
        .catch((error) => {
          bus.$emit('onMessage', {
            text: 'Error in Atlas Request: ' + error,
            alertType: 'alert-danger'
          })
          console.log(error)
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
        .then(function (object) {
          // By pushing the data to an array that exists in recursion, we
          // can return the compiled array.
          // Trying to return a variable outside this lexical scope won't work
          // Since that would be declared synchronously.
          finalData.push(object.data);

          // Check if more pages exist.
          let nextLink = object.headers.get('Link').split(',')[0].split(';')
          if (nextLink[1].trim() === 'rel="next"') {
            console.log(nextLink[0].slice(1, -1))
            return recursiveFetch(finalData, nextLink[0].slice(1, -1))
          } else {
            return finalData;
          }
        })
        .catch(error => console.log(error));
    };

    // Finally call recursive function and return a promise with the data in it.
    return recursiveFetch([], null)
  }

  // Pass the resolved promise along.
  return fetchData()
    .then(function (data) {
      console.log(data);
      // Sort alphabetically or by updated date if repo-listing = true.
      if (localStorage.getItem('repo-listing') === "true") {
        data.sort(function (a, b) {
          return new Date(b.pushed_at) - new Date(a.pushed_at);
        });
      } else {
        data.sort(function (a, b) {
          if (a.name < b.name) {
            return -1
          }
          if (a.name > b.name) {
            return 1
          }
          return 0;
        });
      }

      // Add a default; otherwise user can't select first element.
      let first = {
        name: '-Select-'
      };
      data.unshift(first);

      return data;
    })
    .catch(error => error);
}

/**
 * Gets a list of branches based on repo.
 *
 * @param repo
 * @returns {Array}
 */
function getRepoBranches(repo) {
  let myInit = initializeHeaders();

  return fetch('https://api.github.com/repos/CuBoulder/' + repo + '/branches?per_page=100', myInit)
    .then(handleErrors)
    .then(response => response.json())
    .catch(error => error);
}

/**
 * Takes a GitHub repo and returns the most recent commit regardless of branch.
 *
 * @param repo
 * @param that
 * @returns {string}
 */
function getLatestCommit(repo, that = null) {
  let myInit = initializeHeaders();

  // Need to account for stupid Drupal repo name.
  if (repo === 'drupal') {
    repo = 'drupal-7.x'
  }

  return fetch('https://api.github.com/repos/CuBoulder/' + repo + '/commits', myInit)
    .then(handleErrors)
    .then(response => response.json())
    .then(function (data) {
      // Return first listed commit and passed in object if exists.
      return {
        hash: data[0].sha,
        object: that
      };
    })
    .catch(error => error);
}

/**
 * Initializes common headers used in GitHub requests.
 *
 * @returns {{method: string, headers: Headers, timeout: number}}
 */
function initializeHeaders() {
  let headers = new Headers();
  let auth = btoa(localStorage.getItem('github-username') + ':' + localStorage.getItem('github-token'));
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', 'Basic ' + auth);

  let myInit = {
    method: 'GET',
    headers: headers,
    //mode: 'cors',
    //cache: 'default',
    timeout: 15,
  };

  return myInit;
}
