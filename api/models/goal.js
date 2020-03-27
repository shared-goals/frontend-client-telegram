const Mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');

const goalSchema = new Mongoose.Schema(
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
        text: {
            type: String,
            required: true,
        },
        archived: {
            type: Boolean,
            default: false,
        },
        completed: {
            type: Boolean,
            default: false,
        }
    },
    {timestamps: true}
);

goalSchema.method('toClient', function() {
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

goalSchema.plugin(AutoIncrement.plugin, {
    model: 'Goal',
    startAt: 1,
});

Mongoose.model('Goal', goalSchema);

module.exports = Mongoose.model('Goal');