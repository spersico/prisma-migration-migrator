## Description

A way to use [Knex's migration engine](https://knexjs.org/guide/migrations.html) to run migrations, while keeping Prisma as the source of truth. 
This way, you get the auto generation of SQL migrations, while gaining ability to use JS to do migrations. 

## So the flow would be:

1. You set up this thing (see below)
2. You run `prisma migrate dev --create-only` to create a new migration, but don't run it
3. You run `yarn prisma-to-knex` to convert the prisma migration to a knex migration. 
  
    The knex migration will be right next to the prisma migration, contain all the SQL of the original, and you can modify it however you like. It's a knex migration, do what you want.
4. You run `knex migrate:latest` to run the knex migrations. It will ignore the migrations already run by prisma or knex.
5. ??
5. Profit!


## Set up
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
    
    **Congrats! You now have the power to run sorted, JS-powered migrations!**

4. **Extra Step:** After running a migration from knex the first time, you need to add knex's migration history table to the prisma schema. This way, prisma will ignore the tables knex uses to track migration history. To do this, copy the following to your prisma schema:
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
  - You have Knex's full power:
    - You can now use JS to do migrations.
    - You have access to all the knex plugins and features.
    - You can also use the `up` and `down` commands to handle rollbacks!
  
    Check [knexjs' official docs](https://knexjs.org/guide/migrations.html) for more details on how to use knex migrations


## TODO
- Figure out if the migrations can be run in a way that prisma detects it doesn't need to make other changes (figure out if on top of the knex history table, the migration can be modified to update the prisma history table). This would enable that prisma never notices that it's not actually running the migrations. See: https://github.com/prisma/prisma/blob/main/packages/migrate/src/Migrate.ts. Maybe I can use that to my advantage.
- Improve the docs!
- Add a BUNCH more tests:
  -  Ensure that it really filters the Prisma migrations every time.
- Publish this thing
