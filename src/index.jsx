/*
babel --presets react src --out-dir .\www\js
cordova run browser
https://www.omdbapi.com/
*/
var Search = React.createClass({
  getInitialState: function(){
    return {
      searching: false,
      searching_title: "",
      original_title: "",
      search_result: null,
      page: 1
    };
},
  handleInputChange: function(evt) {
    console.log("TEXT", evt.target.value);
    var text = evt.target.value,
    searching_title=text.replace(/ /g,"+");
    this.requestMovies(searching_title, this.state.page);
    this.setState({
      searching: true,
      searching_title: searching_title,
      original_title: text,
      search_result: null
    });
  },
  requestMovies: function(title, page) {
    var url = 'www.omdbapi.com/?s='+title+'&r=json&page='+page,
    _this = this;
    requestMDB(url)
    .then(function(response) {
        if(title === _this.state.searching_title) {
          _this.setState({
            searching: false,
            search_result: response
          });
        }
      }
    )
    .catch(function(){
      _this.setState({
        searching: false
      });
    })
  },
  render: function() {
    return (
      <div>
        <form className="search_bar_form">
          <input type="text" onChange={this.handleInputChange} className="search_bar"/>
        </form>
        <SearchResultList
          searching={this.state.searching}
          original_title = {this.state.original_title}
          search_result={this.state.search_result} />
      </div>
    )
  }
});

var SearchResultList = React.createClass({
  createSearchEntries: function() {
    if(this.props.search_result !== null) {
      var result = this.props.search_result,
      result_list = result.Search
      search_list = [];
      for(var i = 0; i < result_list.length; i++) {
        search_list.push(<SearchResultEntry key={result_list[i].imdbID} movie={result_list[i]}/>);
      }
      return search_list
    } else {
      return null;
    }
  },
  createTitle: function() {
    var text = "...",
    result = this.props.search_result,
    title = this.props.original_title;

    if(this.props.searching) {
      text = "searching";
    }
    if(title && !result) {
      text = "searching for " + title;
    }
    return text;
  },
  render: function() {
    return (
      <div className="search_result">
        <div>{this.createTitle()}</div>
        <div>{this.createSearchEntries()}</div>
      </div>
    )
  }
});

var SearchResultEntry = React.createClass({
  /* movie, Poster, Title, Type, Year, imdbID
  */
  getInitialState: function(){
    return {
      showDetails: false,
      loading: false,
      additionalDetails: null
    };
  },
  onClick: function() {
    if(!this.state.loading) {
      var url = 'http://www.omdbapi.com/?i='+this.props.movie.imdbID+'&plot=short&r=json',
      _this = this;
      if(this.state.additionalDetails === null) {
        this.setState({loading: true});
        requestMDB(url)
        .then(function(response) {
          console.log(response);
          _this.setState({
            showDetails: true,
            loading: false,
            additionalDetails: response,
          });
        });
      } else if (this.state.additionalDetails !== null) {
        this.setState({showDetails: true});
      }
    }
  },
  toggleDetails: function() {
    console.log("toggle");
    this.setState({showDetails: !this.state.showDetails});
  },
  render: function() {
    if(this.state.loading) {
      return (
        <div className="search_result_entry loading">
          <p>{this.props.movie.Title}</p>
        </div>
      )
    }
    if(this.state.showDetails && this.state.additionalDetails !== null) {
      //thumbnail, year, name, rating, Genre and a short description ( Plot )
      return (
        <div className="search_result_entry additionalDetails" onClick={this.toggleDetails}>
          <p>{this.props.movie.Year}</p>
          <p>{this.props.movie.Title}</p>
          <p>{this.state.additionalDetails.imdbRating}</p>
          <p>{this.state.additionalDetails.Genre}</p>
          <p>{this.state.additionalDetails.Plot}</p>
        </div>
      )
    } else {
      return (
        <div className="search_result_entry" onClick={this.onClick}>
          <p>{this.props.movie.Title}</p>
        </div>
      )
    }
  }
});

var Favorites = React.createClass({
  render: function() {
    return (
      <div>
        <p>Favorites</p>
      </div>
    )
  }
});

var BottomMenu = React.createClass({
  getInitialState: function(){
    return {
      search_clicked: true,
      favorites_clicked: false
    };
  },
  onClickSearch: function() {
    var newstates = {
      search_clicked: true,
      favorites_clicked: false
    };
    this.props.buttonClicked(newstates);
    this.setState(newstates);
  },
  onClickFavorites: function() {
    var newstates = {
      search_clicked: false,
      favorites_clicked: true
    };
    this.props.buttonClicked(newstates);
    this.setState(newstates);
  },
  render: function() {
    return (
      <div className = "bottom_menu">
        <BottomButton id="search_button" onClick={this.onClickSearch} clicked={this.state.search_clicked}/>
        <BottomButton id="favorites_button" onClick={this.onClickFavorites} clicked={this.state.favorites_clicked}/>
      </div>
    )
  }
});

var BottomButton = React.createClass({
  render: function() {
    var classname = "bottom_button " + this.props.id;
    if(this.props.clicked) {
      classname += " clicked";
    }
    return (
      <div className={classname} onClick={this.props.onClick}></div>
    )
  }
});

var Mainframe = React.createClass({
  onButton: function(clicked) {
    console.log("Mainframe: button", clicked);
    this.setState(clicked);
  },
  render: function() {
    var search_clicked = true;
    if(this.state !== null && !this.state.search_clicked) {
      search_clicked = false
    }
    return(
      <div>
        {search_clicked ? <Search /> : <Favorites />}
        <BottomMenu buttonClicked={this.onButton}/>
      </div>
    )
  }
});

function requestMDB(url) {
  var promise = new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest(),
    proxy = "http://cors-anywhere.herokuapp.com/" + url;
    xhr.open('GET', proxy+url, true);
    xhr.send();
    console.log("request: ", url);
    xhr.addEventListener("readystatechange", processRequest, false);
    function processRequest(e) {
      if(e.srcElement.readyState === 4 && e.srcElement.status === 200) {
        var response = JSON.parse(e.srcElement.response);
        if(response.Response === "True") {
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

var initOnDeviceReady = function() {
  console.log('Device is ready');
  ReactDOM.render(
    <Mainframe />,
    document.getElementById('root')
  );
};

document.addEventListener('deviceready', initOnDeviceReady.bind(this), false);
