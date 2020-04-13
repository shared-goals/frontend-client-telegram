const Mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');

const commitSchema = new Mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        owner: {
            type: Number,
            required: true,
            ref: 'User'
        },
    }, 
    {timestamps: true}
);

commitSchema.method('toClient', function() {
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

// commitSchema.plugin(AutoIncrement.plugin, {
//     model: 'Commit',
//     startAt: 1,
// });

Mongoose.model('Commit', commitSchema);

module.exports = Mongoose.model('Commit');