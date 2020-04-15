const User = require('../models/user');
const Contract = require('../models/contract');
const Commit = require('../models/commit');

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Commit: 
 *       properties:
 *         id: 
 *           type: string
 *         contract:
 *           $ref: '#/components/schemas/Contract'
 *         owner:
 *           $ref: '#/components/schemas/User'
 *         duration:
 *           type: number,
 *         whats_done:
 *           type: string
 *         whats_next:
 *           type: string
 *     CommitPartial:
 *       properties:
 *         duration:
 *           type: number
 *         owner:
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *           required:
 *             - id
 *         contract:
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *           required:
 *             - id
 *       required:
 *         - duration
 *         - whats_done
 *         - owner
 */
let controller = {

    getById: async(id, ctx, next) => {
        try{
            ctx.commit = await Commit.findById(id).populate('owner').exec();
            if(!ctx.commit) return ctx.status = 404;
            return next();
        } catch (err) {
            ctx.status = 404;
            ctx.body = {error: 404, message: 'Commit not found'}
        }
    },

    /**
     * @swagger
     * 
     * /commits/:
     *   post:
     *     summary: create a new commit
     *     operationId: createCommit
     *     tags: 
     *       - commits
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/CommitPartial'
     *     responses:
     *       '201':
     *         description: Commit created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Commit'
     *       '400':
     *         description: Invalid request
     *       '401':
     *         description: Unauthorized
     * 
     */
    create: async (ctx) => {
        try{
            const user = await User.findById(ctx.request.body.owner.id);
            console.log(ctx.request.body.contract.id)
            const contract = await Contract.findById(ctx.request.body.contract.id);
            if(!user) {
                console.error('Owner is not defined. Check request body')
                return ctx.status = 400;
            }
            if(!contract) {
                console.error('Contract is not defined. Check request body')
                return ctx.status = 400;
            }
            let commit = new Commit({
                owner: user._id,
                contract: contract._id,
                duration: ctx.request.body.duration,
                whats_done: ctx.request.body.whats_done,
                whats_next: ctx.request.body.whats_next
            });
            commit = await commit.save();
            await Commit.populate(commit, {path: 'owner'});
            ctx.body = commit.toClient();
            ctx.status = 201;
        } catch (err) {
            ctx.status = 400;
        }
    }, 

    /**
     * @swagger
     * 
     * /commits/{commit_id}:
     *   get:
     *     summary: get a commit by id
     *     operationId: readCommit
     *     tags: 
     *       - commits
     *     parameters:
     *       - name: commit_id
     *         in: path
     *         required: true
     *         description: the id of the commit to retrieve
     *         schema: 
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Commit'
     *       '404':
     *         description: Commit not found
     * 
     */
    read: async (ctx) => {
        ctx.body = ctx.commit.toClient();
    },
    
    /**
     * @swagger
     * 
     * /commits/{commit_id}:
     *   put:
     *     summary: update a commit by id
     *     operationId: updateCommit
     *     tags: 
     *       - commits
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: commit_id
     *         in: path
     *         required: true
     *         description: the id of the commit to update
     *         schema: 
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/CommitPartial'
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Commit'
     *       '400':
     *         description: Invalid request
     *       '401':
     *         description: Unauthorized
     *       '404':
     *         description: Commit not found
     * 
     */
    update: async (ctx) => {
        try{
            const user = await User.findById(ctx.request.body.owner.id);
            if(!user) return ctx.body = 400;
            const commit = ctx.commit;
            commit.title = ctx.request.body.title;
            commit.owner = user._id;
            await commit.save();
            await commit.populate('owner').execPopulate();
            ctx.body = commit.toClient();
        } catch (err) {
            ctx.status = 400;
        }
    },
    
    /**
     * @swagger
     * 
     * /commits/{commit_id}:
     *   delete:
     *     summary: delete a commit by id
     *     operationId: deleteCommit
     *     tags: 
     *       - commits
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: commit_id
     *         in: path
     *         required: true
     *         description: the id of the commit to delete
     *         schema: 
     *           type: string
     *     responses:
     *       '204':
     *         description: no content
     *       '404':
     *         description: Commit not found
     *       '401':
     *         description: Unauthorized
     * 
     */
    delete: async (ctx) => {
        await Commit.findOneAndDelete({_id: ctx.commit.id}).exec();
        ctx.status = 204;
    },

    /**
     * @swagger
     * 
     * /commits/:
     *   get:
     *     summary: list all commits
     *     operationId: listCommits
     *     tags: 
     *       - commits
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
     *                 $ref: '#/components/schemas/Commit' 
     * /users/{user_id}/commits/:
     *   get:
     *     summary: list all commits owned by a given user
     *     operationId: listUserCommits
     *     tags: 
     *       - commits
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
     *                 $ref: '#/components/schemas/Commit' 
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
        const commits = await Commit.find(req).populate('owner').exec();
        for(let i = 0; i < commits.length; i++) {
            commits[i] = commits[i].toClient();
        }
        ctx.body = commits;
    },
    
    /**
     * @swagger
     * 
     * /commits/:
     *   delete:
     *     summary: delete all commits
     *     operationId: clearCommits
     *     tags: 
     *       - commits
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
        await Commit.deleteMany().exec();
        ctx.status = 204;
    }
}

module.exports = controller;