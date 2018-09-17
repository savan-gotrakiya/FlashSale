/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
 

var express = require('express'); // Express web server framework


var client_id = 'SavanGot-Flashsal-SBX-081f4e62a-04d76dc3'; // Your client id
var  client_secret = 'SBX-81f4e62a83ab-bcd6-4114-bcaf-1247'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

//token
//access_token=BQCyAJkrqWEC4fbE48mBp43v00qoNjOLQcWYDfYr6_Cd_5Qq1CLQtUHrnC-G2Hx1M9NCdHe0aoTFX-w_hOc0B_gNgLSzzpJAFeCp9uVhMB54DNQSSTTs3YjDw7uXNBcIZ45yxVBhKQN_5C3BsFKqBNwi0DL7f_RMOq2iAuTAxdYT4uwFSpzU&refresh_token=AQCfJ8clubJGVPQv8rRAvSCnlBRJ3rJfHfWM-0zLcx4RMYUe9PfwxAuiRgMmyjp3X2wppNZ_XkKRUCqqB-YaWMkPnCZoBPVv_fzEMUzMZO6jIYtrRYTE7HV_fc3Ymbn0q9hHFg


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();


app.use(express.static(__dirname + '/public'))
   
app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://auth.sandbox.ebay.com/oauth2/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/index' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  }
   else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://auth.sandbox.ebay.com/api/eBayAuthToken',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;


        var options = {
          url: 'https://auth.sandbox.ebay.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
         
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://auth.sandbox.ebay.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
