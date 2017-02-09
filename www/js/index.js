/*
babel --presets react src --out-dir .\www\js
cordova run browser
https://www.omdbapi.com/
*/
var Search = React.createClass({
  displayName: "Search",

  getInitialState: function () {
    return {
      searching: false,
      searching_title: "",
      original_title: "",
      search_result: null,
      page: 1
    };
  },
  handleInputChange: function (evt) {
    console.log("TEXT", evt.target.value);
    var text = evt.target.value,
        searching_title = text.replace(/ /g, "+");
    this.requestMovies(searching_title, this.state.page);
    this.setState({
      searching: true,
      searching_title: searching_title,
      original_title: text,
      search_result: null
    });
  },
  requestMovies: function (title, page) {
    var url = 'www.omdbapi.com/?s=' + title + '&r=json&page=' + page,
        _this = this;
    requestMDB(url).then(function (response) {
      if (title === _this.state.searching_title) {
        _this.setState({
          searching: false,
          search_result: response
        });
      }
    }).catch(function (e) {
      console.log(e);
      _this.setState({
        searching: false
      });
    });
  },
  render: function () {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "form",
        { className: "search_bar_form" },
        React.createElement("input", { type: "text", onChange: this.handleInputChange, className: "search_bar" })
      ),
      React.createElement(SearchResultList, {
        searching: this.state.searching,
        original_title: this.state.original_title,
        search_result: this.state.search_result })
    );
  }
});

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
          movie.fav = true;
        }
        search_list.push(React.createElement(SearchResultEntry, { key: movie.imdbID, movie_data: movie }));
      }
      return search_list;
    } else {
      return null;
    }
  },
  createTitle: function () {
    var text = "...",
        result = this.props.search_result,
        title = this.props.original_title;

    if (this.props.searching) {
      text = "searching";
    }
    if (title && !result) {
      text = "searching for " + title;
    }
    return text;
  },
  render: function () {
    return React.createElement(
      "div",
      { className: "search_result" },
      React.createElement(
        "div",
        null,
        this.createTitle()
      ),
      React.createElement(
        "div",
        null,
        this.createSearchEntries()
      )
    );
  }
});

var SearchResultEntry = React.createClass({
  displayName: "SearchResultEntry",

  /* movie, Poster, Title, Type, Year, imdbID
  */
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
      ls.removeFavorite(movie.imdbID);
      movie.fav = false;
    } else {
      ls.addFavorite(movie);
      movie.fav = true;
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
    console.log("render", this.state.showDetails, this.state.movie.additionalDetails);
    if (this.state.showDetails && this.state.movie.additionalDetails) {
      //thumbnail, year, name, rating, Genre and a short description ( Plot ) ❤
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

var Favorites = React.createClass({
  displayName: "Favorites",

  render: function () {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        null,
        "Favorites"
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

function initOnDeviceReady() {
  console.log('Device is ready');
  ls.load();
  ReactDOM.render(React.createElement(Mainframe, null), document.getElementById('root'));
};

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
    console.log("add fav", movie);
    this.favorites[movie.imdbID] = movie;
    this.save();
  },
  removeFavorite: function (id) {
    console.log("removie fav", id, this.favorites.id);
    delete this.favorites.id;
    this.save();
  },
  isFavorite: function (id) {
    return this.favorites.id;
  }
};

document.addEventListener('deviceready', initOnDeviceReady.bind(this), false);