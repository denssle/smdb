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
    }).catch(function () {
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
        search_list.push(React.createElement(SearchResultEntry, { key: result_list[i].imdbID, movie: result_list[i] }));
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
      additionalDetails: null
    };
  },
  onClick: function () {
    if (!this.state.loading) {
      var url = 'http://www.omdbapi.com/?i=' + this.props.movie.imdbID + '&plot=short&r=json',
          _this = this;
      if (this.state.additionalDetails === null) {
        this.setState({ loading: true });
        requestMDB(url).then(function (response) {
          console.log(response);
          _this.setState({
            showDetails: true,
            loading: false,
            additionalDetails: response
          });
        });
      } else if (this.state.additionalDetails !== null) {
        this.setState({ showDetails: true });
      }
    }
  },
  toggleDetails: function () {
    console.log("toggle");
    this.setState({ showDetails: !this.state.showDetails });
  },
  render: function () {
    if (this.state.loading) {
      return React.createElement(
        "div",
        { className: "search_result_entry loading" },
        React.createElement(
          "p",
          null,
          this.props.movie.Title
        )
      );
    }
    if (this.state.showDetails && this.state.additionalDetails !== null) {
      //thumbnail, year, name, rating, Genre and a short description ( Plot )
      return React.createElement(
        "div",
        { className: "search_result_entry additionalDetails", onClick: this.toggleDetails },
        React.createElement(
          "p",
          null,
          this.props.movie.Year
        ),
        React.createElement(
          "p",
          null,
          this.props.movie.Title
        ),
        React.createElement(
          "p",
          null,
          this.state.additionalDetails.imdbRating
        ),
        React.createElement(
          "p",
          null,
          this.state.additionalDetails.Genre
        ),
        React.createElement(
          "p",
          null,
          this.state.additionalDetails.Plot
        )
      );
    } else {
      return React.createElement(
        "div",
        { className: "search_result_entry", onClick: this.onClick },
        React.createElement(
          "p",
          null,
          this.props.movie.Title
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
      if (e.srcElement.readyState === 4 && e.srcElement.status === 200) {
        var response = JSON.parse(e.srcElement.response);
        if (response.Response === "True") {
          console.log("response for: ", url, response);
          resolve(response);
        } else {
          console.warn("http error 2", response.Response, e);
          reject();
        }
      } else {
        console.warn("http error 1", e.srcElement.readyState, e.srcElement.status, e);
      }
    }
  });
  return promise;
}

var initOnDeviceReady = function () {
  console.log('Device is ready');
  ReactDOM.render(React.createElement(Mainframe, null), document.getElementById('root'));
};

document.addEventListener('deviceready', initOnDeviceReady.bind(this), false);