/*
    ENDPOINT               PARAMS          METHOD

    /user                    -              POST
    /user                   ?id             GET
    /user:id                 -              DELETE
    /login                   -              POST
    /order                   -              POST
    /order:dish_id           -              PUT
    /order:order_id          -              PUT
    /order            ?id ?table ?status    GET
    /table              ?id ?status         GET
    /table:table_id          -              PUT  ??status
    /table                   -              POST
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

const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('Test'));

app.post('/user', (req, res, next) => {
    var u = user.newUser(req.body);
    if (!req.body.password) {
        return next({ statusCode: 404, error: true, errormessage: "Password field missing" });
    }
    u.setPassword(req.body.password);

    u.save().then((data) => {
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        if (reason.code === 11000)
            return next({ statusCode: 404, error: true, errormessage: "User already exists" });
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
    })
});

app.get('/user', auth, (req, res, next) => {
    var filter = {};
    if (req.query.id)
        filter = { id: { $all: req.query.id } };

    user.getModel().find(filter).then((users) => {
        return res.status(200).json({ error: false, errormessage: "" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    })
});

app.delete('user/:id', auth, (req, res, next) => {
    if (!user.newUser(req.user).hasAdminRole()) {
        return next({ statusCode: 404, error: true, errormessage: "Unauthorized: user is not a moderator" });
    }

    user.getModel().deleteOne({ id: req.params.id }).then(() => {
        return res.status(200).json({ error: false, errormessage: "" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.post('/orders', auth, (req, res, next) => {
    var recvorder = req.body;
    recvorder.timestamp = new Date();
    recvorder.table_number = req.table.id;
    recvorder.dishes = req.dishes;
    recvorder.waiter = req.user.id;
    recvorder.status = false;

    order.getModel().create(recvorder).then((data) => {
        ios.emit('broadcast', data);
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.put('/orders/:dish_id', auth, (req, res, next) => {

});

app.put('/orders/:order_id', auth, (req, res, next) => {
    order.getModel().updateOne({ _id: req.params.order_id }, { $set: { "status": "true" } }).then((data) => {
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.get('/orders', auth, (req, res, next) => {
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

app.put('/tables/:table_id', auth, (req, res, next) => {
    table.getModel().updateOne({ _id: req.params.table_id }, { $set: { "status": req.params.status } }).then((data) => {
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.get('/tables', auth, (req, res, next) => {
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

app.post('/tables', auth, (req, res, next) => {
    var _table = req.body;
    _table.seats = req.body.seats;
    _table.status = false;

    table.getModel().create(_table).then((data) => {
        ios.emit('broadcast', data);
        return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});

app.listen(port, () => console.log(`HTTP app listening on port ${port}!`));