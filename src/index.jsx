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
    requestMDB(url).then(function(response) {
      if(title === _this.state.searching_title) {
        _this.setState({
          searching: false,
          search_result: response
        });
      }
    }).catch(function(e) {
      console.log(e);
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
        var movie = result_list[i];
        movie.fav = false;
        if(ls.isFavorite(movie.imdbID)) {
          movie = ls.isFavorite(movie.imdbID);
          console.log("is fav", movie);
          movie.fav = true;
        }
        search_list.push(<SearchResultEntry key={movie.imdbID} movie_data={movie}/>);
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
      additionalDetails: false,
      movie: {}
    };
  },
  componentWillMount: function() {
    this.setState({
      movie: this.updateMovie(this.props.movie_data)
    });
  },
  updateMovie(data) {
    var movie = this.state.movie;
    for(var item in data) {
      movie[item] = data[item];
    }
    return movie;
  },
  loadDetails: function() {
    if(!this.state.loading) {
      var url = 'http://www.omdbapi.com/?i='+this.state.movie.imdbID+'&plot=short&r=json',
      _this = this;
      if(!this.state.movie.additionalDetails) {
        this.setState({loading: true});
        requestMDB(url).then(function(response) {
          console.log(response);
          response.additionalDetails = true;
          _this.setState({
            showDetails: true,
            loading: false,
            movie: _this.updateMovie(response),
          });
        }).catch(function(e) {
          _this.setState({loading: false});
        });
      } else {
        this.setState({showDetails: true});
      }
    }
  },
  toggleDetails: function() {
    console.log("toggle details");
    this.setState({showDetails: !this.state.showDetails});
  },
  toggleFavorite: function() {
    console.log("toggle fav");
    var movie = this.state.movie;
    if(this.state.movie.fav) {
      movie.fav = false;
      ls.removeFavorite(movie.imdbID);
    } else {
      movie.fav = true;
      ls.addFavorite(movie);
    }
    this.setState({movie: this.updateMovie(movie)});
  },
  render: function() {
    if(this.state.loading) {
      return (
        <div className="search_result_entry loading">
          <p>{this.state.movie.Title}</p>
        </div>
      )
    }
    console.log("render", this.state.showDetails, this.state.movie.additionalDetails);
    if(this.state.showDetails && this.state.movie.additionalDetails) {
      //thumbnail, year, name, rating, Genre and a short description ( Plot ) ❤
      var fav_classname = "details_favorite";
      if(this.state.movie.fav) {
        fav_classname += " activ_fav";
      }
      return (
        <div className="search_result_entry additionalDetails">
          <img className="details_img" src={this.state.movie.Poster} alt="loading image..."  onClick={this.toggleDetails}/>
          <div className="details_description_block">
            <div className={fav_classname} onClick={this.toggleFavorite}>❤</div>
            <div className="details_title"  onClick={this.toggleDetails}>{this.state.movie.Title}</div>
            <div className="details_year"  onClick={this.toggleDetails}>{this.state.movie.Year}</div>
            <div className="details_genre"  onClick={this.toggleDetails}>Genre: {this.state.movie.Genre}</div>
            <div className="details_rating"  onClick={this.toggleDetails}>imdb Rating: {this.state.movie.imdbRating}</div>
          </div>
          <div className="details_plot"  onClick={this.toggleDetails}>{this.state.movie.Plot}</div>
        </div>
      )
    } else {
      return (
        <div className="search_result_entry" onClick={this.loadDetails}>
          <p>{this.state.movie.Title}</p>
        </div>
      )
    }
  }
});

var Favorites = React.createClass({
  getInitialState: function(){
    return {
      favorites_list: this.getFavoritesList()
    };
  },
  getFavoritesList: function() {
    var favorites = ls.getFavorites(),
    favorites_list = [];
    for(var id in favorites) {
      favorites_list.push(favorites[id]);
    }
    return favorites_list;
  },
  updateFavorites: function() {
    this.setState({favorites_list: this.getFavoritesList()});
  },
  render: function() {
    var favorites = this.state.favorites_list;
    if(favorites.length === 0) {
      return (
        <div className="no_favorites">
          <p>No favorites.</p>
        </div>
      )
    } else {
      var favoritesEntries = [];
      for(var i=0; i<favorites.length; i++) {
        var movie = favorites[i];
        favoritesEntries.push(<FavoritEntry movie={movie} key={movie.imdbID} updateFavorites={this.updateFavorites}/>);
      }
      return (
        <div className="favorites_entries">
          {favoritesEntries}
        </div>
      )
    }
  }
});

var FavoritEntry = React.createClass({
  toggleFavorite: function() {
    console.log("toggle toggle");
    ls.removeFavorite(this.props.movie.imdbID);
    this.props.updateFavorites();
  },
  render: function() {
    console.log(this.props.movie);
    var movie = this.props.movie;
    return(
      <div className="favorite_entry">
        <img className="details_img" src={movie.Poster} alt="loading image..."/>
        <div className="favorite_entry_head">
          <div className="details_favorite activ_fav" onClick={this.toggleFavorite}>❤</div>
          <div >{movie.Title}</div>
          <div ><div className="underline">Runtime: </div>{movie.Runtime}</div>
          <div ><div className="underline">Released: </div>{movie.Released}</div>
          <div >{movie.Country}</div>
        </div>
        <div className="favorite_entry_people">
          <div ><div className="underline">Actors: </div>{movie.Actors}</div>
          <div ><div className="underline">Director: </div>{movie.Director}</div>
          <div ><div className="underline">Writer: </div>{movie.Writer}</div>
        </div>
        <div className="favorite_entry_rating">
          <div ><div className="underline">Awards:</div>{movie.Awards}</div>
          <div ><div className="underline">Metascore:</div>{movie.Metascore}</div>
          <div ><div className="underline">imdbRating:</div>{movie.imdbRating} " / " {movie.imdbVotes} imdbVotes</div>
        </div>
        <div className="favorite_entry_misc">
          <div ><div className="underline">Genre:</div>{movie.Genre}</div>
          <div ><div className="underline">Language:</div>{movie.Language}</div>
          <div ><div className="underline">Rated:</div>{movie.Rated}</div>
        </div>
        <div className="favorite_entry_plot">{movie.Plot}</div>
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
      if(e.srcElement.readyState === 4) {
        if(e.srcElement.status === 200) {
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
  ReactDOM.render(
    <Mainframe />,
    document.getElementById('root')
  );
};

var ls = {
  favorites: {},
  localStorageKey: "smdb",
  save: function() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.favorites));
  },
  load: function() {
    var data = JSON.parse(localStorage.getItem(this.localStorageKey));
    console.log("loaded: ", data);
    if(data !== null) {
      this.favorites = data;
    }
  },
  addFavorite: function(movie) {
    console.log("add fav", movie.Title);
    this.favorites[movie.imdbID] = movie;
    this.save();
  },
  removeFavorite: function(id) {
    console.log("removie fav", id, this.favorites.id);
    delete this.favorites[id];
    this.save();
  },
  isFavorite: function(id) {
    return this.favorites[id];
  },
  getFavorites: function() {
    return this.favorites;
  }
}

document.addEventListener('deviceready', initOnDeviceReady.bind(this), false);
