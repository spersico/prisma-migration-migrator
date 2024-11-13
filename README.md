## Description

This project is a WIP of how to use Knex's engine to run migrations, while using Prisma as the source of truth.

The idea is to use Prisma to generate the schema. Generate the migrations with prisma (but NOT run them), convert them to Knex migrations (allowing you to use Javascript to write the migrations), and then run the Knex migrations.

So the flow would be:

- Install the project (TODO: publish this thing)
- Do whatever you want with prisma (create models, etc). Whenever you want to generate a migration remember to add the `--create-only` flag to the `prisma migrate dev` command. That way you can generate the migration without running it.
- Run `yarn prisma-to-knex` to convert the prisma migrations to knex migrations.
