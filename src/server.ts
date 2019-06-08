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


/* This check doesn't work with Heroku :( */

// if (result.error) {
//     console.log("Unable to load \".env\" file. Please provide one to store the JWT secret key");
//     process.exit(-1);
// }
// if (!process.env.JWT_SECRET) {
//     console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found");
//     process.exit(-1);
// }


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
import cors = require('cors');
const {ObjectId} = require('mongodb');

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
var nsp_chefs = undefined;
var nsp_waiters = undefined;
var nsp_cashers = undefined;

var app = express();
var auth = jwt({ secret: process.env.JWT_SECRET });

app.use(bodyparser.json());
app.use(cors());

const port = process.env.PORT || 8080;

app.get("/", (req, res) => {

    res.status(200).json({ api_version: "1.0", endpoints: ["/user", "/order", "/table", "/dish"] });
    // json method sends a JSON response (setting the correct Content-Type) to the client

});

app.post('/user', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            user.getModel().findOne({ username: req.body.username }).then((u) => {
                if (u)
                    return next({ statusCode: 404, error: true, errormessage: "User already exists" });
                else {
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
        }
    });
});

app.get('/user', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            user.getModel().find().then((users) => {
                return res.status(200).json(users);
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            })
        }
    });
});

app.delete('/user', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            if (req.query.username) {
                user.getModel().deleteOne({username: req.query.username}).then(() => {
                    return res.status(200).json({ error: false, errormessage: "", username: req.query.username });
                }).catch((reason) => {
                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                });
            } else {
                return next({ statusCode: 404, error: true, errormessage: "Specificare username"});
            }
        }
    });
});

app.post('/order', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("WAITER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            var neworder = {
                table_number: req.body.table_number,
                food: req.body.food,
                drinks: req.body.drinks,
                food_ready: req.body.food_ready,
                chef: req.body.chef,
                barman: req.body.barman,
                waiter: req.user.username,
                food_status: req.body.food_status,
                drink_status: req.body.drink_status,
                payed: req.body.payed,
                timestamp: new Date()
            };
        
            order.getModel().create(neworder).then((data) => {
                nsp_chefs.emit('orderSent', data);
                nsp_cashers.emit('orderSent', data);
                return res.status(200).json({ error: false, errormessage: "", id: data._id });
            }).catch((reason) => {console.log(reason);
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.put('/order', auth, (req, res, next) => {
    var us;
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        us = u;
        if (!us.checkRole("CHEF") && !us.checkRole("CASHER") && !us.checkRole("WAITER") && !us.checkRole("BARMAN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            order.getModel().findOne({_id: req.body._id}).then((o) => {
                if (us.checkRole("CHEF")) {
                    if (o.getFoodStatus() == 0) {
                        o.chef = us.username;
                        o.setFoodStatus();
                        nsp_cashers.emit('orderFoodStarted', o);
                        nsp_chefs.emit('orderFoodStarted', o);
                    }
                    else {
                        if (o.getFoodStatus() == 1) {
                            o.setDishReady(req.query.index);
                            o.markModified('food_ready');
                            nsp_cashers.emit('dishCompleted');
                            if(o.orderCompleted()) {
                                o.setFoodStatus();
                                nsp_cashers.emit('orderFoodCompleted', o);
                                nsp_waiters.emit('orderFoodCompleted', o);
                            }
                        }
                    }
                } else {
                    if (us.checkRole("CASHER")) {
                        o.payed = true;
                    } else {
                        if (us.checkRole("WAITER")) {
                            if (req.query.type === 'food') {
                                o.setFoodStatus();
                                if (o.getFoodStatus() === 3) {
                                    nsp_cashers.emit('orderFoodDelivered', o);
                                }
                            }
                            else {
                                o.setDrinkStatus();
                                if (o.getDrinkStatus() === 3) {
                                    nsp_cashers.emit('orderDrinkDelivered', o);
                                }
                            }
                        } else {
                            if (us.checkRole("BARMAN")) {
                                if (o.getDrinkStatus() === 0) {
                                    o.barman = us.username;
                                    nsp_chefs.emit('orderDrinkStarted', order);
                                } else {
                                    if (o.getDrinkStatus() === 1) {
                                        nsp_waiters.emit('orderDrinkCompleted', order);
                                    }
                                }
                                o.setDrinkStatus();
                            }
                        }
                    }
                }
                o.save().then(() => {
                    return res.status(200).json({ error: false, errormessage: "", id: o._id });
                }).catch((reason) => {console.log(reason);
                    return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                });;
            }).catch((reason) => {console.log(reason);
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    }).catch((reason) => {console.log(reason);
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.get('/order', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CHEF") && !u.checkRole("CASHER") && !u.checkRole("BARMAN") && !u.checkRole("WAITER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            order.getModel().find().sort({ timestamp: "asc" }).then((orders) => {
                return res.status(200).json(orders);
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.delete('/order', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            order.getModel().deleteMany({}).then((order) => {
                return res.status(200).json(order);
            }).catch((reason) => {console.log(reason);
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.put('/table', auth, (req, res, next) => {
    var us;
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        us = u;
        if (!us.checkRole("CASHER") && !us.checkRole("WAITER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            table.getModel().findOne(req.body).then((t) => {
                if (us.checkRole("WAITER") && t.getStatus()) {
                    t.setStatus();
                    nsp_cashers.emit('tableOccupied', t);
                    nsp_waiters.emit('tableOccupied', t);
                }
                
                if (us.checkRole("CASHER") && !t.getStatus()) {
                    t.setStatus();
                    nsp_waiters.emit('tableFree', t);
                    nsp_cashers.emit('tableFree', t);
                }
                t.save().then(() => {
                    return res.status(200).json({ error: false, errormessage: "", status: t.getStatus() });
                });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.get('/table', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER") && !u.checkRole("WAITER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            table.getModel().find().then((tables) => {
                return res.status(200).json(tables);
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.post('/table', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        } else {
            table.getModel().findOne({ number_id: req.body.number_id }).then((t) => {
                if (t) {
                    return next({ statusCode: 404, error: true, errormessage: "Table number already exists" });
                }
                else {
                    var newtable = req.body;
                    newtable.status = false;
        
                    table.getModel().create(newtable).then((data) => {
                        nsp_waiters.emit('tableCreated', data);
                        return res.status(200).json({ error: false, errormessage: "", id: data.number_id });
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                }
            });
        }
    });
});

app.delete('/table', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        } else {
            table.getModel().deleteMany({}).then(() => {
                return res.status(200).json({ error: false, errormessage: "" });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.get('/dish', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER") && !u.checkRole("WAITER") && !u.checkRole("CHEF") && !u.checkRole("BARMAN")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized" });
        } else {
            var filter = {};
            if (req.query.type) {
                filter = { type: { $all: req.query.type } };
            }

            dish.getModel().find(filter).then((dishes) => {
                return res.status(200).json(dishes);
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.post('/dish', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        } else {
            table.getModel().findOne({ name: req.body.name }).then((d) => {
                if (d) {
                    return next({ statusCode: 404, error: true, errormessage: "Dish already exists" });
                }
                else {
                    var newdish = req.body;
                    dish.getModel().create(newdish).then((data) => {
                        return res.status(200).json({ error: false, errormessage: "", id: data.name });
                    }).catch((reason) => {
                        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
                    });
                }
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.delete('/dish', auth, (req, res, next) => {
    user.getModel().findOne({ username: req.user.username }).then((u) => {
        if (!u.checkRole("CASHER")) {
            return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not an admin" });
        } else {
            dish.getModel().deleteMany({}).then(() => {
                return res.status(200).json({ error: false, errormessage: "" });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    });
});

app.get('/renew', auth, (req, res, next) => {
    var tokendata = req.user;
    delete tokendata.iat;
    delete tokendata.exp;
    console.log("Renewing token for user " + JSON.stringify(tokendata));
    var token_signed = jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(req.params.l);
    return res.status(200).json({ error: false, errormessage: "", token: token_signed, location: req.query.l });
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

        // De-commentare le seguenti righe per popolare il database
        /*var users = [ 
            {
                username: 'Cassiere',
                password: 'cassiere',
                role: 'CASHER'
            },
            {
                username: 'Cameriere',
                password: 'cameriere',
                role: 'WAITER'
            },
            {
                username: 'Cuoco',
                password: 'cuoco',
                role: 'CHEF'
            },
            {
                username: 'Barman',
                password: 'barman',
                role: 'BARMAN'
            }
        ];
        for (const us of users) {
            var u = user.newUser(us);
            u.setPassword(us.password);
            u.save().then(() => {
                console.log('Utente creato');
            })
        }

        var dishes = [
            {
                name: 'Pasta',
                price: '6.50',
                ingredients: ['Pasta', 'Sugo'],
                type: 'food',
                estimated_time: 10
            },
            {
                name: 'Risotto',
                price: '7',
                ingredients: ['Riso', 'Funghi'],
                type: 'food',
                estimated_time: 15
            },
            {
                name: 'Coca-Cola',
                price: '2.50',
                type: 'drink'
            },
            {
                name: 'Fanta',
                price: '2.50',
                type: 'drink',
            }
        ];
        for (const d of dishes) {
            var ds = dish.newDish(d);
            ds.save().then(() => {
                console.log('Piatto creato');
            })
        }

        var tables = [
            {
                number_id: 1,
                seats: 4,
                status: true
            },
            {
                number_id: 2,
                seats: 3,
                status: true
            }
        ];
        for (const t of tables) {
            var ts = table.newTable(t);
            ts.save().then(() => {
                console.log('Piatto creato');
            })
        }*/
        //FINE SCRIPT POPOLAZIONE DATABASE

        // To start a standard HTTP server we directly invoke the "listen"
        // method of express application
        let server = http.createServer(app);
        ios = io(server);
        nsp_chefs = ios.of('/chefs');
        nsp_waiters = ios.of('/waiters');
        nsp_cashers = ios.of('/cashers');
        ios.on('connection', function (client) {
            var ip = 
            console.log("Socket.io client connected");
        });
        server.listen(port, () => console.log("HTTP Server started on port" + port));

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