const Contract = require('../models/contract');
const User = require('../models/user');
const Goal = require('../models/goal');

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Contract: 
 *       properties:
 *         id: 
 *           type: number
 *         goal:
 *           $ref: '#/components/schemas/Goal'
 *         owner:
 *           $ref: '#/components/schemas/User'
 *         duration:
 *           type: number
 *         week_days:
 *           type: array
 *           "items": {
 *              type: string
 *           }
 *         month_days:
 *           type: array
 *           "items": {
 *              type: number
 *           }
 *         next_run:
 *           type: string
 *           format: date
 *         last_run:
 *           type: string
 *           format: date
 *     ContractPartial:
 *       properties:
 *         id:
 *           type: number
 *         goal:
 *           type: object
 *           properties: 
 *             id: 
 *               type: number
 *           required: 
 *             - id
 *         owner:
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *           required:
 *             - id
 *         duration:
 *           type: number
 *         week_days:
 *           type: array
 *           "items": {
 *              type: string
 *           }
 *         month_days:
 *           type: array
 *           "items": {
 *              type: number
 *           }
 *         next_run:
 *           type: string
 *           format: date
 *         last_run:
 *           type: string
 *           format: date
 *       required:
 *         - goal
 *         - owner
 *         - duration
 */
let controller = {

    getById: async(id, ctx, next) => {
        try{
            ctx.contract = await Contract.findById(id).populate('owner').populate('goal').exec();
            console.log('--==', ctx.contract, '==--')
            if(!ctx.contract) return ctx.status = 404;
            return next();
        } catch (err) {
            console.error(err)
            ctx.status = 404;
        }
    },

    /**
     * @swagger
     * 
     * /contracts/:
     *   post:
     *     summary: create a new contract
     *     operationId: createContract
     *     tags: 
     *       - contracts
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/ContractPartial'
     *     responses:
     *       '201':
     *         description: Contract created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contract'
     *       '400':
     *         description: Invalid request
     *       '401':
     *         description: Unauthorized
     * 
     */
    create: async (ctx) => {
        try{
            const user = await User.findById(ctx.request.body.owner.id);
            const goal = await Goal.findById(ctx.request.body.goal.id);
            if(!user) {
                console.error('Owner is not defined. Check request body')
                return ctx.status = 400;
            }
            if(!user) {
                console.error('Goal is not defined. Check request body')
                return ctx.status = 400;
            }
            let contract = new Contract({
                owner: user._id,
                goal: goal._id,
                duration: ctx.request.body.duration,
                week_days: ctx.request.body.week_days,
                month_days: ctx.request.body.month_days
            });
            contract = await contract.save();
            await Contract.populate(contract, {path: 'owner'});
            ctx.body = contract.toClient();
            ctx.status = 201;
        } catch (err) {
            console.error(err)
            ctx.status = 400;
        }
    }, 

    /**
     * @swagger
     * 
     * /contracts/{contract_id}:
     *   get:
     *     summary: get a contract by id
     *     operationId: readContract
     *     tags: 
     *       - contracts
     *     parameters:
     *       - name: contract_id
     *         in: path
     *         required: true
     *         description: the id of the contract to retrieve
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
     *         description: Contract not found
     * 
     */
    read: async (ctx) => {
        ctx.body = ctx.contract.toClient();
    },
    
    /**
     * @swagger
     * 
     * /contracts/{contract_id}:
     *   put:
     *     summary: update a contract by id
     *     operationId: updateContract
     *     tags: 
     *       - contracts
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: contract_id
     *         in: path
     *         required: true
     *         description: the id of the contract to update
     *         schema: 
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/ContractPartial'
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Contract'
     *       '400':
     *         description: Invalid request
     *       '401':
     *         description: Unauthorized
     *       '404':
     *         description: Contract not found
     * 
     */
    update: async (ctx) => {
        try{
            const user = await User.findById(ctx.request.body.owner.id);
            if(!user) return ctx.body = 400;
            const contract = ctx.contract;
            contract.title = ctx.request.body.title;
            contract.owner = user._id;
            await contract.save();
            await contract.populate('owner').execPopulate();
            ctx.body = contract.toClient();
        } catch (err) {
            console.error(err)
            ctx.status = 400;
        }
    },
    
    /**
     * @swagger
     * 
     * /contracts/{contract_id}:
     *   delete:
     *     summary: delete a contract by id
     *     operationId: deleteContract
     *     tags: 
     *       - contracts
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: contract_id
     *         in: path
     *         required: true
     *         description: the id of the contract to delete
     *         schema: 
     *           type: string
     *     responses:
     *       '204':
     *         description: no content
     *       '404':
     *         description: Contract not found
     *       '401':
     *         description: Unauthorized
     * 
     */
    delete: async (ctx) => {
        await Contract.findOneAndDelete({_id: ctx.contract.id}).exec();
        ctx.status = 204;
    },

    /**
     * @swagger
     * 
     * /contracts/:
     *   get:
     *     summary: list all contracts
     *     operationId: listContracts
     *     tags: 
     *       - contracts
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
     *                 $ref: '#/components/schemas/Contract' 
     * /users/{user_id}/contracts/:
     *   get:
     *     summary: list all contracts owned by a given user
     *     operationId: listUserContracts
     *     tags: 
     *       - contracts
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
     *                 $ref: '#/components/schemas/Contract' 
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
        const contracts = await Contract.find(req).populate('owner').exec();
        for(let i = 0; i < contracts.length; i++) {
            contracts[i] = contracts[i].toClient();
        }
        ctx.body = contracts;
    },
    
    /**
     * @swagger
     * 
     * /contracts/:
     *   delete:
     *     summary: delete all contracts
     *     operationId: clearContracts
     *     tags: 
     *       - contracts
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
        await Contract.deleteMany().exec();
        ctx.status = 204;
    },
    
    /**
     * @ swagger
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
     *
    getByGoalId: async (ctx) => {
        const req = {};
        console.log(ctx)
        if (ctx.query.goal_id) {
            try{
                const goal = await Goal.findById(ctx.query.goal_id).exec();
                console.log(goal)
                req.goal = goal._id;
            } catch (err) {
                console.error(err)
                req.goal = null;
            }
            console.log(req.goal)
        }
        if (ctx.user) req.goal = ctx.goal._id;
        const contracts = await Contract.find(req).populate('owner').populate('goal').exec();
        for(let i = 0; i < contracts.length; i++) {
            contracts[i] = contracts[i].toClient();
        }
        ctx.body = contracts;
    }*/
}

module.exports = controller;