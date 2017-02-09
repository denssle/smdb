/*
babel --presets react src --out-dir .\www\js
cordova run browser
https://www.omdbapi.com/
*/

/*
  Contains searchbar
*/
var Search = React.createClass({
  displayName: "Search",

  getInitialState: function () {
    return {
      searching: false,
      searching_title: "",
      original_title: "",
      search_result: null,
      page: 1,
      text: ""
    };
  },
  handleInputChange: function (evt) {
    this.setState({ text: evt.target.value });
  },
  startSearch: function (e) {
    e.preventDefault();
    console.log("start search");
    var searching_title = this.state.text.replace(/ /g, "+");
    this.requestMovies(searching_title, this.state.page);
    this.setState({
      searching: true,
      searching_title: searching_title,
      original_title: this.state.text
    });
  },
  requestMovies: function (title, page) {
    var url = 'www.omdbapi.com/?s=' + title + '&r=json&page=' + page,
        _this = this;
    requestMDB(url).then(function (response) {
      if (title === _this.state.searching_title) {
        _this.setState({
          searching: false,
          search_result: response,
          page: page
        });
      }
    }).catch(function () {
      console.log("catched error");
      _this.setState({ searching: false });
    });
  },
  nextPage: function () {
    var totalPages = Math.ceil(this.state.search_result.totalResults / 10),
        nextpage = this.state.page + 1;
    console.log("nextPage", nextpage, totalPages, this.state.search_result.totalResults);
    if (nextpage < totalPages && !this.state.searching) {
      this.setState({ searching: true });
      this.requestMovies(this.state.searching_title, nextpage);
    }
  },
  previousPage: function () {
    var previouspage = this.state.page - 1;
    console.log("previousPage", previouspage);
    if (previouspage > 0 && !this.state.searching) {
      this.setState({ searching: true });
      this.requestMovies(this.state.searching_title, previouspage);
    }
  },
  render: function () {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "form",
        { className: "search_bar_form", onSubmit: this.startSearch },
        React.createElement("input", { type: "text", onChange: this.handleInputChange, className: "search_bar" }),
        React.createElement(
          "div",
          { className: "search_bar_button", onClick: this.startSearch },
          " "
        )
      ),
      React.createElement(SearchResultList, {
        searching: this.state.searching,
        original_title: this.state.original_title,
        search_result: this.state.search_result,
        page: this.state.page,
        nextPage: this.nextPage,
        previousPage: this.previousPage })
    );
  }
});

/**
  Contains result and seach status
*/
var SearchResultList = React.createClass({
  displayName: "SearchResultList",

  createSearchEntries: function () {
    if (this.props.search_result !== null) {
      var result = this.props.search_result,
          result_list = result.Search;
      search_list = [];
      for (var i = 0; i < result_list.length; i++) {
        var movie = result_list[i];
        movie.fav = false;
        if (ls.isFavorite(movie.imdbID)) {
          movie = ls.isFavorite(movie.imdbID);
          console.log("is fav", movie);
          movie.fav = true;
        }
        search_list.push(React.createElement(SearchResultEntry, { key: movie.imdbID, movie_data: movie }));
      }
      search_list.push(this.getPaginationButtons());
      return search_list;
    } else {
      return null;
    }
  },
  createStatus: function () {
    // gives feedback
    var text = "...",
        searching = this.props.searching,
        result = this.props.search_result,
        title = this.props.original_title;
    if (searching) {
      text = "searching...";
    }
    if (title && !result && searching) {
      text = "searching for " + title + "...";
    }
    if (result) {
      text = "we found " + result.totalResults + " movies.";
    }
    return text;
  },
  getPaginationButtons: function () {
    if (this.props.search_result.totalResults > 10) {
      // we need more than one page
      return React.createElement(PaginationButtons, {
        page: this.props.page,
        nextPage: this.props.nextPage,
        previousPage: this.props.previousPage,
        totalResults: this.props.search_result.totalResults,
        searching: this.props.searching,
        key: "paginationButtons" });
    } else {
      return null;
    }
  },
  render: function () {
    return React.createElement(
      "div",
      { className: "createStatus" },
      React.createElement(
        "div",
        { className: "search_status" },
        this.createStatus()
      ),
      React.createElement(
        "div",
        { className: "search_list_entries" },
        this.createSearchEntries()
      )
    );
  }
});

var SearchResultEntry = React.createClass({
  displayName: "SearchResultEntry",

  getInitialState: function () {
    return {
      showDetails: false,
      loading: false,
      additionalDetails: false,
      movie: {}
    };
  },
  componentWillMount: function () {
    this.setState({
      movie: this.updateMovie(this.props.movie_data)
    });
  },
  updateMovie(data) {
    var movie = this.state.movie;
    for (var item in data) {
      movie[item] = data[item];
    }
    return movie;
  },
  // Use http to get more details for the clicked movie
  loadDetails: function () {
    if (!this.state.loading) {
      var url = 'http://www.omdbapi.com/?i=' + this.state.movie.imdbID + '&plot=short&r=json',
          _this = this;
      if (!this.state.movie.additionalDetails) {
        this.setState({ loading: true });
        requestMDB(url).then(function (response) {
          console.log(response);
          response.additionalDetails = true;
          _this.setState({
            showDetails: true,
            loading: false,
            movie: _this.updateMovie(response)
          });
        }).catch(function (e) {
          _this.setState({ loading: false });
        });
      } else {
        // additionalDetails already loaded
        this.setState({ showDetails: true });
      }
    }
  },
  toggleDetails: function () {
    console.log("toggle details");
    this.setState({ showDetails: !this.state.showDetails });
  },
  toggleFavorite: function () {
    console.log("toggle fav");
    var movie = this.state.movie;
    if (this.state.movie.fav) {
      movie.fav = false;
      ls.removeFavorite(movie.imdbID);
    } else {
      movie.fav = true;
      ls.addFavorite(movie);
    }
    this.setState({ movie: this.updateMovie(movie) });
  },
  render: function () {
    if (this.state.loading) {
      return React.createElement(
        "div",
        { className: "search_result_entry loading" },
        React.createElement(
          "p",
          null,
          this.state.movie.Title
        )
      );
    }
    if (this.state.showDetails && this.state.movie.additionalDetails) {
      var fav_classname = "details_favorite";
      if (this.state.movie.fav) {
        fav_classname += " activ_fav";
      }
      return React.createElement(
        "div",
        { className: "search_result_entry additionalDetails" },
        React.createElement("img", { className: "details_img", src: this.state.movie.Poster, alt: "loading image...", onClick: this.toggleDetails }),
        React.createElement(
          "div",
          { className: "details_description_block" },
          React.createElement(
            "div",
            { className: fav_classname, onClick: this.toggleFavorite },
            "\u2764"
          ),
          React.createElement(
            "div",
            { className: "details_title", onClick: this.toggleDetails },
            this.state.movie.Title
          ),
          React.createElement(
            "div",
            { className: "details_year", onClick: this.toggleDetails },
            this.state.movie.Year
          ),
          React.createElement(
            "div",
            { className: "details_genre", onClick: this.toggleDetails },
            "Genre: ",
            this.state.movie.Genre
          ),
          React.createElement(
            "div",
            { className: "details_rating", onClick: this.toggleDetails },
            "imdb Rating: ",
            this.state.movie.imdbRating
          )
        ),
        React.createElement(
          "div",
          { className: "details_plot", onClick: this.toggleDetails },
          this.state.movie.Plot
        )
      );
    } else {
      return React.createElement(
        "div",
        { className: "search_result_entry", onClick: this.loadDetails },
        React.createElement(
          "p",
          null,
          this.state.movie.Title
        )
      );
    }
  }
});

var PaginationButtons = React.createClass({
  displayName: "PaginationButtons",

  getPreviousPageButton: function () {
    if (this.props.page > 1 && !this.props.searching) {
      return React.createElement(
        "div",
        { className: "previous_page_button", onClick: this.props.previousPage },
        " \u2190 "
      );
    } else {
      return React.createElement(
        "div",
        { className: "previous_page_button inaktiv" },
        " \u2190 "
      );
    }
  },
  getNextPageButton: function () {
    if (!this.props.searching) {
      return React.createElement(
        "div",
        { className: "next_page_button", onClick: this.props.nextPage },
        " \u2192 "
      );
    } else {
      return React.createElement(
        "div",
        { className: "next_page_button inaktiv" },
        " \u2192 "
      );
    }
  },
  render: function () {
    var page = this.props.page,
        totalResults = Math.ceil(this.props.totalResults / 10); // 10 items / page
    return React.createElement(
      "div",
      { className: "pagination_buttons" },
      this.getPreviousPageButton(),
      React.createElement(
        "div",
        { className: "pagination_status" },
        page,
        " / ",
        totalResults
      ),
      this.getNextPageButton()
    );
  }
});

var Favorites = React.createClass({
  displayName: "Favorites",

  getInitialState: function () {
    return {
      favorites_list: this.getFavoritesList()
    };
  },
  getFavoritesList: function () {
    var favorites = ls.getFavorites(),
        favorites_list = [];
    for (var id in favorites) {
      favorites_list.push(favorites[id]);
    }
    return favorites_list;
  },
  updateFavorites: function () {
    this.setState({ favorites_list: this.getFavoritesList() });
  },
  render: function () {
    var favorites = this.state.favorites_list;
    if (favorites.length === 0) {
      return React.createElement(
        "div",
        { className: "no_favorites" },
        React.createElement(
          "p",
          null,
          "No favorites."
        )
      );
    } else {
      var favoritesEntries = [];
      for (var i = 0; i < favorites.length; i++) {
        var movie = favorites[i];
        favoritesEntries.push(React.createElement(FavoritEntry, { movie: movie, key: movie.imdbID, updateFavorites: this.updateFavorites }));
      }
      return React.createElement(
        "div",
        { className: "favorites_entries" },
        favoritesEntries
      );
    }
  }
});

var FavoritEntry = React.createClass({
  displayName: "FavoritEntry",

  toggleFavorite: function () {
    console.log("toggle toggle");
    ls.removeFavorite(this.props.movie.imdbID);
    this.props.updateFavorites();
  },
  render: function () {
    console.log(this.props.movie);
    var movie = this.props.movie;
    return React.createElement(
      "div",
      { className: "favorite_entry" },
      React.createElement("img", { className: "details_img", src: movie.Poster, alt: "loading image..." }),
      React.createElement(
        "div",
        { className: "favorite_entry_head" },
        React.createElement(
          "div",
          { className: "details_favorite activ_fav", onClick: this.toggleFavorite },
          "\u2764"
        ),
        React.createElement(
          "div",
          null,
          movie.Title
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Runtime: "
          ),
          movie.Runtime
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Released: "
          ),
          movie.Released
        ),
        React.createElement(
          "div",
          null,
          movie.Country
        )
      ),
      React.createElement(
        "div",
        { className: "favorite_entry_people" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Actors: "
          ),
          movie.Actors
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Director: "
          ),
          movie.Director
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Writer: "
          ),
          movie.Writer
        )
      ),
      React.createElement(
        "div",
        { className: "favorite_entry_rating" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Awards:"
          ),
          movie.Awards
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Metascore:"
          ),
          movie.Metascore
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "imdbRating:"
          ),
          movie.imdbRating,
          " \" / \" ",
          movie.imdbVotes,
          " imdbVotes"
        )
      ),
      React.createElement(
        "div",
        { className: "favorite_entry_misc" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Genre:"
          ),
          movie.Genre
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Language:"
          ),
          movie.Language
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "underline" },
            "Rated:"
          ),
          movie.Rated
        )
      ),
      React.createElement(
        "div",
        { className: "favorite_entry_plot" },
        movie.Plot
      )
    );
  }
});

var BottomMenu = React.createClass({
  displayName: "BottomMenu",

  getInitialState: function () {
    return {
      search_clicked: true,
      favorites_clicked: false
    };
  },
  onClickSearch: function () {
    var newstates = {
      search_clicked: true,
      favorites_clicked: false
    };
    this.props.buttonClicked(newstates);
    this.setState(newstates);
  },
  onClickFavorites: function () {
    var newstates = {
      search_clicked: false,
      favorites_clicked: true
    };
    this.props.buttonClicked(newstates);
    this.setState(newstates);
  },
  render: function () {
    return React.createElement(
      "div",
      { className: "bottom_menu" },
      React.createElement(BottomButton, { id: "search_button", onClick: this.onClickSearch, clicked: this.state.search_clicked }),
      React.createElement(BottomButton, { id: "favorites_button", onClick: this.onClickFavorites, clicked: this.state.favorites_clicked })
    );
  }
});

var BottomButton = React.createClass({
  displayName: "BottomButton",

  render: function () {
    var classname = "bottom_button " + this.props.id;
    if (this.props.clicked) {
      classname += " clicked";
    }
    return React.createElement("div", { className: classname, onClick: this.props.onClick });
  }
});

var Mainframe = React.createClass({
  displayName: "Mainframe",

  onButton: function (clicked) {
    console.log("Mainframe: button", clicked);
    this.setState(clicked);
  },
  render: function () {
    var search_clicked = true;
    if (this.state !== null && !this.state.search_clicked) {
      search_clicked = false;
    }
    return React.createElement(
      "div",
      null,
      search_clicked ? React.createElement(Search, null) : React.createElement(Favorites, null),
      React.createElement(BottomMenu, { buttonClicked: this.onButton })
    );
  }
});

/*
  Send http requests; uses proxy
*/

function requestMDB(url) {
  var promise = new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest(),
        proxy = "http://cors-anywhere.herokuapp.com/" + url;
    xhr.open('GET', proxy + url, true);
    xhr.send();
    console.log("request: ", url);
    xhr.addEventListener("readystatechange", processRequest, false);
    function processRequest(e) {
      if (e.srcElement.readyState === 4) {
        if (e.srcElement.status === 200) {
          var response = JSON.parse(e.srcElement.response);
          console.log("response for: ", url, response);
          resolve(response);
        } else {
          console.warn("http error", e.srcElement.status, e);
          reject(e.srcElement.status);
        }
      }
    }
  });
  return promise;
}

/**
  Local Storage Interfase
*/
var ls = {
  favorites: {},
  localStorageKey: "smdb",
  save: function () {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.favorites));
  },
  load: function () {
    var data = JSON.parse(localStorage.getItem(this.localStorageKey));
    console.log("loaded: ", data);
    if (data !== null) {
      this.favorites = data;
    }
  },
  addFavorite: function (movie) {
    console.log("add fav", movie.Title);
    this.favorites[movie.imdbID] = movie;
    this.save();
  },
  removeFavorite: function (id) {
    console.log("removie fav", id, this.favorites.id);
    delete this.favorites[id];
    this.save();
  },
  isFavorite: function (id) {
    return this.favorites[id];
  },
  getFavorites: function () {
    return this.favorites;
  }
};

/*
  Initiates the application
*/
function initOnDeviceReady() {
  console.log('Device is ready');
  ls.load();
  ReactDOM.render(React.createElement(Mainframe, null), document.getElementById('root'));
};

document.addEventListener('deviceready', initOnDeviceReady.bind(this), false);