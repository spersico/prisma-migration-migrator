/** @typedef {import('knex').Knex} Knex */

/**@param {Knex} knex*/
export async function up(knex) {
  await knex.raw(`
ALTER TABLE "Article" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
`);
}

/**@param {Knex} knex*/
export async function down(knex) {
  // Add your down migration SQL here
}
