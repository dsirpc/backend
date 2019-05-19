/*
    ENDPOINT                       PARAMS               METHOD

    /user                             -                 POST
    /user                            ?id                GET
    /user:username                    -                 DELETE
    /login                            -                 POST
    /order                            -                 POST
    /order                            -                 PUT
    /order                     ?id ?table ?status       GET
    /table                       ?id ?status            GET
    /table                            -                 PUT
    /table                            -                 POST
    /dish                             -                 POST
    /dish                           ?name               GET
    /dish:name                        -                 DELETE  
*/
const result = require('dotenv').config();

if (result.error) {
    console.log("Unable to load \".env\" file. Please provide one to store the JWT secret key");
    process.exit(-1);
}
if (!process.env.JWT_SECRET) {
    console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found");
    process.exit(-1);
}


import express = require('express');
import mongoose = require('mongoose');
import jsonwebtoken = require('jsonwebtoken');  // JWT generation
import jwt = require('express-jwt');            // JWT parsing middleware for express
import http = require('http');                // HTTP module
import https = require('https');
import io = require('socket.io');
import passport = require('passport');           // authentication middleware for express
import passportHTTP = require('passport-http');
import bodyparser = require('body-parser');

import { userInfo } from 'os';
import { User } from './User';
import * as user from './User';
import { Dish } from './Dish';
import * as dish from './Dish';
import { Table } from './Table';
import * as table from './Table';
import { Order } from './Order';
import * as order from './Order';

var ios = undefined;
var app = express();
var auth = jwt({ secret: process.env.JWT_SECRET });

app.use( bodyparser.json() );

const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('Test'));

app.post('/user', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("ADMIN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        }
    });

    user.getModel().findOne({username: req.body.username}).then((u) => {
        if(u)
            return next({ statusCode: 404, error: true, errormessage: "User already exists" });
        else{
            var u = user.newUser(req.body);
            if (!req.body.password) {
                return next({ statusCode: 404, error: true, errormessage: "Password field missing" });
            }
            u.setPassword(req.body.password);

            u.save().then((data) => {
                return res.status(200).json({ error: false, errormessage: "", id: data.username });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
            });
        }
    });
});

app.get('/user', (req, res, next) => {
    var filter = {};
    if (req.query.username)
        filter = { username: { $all: req.query.username } };
    if (req.query.role)
        filter = { role: { $all: req.query.role } };

    user.getModel().find(filter).then((users) => {
        return res.status(200).json({ error: false, errormessage: "", data: users });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    })
});

app.delete('/user/:username', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("ADMIN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        }
    });
    
    user.getModel().deleteOne({username: req.params.username}).then(() => {
        return res.status(200).json({ error: false, errormessage: "" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.post('/order', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("WAITER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an waiter" });
        }
    });

    var neworder = req.body;
    neworder.timestamp = new Date();
    /*neworder.table_number = req.body.table;
    neworder.dishes = req.body.dishes;*/
    neworder.waiter = req.user.username;
    neworder.status = false;

    order.getModel().create(neworder).then((data) => {
        ios.emit('broadcast', data);
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

/*app.put('/order/:order_id/:dish_id', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("CHEF")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an chef" });
        }
    });

    order.getModel().findOne({ _id: req.params.order_id }).then((order) => {
        order.setDishReady(req.params.dish_id);
        return res.status(200).json({ error: false, errormessage: "", id: order._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});*/

app.put('/order', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("CHEF")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an chef" });
        }
    });

    order.getModel().findOne(req.body).then((order) => {
        order.setOrderStatus();
        return res.status(200).json({ error: false, errormessage: "", id: order._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.get('/order', (req, res, next) => {
    var filter = {};
    if (req.query.tags) {
        filter = { tags: { $all: req.query.tags } };
    }

    order.getModel().find(filter).sort({ timestamp: "asc" }).then((orders) => {
        return res.status(200).json(orders);
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.put('/table', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("CASHER") || !u.checkRole("WAITER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an casher" });
        }
    });

    var t = table.getModel().findOne(req.body);
    table.newTable(t).setStatus();
});

app.get('/table', (req, res, next) => {
    var filter = {};
    if (req.query.tags) {
        filter = { tags: { $all: req.query.tags } };
    }

    table.getModel().find(filter).then((tables) => {
        return res.status(200).json(tables);
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.post('/table', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("ADMIN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        }
    });

    table.getModel().find({number_id: req.body.number_id}).then((t) => {
        if(t)
            return next({ statusCode: 404, error: true, errormessage: "Table number already exists" });
        else{
            var newtable = req.body;
            newtable.status = false;

            table.getModel().create(newtable).then((data) => {
                ios.emit('broadcast', data);
                return res.status(200).json({ error: false, errormessage: "", id: data.number_id });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.get('/dish', (req, res, next) => {
    var filter;
    if (req.query.tags) {
        filter = { tags: { $all: req.query.tags } };
    }

    dish.getModel().find(filter).then((dishes) => {
        return res.status(200).json(dishes);
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.post('/dish', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("ADMIN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        }
    });

    table.getModel().find({name: req.body.name}).then((d) => {
        if(d)
            return next({ statusCode: 404, error: true, errormessage: "Dish already exists" });
        else{
            var newdish;
            newdish.name = req.query.name;
            newdish.price = req.query.price;
            newdish.ingredients = req.query.ingredients;
        
            dish.getModel().create(newdish).then((data) => {
                ios.emit('broadcast', data);
                return res.status(200).json({ error: false, errormessage: "", id: data.name });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    })
});

app.delete('/dish/:name', auth, (req, res, next) => {
    user.getModel().findOne({username: req.user.username}).then((u) => {
        if (!u.checkRole("ADMIN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        }
    });

    dish.getModel().deleteOne({name: req.params.name}).then(() => {
        return res.status(200).json({ error: false, errormessage: "" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

passport.use(new passportHTTP.BasicStrategy(
    function (username, password, done) {

        // Delegate function we provide to passport middleware
        // to verify user credentials 

        console.log("New login attempt from " + username);
        user.getModel().findOne({ username: username }, (err, user) => {
            
            if (err) {
                return done({ statusCode: 500, error: true, errormessage: err });
            }
            if (!user) {
                return done({ statusCode: 500, error: true, errormessage: "Invalid user" });
            }
            if (user.validatePassword(password)) {
                return done(null, user);
            }
            return done({ statusCode: 500, error: true, errormessage: "Invalid password" });
        })
    }
));


// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/login", passport.authenticate('basic', { session: false }), (req, res, next) => {

    // If we reach this point, the user is successfully authenticated and
    // has been injected into req.user

    // We now generate a JWT with the useful user data
    // and return it as response

    var tokendata = {
        username: req.user.username,
        role: req.user.role,
    };

    console.log("Login granted. Generating token");
    var token_signed = jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Note: You can manually check the JWT content at https://jwt.io

    return res.status(200).json({ error: false, errormessage: "", token: token_signed });

});

//app.listen(port, () => console.log(`HTTP app listening on port ${port}!`));
mongoose.connect(process.env.MONGODB_URI).then(
    function onconnected() {
        console.log("Connected to MongoDB");

        /*var u = user.newUser({
            username: "admin",
        });
        u.setAdmin();
        u.setPassword("admin");
        u.save().then(() => {
            console.log("Admin user created");
        }).catch((err) => {
            console.log("Unable to create admin user: " + err);
        });*/


        // To start a standard HTTP server we directly invoke the "listen"
        // method of express application
        let server = http.createServer(app);
        ios = io(server);
        ios.on('connection', function (client) {
            console.log("Socket.io client connected");
        });
        server.listen(8080, () => console.log("HTTP Server started on port 8080"));

        // To start an HTTPS server we create an https.Server instance 
        // passing the express application middleware. Then, we start listening
        // on port 8443
        //
        /*
        https.createServer({
          key: fs.readFileSync('keys/key.pem'),
          cert: fs.readFileSync('keys/cert.pem')
        }, app).listen(8443);
        */

    },
    function onrejected() {
        console.log("Unable to connect to MongoDB");
        process.exit(-2);
    }
)