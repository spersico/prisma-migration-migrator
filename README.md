## Description

A way to use [Knex's migration engine](https://knexjs.org/guide/migrations.html) to run migrations, while keeping Prisma as the source of truth. 

This way, you get the ORM and the auto generation of DDL SQL from Prisma, while gaining the power of Knex's migration engine to run them.

You can use Prisma to generate the migration SQL, but you never run the migrations with Prisma. Instead, from then on, the prisma-generated SQL DDL gets added into Knex migrations.

## Usage (after setting it up):

You can do 2 things:
1. You can migrate the existing prisma migrations to knex migrations. This will convert every prisma migration, to a knex migration, and set knex up



**The flow them, would for updating the schema would then look like the following:**

0. You update the prisma schema (say, add a field to a table).
1. You run `npx knex migrate:make 'example_migration_name' | npx prisma-diff-to-knex` to create a new sql migration based of the schema.
3. You run `knex migrate:latest` to run the knex migrations. It will ignore the migrations already run by prisma.
4. ??
5. Profit!




## Set up
The setup was kinda complex, so I made a script to automate it:
The script will:
- Create a `knexfile.mjs` in the root of your project.
- Add a `create-migration` script to your `package.json` that will create a prisma migration and then convert it to a knex migration (the new flow of migration generation).
- Add the necessary tables to the prisma schema to ignore the knex migration history tables.
- Add the migration files for the prisma schema update 

*It's a bit involved, but I think it's worth it.*

1. **First, install the dependencies**: `npm install prisma-migration-migrator knex`  
    > Note: You can use other package managers, like yarn or pnpm.
2. **Next, create a `knexfile.mjs` in the root of your project.**
  
    Provide the credentials necessary to run migrations. Check [knexjs' official docs](https://knexjs.org/guide/migrations.html#knexfile-js) for more details on how to set up the knexfile. 
    
    A simple, but working version of a `knexfile.mjs` looks like this:
    ```js   
    import { knexFilePrismaAdapter } from 'prisma-migration-migrator'
    const baseConfig = {
      client: 'pg',
      connection: process.env.DATABASE_URL, 
      // you can copy the connection string from the prisma schema!
      
      // ... other optional knex configs
    }
    
    export default knexFilePrismaAdapter(baseConfig)
    ```

3. **Create a new script in your `package.json` to create migrations.** It should look like this:
    ```json
    {
      "scripts": {
        "create-migration": "prisma migrate dev --create-only && yarn prisma-to-knex"
      }
    }
    ```
    This script will create a new migration in prisma (but **not** run it) and then convert it to a knex migration. This way, you can create the prisma migrations, and then convert them to knex migrations. Each migration will have a `migration.mjs` file next to the sql migration, that you can modify however you like. 
    
    Now if you run `npx knex migrate:latest`, knex will run the migrations that were not run by prisma.
    
    **Congrats! You now have the power to run Knex-powered migrations!**

4. **Extra Step:** After running a migration from knex for the first time, you need to add knex's migration history table to the prisma schema. This way, prisma will ignore the tables knex uses to track migration history. To do this, copy the following to your prisma schema:
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
    
## Usage
Test it out!. 
Add a column or something in the prisma schema, run the `create-migration` script, and then run `knex migrate:latest`. 
You should see the new column in the database!

That's it!
  - You can now use JS + SQL to do migrations.
  - You have access to all the knex plugins and features.
  - You can also use the `up` and `down` commands to handle rollbacks!
  - You still have the power of prisma to generate the SQL migrations for you, and the ORM to interact with the database, and the schema to define the database structure.

Check [knexjs' official docs](https://knexjs.org/guide/migrations.html) for more details on how to use knex migrations

## How it works
`TODO - For now, check the code 🤷🏻‍♂️`

## Notes:
  - The `prisma-to-knex` script will only convert the migrations that were not converted before. This way, you can run the script multiple times, and it will only convert the new migrations.
  - The `knexFilePrismaAdapter` is a helper function that adapts the knexfile to work with prisma. It will add the necessary tables to the knex migration history table, and will filter the migrations that were already run by prisma. This way, knex will only run the migrations that were not run by prisma (or itself) before. The Prisma ones will be ignored by the adapter, and the knex ones... well, that's the knex_migrations table for!.

## TODO
- Figure out if the migrations can be run in a way that prisma detects it doesn't need to make other changes (figure out if on top of the knex history table, the migration can be modified to update the prisma history table). This would enable that prisma never notices that it's not actually running the migrations. See: https://github.com/prisma/prisma/blob/main/packages/migrate/src/Migrate.ts. Maybe I can use that to my advantage.
- Improve the docs!
- Add a BUNCH more tests:
  -  Ensure that it really filters the Prisma migrations every time.
- Publish this thing
