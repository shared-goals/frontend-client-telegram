const Mongoose = require('mongoose');
// const AutoIncrement = require('mongoose-auto-increment');

const commitSchema = new Mongoose.Schema(
    {
        contract: {             // Контракт, к которой прикреплен коммит
            type: String,
            required: true,
            ref: 'Goal'
        },
        owner: {                // Автор контракта
            type: Number,
            required: true,
            ref: 'User'
        },
        duration: {             // Длительность в минутах
            type: Number,
            required: true
        },
        whats_done: {           // Что сделано
            type: String
        },
        whats_next: {           // Что дальше делать
            type: String
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
    obj.contract = {
        id: obj.contract ? obj.contract._id : null
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