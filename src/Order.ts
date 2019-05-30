import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: number,
    dishes: string[],
    drinks: string[],
    dishes_qt: number[],
    drinks_qt: number[],
    dishes_ready: boolean[],
    chef: string,
    waiter: string,
    barman: string,
    status: number,
    timestamp: Date,
    setDishReady: (dish_id: string)=>void,
    setOrderStatus: ()=>void,
    getStatus: ()=>number
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
    dishes_qt: {
        type: [mongoose.SchemaTypes.Number],
        required: true
    },
    drinks_qt: {
        type: [mongoose.SchemaTypes.Number],
        required: true
    },
    dishes_ready: {
        type: [mongoose.SchemaTypes.Boolean],
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

orderSchema.methods.setDishReady = function(dish:string): void{
    this.dishes_ready[this.dishes.indexOf(dish)] = true;
}

orderSchema.methods.getStatus = function(): number{
    return this.status;
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
