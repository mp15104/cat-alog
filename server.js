var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var PORT = process.env.PORT || 3000;

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.locals.pretty = true;

var routes = require('./routes/index');

app.get('/', routes.login);
app.get('/register', routes.register);

app.use(express.static(__dirname + '/public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());

app.post('/register', function(req, res) {
  const {username, password } = req.body;
  routes.registering(username, password);
  res.json({ message: 'Account successfully registered.' });
});

app.use(routes.authenticate); //authenticate user
app.get('/index', routes.index);
app.get('/users', routes.users);
app.get('/custom', routes.custom);

app.post('/submitCat', function(req, res) {
  const {catImage, catName, temperament, link } = req.body;
  routes.submitCat(catImage, catName, temperament, link);
  res.json({ message: 'Cat submitted successfully' });
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else {
    console.log(`Server listening on port: ${PORT}`);
    console.log('To Test:');
    console.log('http://localhost:3000');
    console.log('http://localhost:3000/');
  }
});
