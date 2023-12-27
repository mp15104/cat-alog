var sqlite3 = require('sqlite3').verbose(); //verbose provides more detailed stack trace
var db = new sqlite3.Database('data/db_cats');
var Handlebars = require('hbs');

const url = `https://api.thecatapi.com/v1/breeds`;
const api_key = "live_hXA5bPrmMrj5dxpJ9AscFgKxmxmUviZk34GxzD86trsxkN2UqM2SvTG8z7mZp4m0"
let storedBreeds = []
fetch(url,{headers: {
	'x-api-key': api_key
  }})
.then((response) => {
 return response.json();
})
.then((data) => {
 data = data.filter(img=> img.image?.url!=null)
 
storedBreeds = data;
 
 for (let i = 0; i < storedBreeds.length; i++) {
  const breed = storedBreeds[i];
// let option = document.createElement('option');
  if(!breed.image)continue
  sqlString = `INSERT OR IGNORE INTO cats VALUES ('${breed.image.url}', '${breed.name}', '${breed.wikipedia_url}', '${breed.temperament}')`;
  db.run(sqlString);
  }
})
.catch(function(error) {
 console.log(error);
});

exports.authenticate = function(request, response, next) {
  /*
	Middleware to do BASIC http 401 authentication
	*/
  let auth = request.headers.authorization
  // auth is a base64 representation of (username:password)
  //so we will need to decode the base64
  if (!auth) {
    //note here the setHeader must be before the writeHead
    response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
    response.writeHead(401, {
      'Content-Type': 'text/html'
    })
    console.log('No authorization found, send 401.')
    response.end();
  } else {
    console.log("Authorization Header: " + auth)
    //decode authorization header
    // Split on a space, the original auth
    //looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
    var tmp = auth.split(' ')

    // create a buffer and tell it the data coming in is base64
    var buf = Buffer.from(tmp[1], 'base64');

    // read it back out as a string
    //should look like 'ldnel:secret'
    var plain_auth = buf.toString()
    console.log("Decoded Authorization ", plain_auth)

    //extract the userid and password as separate strings
    var credentials = plain_auth.split(':') // split on a ':'
    var username = credentials[0]
    var password = credentials[1]
    console.log("User: ", username)
    console.log("Password: ", password)

    var authorized = false
    let userRole
    //check database users table for user
    db.all("SELECT userid, password, role FROM users", function(err, rows) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].userid == username & rows[i].password == password){
           authorized = true
           userRole = rows[i].role
        }
      }
      if (authorized == false) {
        //we had an authorization header by the user:password is not valid
        response.setHeader('WWW-Authenticate', 'Basic realm="need to login"')
        response.writeHead(401, {
          'Content-Type': 'text/html'
        })
        console.log('No authorization found, send 401.')
        response.end()
      } else{
        request.user_role = userRole
        next()
      }
    })
  }

  //notice no call to next()

}


exports.index = function (request, response) { 
  db.all(`SELECT * FROM cats`, function(err, catrows){
    db.all(`SELECT * FROM customcats`, function(err, ccatrows){
      response.render('index', {cats: catrows, customcats: ccatrows});
    })
})
}


exports.users = function(request, response) {
  // /send_users
  console.log('USER ROLE: ' + request.user_role);
  if (request.user_role !== 'admin') {
    response.writeHead(403, {
      'Content-Type': 'text/html'
    });
    response.end('        <form action="/index">    <input type="submit" value="Exit" /></form> <b>ERROR: Admin Privileges Required To See Users</b>');
    return;
  }
		db.all("SELECT userid, password FROM users", function(err, rows){
 	       response.render('users', {title : 'Users:', userEntries: rows});
		})

}

exports.login = function(request, response){
  response.render('login');
}

exports.register = function(request, response){
  response.render('register');
}

let randomCatImageUrl = '';
exports.custom = function(request, response){  
  fetch('https://api.thecatapi.com/v1/images/search')
    .then(response => response.json())
      .then(data => {
          randomCatImageUrl = data[0].url;
      })
  .catch(error => console.log(error));
  response.render('custom', {image: randomCatImageUrl, name: "Name", temperament: "Temperament", link: "Info Link"});
};

exports.submitCat= function(catImage, catName, temperament, link){
  sqlString = `INSERT or REPLACE INTO customcats VALUES ('${catImage}', '${catName}', '${link}', '${temperament}')`;
  db.run(sqlString);
};

exports.registering= function(username, password){
  const role = 'guest';
  sqlString = `INSERT OR REPLACE INTO users VALUES ('${username}', '${password}', '${role}')`;
  db.run(sqlString);
};