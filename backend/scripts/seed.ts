import 'dotenv/config';
import { db } from '../src/core/db';
import { agents, knowledgeBases, agentKnowledgeBases, modelProviders, integrations, runs, activities } from '../src/core/db/schema';
// @ts-ignore - The mock data doesn't type check perfectly because icons are functions, but we just want the strings for the seed
import { agents as mockAgents, knowledgeBases as mockKbs, modelProviders as mockModels, integrations as mockIntegrations, runs as mockRuns, activity as mockActivity } from '../../frontend/src/data/marketing-os';

async function main() {
  console.log('🌱 Seeding database with Marketing OS mock data...');

  // 1. Clear existing data
  console.log('Clearing existing data...');
  await db.delete(activities);
  await db.delete(runs);
  await db.delete(agentKnowledgeBases);
  await db.delete(knowledgeBases);
  await db.delete(agents);
  await db.delete(modelProviders);
  await db.delete(integrations);

  // 2. Seed Agents
  console.log('Seeding agents...');
  const agentIdMap: Record<string, string> = {};
  for (const agent of mockAgents) {
    const [inserted] = await db.insert(agents).values({
      slug: agent.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      status: agent.status,
      icon: agent.icon?.displayName || agent.icon?.name || 'Bot', // Best effort extract icon name
      model: agent.model,
      skills: agent.skills,
    }).returning({ id: agents.id });
    agentIdMap[agent.name] = inserted.id; // Map for KBs and Runs
  }

  // 3. Seed Knowledge Bases
  console.log('Seeding knowledge bases...');
  const kbIdMap: Record<string, string> = {};
  for (const kb of mockKbs) {
    const [inserted] = await db.insert(knowledgeBases).values({
      slug: kb.id,
      name: kb.name,
      type: kb.type,
      source: kb.source,
      docsCount: kb.docs,
      chunksCount: kb.chunks,
      icon: kb.icon?.displayName || kb.icon?.name || 'FileText',
    }).returning({ id: knowledgeBases.id });
    kbIdMap[kb.name] = inserted.id;
    
    // Link to agents (mock data says usedBy: ["Atlas", "Quill"])
    for (const agentName of kb.usedBy) {
      if (agentIdMap[agentName]) {
        await db.insert(agentKnowledgeBases).values({
          agentId: agentIdMap[agentName],
          kbId: inserted.id,
        });
      }
    }
  }

  // 4. Seed Models & Integrations
  console.log('Seeding models & integrations...');
  for (const model of mockModels) {
    await db.insert(modelProviders).values({
      slug: model.id,
      name: model.name,
      kind: model.kind,
      models: model.models,
      status: model.status,
      note: model.note,
    });
  }
  
  for (const integration of mockIntegrations) {
    await db.insert(integrations).values({
      slug: integration.id,
      name: integration.name,
      blurb: integration.blurb,
      status: integration.status,
      detail: integration.detail,
    });
  }

  // 5. Seed Runs
  console.log('Seeding runs...');
  for (const run of mockRuns) {
    const agentId = agentIdMap[run.agent] || Object.values(agentIdMap)[0]; // Fallback to first if not found
    await db.insert(runs).values({
      slug: run.id,
      title: run.title,
      agentId,
      status: run.status,
      startedAt: new Date(), // Mock says "Today, 09:12", we'll just use now()
      duration: run.duration,
      model: run.model,
      summary: run.summary,
      metrics: run.metrics,
      sections: run.sections,
      sources: run.sources,
      attachments: run.attachments,
      comments: run.comments,
    });
  }

  // 6. Seed Activities
  console.log('Seeding activities...');
  for (const a of mockActivity) {
    await db.insert(activities).values({
      slug: a.id,
      text: a.text,
    });
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Seeding failed:');
  console.error(e);
  process.exit(1);
});
