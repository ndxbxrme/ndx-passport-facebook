# ndx-passport-facebook 
### facebook login for [ndx-framework](https://github.com/ndxbxrme/ndx-framework) apps
install with   
`npm install --save ndx-passport-facebook`  
## example
`src/server/app.coffee`  
```coffeescript
require 'ndx-server'
.config
  database: 'db'
.use ndx-passport
.use ndx-passport-facebook
.start()
```
`src/client/../login.jade`  
```jade
a(href='/api/facebook', target='_self') Facebook
```
## environment/config variables  
|environment|config|description|
|-----------|------|-----------|
|FACEBOOK_KEY|facebookKey|your facebook key|
|FACEBOOK_SECRET|facebookSecret|your facebook secret|
|FACEBOOK_CALLBACK|facebookCallback|set this to `http(s)://yourservername.com/api/facebook/callback`|
|FACEBOOK_SCOPE|facebookScope|a list of scopes you want access to|