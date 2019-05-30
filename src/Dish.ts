import mongoose = require('mongoose');

export interface Dish extends mongoose.Document {
    name: string,
    price: number,
    ingredients: string[],
    type: string
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
    },
    type: {
        type: mongoose.SchemaTypes.String,
        required: true
    }
});

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