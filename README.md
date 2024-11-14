## Description

This project is a WIP of how to use Knex's engine to run migrations, while using Prisma as the source of truth.

This way, you get the auto generation of SQL migrations, but you also get the ability to use JS to do migrations. 

The idea is to use Prisma to generate the schema and the migrations, but running them through Knex.

To do this, after setting this up, generate the migrations with prisma (but NOT run them), convert them to Knex migrations (using the script on this package), and then run the Knex migrations (using the knex config modifier on this package).

So the flow would be:

- Install the project (not yet, it's not published, this is VERY much a WIP)
- Do whatever you want with prisma (create models, etc). Whenever you want to generate a migration remember to add the `--create-only` flag to the `prisma migrate dev` command. That way you can generate the migration without running it.
- Run `yarn prisma-to-knex` to convert the prisma migrations to knex migrations. This should create a `migration.mjs` on each folder, next to the sql migration.
- Set up the knexFile to look like the one in this repo (import the `PrismaFolderShapedMigrationSource`, look into the `knexfile.mjs` in this repo for an example).
- That's it. You can now run `knex migrate:latest` and knex should run the migrations that were not run before (check [https://knexjs.org/guide/migrations.html](https://knexjs.org/guide/migrations.html) for more details on how to use knex migrations)


## TODO
- BUG: Avoid overwriting the generated migration if the file already exists!!!!
- Figure out if the migrations can be run in a way that prisma detects it doesn't need to make other changes (figure out if on top of the knex history table, the migration can be modified to update the prisma history table). This would enable that prisma never notices that it's not actually running the migrations.
- The knex config part of the setup could be better. Maybe a function that takes a knexfile and modifies it enough to work as expected? That way setting this up would just be a matter of running the migrator, setting up knex with the same db as prisma, and using the modifier function to configure the knex migration source.
- Improve the docs!
- Add a BUNCH more tests:
  -  Ensure that it really filters the Prisma migrations every time.
- Publish this thing
