import { useRef, useEffect, useMemo, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildFileGraph } from '../lib/wikilinks';
import type { FileNode } from '../lib/wikilinks';

interface GraphViewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function GraphView({ isOpen, onClose }: GraphViewProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<FileNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const positionsRef = useRef<NodePosition[]>([]);
  const animRef = useRef<number>(0);

  const allFolders = useMemo(
    () => state.projects.flatMap((p) => p.folders),
    [state.projects]
  );

  const graph = useMemo(() => buildFileGraph(allFolders), [allFolders]);

  // Force-directed layout simulation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize positions
    const w = canvas.width;
    const h = canvas.height;
    if (positionsRef.current.length !== graph.nodes.length) {
      positionsRef.current = graph.nodes.map((node) => ({
        id: node.id,
        x: w / 2 + (Math.random() - 0.5) * w * 0.6,
        y: h / 2 + (Math.random() - 0.5) * h * 0.6,
        vx: 0,
        vy: 0,
      }));
    }

    const positions = positionsRef.current;
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    function simulate() {
      // Repulsion between all nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 3000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          positions[i].vx -= fx;
          positions[i].vy -= fy;
          positions[j].vx += fx;
          positions[j].vy += fy;
        }
      }

      // Attraction along edges
      const posMap = new Map(positions.map((p) => [p.id, p]));
      for (const edge of graph.edges) {
        const a = posMap.get(edge.from);
        const b = posMap.get(edge.to);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - 120) * 0.01;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      for (const p of positions) {
        p.vx += (w / 2 - p.x) * 0.001;
        p.vy += (h / 2 - p.y) * 0.001;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(20, Math.min(w - 20, p.x));
        p.y = Math.max(20, Math.min(h - 20, p.y));
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const posMap = new Map(positions.map((p) => [p.id, p]));

      // Draw edges
      ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      for (const edge of graph.edges) {
        const a = posMap.get(edge.from);
        const b = posMap.get(edge.to);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Draw nodes
      for (const pos of positions) {
        const node = nodeMap.get(pos.id);
        if (!node) continue;
        const isConnected = node.links.length > 0 || node.backlinks.length > 0;
        const isHovered = hoveredNode?.id === pos.id;
        const radius = isHovered ? 8 : isConnected ? 6 : 4;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? '#818cf8'
          : isConnected
            ? '#6366f1'
            : isDark ? '#4b5563' : '#9ca3af';
        ctx.fill();

        // Label
        if (isHovered || isConnected) {
          ctx.font = `${isHovered ? '12' : '10'}px system-ui, sans-serif`;
          ctx.fillStyle = isDark ? '#e5e7eb' : '#374151';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, pos.x, pos.y - radius - 4);
        }
      }
    }

    function loop() {
      simulate();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    loop();

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: FileNode | null = null;
      for (const pos of positions) {
        const dx = mx - pos.x;
        const dy = my - pos.y;
        if (dx * dx + dy * dy < 100) {
          found = nodeMap.get(pos.id) || null;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen, graph, isDark, hoveredNode]);

  if (!isOpen) return null;

  const connectedCount = graph.nodes.filter((n) => n.links.length > 0 || n.backlinks.length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Graphe de connexions"
    >
      <div
        className={`border rounded-xl shadow-2xl flex flex-col mx-4 animate-slideDown overflow-hidden ${
          isFullscreen ? 'w-full h-full max-w-none max-h-none m-0 rounded-none' : 'w-full max-w-4xl max-h-[85vh]'
        } ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-base font-semibold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Graphe de connexions
          </h2>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {graph.nodes.length} fichiers, {graph.edges.length} liens, {connectedCount} connectes
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label={isFullscreen ? 'Reduire' : 'Plein ecran'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative min-h-[400px]">
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Hovered node info */}
          {hoveredNode && (
            <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg text-xs shadow-lg ${
              isDark ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <div className="font-semibold">{hoveredNode.title}</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {hoveredNode.links.length} lien(s) sortant(s), {hoveredNode.backlinks.length} lien(s) entrant(s)
              </div>
              <div className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                {hoveredNode.folderName}
              </div>
            </div>
          )}

          {/* Empty state */}
          {graph.edges.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-sm mb-1">Aucun lien detecte</p>
                <p className="text-xs">Utilisez la syntaxe <code className={`px-1 py-0.5 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>[[nom du fichier]]</code> dans vos fichiers</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
