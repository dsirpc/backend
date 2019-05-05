import mongoose = require('mongoose');

export interface User extends mongoose.Document {
    readonly _id: mongoose.Schema.Types.ObjectId,
    username: string,
    //mail: string,
    roles: string[],
    salt: string,
    digest: string,
    setPassword: (pwd:string)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasAdminRole: ()=>boolean,
    setAdmin: ()=>void,
    hasModeratorRole: ()=>boolean,
    setModerator: ()=>void,
}

var userSchema = new mongoose.Schema( {
    username: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    /*mail: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },*/
    roles:  {
        type: [mongoose.SchemaTypes.String],
        required: true 
    },
    salt:  {
        type: mongoose.SchemaTypes.String,
        required: false 
    },
    digest:  {
        type: mongoose.SchemaTypes.String,
        required: false 
    }
});

export function getSchema() { return userSchema; }

var userModel;  // This is not exposed outside the model
export function getModel() : mongoose.Model< User >  { // Return Model as singleton
    if( !userModel ) {
        userModel = mongoose.model('User', getSchema() )
    }
    return userModel;
}

export function newUser( data ): User {
    var _usermodel = getModel();
    var user = new _usermodel( data );
    return user;
}