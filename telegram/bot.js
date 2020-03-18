require('dotenv').config()
const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome'))

bot.command('newgoal', (ctx) => ctx.reply('Hello'))

// Create new shared goal

// Syntax:
// /newgoal 
// Ask Goal Name 
// Ask Privacy: Shared, Unlisted, Private
// Ask Contract: 10[m|h] [everyday/every monday,thursday/every 1,10]
// Ask Description 

// Returns:
// Goal: Shared Goal Development
// Contract: 1 hour Everyday
// To Share: /contract "Bongiozzo.Shared Goals Development" 1h everyday

    var goal_name;
    var privacy;
    var minutes;
    var occurence {
        daily: Boolean;
        weekdays: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday];
        monthdays: [1..31];
    }
    var description;

    var goal_id = create_goal (user_id, goal_name, privacy, desciption);
    create_contract(user_id, goal_id, minutes, occurence);  

bot.command('editgoals', (ctx) => ctx.reply('Hello'))

// Edit your goals. Other members will be notified. 

// Syntax:
// /editgoals
// Lists all goals as buttons
// After press goal's button show Action buttons
// Edit Name
// Edit Privacy
// Edit Description
// Edit Contract
    
bot.command('contract', (ctx) => ctx.reply('Hello'))

// Join other goal 

// Syntax:
// /contract 
// Ask Goal Name
// Ask contract: 10[m|h] [everyday/every monday,thursday/every 1,10]]

// Returns:
// Goal: Bongiozzo.Shared Goals Development
// Contract: 1 hour Every Tuesday, Thursday 
// To Share: /contract "Bongiozzo.Shared Goal Development" 1h everyday

    var goal_name;
    var duration;
    var occurence;

    goal_id = check_join(user_id, goal_name);
    create_contract(user_id, goal_id, duration, occurence);  

bot.command('commits', (ctx) => ctx.reply('Hello'))

// Returns list of Contracts for new commit

// Syntax:
// /commits
// Lists all active contracts as buttons
// Bongiozzo.Shared Goals Development 1h
// Enter VGIK contest 3h
// Other contracts:
// Singing Practice 2h

    contracts = get_contracts(user_id)
    foreach () {

    }

// Lists contract's Duration as button or propose to enter Duration
// Provide text for What Was Done from last What's Next to Approve or change
// Ask What's Next

// Show all info and ask to approve

// All contracters receive notification about progress for the goal

    var goal_name;
    var duration;
    var whats_done;
    var whats_next;

    goal_id = check_commit(user_id, goal_name);
    commit(user_id, goal_id, duration, whats_done, whats_next)


bot.launch()