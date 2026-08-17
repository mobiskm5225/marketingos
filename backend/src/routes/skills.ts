import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { eq, inArray, asc } from 'drizzle-orm';
import { db } from '../core/db';
import {
  skills,
  agents,
  agentStages,
  agentReferences,
  modelProviders,
} from '../core/db/schema';
import { parseDoc, slugify } from '../core/skills/parse';
import { buildPreview, filesFromZip, filesFromGithub } from '../core/skills/import';
import { HttpError } from '../middleware/error';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ─── Library CRUD ─────────────────────────────────────────────────────────────

router.get('/skills', async (_req, res, next) => {
  try {
    const rows = await db.select().from(skills).orderBy(asc(skills.name));
    res.json(
      rows.map((s) => ({
        id: s.slug,
        name: s.name,
        description: s.description,
        category: s.category,
        source: s.source,
        sourceRef: s.sourceRef,
        updated: s.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.get('/skills/:slug', async (req, res, next) => {
  try {
    const [row] = await db.select().from(skills).where(eq(skills.slug, req.params.slug));
    if (!row) throw new HttpError(404, 'Skill not found');
    res.json({
      id: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      bodyMd: row.bodyMd,
      frontmatter: row.frontmatter,
      source: row.source,
      sourceRef: row.sourceRef,
      updated: row.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

const writeSchema = z.object({
  bodyMd: z.string().min(1, 'A skill needs a body.'),
  category: z.string().max(100).nullish(),
});

router.post('/skills', async (req, res, next) => {
  try {
    const { bodyMd, category } = writeSchema.parse(req.body);
    const parsed = parseDoc(bodyMd);
    if (!parsed.name) {
      throw new HttpError(400, 'Skill needs a name — add frontmatter or a top-level heading.');
    }

    const slug = slugify(parsed.name);
    const [existing] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, slug));
    if (existing) throw new HttpError(409, `A skill named "${parsed.name}" already exists.`);

    const [created] = await db
      .insert(skills)
      .values({
        slug,
        name: parsed.name,
        description: parsed.description,
        category: category ?? null,
        bodyMd: parsed.raw,
        frontmatter: parsed.frontmatter,
        source: 'manual',
      })
      .returning({ slug: skills.slug });

    res.status(201).json({ id: created!.slug });
  } catch (err) {
    next(err);
  }
});

router.patch('/skills/:slug', async (req, res, next) => {
  try {
    const { bodyMd, category } = writeSchema.partial().parse(req.body);
    const [row] = await db.select().from(skills).where(eq(skills.slug, req.params.slug));
    if (!row) throw new HttpError(404, 'Skill not found');

    const parsed = bodyMd ? parseDoc(bodyMd, row.name) : null;

    await db
      .update(skills)
      .set({
        ...(parsed
          ? {
              name: parsed.name || row.name,
              description: parsed.description,
              bodyMd: parsed.raw,
              frontmatter: parsed.frontmatter,
            }
          : {}),
        ...(category !== undefined ? { category: category ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(skills.id, row.id));

    res.json({ id: row.slug });
  } catch (err) {
    next(err);
  }
});

router.delete('/skills/:slug', async (req, res, next) => {
  try {
    const [row] = await db.select().from(skills).where(eq(skills.slug, req.params.slug));
    if (!row) throw new HttpError(404, 'Skill not found');

    // agent_stages references skills with onDelete: restrict, so report which
    // agents block the delete rather than surfacing a raw FK violation.
    const inUse = await db
      .select({ agentName: agents.name })
      .from(agentStages)
      .innerJoin(agents, eq(agentStages.agentId, agents.id))
      .where(eq(agentStages.skillId, row.id));

    if (inUse.length > 0) {
      const names = [...new Set(inUse.map((r) => r.agentName))].join(', ');
      throw new HttpError(409, `Still used by: ${names}. Remove it from those pipelines first.`);
    }

    await db.delete(skills).where(eq(skills.id, row.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Import ───────────────────────────────────────────────────────────────────
//
// Both sources return a preview only. Nothing is written until the user
// confirms it via POST /api/skills/import/commit.

router.post('/skills/import/folder', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'Upload a .zip of the agent folder.');
    const files = filesFromZip(req.file.buffer);
    res.json(buildPreview(files, req.file.originalname));
  } catch (err) {
    next(err);
  }
});

router.post('/skills/import/github', async (req, res, next) => {
  try {
    const { url } = z.object({ url: z.string().min(1) }).parse(req.body);
    const { files, ref } = await filesFromGithub(url);
    res.json(buildPreview(files, ref));
  } catch (err) {
    next(err);
  }
});

const commitSchema = z.object({
  agent: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().default(''),
    agentMd: z.string().nullish(),
    guardrails: z.string().nullish(),
    category: z.string().nullish(),
  }),
  skills: z
    .array(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().default(''),
        bodyMd: z.string().min(1),
        frontmatter: z.record(z.string(), z.unknown()).default({}),
        category: z.string().nullish(),
      }),
    )
    .min(1),
  references: z
    .array(z.object({ name: z.string().min(1), bodyMd: z.string() }))
    .default([]),
  stages: z
    .array(
      z.object({
        skillSlug: z.string().min(1),
        position: z.number().int().positive(),
        dependsOn: z.array(z.number().int().positive()).default([]),
        isGate: z.boolean().default(false),
      }),
    )
    .min(1),
  sourceRef: z.string().default(''),
  source: z.enum(['folder', 'github']).default('folder'),
});

/**
 * Writes a confirmed preview: skills into the shared library, then the agent,
 * its references and its pipeline.
 *
 * A skill slug that already exists is reused rather than overwritten — two
 * agents legitimately share a skill name, and the second import must not
 * clobber the first. Where the incoming text differs it is kept on the stage as
 * `bodyOverride`, so the library entry stays canonical and each agent keeps its
 * own wording.
 */
router.post('/skills/import/commit', async (req, res, next) => {
  try {
    // Typed from the schema rather than cast — a cast would silently hide any
    // field the schema gains from here on.
    const payload = commitSchema.parse(req.body);

    const result = await db.transaction(async (tx) => {
      const incomingSlugs = payload.skills.map((s) => s.slug);
      const existing = incomingSlugs.length
        ? await tx.select().from(skills).where(inArray(skills.slug, incomingSlugs))
        : [];
      const existingBySlug = new Map(existing.map((s) => [s.slug, s]));

      const skillIdBySlug = new Map<string, string>();
      const overrides = new Map<string, string>();
      let created = 0;
      let reused = 0;

      for (const incoming of payload.skills) {
        const match = existingBySlug.get(incoming.slug);
        if (match) {
          skillIdBySlug.set(incoming.slug, match.id);
          reused += 1;
          if (match.bodyMd.trim() !== incoming.bodyMd.trim()) {
            overrides.set(incoming.slug, incoming.bodyMd);
          }
          continue;
        }

        const [row] = await tx
          .insert(skills)
          .values({
            slug: incoming.slug,
            name: incoming.name,
            description: incoming.description,
            bodyMd: incoming.bodyMd,
            frontmatter: incoming.frontmatter,
            // A skill with no category of its own inherits the agent's, so an
            // import lands categorised instead of needing 10 manual edits.
            category: incoming.category ?? payload.agent.category ?? null,
            source: payload.source,
            sourceRef: payload.sourceRef || null,
          })
          .returning({ id: skills.id });
        skillIdBySlug.set(incoming.slug, row!.id);
        created += 1;
      }

      // Give the agent a free slug rather than overwriting an existing one.
      let agentSlug = payload.agent.slug;
      for (let n = 2; ; n += 1) {
        const [clash] = await tx.select({ id: agents.id }).from(agents).where(eq(agents.slug, agentSlug));
        if (!clash) break;
        agentSlug = `${payload.agent.slug}-${n}`;
      }

      const [defaultProvider] = await tx
        .select({ id: modelProviders.id })
        .from(modelProviders)
        .orderBy(asc(modelProviders.createdAt))
        .limit(1);

      const [agent] = await tx
        .insert(agents)
        .values({
          slug: agentSlug,
          name: payload.agent.name,
          role: 'Imported agent',
          description: payload.agent.description,
          status: 'draft',
          icon: 'Bot',
          category: payload.agent.category ?? null,
          agentMd: payload.agent.agentMd ?? null,
          guardrails: payload.agent.guardrails ?? null,
          defaultProviderId: defaultProvider?.id ?? null,
        })
        .returning({ id: agents.id, slug: agents.slug });

      for (const [i, reference] of payload.references.entries()) {
        await tx.insert(agentReferences).values({
          agentId: agent!.id,
          name: reference.name,
          bodyMd: reference.bodyMd,
          position: i,
        });
      }

      // Two passes: insert every stage to get its id, then resolve dependencies
      // from stage positions to those ids.
      const stageIdByPosition = new Map<number, string>();
      for (const stage of payload.stages) {
        const skillId = skillIdBySlug.get(stage.skillSlug);
        if (!skillId) throw new HttpError(400, `Stage references unknown skill "${stage.skillSlug}".`);

        const [row] = await tx
          .insert(agentStages)
          .values({
            agentId: agent!.id,
            skillId,
            position: stage.position,
            dependsOn: [],
            isGate: stage.isGate,
            bodyOverride: overrides.get(stage.skillSlug) ?? null,
          })
          .returning({ id: agentStages.id });
        stageIdByPosition.set(stage.position, row!.id);
      }

      for (const stage of payload.stages) {
        const ids = stage.dependsOn
          .map((p) => stageIdByPosition.get(p))
          .filter((id): id is string => Boolean(id));
        if (ids.length === 0) continue;
        await tx
          .update(agentStages)
          .set({ dependsOn: ids })
          .where(eq(agentStages.id, stageIdByPosition.get(stage.position)!));
      }

      return {
        agent: agent!.slug,
        skillsCreated: created,
        skillsReused: reused,
        overrides: overrides.size,
        stages: payload.stages.length,
        references: payload.references.length,
      };
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
