# Prisma Migration Migrator

**Warning: This is a side project for me. I haven't tested this on a production environment. I welcome issues and PRs, though!**

**DB Compatibility: I developed this with PostgreSQL in mind, and I tested it with success with MySQL 8.X. The DDL generation didn't work that well on MySQL5 and SQLite. The migration still works though, but bear this warning in mind, if you've got issues on those DBs**

Helps you set up [Knex's migration engine](https://knexjs.org/guide/migrations.html) to run migrations, while keeping Prisma as the source of truth. 

This way, you get the ORM and the auto generation of DDL SQL from Prisma, while gaining the power of Knex's migration engine to run them.

You can use Prisma to generate the migration SQL, but you don't need Prisma anymore to run the migrations. 
Instead, from then on, the prisma-generated SQL DDL gets added into Knex migrations (with the help of [this package](https://github.com/spersico/prisma-diff-to-knex-migration)).


## How to use it

**This script is not a dependency. This is a wizard that helps you setup things**

1. **First, make sure you've got all the dependencies you need**:
  - Knex is obviously required, pg is the driver that knex uses for PostgreSQL (read more [here](https://knexjs.org/guide/#node-js)) dotenv is recommended to pick up the env variables: 
    ```bash
    npm install knex dotenv pg # replace pg with mysql, if that's your DB engine.
    ```
  - Optionally, to get the prisma-augmented knex migrations, you can install locally [this other package](https://github.com/spersico/prisma-diff-to-knex-migration): 
    ```bash
    npm install -D prisma-diff-to-knex-migration
    ```
2. **Run the migration script. You don't need to install this package!!** 
    ```bash
    npx prisma-migration-migrator
    ```

    **This will set up everything for you, and explain during the process what it's doing.**
    
    If the setup is unsuccessful, you can either force it to run again with ```npx prisma-migration-migrator -- --setup```, skip the check entirely with ```npx prisma-migration-migrator -- --skip-check```, or setup knex and prisma manually following the code of this repo as an example.
  
    **The script will:**
    1. Create a pre-configured `knexfile.mjs` in the root of your project (if it doesn't exist) (it assumes PostgreSQL, update it accordingly if you use another DB).
    2. Add the necessary models to the prisma schema to ignore the knex migration history tables.
    3. Create a script that lets you sync the migrations applied by prisma with knex. The script is created in the base folder, and script to call it is added to the package.json (`migration:sync`). **The script is needed so that knex only runs the migrations that were not run by prisma before.**
    4. Add a `migration:generate` script to your `package.json` that will create knex migrations and then adds Prisma's SQL (setting the new flow of migration generation for you). (This is where you will use `prisma-diff-to-knex-migration` to update the knex migrations with the Prisma SQL. It uses npx, so if you don't have it locally, it will download it for you)
    
    > You can optionally pass a second parameter to the script to specify the path to the prisma schema file. By default, it will look for a `schema.prisma` file in the root of your project.
    
3. **Now SYNC**:
First, remember to run the `migration:sync` script to sync the migrations applied by prisma with knex. If you don't run the `migration:sync` script first, the `migration:generate` script will include the knex history_ tables in generated migration SQL, which you probably don't want.
4. **Done!**:
We are ready! You can now run the `migration:generate` script to create a new migration with the added prisma SQL. 
And then run `npm run migrations:apply` to run them. 
From this point on, you shouldn't need to run prisma-migration-migrator again, and you can use the provided scripts.

## Usage
Test it out!. 
Add a column or something in the prisma schema, run the `migration:generate` script the generate a knex migration with the change, and then run `migration:apply`, to apply them.
You should see the new column in the database!

That's it! You now:
  - Can use JS + SQL to do migrations.
  - Have access to all the knex plugins and features. You've got the complete power of knex at your disposal.
  - Can use the `up` and `down` pattern to handle rollbacks!
  - You still have the power of prisma to generate the SQL migrations for you, and the ORM to interact with the database, and the schema to define the database structure.

Check [knexjs' official docs](https://knexjs.org/guide/migrations.html) for more details on how to use knex migrations.


## Deeper Explanation of the setup
This section explains what the migration script does in a bit more detail. Most of this is explained by the wizard you see when running it, though.

### Prisma schema changes
We append the following models to your prisma schema (if they don't exist):
  ```prisma
model knex_migrations {
  @@ignore
  id             Int       @id @default(autoincrement())
  name           String?   @db.VarChar(255)
  batch          Int?
  migration_time DateTime? @db.Timestamptz(6)
  // on mysql this field needs to be  @db.DateTime(6)  instead
}

model knex_migrations_lock {
  @@ignore
  index     Int  @id @default(autoincrement())
  is_locked Int?
}

  ```
This way, prisma will ignore the tables knex uses to track migration history, and won't complain about database drift when generating DDL commands for the migrations.
    
### Knexfile

We create a `knexfile.mjs` in the root of your project.
This file will be pre-configured to work with prisma, will use the `dotenv` package to load the environment variables, and will use .mjs files for the migrations.

Note: The generated knexfile assumes a PostgreSQL database. In order to set it up for mysql, you need to update the client property in the knexfile, before running the script.
  If you're using another database, please update the file accordingly, by following the knex documentation: https://knexjs.org/guide/#installation
  PRs making the setup process more intelligent (for example, to pick up the client value from the prisma.schema) are welcome.
  
*Note: You can change the file to use .js or .ts files if you want. I didn't test it with .ts files, because I found that knex support for typescript migrations is kinda problematic at times. Try it if you really want the full Typescript experience.*

### Sync script
The script makes sure that the knex tables are present in the database, and that the knex migration history is in sync with the prisma migration history.

The knex_tables being present makes sure that knex only runs the migrations that were not run by prisma before. It also makes sure that Prima's generated SQL from `prisma-diff-to-knex-migration` doesn't include the knex history tables.


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
