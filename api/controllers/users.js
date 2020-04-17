const User = require('../models/user');
const Bcrypt = require('bcrypt');

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     User: 
 *       type: object
 *       properties:
 *         id: 
 *           type: number
 *         email:
 *           type: string
 *         language:
 *           type: string
 *     UserPartial:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         language:
 *           type: string
 *       required:
 *         - id
 *     UserUnauthorized:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *       required:
 *         - email
 *         - password
 *     UsersArray:
 *       type: array
 *       items: 
 *         $ref: '#/components/schemas/User' 
 */
let controller = {

    getById: async(id, ctx, next) => {
        try{
            ctx.user = await User.findById(id).exec();
            if(!ctx.user) return ctx.status = 404;
            return next();
        } catch (err) {
            ctx.status = 404;
            ctx.body = {error: 404, message: 'User not found'}
        }
    },
    
    /**
     * @swagger
     *
     * /users/email/{user_email}:
     *   get:
     *     summary: get a user by email
     *     operationId: readUserByEmail
     *     tags:
     *       - users
     *     parameters:
     *       - name: user_email
     *         in: path
     *         required: true
     *         description: the email of the user to retrieve
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '404':
     *         description: User not found
     *
     */
    getByEmail: async (ctx, next) => {
        let email = decodeURIComponent(ctx.request.url.replace(/\/users\/email\//, ''))
        try{
            ctx.user = await User.findOne({email: email}).exec();
            console.log(ctx.user)
            if(!ctx.user) {
                ctx.body = {error: 404, message: 'User not found'}
                return ctx.status = 404;
            }
            ctx.body = ctx.user.toClient();
        } catch (err) {
            ctx.status = 404;
            ctx.body = {error: 404, message: 'User not found'}
        }
    },
    
    /**
     * @swagger
     *
     * /users/search/{text}:
     *   get:
     *     summary: search a gidev text in username or email of users
     *     operationId: readUserByEmail
     *     tags:
     *       - searchUser
     *     parameters:
     *       - name: text
     *         in: path
     *         required: true
     *         description: the text suggested in email or username of the user to retrieve
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '404':
     *         description: User not found
     *
     */
    search: async (ctx) => {
        const req = {}
        ctx.query = controller.getParamsFromQuery('/users/search/{text}', ctx.request.url)
        console.log(ctx.query)
        if (ctx.query && ctx.query.text) {
            req.email = new RegExp(ctx.query.text, 'i')
        }

        const users = await User.find(req).exec()
        if(!users) {
            ctx.body = JSON.stringify({error: 404, message: 'User not found'})
            return ctx.status = 404
        }
        for(let i = 0; i < users.length; i++) {
            users[i] = users[i].toClient()
        }
        ctx.body = users
    },
    
    /**
     * @swagger
     *
     * /users/{user_id}:
     *   get:
     *     summary: get a user by id
     *     operationId: readUser
     *     tags:
     *       - users
     *     parameters:
     *       - name: user_id
     *         in: path
     *         required: true
     *         description: the id of the user to retrieve
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '404':
     *         description: User not found
     *
     */
    read: async (ctx) => {
        ctx.body = ctx.user.toClient();
    },

    /**
     * @swagger
     * 
     * /users/{user_id}:
     *   put:
     *     summary: update a user by id
     *     operationId: updateUser
     *     tags: 
     *       - users
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: user_id
     *         in: path
     *         required: true
     *         description: the id of the user to update
     *         schema: 
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *             $ref: '#/components/schemas/UserPartial'
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       '404':
     *         description: User not found
     *       '400':
     *         description: Invalid request body
     *       '401':
     *         description: Unauthorized
     * 
     */
    update: async (ctx) => {
        const user = ctx.user
        Object.keys(ctx.request.body).forEach(async(key) => {
            'use strict'
            if (key === 'password') {
                user.password = await Bcrypt.hash(ctx.request.body.password, 10)
            } else {
                user[key] = ctx.request.body[key]
            }
        })
        await user.save()
        ctx.body = user.toClient()
    },
    
    /**
     * @swagger
     * 
     * /users/{user_id}:
     *   delete:
     *     summary: delete a user by id
     *     operationId: deleteUser
     *     tags: 
     *       - users
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: user_id
     *         in: path
     *         required: true
     *         description: the id of the user to delete
     *         schema: 
     *           type: string
     *     responses:
     *       '204':
     *         description: User deleted
     *       '404':
     *         description: User not found
     *       '401':
     *         description: Unauthorized
     *       '409':
     *         description: Conflict with dependent resources
     * 
     */
    delete: async (ctx) => {
        const n = await Book.countDocuments({owner: ctx.user._id}).exec();
        if(n > 0) return ctx.status = 409;
        await User.findByIdAndDelete(ctx.user._id).exec();
        ctx.status = 204;
    },
    
    /**
     * @swagger
     * 
     * /users/:
     *   get:
     *     summary: list all users
     *     operationId: listUsers
     *     tags: 
     *       - users
     *     responses:
     *       '200':
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UsersArray'
     * 
     */
    list: async (ctx) => {
        const users = await User.find({}).exec();
        for(let i = 0; i < users.length; i++) {
            users[i] = users[i].toClient();
        }
        ctx.body = users;
    },
    
    /**
     * @swagger
     * 
     * /users/:
     *   delete:
     *     summary: delete all users
     *     operationId: clearUsers
     *     tags: 
     *       - users
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       '204':
     *         description: Users deleted
     *       '401':
     *         description: Unauthorized
     *       '409':
     *         description: Conflict with dependent resources
     * 
     */
    clear: async (ctx) => {
        const n = await Book.countDocuments().exec();
        if(n > 0) return ctx.status = 409;
        await User.deleteMany().exec();
        ctx.status = 204;
    },
    
    /**
     *
     * @param pattern
     * @param url
     * @returns {any}
     */
    getParamsFromQuery: (pattern, url) => {
        'use strict'
        
        const re = new RegExp(pattern.replace(/\{([^\}]+)\}/g, '(?<$1>[^\/]+)'))
        const matches = re.exec(url)
        return matches !== null ? matches.groups : null
    }
}

module.exports = controller;