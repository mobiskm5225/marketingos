import { eq } from 'drizzle-orm';
import { db } from '../../core/db';
import { agentJobs, agentResults, linkedinPosts, linkedinCreatives } from '../../core/db/schema';
import { callOpenAI, generateImage } from '../../core/ai/openai';
import { createNotification } from '../../core/notifications';
import { getBrandColors } from '../../core/settings';
import { brandCreative } from '../../core/image';
import { buildLinkedinConceptsPrompt } from './prompt';
import log from '../../logger';

const AGENT_NAME = 'linkedin-creatives';
const VARIANTS = 3;

interface Concept {
  concept: string;
  image_prompt: string;
  caption: string;
}

function parseConcepts(text: string): Concept[] {
  // Model is told to return bare JSON, but strip fences defensively
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleaned);
  const list: Concept[] = parsed.creatives ?? [];
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('Concept generation returned no creatives');
  }
  return list.slice(0, VARIANTS);
}

// Pipeline: post content → GPT-4o designs 3 creative concepts → gpt-image-1
// renders each → stored in linkedin_creatives. Cost of all calls accumulates
// on the agent_jobs row.
export async function runLinkedinCreatives(postId: string, jobId: string): Promise<void> {
  log.info({ postId, jobId }, 'LinkedIn creatives starting');

  try {
    await db.update(agentJobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(agentJobs.id, jobId));
    await db.update(linkedinPosts).set({ status: 'generating', updatedAt: new Date() }).where(eq(linkedinPosts.id, postId));

    const [post] = await db.select().from(linkedinPosts).where(eq(linkedinPosts.id, postId)).limit(1);
    if (!post) throw new Error('Post not found');

    const userMessage = `LinkedIn post draft:\n\n${post.title ? `Title: ${post.title}\n\n` : ''}${post.content}`;

    const brand = await getBrandColors();
    log.info({ postId, brand }, 'Generating creative concepts (GPT-4o)');
    const conceptResult = await callOpenAI(buildLinkedinConceptsPrompt(brand), userMessage, 'gpt-4o', 2048, 0.7);
    const concepts = parseConcepts(conceptResult.text);

    let totalInput = conceptResult.inputTokens;
    let totalOutput = conceptResult.outputTokens;
    let totalCost = conceptResult.costUsd;
    let generated = 0;

    for (let i = 0; i < concepts.length; i++) {
      const c = concepts[i];
      try {
        log.info({ postId, variant: i + 1 }, 'Rendering creative (gpt-image-2)');
        const img = await generateImage(c.image_prompt, '1536x1024', 'medium');

        // Stamp the org logo (Design System → Branding) bottom-right
        const brandedB64 = await brandCreative(img.b64);

        await db.insert(linkedinCreatives).values({
          postId,
          jobId,
          variant: i + 1,
          concept: c.concept,
          imagePrompt: c.image_prompt,
          caption: c.caption,
          imageB64: brandedB64,
          costUsd: img.costUsd.toFixed(6),
        });

        totalInput += img.inputTokens;
        totalOutput += img.outputTokens;
        totalCost += img.costUsd;
        generated++;
      } catch (err: any) {
        log.error({ postId, variant: i + 1, err: err.message }, 'Creative render failed');
      }
    }

    if (generated === 0) throw new Error('All creative renders failed');

    const summary = concepts.map((c, i) =>
      `## Variant ${i + 1} — ${c.concept}\n\n**Caption:** ${c.caption}\n\n**Image prompt:** ${c.image_prompt}`
    ).join('\n\n---\n\n');

    await db.insert(agentResults).values({
      jobId,
      resultType: 'linkedin_creatives',
      content: `# LinkedIn Creatives\n\n${generated}/${concepts.length} images generated.\n\n${summary}`,
    });

    await db.update(agentJobs).set({
      status: 'done',
      inputTokens: totalInput,
      outputTokens: totalOutput,
      costUsd: totalCost.toFixed(6),
      updatedAt: new Date(),
    }).where(eq(agentJobs.id, jobId));

    await db.update(linkedinPosts).set({ status: 'done', errorMessage: null, updatedAt: new Date() }).where(eq(linkedinPosts.id, postId));

    await createNotification(
      'job_done',
      'LinkedIn creatives ready',
      `"${post.title ?? post.content.slice(0, 50)}" — ${generated} variations, $${totalCost.toFixed(4)}`,
      jobId,
    );

    log.info({ postId, jobId, generated, costUsd: totalCost.toFixed(6) }, 'LinkedIn creatives done');

  } catch (err: any) {
    log.error({ postId, jobId, err: err.message }, 'LinkedIn creatives failed');
    await createNotification('job_error', 'LinkedIn creatives failed', err.message, jobId);
    try {
      await db.update(agentJobs).set({ status: 'error', errorMessage: err.message, updatedAt: new Date() }).where(eq(agentJobs.id, jobId));
      await db.update(linkedinPosts).set({ status: 'error', errorMessage: err.message, updatedAt: new Date() }).where(eq(linkedinPosts.id, postId));
    } catch { /* swallow */ }
  }
}
