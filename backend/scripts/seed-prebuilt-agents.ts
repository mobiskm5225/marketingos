import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { db, pool } from '../src/core/db';
import {
  agents,
  skills,
  agentStages,
  agentReferences,
  modelProviders,
} from '../src/core/db/schema';
import { assertAcyclic } from '../src/core/agent/dag';

/**
 * Finds the agents directory either mounted in Docker (/agents)
 * or relative to this script in the repository (../../agents).
 */
function getAgentsDir(): string {
  if (fs.existsSync('/agents')) return '/agents';
  const localPath = path.resolve(__dirname, '../../agents');
  if (fs.existsSync(localPath)) return localPath;
  throw new Error(`Agents directory not found at /agents or ${localPath}`);
}

function readFileSafe(filePath: string, fallback = ''): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch {
    // fallback
  }
  return fallback;
}

interface SkillDef {
  slug: string;
  name: string;
  description: string;
  category: string;
  filePath: string;
  fallbackContent: string;
}

interface StageDef {
  skillSlug: string;
  position: number;
  dependsOnSlugs: string[];
  isGate?: boolean;
}

interface AgentDef {
  slug: string;
  name: string;
  role: string;
  description: string;
  category: string;
  icon: string;
  status: 'active' | 'draft' | 'paused';
  specFilePath: string;
  guardrails: string;
  fallbackPrompt: string;
  references: { name: string; filePath: string; fallbackContent: string }[];
  stages: StageDef[];
}

export async function seedPrebuiltAgents() {
  const agentsDir = getAgentsDir();
  console.log(`📂 Using agents directory: ${agentsDir}`);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Define Skills
  // ──────────────────────────────────────────────────────────────────────────
  const skillDefs: SkillDef[] = [
    // LinkedIn Skills
    {
      slug: 'linkedin-educational',
      name: 'LinkedIn Post — Educational',
      description: 'Framework, breakdown, or "how it works" format. Translates complex practitioner insights into actionable steps.',
      category: 'social',
      filePath: path.join(agentsDir, 'Li agent', 'linkedin-educational.md'),
      fallbackContent: '# Skill: LinkedIn Post — Educational\n\nFramework, breakdown, or "how it works" format.',
    },
    {
      slug: 'linkedin-behind-the-scenes',
      name: 'LinkedIn Post — Behind the Scenes',
      description: 'Build-in-public update, process reveal, real-time engineering decisions, and tooling progress.',
      category: 'social',
      filePath: path.join(agentsDir, 'Li agent', 'linkedin-behind-the-scenes.md'),
      fallbackContent: '# Skill: LinkedIn Post — Behind the Scenes\n\nBuild-in-public update and process reveal.',
    },
    {
      slug: 'linkedin-founder-voice',
      name: 'LinkedIn Post — Founder Voice',
      description: 'Opinion, stance, or contrarian take grounded in founder conviction and firsthand experience.',
      category: 'social',
      filePath: path.join(agentsDir, 'Li agent', 'linkedin-founder-voice.md'),
      fallbackContent: '# Skill: LinkedIn Post — Founder Voice\n\nOpinion, stance, or contrarian take.',
    },
    {
      slug: 'linkedin-results-social-proof',
      name: 'LinkedIn Post — Results & Social Proof',
      description: 'Wins, customer metrics, before/after comparisons, and verified outcomes.',
      category: 'social',
      filePath: path.join(agentsDir, 'Li agent', 'linkedin-results-social-proof.md'),
      fallbackContent: '# Skill: LinkedIn Post — Results & Social Proof\n\nWins, case studies, before/after metrics.',
    },
    {
      slug: 'creative-brief-generator',
      name: 'Creative Brief Generator',
      description: 'Produces structured creative briefs for static graphics, carousels, or video assets accompanying posts.',
      category: 'social',
      filePath: path.join(agentsDir, 'Li agent', 'creative-brief-generator.md'),
      fallbackContent: '# Skill: Creative Brief Generator\n\nProduces creative briefs for visual assets.',
    },
    {
      slug: 'caption-writer',
      name: 'Caption Writer',
      description: 'Drafts short, scannable captions accompanying visual assets on LinkedIn.',
      category: 'social',
      filePath: path.join(agentsDir, 'Li agent', 'caption-writer.md'),
      fallbackContent: '# Skill: Caption Writer\n\nDrafts short captions for visual assets.',
    },

    // Email Marketing Skills
    {
      slug: 'email-onboarding-nurture-sequence',
      name: 'Email Onboarding & Nurture Sequence',
      description: 'Multi-email sequence to onboard new users, activate product usage, and build long-term relationships.',
      category: 'content',
      filePath: path.join(agentsDir, 'Email agent', 'skills', 'email-onboarding-nurture-sequence', 'SKILL.md'),
      fallbackContent: '# Skill: Email Onboarding & Nurture Sequence\n\nMulti-email onboarding and nurture sequence.',
    },
    {
      slug: 'email-cold-outreach-sequence',
      name: 'Email Cold Outreach Sequence',
      description: 'Multi-touch outbound sales email sequence focused on problem identification, credibility, and low-friction CTA.',
      category: 'content',
      filePath: path.join(agentsDir, 'Email agent', 'skills', 'email-cold-outreach-sequence', 'SKILL.md'),
      fallbackContent: '# Skill: Email Cold Outreach Sequence\n\nMulti-touch outbound sales sequence.',
    },
    {
      slug: 'email-newsletter',
      name: 'Email Newsletter — Editorial Format',
      description: 'Weekly/bi-weekly editorial newsletter delivering single-theme insight, analysis, and curated takeaways.',
      category: 'content',
      filePath: path.join(agentsDir, 'Email agent', 'skills', 'email-newsletter', 'SKILL.md'),
      fallbackContent: '# Skill: Email Newsletter — Editorial Format\n\nEditorial newsletter format.',
    },

    // Reachify Content Agent Skills
    {
      slug: 'reachify-landing-page',
      name: 'Reachify — Landing Page',
      description: 'High-converting B2B SaaS homepage/landing page structural shell with hero, problem, capability, and risk reversal.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-landing-page', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify Landing Page\n\nHigh-converting B2B SaaS landing page.',
    },
    {
      slug: 'reachify-feature-page',
      name: 'Reachify — Feature Page',
      description: 'Deep-dive product feature page communicating capability, workflow, and outcome for high-intent buyers.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-feature-page', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify Feature Page\n\nProduct feature page structure.',
    },
    {
      slug: 'reachify-faq-block',
      name: 'Reachify — FAQ Block',
      description: 'High-intent objection handling and buyer FAQ module for embedding into landing and comparison pages.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-faq-block', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify FAQ Block\n\nHigh-intent FAQ and objection handling block.',
    },
    {
      slug: 'reachify-social-proof-stack',
      name: 'Reachify — Social Proof Stack',
      description: 'Modular social proof component combining customer logos, metric callouts, and quote cards.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-social-proof-stack', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify Social Proof Stack\n\nModular social proof component.',
    },
    {
      slug: 'reachify-lean-hero-benefit-copy',
      name: 'Reachify — Lean Hero Benefit Copy',
      description: 'High-impact, concise hero section and benefit copy optimized for fast load times and clean mobile scanning.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-lean-hero-benefit-copy', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify Lean Hero Benefit Copy\n\nHero section and benefit copy.',
    },
    {
      slug: 'reachify-tofu-educational',
      name: 'Reachify — TOFU Educational',
      description: 'Top-of-funnel educational blog post targeting high-volume problem awareness search queries.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-tofu-educational', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify TOFU Educational\n\nTop-of-funnel educational blog post.',
    },
    {
      slug: 'reachify-mofu-comparison-buyers-guide',
      name: 'Reachify — MOFU Comparison / Buyer\'s Guide',
      description: 'Middle-of-funnel evaluation guide and buyer framework comparing solution categories fairly.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-mofu-comparison-buyers-guide', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify MOFU Comparison\n\nMiddle-of-funnel buyer comparison guide.',
    },
    {
      slug: 'reachify-bofu-objection-competitor-comparison',
      name: 'Reachify — BOFU Competitor Comparison',
      description: 'Bottom-of-funnel competitor vs. competitor comparison addressing buying objections with verified proof.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-bofu-objection-competitor-comparison', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify BOFU Competitor Comparison\n\nDirect competitor comparison.',
    },
    {
      slug: 'reachify-case-study',
      name: 'Reachify — Case Study',
      description: 'Outcome-led B2B case study built around a headline metric, challenge narrative, and implementation outcome.',
      category: 'content',
      filePath: path.join(agentsDir, 'content agent', 'skills', 'reachify-case-study', 'SKILL.md'),
      fallbackContent: '# Skill: Reachify Case Study\n\nOutcome-led B2B SaaS case study.',
    },

    // Editor Agent Skills
    {
      slug: 'editor-rubric-qa',
      name: 'Editor Rubric & Compliance QA',
      description: '12 hard-fail compliance gates and weighted quality rubric scoring across brand voice, structure, logic, and reader value.',
      category: 'content',
      filePath: path.join(agentsDir, 'editor agent', 'editor-rubric-v1.0_1.md'),
      fallbackContent: '# Skill: Editor Rubric & Compliance QA\n\n12 hard-fail compliance gates and weighted quality scoring.',
    },
    {
      slug: 'editor-linkedin-review',
      name: 'LinkedIn Post Editorial Review',
      description: 'Specialized review rubric and scoring scorecard for LinkedIn post variants.',
      category: 'social',
      filePath: path.join(agentsDir, 'editor agent', 'linkedin-post-template.md'),
      fallbackContent: '# Skill: LinkedIn Post Editorial Review\n\nReview rubric and scorecard for LinkedIn posts.',
    },
    {
      slug: 'editor-email-review',
      name: 'Email Campaign Editorial Review',
      description: 'Specialized review rubric and scoring scorecard for onboarding, outreach, and newsletter sequences.',
      category: 'content',
      filePath: path.join(agentsDir, 'editor agent', 'email-campaign-template.md'),
      fallbackContent: '# Skill: Email Campaign Editorial Review\n\nReview rubric and scorecard for email campaigns.',
    },
  ];

  console.log('⚡ Upserting skills library...');
  for (const s of skillDefs) {
    const content = readFileSafe(s.filePath, s.fallbackContent);
    const [existing] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, s.slug));

    if (existing) {
      await db
        .update(skills)
        .set({
          name: s.name,
          description: s.description,
          category: s.category,
          bodyMd: content,
          frontmatter: { name: s.name, description: s.description, category: s.category },
          updatedAt: new Date(),
        })
        .where(eq(skills.id, existing.id));
      console.log(`  🔄 Updated skill: ${s.name} (${s.slug})`);
    } else {
      await db.insert(skills).values({
        slug: s.slug,
        name: s.name,
        description: s.description,
        category: s.category,
        bodyMd: content,
        frontmatter: { name: s.name, description: s.description, category: s.category },
        source: 'folder',
        sourceRef: s.filePath.replace(agentsDir, 'agents'),
      });
      console.log(`  ✅ Added skill:   ${s.name} (${s.slug})`);
    }
  }

  // Fetch skill lookup map: slug -> id
  const allSkills = await db.select({ id: skills.id, slug: skills.slug }).from(skills);
  const skillMap = new Map(allSkills.map((s) => [s.slug, s.id]));

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Define Agents with Pipeline Stages and References
  // ──────────────────────────────────────────────────────────────────────────
  const agentDefs: AgentDef[] = [
    // 1. LinkedIn Social Agent
    {
      slug: 'linkedin-social-agent',
      name: 'LinkedIn Social Agent',
      role: 'Social Media Content Creator',
      description:
        "Pulls today's KB context, decides which LinkedIn skill to run (Educational, Behind the Scenes, Founder Voice, or Results & Social Proof), drafts one post with optional creative brief and caption, and saves the draft to Notion. Runs 3×/week on a Mon/Wed/Fri schedule with algorithmic fallback. Never publishes directly.",
      category: 'social',
      icon: 'Share2',
      status: 'active',
      specFilePath: path.join(agentsDir, 'Li agent', 'Li agent prompt.md'),
      guardrails:
        'Never publish directly to LinkedIn. Never invent results, metrics, or positioning statements not confirmed in the KB. Max 2 emojis per post. No external links in post body. Hook ≤140 chars on mobile. Exactly one CTA per post.',
      fallbackPrompt: '# LinkedIn Social Agent\n\nOrchestrates LinkedIn content creation.',
      references: [
        {
          name: 'shared-content-rules',
          filePath: path.join(agentsDir, 'Li agent', 'shared-content-rules.md'),
          fallbackContent: '# Shared Content Rules\n\n150-180 words, no external links in body.',
        },
      ],
      stages: [
        { skillSlug: 'gather-context', position: 1, dependsOnSlugs: [] },
        { skillSlug: 'linkedin-educational', position: 2, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'linkedin-behind-the-scenes', position: 3, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'linkedin-founder-voice', position: 4, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'linkedin-results-social-proof', position: 5, dependsOnSlugs: ['gather-context'] },
        {
          skillSlug: 'creative-brief-generator',
          position: 6,
          dependsOnSlugs: [
            'linkedin-educational',
            'linkedin-behind-the-scenes',
            'linkedin-founder-voice',
            'linkedin-results-social-proof',
          ],
        },
        { skillSlug: 'caption-writer', position: 7, dependsOnSlugs: ['creative-brief-generator'] },
      ],
    },

    // 2. Email Marketing Agent
    {
      slug: 'email-marketing-agent',
      name: 'Email Marketing Agent',
      role: 'Email Campaign Drafter',
      description:
        'Drafts targeted email campaigns for Reachify clients across Onboarding & Nurture Sequences, Cold Outreach Sequences, and Newsletters. Uses client Brand KB + proven copywriting frameworks. All drafts go to human review — no autonomous sending.',
      category: 'content',
      icon: 'Mail',
      status: 'active',
      specFilePath: path.join(agentsDir, 'Email agent', 'Email-Marketing-Agent-Spec.md'),
      guardrails:
        'Never send emails autonomously. Always return drafts for human approval. Do not fabricate client results or metrics. Keep each skill file self-contained. Always provide 2-3 subject line candidates.',
      fallbackPrompt: '# Email Marketing Agent\n\nDrafts high-converting email campaigns.',
      references: [],
      stages: [
        { skillSlug: 'gather-context', position: 1, dependsOnSlugs: [] },
        { skillSlug: 'email-onboarding-nurture-sequence', position: 2, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'email-cold-outreach-sequence', position: 3, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'email-newsletter', position: 4, dependsOnSlugs: ['gather-context'] },
      ],
    },

    // 3. Content Marketing Agent
    {
      slug: 'content-marketing-agent',
      name: 'Content Marketing Agent',
      role: 'B2B Content Marketing Execution Agent',
      description:
        "Drafts client-facing content for Reachify — landing pages, feature pages, FAQ blocks, social proof stacks, TOFU/MOFU/BOFU blog posts, and case studies — using a governed library of structural templates for consistent quality.",
      category: 'content',
      icon: 'FileText',
      status: 'active',
      specFilePath: path.join(agentsDir, 'content agent', 'reachify-content-agent.md'),
      guardrails:
        "Never force-fit content into an unrelated template. If no Format Key matches, draft freeform and flag the gap. Notion is source of truth — skill files are snapshots. Don't fabricate client data or metrics.",
      fallbackPrompt: '# Reachify Content Agent\n\nDrafts B2B SaaS marketing content.',
      references: [],
      stages: [
        { skillSlug: 'gather-context', position: 1, dependsOnSlugs: [] },
        { skillSlug: 'reachify-landing-page', position: 2, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'reachify-feature-page', position: 3, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'reachify-tofu-educational', position: 4, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'reachify-mofu-comparison-buyers-guide', position: 5, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'reachify-bofu-objection-competitor-comparison', position: 6, dependsOnSlugs: ['gather-context'] },
        { skillSlug: 'reachify-case-study', position: 7, dependsOnSlugs: ['gather-context'] },
      ],
    },

    // 4. Editor Agent
    {
      slug: 'editor-agent',
      name: 'Editor Agent',
      role: 'Quality Gate — Editorial Review Before Human Approval',
      description:
        'The last machine gate before the human gate. Every draft from the Blog Agent, Email Campaign Agent, and LinkedIn Agent is automatically routed here. Runs brand voice check and weighted quality rubric, applies 12 hard-fail compliance gates, returns numeric score with PASS / REVISE / FAIL verdict, and writes structured review layer to Notion. Does not rewrite content, does not publish, does not edit its own rubric.',
      category: 'content',
      icon: 'CheckCheck',
      status: 'active',
      specFilePath: path.join(agentsDir, 'editor agent', 'editor-agent-system-prompt_2.md'),
      guardrails:
        'Never edit or overwrite the draft body. Never publish content. Never modify the rubric autonomously. Max 2 revision cycles per draft. Strictly enforce 12 hard-fail gates.',
      fallbackPrompt: '# Editor Agent — Quality Gate\n\nAutomated editorial QA layer.',
      references: [
        {
          name: 'editor-agent-spec',
          filePath: path.join(agentsDir, 'editor agent', 'editor-agent-spec_1.md'),
          fallbackContent: '# Editor Agent Spec\n\nQuality gate specification.',
        },
      ],
      stages: [
        { skillSlug: 'editor-rubric-qa', position: 1, dependsOnSlugs: [], isGate: true },
        { skillSlug: 'editor-linkedin-review', position: 2, dependsOnSlugs: ['editor-rubric-qa'] },
        { skillSlug: 'editor-email-review', position: 3, dependsOnSlugs: ['editor-rubric-qa'] },
        {
          skillSlug: 'editorial-qa',
          position: 4,
          dependsOnSlugs: ['editor-linkedin-review', 'editor-email-review'],
          isGate: true,
        },
      ],
    },
  ];

  console.log('\n🤖 Upserting pre-built agents & pipeline DAGs...');
  const [defaultProvider] = await db
    .select({ id: modelProviders.id })
    .from(modelProviders)
    .where(eq(modelProviders.slug, 'openai'));

  for (const a of agentDefs) {
    const promptMd = readFileSafe(a.specFilePath, a.fallbackPrompt);

    // Upsert Agent
    let agentId: string;
    const [existing] = await db.select().from(agents).where(eq(agents.slug, a.slug));

    if (existing) {
      agentId = existing.id;
      await db
        .update(agents)
        .set({
          name: a.name,
          role: a.role,
          description: a.description,
          status: a.status,
          icon: a.icon,
          category: a.category,
          guardrails: a.guardrails,
          agentMd: promptMd,
          defaultProviderId: defaultProvider?.id ?? null,
          defaultModel: 'gpt-4o-mini',
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agentId));
      console.log(`  🔄 Updated agent: ${a.name} (${a.slug})`);
    } else {
      const [inserted] = await db
        .insert(agents)
        .values({
          slug: a.slug,
          name: a.name,
          role: a.role,
          description: a.description,
          status: a.status,
          icon: a.icon,
          category: a.category,
          guardrails: a.guardrails,
          agentMd: promptMd,
          defaultProviderId: defaultProvider?.id ?? null,
          defaultModel: 'gpt-4o-mini',
        })
        .returning({ id: agents.id });
      agentId = inserted!.id;
      console.log(`  ✅ Created agent: ${a.name} (${a.slug})`);
    }

    // Upsert Agent References
    await db.delete(agentReferences).where(eq(agentReferences.agentId, agentId));
    for (const [idx, ref] of a.references.entries()) {
      const refContent = readFileSafe(ref.filePath, ref.fallbackContent);
      await db.insert(agentReferences).values({
        agentId,
        name: ref.name,
        bodyMd: refContent,
        position: idx,
      });
      console.log(`     📄 Attached reference: ${ref.name}`);
    }

    // Upsert Agent Stages & Build DAG
    // Clear old stages to prevent orphaned nodes
    await db.delete(agentStages).where(eq(agentStages.agentId, agentId));

    // Pre-allocate UUIDs for each stage so dependsOn can reference other stages
    const stageIdBySlug = new Map<string, string>();
    for (const st of a.stages) {
      stageIdBySlug.set(st.skillSlug, randomUUID());
    }

    const stageNodesForValidation = a.stages.map((st) => {
      const stageId = stageIdBySlug.get(st.skillSlug)!;
      const dependsOnIds = st.dependsOnSlugs
        .map((slug) => stageIdBySlug.get(slug))
        .filter((id): id is string => Boolean(id));
      return { id: stageId, dependsOn: dependsOnIds };
    });

    // Validate DAG acyclicity
    assertAcyclic(stageNodesForValidation);

    for (const st of a.stages) {
      const stageId = stageIdBySlug.get(st.skillSlug)!;
      const skillId = skillMap.get(st.skillSlug);
      if (!skillId) {
        console.warn(`     ⚠️ Missing skillId for slug "${st.skillSlug}", skipping stage.`);
        continue;
      }

      const dependsOnIds = st.dependsOnSlugs
        .map((slug) => stageIdBySlug.get(slug))
        .filter((id): id is string => Boolean(id));

      await db.insert(agentStages).values({
        id: stageId,
        agentId,
        skillId,
        position: st.position,
        dependsOn: dependsOnIds,
        isGate: Boolean(st.isGate),
      });
    }

    console.log(`     🔗 Wired ${a.stages.length} pipeline stages successfully.`);
  }

  console.log('\n🎉 Pre-built agents and skills library seeding completed successfully!');
}

if (require.main === module) {
  seedPrebuiltAgents()
    .then(() => pool.end())
    .catch(async (err) => {
      console.error('\n❌ Seeding failed:', err);
      await pool.end();
      process.exit(1);
    });
}
