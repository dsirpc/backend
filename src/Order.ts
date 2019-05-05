import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: string,
    dishes: string[],
    drinks: string[],
    chef: string,
    waiter: string,
    barman: string,
    status: boolean,
    timestamp: Date,
}

var orderSchema = new mongoose.Schema({
    table_number: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    dishes: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    },
    drinks: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false
    },
    chef: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    waiter: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    barman: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true
    }
});

export function getSchema() { return orderSchema; }

var orderModel;

export function getModel() : mongoose.Model< Order >  { // Return Model as singleton
    if( !orderModel ) {
        orderModel = mongoose.model('User', getSchema() )
    }
    return orderModel;
}
