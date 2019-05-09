import mongoose = require('mongoose');

export interface Dish extends mongoose.Document {
    name: string,
    price: number,
    ingredients: string[],
    setPrice: (price:number)=>void
}

var dishSchema = new mongoose.Schema({
    name: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    price: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    ingredients: {
        type: [mongoose.SchemaTypes.String],
        required: true
    }
});

dishSchema.methods.setPrice = function(price:number): void{
    this.price = price;
}

export function getSchema(){ return dishSchema; };

var dishModel;

export function getModel(): mongoose.Model<Dish> { // Return Model as singleton
    if (!dishModel) {
        dishModel = mongoose.model('Dish', getSchema())
    }
    return dishModel;
}

export function newDish(data): Dish {
    var _dishmodel = getModel();
    var dish = new _dishmodel(data);
    return dish;
}