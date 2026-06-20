import { Prisma } from '@prisma/client'
import { generateText, type LanguageModel } from 'ai'
import { prisma } from './prisma'
import { generateEmbedding } from './embedding'
import { truncate } from './text'
import { getSetting, getNumericSetting, getBoolSetting } from './settings.service.ts'
import { withSpan } from './metrics.ts'

export interface SearchResult {
  chunkId: string
  content: string
  documentId: string
  documentTitle: string
  score: number          // hybrid similarity in [0, 1] (higher = more relevant)
  startChar: number
  endChar: number
  embedding?: number[]   // attached for in-process MMR; stripped before returning to client
}

export interface SearchOptions {
  limit?: number
  workspaceId?: string
  /** Similarity floor; results below are dropped. Default 0.2. */
  minScore?: number
  /** Over-fetch factor for MMR diversification. Default 3. */
  overFetch?: number
  /** MMR lambda (0 = max diversity, 1 = pure relevance). Default 0.7. */
  mmrLambda?: number
  /** Restrict search to a specific document. */
  documentId?: string
  /** Weight of vector score vs BM25 (0–1). Default 0.7 → 70% vector, 30% BM25. */
  hybridAlpha?: number
  /**
   * If provided, use HyDE: generate a hypothetical answer to the query and
   * embed that instead of the raw query string. Improves recall ~15–30% for
   * factual Q&A at the cost of one extra LLM call.
   */
  hydeModel?: LanguageModel
}

const DEFAULT_LIMIT = 5
const DEFAULT_MIN_SCORE = 0.2
const DEFAULT_OVERFETCH = 3
const DEFAULT_MMR_LAMBDA = 0.7
const DEFAULT_HYBRID_ALPHA = 0.7
const QUERY_MAX_CHARS = 512

async function getSearchConfig() {
  const config = useRuntimeConfig()
  const [topKStr, thresholdStr, hybridStr, rerankStr] = await Promise.all([
    getSetting('SEARCH_TOP_K', String(config.searchTopK ?? DEFAULT_LIMIT)),
    getSetting('SEARCH_THRESHOLD', String(config.searchThreshold ?? DEFAULT_MIN_SCORE)),
    getSetting('SEARCH_HYBRID', String(config.searchHybrid ?? false)),
    getSetting('SEARCH_RERANK', String(config.searchRerank ?? false)),
  ])
  const topK = Math.max(1, getNumericSetting(topKStr, DEFAULT_LIMIT))
  const minScore = getNumericSetting(thresholdStr, DEFAULT_MIN_SCORE)
  const hybrid = getBoolSetting(hybridStr, false)
  const rerank = getBoolSetting(rerankStr, false)
  // If hybrid search is disabled, alpha=1 → pure vector (BM25 beta=0)
  const hybridAlpha = hybrid ? DEFAULT_HYBRID_ALPHA : 1.0
  return { topK, minScore, hybridAlpha, rerank }
}

async function getMemoryScope(): Promise<string> {
  const config = useRuntimeConfig()
  const scope = await getSetting('MEMORY_SCOPE', String(config.memoryScope ?? 'local_per_user'))
  return scope.trim() || 'local_per_user'
}

async function expandQueryHyDE(query: string, model: LanguageModel): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      prompt:
        `Write a short paragraph (2–3 sentences) that directly answers the following question. ` +
        `Be factual and specific. Do not begin with "Based on" or similar hedging.\n\nQuestion: ${query}\n\nAnswer:`,
      maxOutputTokens: 150,
      maxRetries: 0,
    })
    return text.trim() || query
  } catch {
    return query
  }
}

export async function search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  return withSpan('search', async () => {
  const cfg = await getSearchConfig()
  const limit = options.limit ?? cfg.topK
  const minScore = options.minScore ?? cfg.minScore
  const overFetch = options.overFetch ?? DEFAULT_OVERFETCH
  const mmrLambda = options.mmrLambda ?? DEFAULT_MMR_LAMBDA
  const alpha = options.hybridAlpha ?? cfg.hybridAlpha
  const skipMmr = !cfg.rerank
  const beta = 1 - alpha

  const safeQuery = truncate(query.trim(), QUERY_MAX_CHARS)
  if (!safeQuery) return []

  // HyDE: optionally embed a hypothetical answer instead of the raw query
  const queryToEmbed = options.hydeModel
    ? await expandQueryHyDE(safeQuery, options.hydeModel)
    : safeQuery

  const queryEmbedding = await generateEmbedding(queryToEmbed)
  const embeddingStr = `[${queryEmbedding.join(',')}]`
  const fetchLimit = Math.max(limit * overFetch, limit + 5)

  const memoryScope = (await getMemoryScope()).trim()
  const conditions: Prisma.Sql[] = []

  if (options.documentId) {
    conditions.push(Prisma.sql`d.id = ${options.documentId}`)
  } else {
    if (memoryScope === 'local_per_user' && options.workspaceId) {
      conditions.push(
        Prisma.sql`d."workspaceId" = ${options.workspaceId}`,
      )
    }
    if (memoryScope === 'disabled') {
      conditions.push(
        Prisma.sql`(d.metadata->>'kind' IS NULL OR d.metadata->>'kind' <> 'chat_memory')`,
      )
    }
  }
  conditions.push(Prisma.sql`d."ingestStatus" = 'ready'`)

  const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

  // Hybrid CTE: combine cosine-vector score and BM25 (ts_rank_cd) score.
  // Both scores are in [0, 1]; the combined score is a weighted average.
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    WITH vector_scores AS (
      SELECT
        c.id,
        1 - (c.embedding <=> ${embeddingStr}::vector) AS vscore
      FROM "Chunk" c
      JOIN "Document" d ON c."documentId" = d.id
      ${where}
      ORDER BY vscore DESC
      LIMIT ${fetchLimit}
    ),
    bm25_scores AS (
      SELECT
        c.id,
        ts_rank_cd(c.textsearch, plainto_tsquery('simple', ${safeQuery})) AS bscore
      FROM "Chunk" c
      JOIN "Document" d ON c."documentId" = d.id
      ${where}
      AND c.textsearch @@ plainto_tsquery('simple', ${safeQuery})
      LIMIT ${fetchLimit}
    ),
    combined AS (
      SELECT
        COALESCE(v.id, b.id) AS id,
        ${alpha}::float * COALESCE(v.vscore, 0::float)
          + ${beta}::float * COALESCE(b.bscore, 0::float) AS score
      FROM vector_scores v
      FULL OUTER JOIN bm25_scores b ON v.id = b.id
    )
    SELECT
      c.id              AS "chunkId",
      c.content,
      c."documentId",
      d.title           AS "documentTitle",
      c."startChar",
      c."endChar",
      c.embedding::text AS "embeddingText",
      combined.score    AS score
    FROM combined
    JOIN "Chunk" c    ON c.id = combined.id
    JOIN "Document" d ON c."documentId" = d.id
    ORDER BY combined.score DESC
    LIMIT ${fetchLimit}
  `)

  const candidates: SearchResult[] = rows.map((r) => ({
    chunkId: r.chunkId as string,
    content: r.content as string,
    documentId: r.documentId as string,
    documentTitle: r.documentTitle as string,
    score: parseFloat(String(r.score)),
    startChar: (r.startChar as number) || 0,
    endChar: (r.endChar as number) || 0,
    embedding: parsePgVector(r.embeddingText as string),
  }))

  const filtered = candidates.filter((c) => c.score >= minScore)
  if (filtered.length <= limit || skipMmr) return filtered.slice(0, limit).map(stripEmbedding)

  return mmrRank(queryEmbedding, filtered, limit, mmrLambda).map(stripEmbedding)
  })
}

/** Distinct documents in a retrieval set (same shape as chat `ConverseSource` citations). */
export type RagSource = Pick<SearchResult, 'chunkId' | 'documentId' | 'documentTitle' | 'score'>

export async function rag(
  query: string,
  limit = DEFAULT_LIMIT,
  workspaceId?: string,
  hydeModel?: LanguageModel,
): Promise<{
  query: string
  results: SearchResult[]
  context: string
  sources: RagSource[]
}> {
  const results = await search(query, { limit, workspaceId, hydeModel })
  const context = results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n')
  const sources: RagSource[] = [
    ...new Map(
      results.map((r) => [
        r.documentId,
        {
          chunkId: r.chunkId,
          documentId: r.documentId,
          documentTitle: r.documentTitle,
          score: r.score,
        } satisfies RagSource,
      ]),
    ).values(),
  ]
  return { query, results, context, sources }
}

export async function inspect(query: string, limit = DEFAULT_LIMIT, workspaceId?: string) {
  const t0 = Date.now()
  const queryEmbedding = await generateEmbedding(truncate(query, QUERY_MAX_CHARS))
  const tEmbed = Date.now()
  const results = await search(query, { limit, workspaceId })
  const tRetrieve = Date.now()

  const context = results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n')
  const sources: RagSource[] = [
    ...new Map(
      results.map((r) => [
        r.documentId,
        {
          chunkId: r.chunkId,
          documentId: r.documentId,
          documentTitle: r.documentTitle,
          score: r.score,
        } satisfies RagSource,
      ]),
    ).values(),
  ]

  return {
    query,
    embedding: { dimensions: queryEmbedding.length, preview: queryEmbedding.slice(0, 12) },
    results,
    context,
    sources,
    latencyMs: { embed: tEmbed - t0, retrieve: tRetrieve - tEmbed, total: tRetrieve - t0 },
  }
}

export async function logRagQuery(input: {
  queryText: string
  responseText: string | null
  results: SearchResult[]
  latencyMs: number
  userId?: string
  conversationId?: string
  toolCalled?: boolean
}): Promise<void> {
  try {
    const sources: Prisma.InputJsonValue = input.results.map((r) => ({
      chunkId: r.chunkId,
      documentId: r.documentId,
      documentTitle: r.documentTitle,
      score: r.score,
    }))
    await prisma.query.create({
      data: {
        queryText: input.queryText,
        responseText: input.responseText,
        sources,
        latencyMs: input.latencyMs,
        userId: input.userId ?? null,
        conversationId: input.conversationId ?? null,
        toolCalled: input.toolCalled ?? false,
      },
    })
  } catch {
    /* telemetry must never break user flow */
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function stripEmbedding(r: SearchResult): SearchResult {
  const { embedding, ...rest } = r
  void embedding
  return rest
}

export function parsePgVector(text: string): number[] {
  if (!text) return []
  const trimmed = text.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (!trimmed) return []
  const out: number[] = []
  for (const piece of trimmed.split(',')) {
    const n = parseFloat(piece)
    if (Number.isFinite(n)) out.push(n)
  }
  return out
}

export function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

export function mmrRank(
  queryVec: number[],
  candidates: SearchResult[],
  k: number,
  lambda: number,
): SearchResult[] {
  const picked: SearchResult[] = []
  const remaining = [...candidates]
  while (picked.length < k && remaining.length > 0) {
    let bestIdx = 0
    let bestScore = -Infinity
    for (let i = 0; i < remaining.length; i++) {
      const r = remaining[i]
      const rel = r.embedding ? cosineSim(queryVec, r.embedding) : r.score
      let maxSimToPicked = 0
      for (const p of picked) {
        if (!r.embedding || !p.embedding) continue
        const s = cosineSim(r.embedding, p.embedding)
        if (s > maxSimToPicked) maxSimToPicked = s
      }
      const mmr = lambda * rel - (1 - lambda) * maxSimToPicked
      if (mmr > bestScore) { bestScore = mmr; bestIdx = i }
    }
    picked.push(remaining.splice(bestIdx, 1)[0])
  }
  return picked
}
