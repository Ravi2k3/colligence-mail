import { useEffect, useRef } from "react"

// ── Constellation canvas ─────────────────────────────────────────────────────

const NODE_COUNT = 60
const CONNECTION_DISTANCE = 140
const NODE_SPEED = 0.3

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  phase: number
}

function createNodes(width: number, height: number): Node[] {
  const nodes: Node[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * NODE_SPEED * (0.5 + Math.random() * 0.5),
      vy: Math.sin(angle) * NODE_SPEED * (0.5 + Math.random() * 0.5),
      radius: 1.2 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return nodes
}

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const nodesRef = useRef<Node[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize(): void {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas!.getBoundingClientRect()
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      nodesRef.current = createNodes(rect.width, rect.height)
    }

    resize()
    window.addEventListener("resize", resize)

    let time = 0

    function animate(): void {
      const rect = canvas!.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      ctx!.clearRect(0, 0, w, h)
      time += 0.01

      const nodes = nodesRef.current

      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > w) node.vx *= -1
        if (node.y < 0 || node.y > h) node.vy *= -1

        node.x = Math.max(0, Math.min(w, node.x))
        node.y = Math.max(0, Math.min(h, node.y))
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15
            ctx!.beginPath()
            ctx!.moveTo(nodes[i].x, nodes[i].y)
            ctx!.lineTo(nodes[j].x, nodes[j].y)
            ctx!.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      for (const node of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + node.phase)
        const opacity = 0.2 + pulse * 0.4

        ctx!.beginPath()
        ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx!.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full"
    />
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function BrandingPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-neutral-950 lg:block">
      <ConstellationCanvas />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(10,10,10,0.7)_100%)]" />

      {/* Big centered text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-12">
        <h2 className="text-center text-5xl font-bold leading-tight tracking-tight text-white/90">
          Every email.
          <br />
          One search away.
        </h2>
        <p className="max-w-sm text-center text-base leading-relaxed text-neutral-400">
          Connect your accounts. Colligence threads, indexes, and understands
          your email so you never lose anything again.
        </p>
      </div>

      {/* Bottom domain */}
      <div className="absolute inset-x-0 bottom-0 p-8">
        <p className="text-xs text-neutral-600">colligence.ai</p>
      </div>
    </div>
  )
}
