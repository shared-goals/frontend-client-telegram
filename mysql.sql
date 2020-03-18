create table users (
    guid user_id,
    varchar(255) user_name

    -- Telegram Passport as universal username?
    -- Facebook
    -- VK
    -- Email
    -- LinkedIn
);

create table goals (
    [primary key]
    guid goal_id,
    [unique]
    guid user_id,
    varchar(255) goal_name,
    enum privacy, -- private, unlisted, shared
    text description,
    boolean archived,
    boolean completed,
    timestamp created 
);
 
create table contracts (
    guid contract_id,
    guid goal_id,
    guid user_id,
    int duration,
    int everyday,
    int everyweek,
    int everymonth,
    varchar weekdays,
    varchar monthdays,
    date next_run,
    date last_run
);

create table commits (
    guid user_id,
    guid contract_id,
    int duration,
    timestamp created,
    text whats_done,
    text whats_next
);