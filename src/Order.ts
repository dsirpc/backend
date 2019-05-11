import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: string,
    dishes: string[],
    drinks: string[],
    dishes_status: boolean[],
    chef: string,
    waiter: string,
    barman: string,
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
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true
    }
});

orderSchema.methods.setDishReady = function(dish:string): void{
    for(var d in this.dishes){
        if(d==dish){
            var position = this.dishes.indexOf(d);
            if(!this.dishes_status[position])
                this.dishes_status[position] = true;
        }
    }
}

orderSchema.methods.setOrderReady = function(): void{
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
