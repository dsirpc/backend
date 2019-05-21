import mongoose = require('mongoose');

export interface Table extends mongoose.Document{
    number_id: number,
    seats: number,
    status: boolean,
    setStatus: ()=>void,
    getStatus: ()=>boolean
}

var tableSchema = new mongoose.Schema({
    number_id: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    seats: {
        type: mongoose.SchemaTypes.Number,
        required: true
    },
    status: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    }
})

tableSchema.methods.setStatus = function(): void{
    this.status = !this.status;
}

tableSchema.methods.getStatus = function(): boolean{
    return this.status;
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