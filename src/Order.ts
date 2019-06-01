import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: number,
    dishes: string[],
    drinks: string[],
    dishes_ready: number,
    chef: string,
    waiter: string,
    barman: string,
    status: number,
    payed: boolean,
    timestamp: Date,
    getDishes: ()=>string[],
    setOrderStatus: ()=>void,
    getStatus: ()=>number,
    incrementDishesReady: ()=>void,
    getDishesReady: ()=>number,
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
        required: true
    },
    dishes_ready: {
        type: mongoose.SchemaTypes.Number,
        required: true
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
        required: false
    },
    status: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    payed: {
        type: mongoose.SchemaTypes.Boolean,
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
    if(this.status == 2)
        this.status = 3;
}

orderSchema.methods.getStatus = function(): number{
    return this.status;
}

orderSchema.methods.getDishes = function(): string[]{
    return this.dishes;
}

orderSchema.methods.incrementDishesReady = function(): void{
    this.dishes_ready++;
}

orderSchema.methods.getDishesReady = function(): number{
    return this.dishes_ready;
}


export function getSchema() { return orderSchema; }

var orderModel;

export function getModel() : mongoose.Model< Order >  { // Return Model as singleton
    if( !orderModel ) {
        orderModel = mongoose.model('Order', getSchema() )
    }
    return orderModel;
}

export function newOrder( data ): Order {
    var _ordermodel = getModel();
    var order = new _ordermodel( data );
    return order;
}
