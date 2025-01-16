# Prisma Migration Migrator

A way to use [Knex's migration engine](https://knexjs.org/guide/migrations.html) to run migrations, while keeping Prisma as the source of truth. 

This way, you get the ORM and the auto generation of DDL SQL from Prisma, while gaining the power of Knex's migration engine to run them.

You can use Prisma to generate the migration SQL, but you never run the migrations with Prisma. 
Instead, from then on, the prisma-generated SQL DDL gets added into Knex migrations.

## How to use it
READ THIS FIRST! This package doesn't need to be installed. It's a one-time setup script that will set up everything for you.

1. **First, make sure you've got all the dependencies you need**:
  - Knex is obviously required, dotenv is recommended: 
    ```bash
    npm install knex dotenv
    ```
  - Optionally, to get the augmented knex migrations, you will need this other one: 
    ```bash
    npm install -D prisma-diff-to-knex-migration
    ```
    
    > Note: You can use other package managers, like yarn or pnpm.
2. **Run the migration script. You don't need to install this package!!** 
    ```bash
    npx prisma-migration-migrator
    ```

    **This will set up everything for you, and explain during the process what it's doing.**
  
    **The script will:**
    1. Create a pre-configured `knexfile.mjs` in the root of your project (if it doesn't exist).
    2. Add the necessary models to the prisma schema to ignore the knex migration history tables.
    3. Add a `create-migration` script to your `package.json` that will create knex migrations and then adds Prisma's SQL (setting the new flow of migration generation for you). (This is where you will use the devDependency `prisma-diff-to-knex-migration` to update the knex migrations with the Prisma SQL.)
    4. Run the script to convert the existing prisma migrations to knex migrations for the first time.
    5. Create and sync the knex migration history table with the prisma migration history table (so knex only runs the migrations that were not run by prisma).
    
3. **Setup done!**. You can use the `create-migration` script to create new migrations, and then run `knex migrate:latest` to run them. 
From this point on, you don't need this migrator script, and you can use the `prisma-diff-to-knex-migration` package to update the knex migrations with the Prisma SQL, if you want.

## Usage
Test it out!. 
Add a column or something in the prisma schema, run the `create-migration` script, and then run `knex migrate:latest`. 
You should see the new column in the database!

That's it!
  - You can now use JS + SQL to do migrations.
  - You have access to all the knex plugins and features. You've got the complete power of knex at your disposal.
  - You can also use the `up` and `down` commands to handle rollbacks!
  - You still have the power of prisma to generate the SQL migrations for you, and the ORM to interact with the database, and the schema to define the database structure.

Check [knexjs' official docs](https://knexjs.org/guide/migrations.html) for more details on how to use knex migrations.


## Deeper Explanation of the setup
### Prisma schema changes
The script will append the following models to your prisma schema (if they don't exist):
  ```prisma
  model knex_migrations {
    @@ignore
    id           Int      @id @default(autoincrement())
    name         String
    batch        Int
    migration_time DateTime
  }

  model knex_migrations_lock {
    @@ignore
    id           Int @id
    is_locked    Boolean
  }
  ```
This way, prisma will ignore the tables knex uses to track migration history, and won't complain about database drift.
    
### Knexfile

The script will create a `knexfile.mjs` in the root of your project. 
This file will be pre-configured to work with prisma, will use the `dotenv` package to load the environment variables, and will use .mjs files for the migrations.
Note: You can change the file to use .js or .ts files if you want. I didn't test it with .ts files, because I found that knex support for typescript migrations is kinda difficult to set up sometimes. But you can try it if you want.

### Prisma to knex migrations
The script will convert the existing prisma migrations to knex migrations. It will do this by copying the SQL files generated by prisma to the knex migration files.
It will then sync the knex migration history table with the prisma migration history table, so knex only runs the migrations that were not run by prisma before.

### Create-migration script

The script will add a `create-migration` script to your `package.json`. This is the part where you will use the `prisma-diff-to-knex-migration` package to update the knex migrations with the Prisma SQL. The script is not strictly necessary, but it will make your life easier, by generating a starting SQL sentence for you, based on the difference between the prisma schema and the database. You can check the package's documentation for more details on how to use it (it's pretty simple).

> I did this in a separate package to keep everything modular and to avoid adding unnecessary dependencies to your project. I don't want to force you to keep this package installed after the setup is done.
  
## Motivation

**I just got frustrated with Prisma migrations.**

I wanted my trusty `up`/`down` pattern for migrations/rollbacks, I wanted to use JS (maybe even TS!), and not just SQL, I wanted out. Knex was there (though Sequelize was also an option, I just thought that Knex, being a query builder, would be more flexible).

I wanted to use it, but it was a pain to set up alongside Prisma.

So I made this to handle the migration, and also [this other package](https://github.com/spersico/prisma-diff-to-knex-migration), for the **nice** part of Prisma migrations: the SQL generation.
