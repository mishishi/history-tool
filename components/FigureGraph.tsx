'use client';

/**
 * FigureGraph — 人物关系图谱 client component
 *
 * 力学布局用 d3-force(react-flow 12 原生支持 d3-force 作 layout)
 * 节点样式:按 count 字号、按 dynasty 边框色
 * 节点点击 → 跳 /figures/[name]
 * 边粗细 = weight,weight≥2 加 label
 */
import { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
} from 'd3-force';
import Link from 'next/link';
import { findDynasty } from '@/lib/dynasties';
import type { FigureGraphNode, FigureGraphEdge } from '@/lib/figures-graph';

/* ===== 自定义节点 ===== */
interface FigureNodeData extends Record<string, unknown> {
  name: string;
  count: number;
  dynastyColor: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
}

function FigureNode({ data }: NodeProps<Node<FigureNodeData>>) {
  const { name, count, dynastyColor, size } = data;
  const sizeClass = {
    sm: 'px-2 py-1 text-xs min-w-[60px]',
    md: 'px-3 py-1.5 text-sm min-w-[80px]',
    lg: 'px-4 py-2 text-base min-w-[100px]',
    xl: 'px-5 py-2.5 text-lg font-semibold min-w-[120px]',
  }[size];
  return (
    <Link
      href={`/figures/${encodeURIComponent(name)}`}
      className={`block bg-paper-card border-2 ${sizeClass} text-ink text-center rounded-sm shadow-sm hover:shadow-md transition-shadow no-underline`}
      style={{ borderColor: dynastyColor }}
      onClick={(e) => e.stopPropagation()}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div className="leading-tight">{name}</div>
      <div
        className="text-[10px] mt-0.5 tabular-nums opacity-60"
        style={{ color: dynastyColor }}
      >
        ×{count}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </Link>
  );
}

const nodeTypes = { figure: FigureNode };

/* ===== 客户端辅助(client-safe) ===== */
function nodeColor(dynastyName: string): string {
  return findDynasty(dynastyName)?.primary || '#5A5A5A';
}

function nodeSize(count: number): 'sm' | 'md' | 'lg' | 'xl' {
  if (count >= 5) return 'xl';
  if (count >= 3) return 'lg';
  if (count >= 2) return 'md';
  return 'sm';
}

/* ===== 力学布局 — d3-force (强类型,无 any) ===== */
function applyForceLayout(
  nodes: Node[],
  edges: Edge[],
  width: number,
  height: number,
): { nodes: Node[]; edges: Edge[] } {
  // 节点类型: react-flow Node 扩展 SimulationNodeDatum (x/y/vx/vy 由 d3 写入)
  type SimNode = Node & SimulationNodeDatum;
  // 边类型: d3-force forceLink 在 forceSimulation 跑过后,source/target 会被替换为 NodeDatum
  // (即 { index, x, y, vx, vy, id }) — 所以回调里 source/target 可能是 string 或 {id}
  type SimEdge = { source: string | SimNode; target: string | SimNode };

  // 复制节点 + 螺旋初始位置(避免 d3 第一次 tick 时发散)
  const simNodes: SimNode[] = nodes.map((n, i) => {
    const angle = i * 0.5;
    const radius = Math.sqrt(i) * 30;
    return {
      ...n,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
  });
  const simEdges: SimEdge[] = edges.map((e) => ({ source: e.source, target: e.target }));

  // 节点半径(用于 collision force)— 大节点半径更大
  const nodeRadius = (n: SimNode) => {
    const size = (n.data as FigureNodeData | undefined)?.size;
    return { sm: 30, md: 40, lg: 55, xl: 70 }[size || 'sm'];
  };

  const sim = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimEdge>(simEdges)
        .id((d) => d.id)
        .distance((l) => {
          const sId = typeof l.source === 'string' ? l.source : l.source.id;
          const tId = typeof l.target === 'string' ? l.target : l.target.id;
          const w = Number(edges.find((oe) => oe.source === sId && oe.target === tId)?.data?.weight || 1);
          return Math.max(60, 180 - w * 25);
        })
        .strength((l) => {
          const w = Number(edges.find((oe) => oe.source === l.source && oe.target === l.target)?.data?.weight || 1);
          return Math.min(0.7, 0.1 + 0.2 * w);
        }),
    )
    .force('charge', forceManyBody<SimNode>().strength(-300))
    .force('center', forceCenter<SimNode>(width / 2, height / 2))
    .force('x', forceX<SimNode>(width / 2).strength(0.05))
    .force('y', forceY<SimNode>(height / 2).strength(0.05))
    .force('collision', forceCollide<SimNode>().radius((n) => nodeRadius(n) + 8))
    .stop();

  const ticks = 500;
  for (let i = 0; i < ticks; i++) sim.tick();

  const positioned = nodes.map((n) => {
    const simNode = simNodes.find((s) => s.id === n.id)!;
    return { ...n, position: { x: simNode.x ?? width / 2, y: simNode.y ?? height / 2 } };
  });

  return { nodes: positioned, edges };
}

/* ===== 边样式函数 ===== */
function buildEdgeStyle(edge: FigureGraphEdge, dark: boolean): Edge {
  const w = edge.weight;
  const opacity = w >= 3 ? 0.6 : w >= 2 ? 0.4 : 0.2;
  const strokeWidth = w >= 3 ? 2 : w >= 2 ? 1.5 : 1;
  return {
    id: `${edge.source}::${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: 'default',
    animated: false,
    style: {
      stroke: dark ? '#A8895C' : '#5A5A5A',
      strokeWidth,
      opacity,
    },
    label: w >= 2 ? `×${w}` : undefined,
    labelStyle: { fontSize: 10, fill: dark ? '#D4C19C' : '#1A1A1A' },
    labelBgStyle: { fill: dark ? '#1F1B16' : '#FAF6EE', fillOpacity: 0.85 },
    markerEnd: { type: MarkerType.ArrowClosed, color: dark ? '#A8895C' : '#5A5A5A' },
    data: { weight: w },
  };
}

/* ===== 主组件 ===== */
export default function FigureGraph({
  graph,
}: {
  graph: { nodes: FigureGraphNode[]; edges: FigureGraphEdge[] };
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 检测 dark mode
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // 转换 + 应用布局
  useEffect(() => {
    const W = 1200;
    const H = 800;
    const initialNodes: Node<FigureNodeData>[] = graph.nodes.map((n) => ({
      id: n.id,
      type: 'figure',
      position: { x: 0, y: 0 },
      data: {
        name: n.name,
        count: n.count,
        dynastyColor: nodeColor(n.dynasties[0] || ''),
        size: nodeSize(n.count),
      },
    }));
    const initialEdges: Edge[] = graph.edges.map((e) => buildEdgeStyle(e, isDark));
    const positioned = applyForceLayout(initialNodes, initialEdges, W, H);
    setNodes(positioned.nodes);
    setEdges(positioned.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const onInit = useCallback(() => {
    // ready
  }, []);

  return (
    <div className="w-full h-[80vh] min-h-[600px] border border-border rounded-sm overflow-hidden bg-paper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-paper-card !border !border-border !shadow-sm"
        />
        <MiniMap
          nodeColor={(n) => (n.data as FigureNodeData)?.dynastyColor || '#5A5A5A'}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-paper-card !border !border-border"
        />
      </ReactFlow>
    </div>
  );
}
