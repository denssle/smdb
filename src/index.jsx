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
      search_result: null
    };
},
  handleInputChange: function(evt) {
    console.log("TEXT", evt.target.value);
    var text = evt.target.value,
    searching_title=text.replace(/ /g,"+");
    if(text.length > 3) {
      this.requestMDB(searching_title);
      this.setState({
        searching: true,
        searching_title: searching_title,
        original_title: text,
        search_result: null
      });
    } else {
      this.setState({
        searching: false,
        searching_title: searching_title,
        original_title: text,
        search_result: null,
      });
    }
  },
  requestMDB: function(title) {
    var xhr = new XMLHttpRequest(),
    url = 'www.omdbapi.com/?t='+title+'&y=&plot=short&r=json',
    proxy = "http://cors-anywhere.herokuapp.com/" + url,
    _this = this;

    xhr.open('GET', proxy+url, true);
    xhr.send();
    console.log("request: ", title);
    xhr.addEventListener("readystatechange", processRequest, false);
    function processRequest(e) {
      if(e.srcElement.readyState === 4) {
        var response = JSON.parse(e.srcElement.response);
        console.log("response for: " + title, _this.state.searching_title, response);
        if(title === _this.state.searching_title && response.Title) {
          _this.setState({
            searching: false,
            search_result: response
          });
        } else if (response.Error) {
          console.warn("Error", response.Error);
          _this.setState({
            searching: false
          });
        }
      }
    };
  },
  render: function() {
    return (
      <div>
        <form className="search_bar_form">
          <input type="text" onChange={this.handleInputChange} className="search_bar"/>
        </form>
        <SearchResult
          searching={this.state.searching}
          original_title = {this.state.original_title}
          search_result={this.state.search_result} />
      </div>
    )
  }
});

var SearchResult = React.createClass({
  render: function() {
    var text = "",
    title = this.props.original_title,
    result = this.props.search_result;
    if(this.props.searching) {
      text = "searching";
    }
    if(title && !result) {
      text = "searching for " + title;
    }
    if(title && result) {
      text = "for " +  title + " we found: " + result.Title;
    }
    return (
      <div className="search_result"><h1>{text}</h1></div>
    )
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

var initOnDeviceReady = function() {
  console.log('Device is ready');
  ReactDOM.render(
    <Mainframe />,
    document.getElementById('root')
  );
};

document.addEventListener('deviceready', initOnDeviceReady.bind(this), false);
