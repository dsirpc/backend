import mongoose = require('mongoose');

export interface Table extends mongoose.Document{
    readonly _id: mongoose.Schema.Types.ObjectId,
    seats: number,
    status: boolean,
    setStatus: ()=>void
}

var tableSchema = new mongoose.Schema({
    seats: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    status: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    }
})

tableSchema.methods.setStatus = function(){
    this.status = !this.status;
}

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