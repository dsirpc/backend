import mongoose = require('mongoose');

export interface Table extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    seats: number
}

var tableSchema = new mongoose.Schema({
    seats: {
        type: mongoose.SchemaTypes.Number,
        required: true
    }
})

export function getSchema() { return tableSchema; }

var tableModel;

export function getModel() : mongoose.Model< Table >  { // Return Model as singleton
    if( !tableModel ) {
        tableModel = mongoose.model('Table', getSchema() )
    }
    return tableModel;
}

export function newTable( data ): Table {
    var _tablemodel = getModel();
    var table = new _tablemodel( data );
    return table;
}