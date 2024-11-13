/** @typedef {import('knex').Knex} Knex */

/**@param {Knex} knex*/
export async function up(knex) {
  await knex.raw(`
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
`);

  await knex.raw(`
CREATE UNIQUE INDEX "Article_title_key" ON "Article"("title");
`);
}

/**@param {Knex} knex*/
export async function down(knex) {
  // Add your down migration SQL here
}
