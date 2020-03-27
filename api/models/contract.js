const Mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');

const contractSchema = new Mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        owner: {
            type: Number,
            required: true,
            ref: 'Goal'
        },
    }, 
    {timestamps: true}
);

contractSchema.method('toClient', function() {
    var obj = this.toObject();

    //Rename fields
    obj.id = obj._id;
    obj.owner = {
        id: obj.owner._id,
        email: obj.owner.email,
    }

    // Delete fields
    delete obj._id;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;

    return obj;
});

contractSchema.plugin(AutoIncrement.plugin, {
    model: 'Contract',
    startAt: 1,
});

Mongoose.model('Contract', contractSchema);

module.exports = Mongoose.model('Contract');