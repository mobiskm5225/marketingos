import 'dotenv/config';
import { db, pool } from '../src/core/db';
import { modelProviders, integrations, categories } from '../src/core/db/schema';
import {
  modelProviders as catalogProviders,
  integrations as catalogIntegrations,
  categories as catalogCategories,
} from './seed-data';

/**
 * Loads reference data only — model providers and integrations. It never creates
 * agents, knowledge bases or runs: those belong to the user.
 *
 * Existing rows are left alone, so a provider you have already configured keeps
 * its API key and `connected` status across runs. Only missing rows are added.
 */
async function main() {
  // Every insert below is onConflictDoNothing, so this is safe to run on every
  // container boot and safe to re-run after the catalog gains new entries. An
  // early "already seeded, skip" check would silently withhold newly added rows
  // (categories, providers) from an existing install. --if-empty is still
  // accepted so the compose command keeps working.
  console.log('Loading reference catalog...');

  for (const [i, category] of catalogCategories.entries()) {
    await db
      .insert(categories)
      .values({ slug: category.slug, name: category.name, position: i })
      .onConflictDoNothing({ target: categories.slug });
  }

  for (const provider of catalogProviders) {
    await db
      .insert(modelProviders)
      .values({
        slug: provider.id,
        name: provider.name,
        kind: provider.kind,
        models: provider.models,
        status: 'available',
        note: provider.note,
      })
      .onConflictDoNothing({ target: modelProviders.slug });
  }

  for (const integration of catalogIntegrations) {
    await db
      .insert(integrations)
      .values({
        slug: integration.id,
        name: integration.name,
        blurb: integration.blurb,
        status: 'available',
        detail: integration.detail,
      })
      .onConflictDoNothing({ target: integrations.slug });
  }

  console.log(
    `✅ Catalog ready — ${catalogCategories.length} categories, ${catalogProviders.length} model providers, ${catalogIntegrations.length} integrations.`,
  );
  console.log('No agents, knowledge bases or runs created. Add those through the app.');
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('❌ Seeding failed:');
    console.error(err);
    await pool.end();
    process.exit(1);
  });
