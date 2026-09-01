<script setup lang="ts">
import type { EmbryoDetail } from '~/stores/embryos'
import type { AiWorkflowNode } from 'ai-elements-nuxt/types'
import { LIFECYCLE, truncateSeed } from '~/utils/embryo-display'

const props = defineProps<{
  embryo: EmbryoDetail
}>()

const NODE_W = 156
const NODE_H = 52
const CX = 180
const CY = 150
const RADIUS = 150

const { nodes, edges, moveNode, fromJSON, selectedNodes, selectNode } = useAiWorkflow()
const canvasRef = ref<{ zoomIn: () => void; zoomOut: () => void; resetView: () => void; fitView: (pts: Array<{ x: number; y: number }>) => void } | null>(null)
const zoom = ref(1)

const layoutKey = computed(() => {
  const e = props.embryo
  const ids = [
    ...e.connections.map(c => c.id),
    ...e.connectedTo.map(c => c.id),
  ].sort().join(',')
  return `${e.id}:${ids}`
})

function neighborEntries() {
  const seen = new Set<string>()
  const list: Array<{
    id: string
    seed: string
    state: EmbryoDetail['state']
    edgeId: string
    type: string
    inferred: boolean
    inbound: boolean
  }> = []

  for (const c of props.embryo.connections) {
    if (seen.has(c.targetId)) continue
    seen.add(c.targetId)
    list.push({
      id: c.target.id,
      seed: c.target.seed,
      state: c.target.state,
      edgeId: c.id,
      type: c.type,
      inferred: c.detectedBy === 'AGENT' && !c.confirmedByUser,
      inbound: false,
    })
  }
  for (const c of props.embryo.connectedTo) {
    if (seen.has(c.sourceId) || c.sourceId === props.embryo.id) continue
    seen.add(c.sourceId)
    list.push({
      id: c.source.id,
      seed: c.source.seed,
      state: c.source.state,
      edgeId: c.id,
      type: c.type,
      inferred: c.detectedBy === 'AGENT' && !c.confirmedByUser,
      inbound: true,
    })
  }
  return list
}

function layout() {
  const neighbors = neighborEntries()
  const nextNodes: AiWorkflowNode[] = [
    {
      id: props.embryo.id,
      type: 'current',
      label: truncateSeed(props.embryo.seed, 36),
      position: { x: CX, y: CY },
      status: props.embryo.state === 'FOSSIL' ? 'completed' as const : 'running' as const,
      data: { state: props.embryo.state, current: true },
    },
  ]

  const n = neighbors.length
  neighbors.forEach((nb, i) => {
    const angle = n === 1 ? -Math.PI / 2 : (2 * Math.PI * i) / n - Math.PI / 2
    nextNodes.push({
      id: nb.id,
      type: nb.state === 'FOSSIL' ? 'fossil' : 'embryo',
      label: truncateSeed(nb.seed, 32),
      position: {
        x: CX + Math.cos(angle) * RADIUS,
        y: CY + Math.sin(angle) * RADIUS,
      },
      status: nb.state === 'FOSSIL' ? 'completed' as const : 'idle' as const,
      data: { state: nb.state, current: false },
    })
  })

  const nextEdges = neighbors.map((nb) => ({
    id: nb.edgeId,
    source: nb.inbound ? nb.id : props.embryo.id,
    target: nb.inbound ? props.embryo.id : nb.id,
    label: nb.type.toLowerCase(),
    animated: nb.inferred,
  }))

  fromJSON({ nodes: nextNodes, edges: nextEdges })
}

const edgeViews = computed(() =>
  edges.value.flatMap((edge) => {
    const source = nodes.value.find(n => n.id === edge.source)
    const target = nodes.value.find(n => n.id === edge.target)
    if (!source || !target) return []
    return [{
      ...edge,
      sourceX: source.position.x + NODE_W / 2,
      sourceY: source.position.y + NODE_H / 2,
      targetX: target.position.x + NODE_W / 2,
      targetY: target.position.y + NODE_H / 2,
    }]
  }),
)

watch(layoutKey, layout, { immediate: true })

function onMove(id: string, x: number, y: number) {
  moveNode(id, { x, y })
}

function onSelect(id: string) {
  selectNode(id, false)
}

function openNode(id: string) {
  if (id === props.embryo.id) return
  navigateTo(`/embryo/${id}`)
}

function fit() {
  canvasRef.value?.fitView(nodes.value.map(n => n.position))
}

function glyphFor(state: unknown) {
  const s = String(state)
  return LIFECYCLE.find(l => l.state === s)?.glyph ?? '◌'
}
</script>

<template>
  <div class="hypar-connection-graph relative">
    <AiCanvas
      ref="canvasRef"
      height="320px"
      :show-grid="true"
      :min-zoom="0.4"
      :max-zoom="2"
      @zoom="z => zoom = z"
    >
      <template #default="{ zoom: z, panX: px, panY: py }">
        <svg
          data-ai-edges
          class="overflow-visible pointer-events-none absolute inset-0 w-px h-px"
        >
          <AiEdge
            v-for="edge in edgeViews"
            :key="edge.id"
            :id="edge.id"
            :source-x="edge.sourceX"
            :source-y="edge.sourceY"
            :target-x="edge.targetX"
            :target-y="edge.targetY"
            :label="edge.label"
            :animated="edge.animated"
            :selected="selectedNodes.includes(edge.source) || selectedNodes.includes(edge.target)"
            type="bezier"
          />
        </svg>
        <AiNode
          v-for="node in nodes"
          :id="node.id"
          :key="node.id"
          :label="node.label"
          :x="node.position.x"
          :y="node.position.y"
          :type="node.type"
          :status="node.status"
          :selected="selectedNodes.includes(node.id)"
          :zoom="z"
          :pan-x="px"
          :pan-y="py"
          :draggable="true"
          @move="onMove"
          @select="onSelect"
        >
          <template #header>
            <button
              type="button"
              class="hypar-graph-node-hit"
              @dblclick.stop="openNode(node.id)"
            >
              <span class="text-[10px] font-mono">{{ glyphFor(node.data?.state) }}</span>
              <span class="text-[11px] leading-tight truncate">{{ node.label }}</span>
            </button>
          </template>
        </AiNode>
      </template>
    </AiCanvas>
    <AiControls
      class="absolute bottom-2 right-2"
      position="bottom-right"
      :zoom="zoom"
      @zoom-in="canvasRef?.zoomIn()"
      @zoom-out="canvasRef?.zoomOut()"
      @reset="canvasRef?.resetView()"
      @fit-view="fit"
    />
    <p class="px-3 py-2 text-[10px] wz-faint">
      {{ neighborEntries().length
        ? 'Dashed = inferred (unconfirmed) · solid = explicit · double-click a node to open'
        : 'Empty graph shell — connect another embryo to grow the map' }}
    </p>
  </div>
</template>
