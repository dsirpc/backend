import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: string,
    dishes: string[],
    drinks: string[],
    chef: string,
    waiter: string,
    barman: string,
    status: number,
    timestamp: Date,
    setOrderStatus: ()=>void
}

var orderSchema = new mongoose.Schema({
    table_number: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    dishes: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    drinks: {
        type: [mongoose.SchemaTypes.String],
        required: false
    },
    chef: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    waiter: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    barman: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    status: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true
    }
});

orderSchema.methods.setOrderStatus = function(): void{
    if(this.status == 0)
        this.status = 1;
    if(this.status == 1)
    this.status = 2;
}

export function getSchema() { return orderSchema; }

var orderModel;

export function getModel() : mongoose.Model< Order >  { // Return Model as singleton
    if( !orderModel ) {
        orderModel = mongoose.model('User', getSchema() )
    }
    return orderModel;
}

export function newOrder( data ): Order {
    var _ordermodel = getModel();
    var order = new _ordermodel( data );
    return order;
}
