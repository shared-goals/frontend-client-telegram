const Goal = require('../models/goal');
const User = require('../models/user');
const Contract = require('../models/contract');

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Goal: 
 *       properties:
 *         id: 
 *           type: string
 *         code:
 *           type: string
 *         title:
 *           type: string
 *         owner:
 *           $ref: '#/components/schemas/User'
 *         contract:
 *           $ref: '#/components/schemas/Contract'
 *         text:
 *           type: string
 *         archived:
 *           type: boolean
 *         completed:
 *           type: boolean
 *     GoalPartial:
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         title:
 *           type: string
 *         owner:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *           required:
 *             - id
 *         contract:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *         text:
 *           type: string
 *         archived:
 *           type: boolean
 *         completed:
 *           type: boolean
 *       required:
 *         - title
 *         - owner
 *         - text
 */
let controller = {

    getById: async(id, ctx, next) => {
        try{
            const findedGoal = await Goal.aggregate([{'$addFields':{strId: {'$toString': '$_id'}}}, {'$match':{strId: new RegExp(id)}}]).exec();
            if (findedGoal !== null) {
                ctx.goal = await Goal.findById(findedGoal[0]._id).populate('owner').exec();
            }
            // ctx.goal.contract = await Contract.find({goal: id}).populate('owner').populate('goal').exec();
            if(!ctx.goal) return ctx.status = 404;
            return next();
        } catch (err) {
            console.error(err)
            ctx.status = 404;
            ctx.body = {error: 404, message: 'Goal not found'}
        }
    },

    /**
     * @swagger
     * 
     * /goals/:
     *   post:
     *     summary: create a new goal
     *     operationId: createGoal
     *     tags: 
     *       - goals
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/GoalPartial'
     *     responses:
     *       '201':
     *         description: Goal created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Goal'
     *       '400':
     *         description: Invalid request
     *       '401':
     *         description: Unauthorized
     * 
     */
    create: async (ctx) => {
        try{
            const user = await User.findById(ctx.request.body.owner.id);
            if(!user) return ctx.status = 400;
            console.log(ctx.request.body.code || '')
            let goal = new Goal({
                code: ctx.request.body.code || '',
                title: ctx.request.body.title,
                owner: user._id,
                text: ctx.request.body.text
            });
            goal = await goal.save();
            await Goal.populate(goal, {path: 'owner'});
            ctx.body = goal.toClient();
            ctx.status = 201;
        } catch (err) {
            ctx.status = 400;
        }
    }, 

    /**
     * @swagger
     * 
     * /goals/{goal_id}:
     *   get:
     *     summary: get a goal by id
     *     operationId: readGoal
     *     tags: 
     *       - goals
     *     parameters:
     *       - name: goal_id
     *         in: path
     *         required: true
     *         description: the id of the goal to retrieve
     *         schema: 
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Goal'
     *       '404':
     *         description: Goal not found
     * 
     */
    read: async (ctx) => {
        console.log('read')
        ctx.body = ctx.goal.toClient();
    },
    
    /**
     * @swagger
     * 
     * /goals/{goal_id}:
     *   put:
     *     summary: update a goal by id
     *     operationId: updateGoal
     *     tags: 
     *       - goals
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: goal_id
     *         in: path
     *         required: true
     *         description: the id of the goal to update
     *         schema: 
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/GoalPartial'
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Goal'
     *       '400':
     *         description: Invalid request
     *       '401':
     *         description: Unauthorized
     *       '404':
     *         description: Goal not found
     * 
     */
    update: async (ctx) => {
        try{
            const user = await User.findById(ctx.request.body.owner.id);
            if(!user) return ctx.body = 400;
            const goal = ctx.goal;
            if (ctx.request.body.code) {
                goal.code = ctx.request.body.code;
            }
            if (ctx.request.body.title) {
                goal.title = ctx.request.body.title;
            }
            goal.owner = user._id;
            await goal.save();
            await goal.populate('owner').execPopulate();
            ctx.body = goal.toClient();
        } catch (err) {
            ctx.status = 400;
        }
    },
    
    /**
     * @swagger
     * 
     * /goals/{goal_id}:
     *   delete:
     *     summary: delete a goal by id
     *     operationId: deleteGoal
     *     tags: 
     *       - goals
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: goal_id
     *         in: path
     *         required: true
     *         description: the id of the goal to delete
     *         schema: 
     *           type: string
     *     responses:
     *       '204':
     *         description: no content
     *       '404':
     *         description: Goal not found
     *       '401':
     *         description: Unauthorized
     * 
     */
    delete: async (ctx) => {
        await Goal.findOneAndDelete({_id: ctx.goal.id}).exec();
        ctx.status = 204;
    },

    /**
     * @swagger
     * 
     * /goals/:
     *   get:
     *     summary: list all goals
     *     operationId: listGoals
     *     tags: 
     *       - goals
     *     parameters:
     *       - name: owner_id
     *         in: query
     *         description: the id of the owner
     *         schema: 
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items: 
     *                 $ref: '#/components/schemas/Goal' 
     * /users/{user_id}/goals/:
     *   get:
     *     summary: list all goals owned by a given user
     *     operationId: listUserGoals
     *     tags: 
     *       - goals
     *     parameters:
     *       - name: user_id
     *         in: path
     *         required: true
     *         description: the id of the owner
     *         schema: 
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items: 
     *                 $ref: '#/components/schemas/Goal' 
     *       '404':
     *         description: User not found
     * 
     */
    list: async (ctx) => {
        const req = {};
        if (ctx.query.owner_id) {
            try{
                const user = await User.findById(ctx.query.owner_id).exec();
                req.owner = user._id;
            } catch (err) {
                req.owner = null;
            }
        }
        if (ctx.user) req.owner = ctx.user._id;
        const goals = await Goal.find(req).populate('owner').exec();
        for(let i = 0; i < goals.length; i++) {
            goals[i] = goals[i].toClient();
        }
        ctx.body = goals;
    },
    
    /**
     * @swagger
     * 
     * /goals/:
     *   delete:
     *     summary: delete all goals
     *     operationId: clearGoals
     *     tags: 
     *       - goals
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '204':
     *         description: no content
     *       '401':
     *         description: Unauthorized
     * 
     */
    clear: async (ctx) => {
        await Goal.deleteMany().exec();
        ctx.status = 204;
    },
    
    /**
     * @swagger
     *
     * /goals/{goal_id}/contract/:
     *   get:
     *     summary: list contract owned by a given user depends to given goal
     *     operationId: getGoalContract
     *     tags:
     *       - contracts
     *     parameters:
     *       - name: goal_id
     *         in: path
     *         required: true
     *         description: the id of the goal
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contract'
     *       '404':
     *         description: Goal not found
     *
     */
    getContract: async (ctx) => {
        const req = {};
        ctx.query.goal_id = ctx.request.url.replace(/[^\d]/, '')
        if (ctx.query.goal_id) {
            try{
                const goal = await Goal.findById(ctx.query.goal_id).exec();
                req.goal = goal._id;
            } catch (err) {
                // console.error(err)
                req.goal = null;
            }
        }
        if (ctx.goal) req.goal = ctx.goal._id;
        const contract = await Contract.find(req).populate('owner').populate('goal').exec();
        ctx.body = contract.length > 0 ? contract[0].toClient() : {};
    }
}

module.exports = controller;