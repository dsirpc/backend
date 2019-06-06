import mongoose = require('mongoose');

export interface Order extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    table_number: number,
    food: string[],
    drinks: string[],
    food_ready: [boolean],
    chef: string,
    waiter: string,
    barman: string,
    food_status: number,
    drink_status: number,
    payed: boolean,
    timestamp: Date,
    getDishes: ()=>string[],
    setFoodStatus: ()=>void,
    setDrinkStatus: ()=>void,
    getFoodStatus: ()=>number,
    getDrinkStatus: ()=>number,
    setDishReady: (index)=>void,
    orderCompleted: ()=>boolean,
}

var orderSchema = new mongoose.Schema({
    table_number: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    food: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    drinks: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    food_ready: {
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
    food_status: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    drink_status: {
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

orderSchema.methods.setFoodStatus = function(): void{
    if(this.food_status == 0) {
        this.food_status = 1;
    } else {
        if(this.food_status == 1) {
            this.food_status = 2;
        } else {
            if(this.food_status == 2)
                this.food_status = 3;
        }
    }
}

orderSchema.methods.setDrinkStatus = function(): void{
    if(this.drink_status == 0) {
        this.drink_status = 1;
    } else {
        if(this.drink_status == 1) {
            this.drink_status = 2;
        } else {
            if(this.drink_status == 2)
                this.drink_status = 3;
        }
    }
}

orderSchema.methods.getFoodStatus = function(): number{
    return this.food_status;
}

orderSchema.methods.getDrinkStatus = function(): number{
    return this.drink_status;
}


orderSchema.methods.getDishes = function(): string[]{
    return this.food;
}

orderSchema.methods.setDishReady = function(index): void{
    this.food_ready[index] = true;;
}

orderSchema.methods.orderCompleted = function(): boolean{
    for (const dish of this.food_ready) {
        if (!dish) {
            return false;
        }
    }
    return true;
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
