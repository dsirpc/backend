import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: string,
    dishes: string[],
    drinks: string[],
    dishes_status: boolean[],
    chef: mongoose.Schema.Types.ObjectId,
    waiter: mongoose.Schema.Types.ObjectId,
    barman: mongoose.Schema.Types.ObjectId,
    status: boolean,
    timestamp: Date,
    setDishReady: (dish:string)=>void,
    setOrderReady: ()=>void
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

orderSchema.methods.setDishReady = function(dish:string){
    for(var d in this.dishes){
        if(d==dish){
            var position = this.dishes.indexOf(d);
            if(!this.dishes_status[position])
                this.dishes_status[position] = true;
        }
    }
}

orderSchema.methods.setOrderReady = function(){
    this.status = true;
    for(var i = 0; i < this.dishes_status; i++)
        this.dishes_status = true;
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
