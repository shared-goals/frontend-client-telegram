const Mongoose = require('mongoose');
const AutoIncrement = require('mongoose-auto-increment');

const contractSchema = new Mongoose.Schema(
    {
        goal: {                 // Цель, к которой прикреплен контракт
            type: Number,
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
        week_days: {            // Дни недели
            type: Array
        },
        month_days: {           // Дни месяца
            type: Array
        },
        next_run: {             // Дни месяца
            type: Date,
            default: new Date().toJSON().slice(0,10)
        },
        last_run: {             // Дни месяца
            type: Date,
            default: new Date().toJSON().slice(0,10)
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
    obj.goal = {
        id: obj.goal._id
    }

    // Delete fields
    delete obj._id;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;

    return obj;
});
//
// contractSchema.method('getByGoalId', async function(goal_id) {
//
//     return {t: 5};
// });

contractSchema.plugin(AutoIncrement.plugin, {
    model: 'Contract',
    startAt: 1,
});

Mongoose.model('Contract', contractSchema);

module.exports = Mongoose.model('Contract');