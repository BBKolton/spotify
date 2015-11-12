var baseUrl = 'https://api.spotify.com/v1/';
var searchUrl = baseUrl + 'search?type=artist&limit=4&q=';
var myApp = angular.module('myApp', []);

var index = myApp.controller('index', function($scope, $http) {
  $scope.search = function() {
    if ($scope.artistSearch.length) {
      $http.get(searchUrl + $scope.artistSearch).then(function(data) {
        $scope.artists = data.data.artists.items;        
      });
    }
  }
});



var game = myApp.controller('game', function($scope, $http) {
  var artistId = window.location.hash.substr(1);
  var similarArtists;
  var timer;
  var timerBar;
  var endGameLoop;
  $scope.audioObject = {};
  $scope.guesses = [];
  $scope.total = 5;
  $scope.endMessage = 'placeholder';

  $http.get(baseUrl + 'artists/' + artistId).then(function(data) {    
    $scope.artist = data.data;
    console.log($scope.artist)
    document.getElementById('jumbotron').style.backgroundImage = 'url("' + data.data.images[0].url + '")';
    $scope.correct = 0;
    $scope.incorrect = 0;
  });

  $http.get(baseUrl + 'artists/' + artistId + '/related-artists').then(function(data) {
    similarArtists = data.data.artists;    
  })

  $scope.startGame = function() {
    $('#start').fadeOut(500, function() {
      $('#middle').removeClass('hidden');
      $('#middle').fadeIn(500, function() {
        $scope.startRound();
      })
    })
  }

  var newArtist;
  var track;

  $scope.startRound = function() {
    $('#possibles').fadeOut(300, function() {
      newArtist = similarArtists[Math.floor(Math.random() * 20)];
      document.getElementById('timerBar').style.backgroundColor = '#aaaaaa';

      //get the random artist's top tracks list
      var trackData = playRandomSong(newArtist.id);

      $scope.possibles = [];
      var correct = {
        name: newArtist.name,
        correct: true,
        image: newArtist.images[0].url
      }
      $scope.possibles[0] = correct;          

      while ($scope.possibles.length < 6) {
        var keys = [];
        for (obj in $scope.possibles) {
          keys.push($scope.possibles[obj].name);
        }

        var randomArtist = similarArtists[Math.floor(Math.random() * 20)];
        if (keys.indexOf(randomArtist.name) === -1) {
          var wrong = {
            name: randomArtist.name,
            correct: false,
            image: randomArtist.images[0].url
          }
          $scope.possibles.push(wrong);
        }
      }

      shuffle($scope.possibles);

      timer = window.setTimeout(function() {
        $scope.registerGuess(false);
      }, 30 * 1000);

      $('#possibles').fadeIn(300);
    });
  }

  function setTimerBar() {
    var steps = 0;

    timerBar = window.setInterval(function() {
      steps++;
      var timerBar = document.getElementById('timerBar');
      timerBar.style.width = 100 * steps / 3000 + '%';
      if (steps > 25 * 100) {
        timerBar.style.backgroundColor = blendColors('#aaaaaa', '#deac31', (steps - 25 * 100) / 490);          
      }
    }, 10);
  }

  function playRandomSong(id) {
    window.clearInterval(timerBar);
    $http.get(baseUrl + 'artists/' + id + '/top-tracks?country=US').then(function(topTracks) {
      var tracks = topTracks.data.tracks;
      track = tracks[Math.floor(Math.random() * 8)];
      //get a random track from the artists top tracks
      $http.get(baseUrl + 'tracks/' + track.id).then(function(trackData) {          
        playMusic(trackData.data.preview_url);
        $scope.trackName = trackData.data.name;
      });
    });
    setTimerBar(); 
  }

  function endGame() {
    $('#middle').fadeOut(500, function() {
      var messages = [
        'You need to brush up on your music!',
        'Got some, boss!',
        'About even isn\'t bad',
        'You really know your stuff!',
        'Holy musical knowledge, Batman! Great job!'
      ];

      console.log($scope.endMessage)
      $scope.endMessage = messages[Math.floor(($scope.correct / ($scope.correct + $scope.incorrect)) * 4)];
      console.log(Math.floor(($scope.correct / ($scope.correct + $scope.incorrect)) * 4));
      console.log($scope.endMessage)

      $('#end').removeClass('hidden');
      $('#end').fadeIn(1000, function() {
        playRandomSong(artistId);
        endGameLoop = window.setInterval(function() {
          playRandomSong(artistId);
        }, 30 * 1000)
      });
    });
  }

  $scope.restart = function() {
    $scope.possibles = [];
    $scope.guesses = [];
    $scope.correct = 0;
    $scope.incorrect = 0;
    $scope.audioObject.pause();
    window.clearInterval(timerBar);
    window.clearInterval(endGameLoop);
    $('#timerBar').width('0px');
    $('#end').fadeOut(500, function() {
      $('#start').fadeIn(500);
    })
  }

  $scope.registerGuess = function(correct) {
    if (correct) {
      $scope.correct++;
    } else {
      $scope.incorrect++;
    }

    $scope.guesses.push({
      name: newArtist.name,
      song: track.name,
      track: track.id,
      correct: correct,
      artist: newArtist.id
    });
        
    window.clearTimeout(timer);

    if ($scope.correct + $scope.incorrect < $scope.total) {
      $scope.startRound();
    } else {
      endGame();
    }
  }

  function playMusic(href) {
  if ($scope.currentSong == href) {
    $scope.audioObject.pause();
    $scope.currentSong = false;
  } else {
    if ($scope.audioObject.pause != undefined) $scope.audioObject.pause()
      $scope.audioObject = new Audio(href);
      $scope.audioObject.play();
      $scope.currentSong = href;
    }
  }


});



//credit to StackOverflow for this shuffle function
//http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

//blend color function from stack overflow
//http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}