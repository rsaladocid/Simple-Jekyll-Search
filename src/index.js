(function(window) {
  'use strict';

  var options = {
    searchInput: null,
    resultsContainer: null,
    contentContainer: null,
    resultsTitle: null,
    json: [],
    success: Function.prototype,
    searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
    templateMiddleware: Function.prototype,
    sortMiddleware: function() {
      return 0;
    },
    resultsTitleText: 'results found',
    noResultsTitleText: 'No results found',
    noResultsText: 'No results found',
    limit: 10,
    fuzzy: false,
    exclude: []
  };

  var requiredOptions = ['searchInput', 'resultsContainer', 'json'];
  var originalResultsTitleText = '';
  var templater = require('./Templater');
  var repository = require('./Repository');
  var jsonLoader = require('./JSONLoader');
  var optionsValidator = require('./OptionsValidator')({
    required: requiredOptions
  });
  var utils = require('./utils');

  window.SimpleJekyllSearch = function(_options) {
    var errors = optionsValidator.validate(_options);
    if (errors.length > 0) {
      throwError(
        'You must specify the following required options: ' + requiredOptions
      );
    }

    options = utils.merge(options, _options);
    originalResultsTitleText = options.resultsTitle.innerHTML;

    templater.setOptions({
      template: options.searchResultTemplate,
      middleware: options.templateMiddleware
    });

    repository.setOptions({
      fuzzy: options.fuzzy,
      limit: options.limit,
      sort: options.sortMiddleware
    });

    if (utils.isJSON(options.json)) {
      initWithJSON(options.json);
    } else {
      initWithURL(options.json);
    }

    return {
      search: search
    };
  };

  function initWithJSON(json) {
    options.success(json);
    repository.put(json);
    registerInput();
  }

  function initWithURL(url) {
    jsonLoader.load(url, function(err, json) {
      if (err) {
        throwError('failed to get JSON (' + url + ')');
      }
      initWithJSON(json);
    });
  }

  function emptyResultsContainer() {
    options.resultsContainer.innerHTML = '';
  }

  function appendToResultsContainer(text) {
    options.resultsContainer.innerHTML += text;
  }

  function hideContentContainer() {
    options.contentContainer.style.display = 'none';
  }

  function showContentContainer() {
    options.contentContainer.style.display = '';
  }

  function resetResultsTitleText() {
    options.resultsTitle.innerHTML = originalResultsTitleText;
  }

  function updateResultsTitleText(len) {
    if (len === 0) {
      options.resultsTitle.innerHTML = options.noResultsTitleText;
    } else {
      options.resultsTitle.innerHTML = len + ' ' + options.resultsTitleText;
    }
  }

  function registerInput() {
    options.searchInput.addEventListener('keyup', function(e) {
      if (isWhitelistedKey(e.which)) {
        emptyResultsContainer();
        hideContentContainer();
        search(e.target.value);
      }
    });
  }

  function search(query) {
    if (isValidQuery(query)) {
      emptyResultsContainer();
      hideContentContainer();
      render(repository.search(query), query);
    } else {
      showContentContainer();
      resetResultsTitleText();
    }
  }

  function render(results, query) {
    var len = results.length;
    updateResultsTitleText(len);
    if (len === 0) {
      return appendToResultsContainer(options.noResultsText);
    }
    for (var i = 0; i < len; i++) {
      results[i].query = query;
      appendToResultsContainer(templater.compile(results[i]));
    }
  }

  function isValidQuery(query) {
    return query && query.length > 0;
  }

  function isWhitelistedKey(key) {
    return [13, 16, 20, 37, 38, 39, 40, 91].indexOf(key) === -1;
  }

  function throwError(message) {
    throw new Error('SimpleJekyllSearch --- ' + message);
  }
})(window);
