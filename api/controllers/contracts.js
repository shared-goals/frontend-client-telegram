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
            const goal = await Goal.findById(ctx.request.body.goal.id);
            if(!goal) return ctx.body = 400;
    
            const user = await User.findById(ctx.request.body.owner.id);
            if(!user) return ctx.body = 400;

            const contract = ctx.contract;
            
            // Object.keys(contract).forEach((key) => {
            //     'use strict'
            //
            //     if (!key.match(/^_/)) {
            //         contract[key] = ctx.request.body[key]
            //     }
            // })
    
            contract.duration = ctx.request.body.duration
            contract.week_days = ctx.request.body.week_days || []
            contract.month_days = ctx.request.body.month_days || []
            
            contract.goal = goal._id;
            contract.owner = user._id;
    
            await contract.save();
            await contract.populate('owner').populate('goal').execPopulate();
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
        const contracts = await Contract.find(req).populate('owner').populate('goal').exec();
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
     * @swagger
     *
     * /contracts/{goal_id}/{owner_id}:
     *   get:
     *     summary: get a contract of given user to a given goal
     *     operationId: getContractByGoalAndOwner
     *     tags:
     *       - contracts
     *     parameters:
     *       - name: goal_id
     *         in: path
     *         required: true
     *         description: the id of the goal of contract to retrieve
     *         schema:
     *           type: string
     *       - name: owner_id
     *         in: path
     *         required: true
     *         description: the id of the user of contract to retrieve
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
    getByGoalAndOwner: async (ctx) => {
        const req = {}
        ctx.query = controller.getParamsFromQuery('/contracts/{goal_id}/{owner_id}', ctx.request.url)

        if (ctx.query.goal_id) {
            try{
                const goal = await Goal.findById(ctx.query.goal_id).exec()
                req.goal = goal._id
            } catch (err) {
                req.goal = null
            }
        }
        if(!req.goal) {
            console.error('Goal is not defined. Check request body')
            return ctx.status = 400
        }
        if (ctx.query.owner_id) {
            try{
                const user = await User.findById(ctx.query.owner_id).exec()
                req.owner = user._id
            } catch (err) {
                req.owner = null
            }
        }
        if(!req.owner) {
            console.error('Goal is not defined. Check request body')
            return ctx.status = 400
        }

        ctx.body = (await Contract.findOne(req).populate('owner').populate('goal').exec()).toClient();
    },
    
    /**
     *
     * @param pattern
     * @param url
     * @returns {any}
     */
    getParamsFromQuery: (pattern, url) => {
        'use strict'
    
        const re = new RegExp(pattern.replace(/\{([^\}]+)\}/g, '(?<$1>\\d+)'))
        const matches = re.exec(url)
        return matches !== null ? matches.groups : null
    }
}

module.exports = controller;