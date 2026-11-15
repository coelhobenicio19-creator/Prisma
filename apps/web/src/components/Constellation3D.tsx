import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  z: number;
}
export function Constellation3D({
  className = "",
  paused = false,
}: {
  className?: string;
  paused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const context = ctx;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let w = 0,
      h = 0,
      frame = 0,
      angle = 0.45,
      visible = true,
      lastTime = 0;
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const points: Point[] = Array.from({ length: 135 }, (_, i) => {
      const y = 1 - (i / 134) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
    });
    const links = points.flatMap((a, i) =>
      points
        .slice(i + 1)
        .map((b, j) => ({
          a: i,
          b: i + j + 1,
          d: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
        }))
        .filter((line) => line.d < 0.36),
    );
    function project(point: Point, rotation = angle) {
      const x = point.x * Math.cos(rotation) + point.z * Math.sin(rotation);
      const z = -point.x * Math.sin(rotation) + point.z * Math.cos(rotation);
      const y =
        point.y * Math.cos(-0.23 + tilt.y) - z * Math.sin(-0.23 + tilt.y);
      const zz =
        point.y * Math.sin(-0.23 + tilt.y) + z * Math.cos(-0.23 + tilt.y);
      const perspective = 3.8 / (3.8 - zz);
      const radius = Math.min(w * 0.38, h * 0.36);
      return {
        x: w * 0.5 + x * radius * perspective + tilt.x * 35,
        y: h * 0.49 + y * radius * perspective,
        z: zz,
        scale: perspective,
      };
    }
    function draw(time: number) {
      context.clearRect(0, 0, w, h);
      const reduced = media.matches;
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 0;
      lastTime = time;
      if (!paused && !reduced) angle += elapsed * 0.000065;
      tilt.x += (pointer.x - tilt.x) * 0.035;
      tilt.y += (pointer.y - tilt.y) * 0.035;
      const radius = Math.min(w * 0.38, h * 0.36);
      const glow = context.createRadialGradient(
        w * 0.5,
        h * 0.49,
        0,
        w * 0.5,
        h * 0.49,
        radius * 1.6,
      );
      glow.addColorStop(0, "rgba(151,190,166,.08)");
      glow.addColorStop(0.6, "rgba(151,190,166,.025)");
      glow.addColorStop(1, "rgba(151,190,166,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, w, h);
      // Deterministic distant stars; the globe remains the only focal object.
      for (let i = 0; i < 48; i++) {
        const x = (((i * 7919) % 997) / 997) * w;
        const y = (((i * 3571) % 991) / 991) * h;
        context.fillStyle = `rgba(189,211,198,${0.08 + (i % 4) * 0.025})`;
        context.beginPath();
        context.arc(x, y, i % 7 === 0 ? 1 : 0.5, 0, Math.PI * 2);
        context.fill();
      }
      // Three spatial orbital paths with front/back depth variation.
      for (let orbit = 0; orbit < 3; orbit++) {
        let prev: ReturnType<typeof project> | null = null;
        for (let j = 0; j <= 150; j++) {
          const a = (j / 150) * Math.PI * 2;
          const inclination = 0.35 + orbit * 0.85;
          const v = {
            x: Math.cos(a) * 1.36,
            y: Math.sin(a) * Math.cos(inclination) * 1.36,
            z: Math.sin(a) * Math.sin(inclination) * 1.36,
          };
          const p = project(v, angle * 0.3 + orbit * 0.7);
          if (prev) {
            context.strokeStyle = `rgba(176,205,187,${p.z > 0 ? 0.17 : 0.055})`;
            context.lineWidth = 0.6;
            context.beginPath();
            context.moveTo(prev.x, prev.y);
            context.lineTo(p.x, p.y);
            context.stroke();
          }
          if (j === (orbit * 37 + Math.floor(angle * 9)) % 150) {
            context.fillStyle = "#d8e7d8";
            context.beginPath();
            context.arc(p.x, p.y, 2, 0, Math.PI * 2);
            context.fill();
          }
          prev = p;
        }
      }
      const projected = points.map((p) => project(p, angle + tilt.x * 0.2));
      for (const link of links) {
        const a = projected[link.a],
          b = projected[link.b];
        const depth = (a.z + b.z) / 2;
        context.strokeStyle = `rgba(174,207,187,${0.045 + Math.max(0, (depth + 1) / 2) * 0.23})`;
        context.lineWidth = depth > 0.3 ? 0.7 : 0.45;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
      projected
        .map((p, i) => ({ ...p, i }))
        .sort((a, b) => a.z - b.z)
        .forEach((p) => {
          const front = (p.z + 1) / 2;
          const hub = p.i % 17 === 0;
          const r = (hub ? 3.1 : 1.1) * p.scale;
          if (hub && front > 0.3) {
            const halo = context.createRadialGradient(
              p.x,
              p.y,
              0,
              p.x,
              p.y,
              r * 7,
            );
            halo.addColorStop(0, "rgba(187,222,194,.24)");
            halo.addColorStop(1, "rgba(187,222,194,0)");
            context.fillStyle = halo;
            context.beginPath();
            context.arc(p.x, p.y, r * 7, 0, Math.PI * 2);
            context.fill();
          }
          context.fillStyle = `rgba(212,233,213,${0.16 + front * 0.76})`;
          context.beginPath();
          context.arc(p.x, p.y, r, 0, Math.PI * 2);
          context.fill();
        });
      // Editorial satellite labels, anchored to the projected sphere.
      const labels = [
        { index: 19, text: "MATEMÁTICA" },
        { index: 65, text: "FÍSICA" },
        { index: 103, text: "BIOLOGIA" },
      ];
      context.font = "8px Inter, sans-serif";
      context.textBaseline = "middle";
      labels.forEach(({ index, text }) => {
        const p = projected[index];
        if (p.z < -0.55) return;
        const sign = p.x > w * 0.5 ? 1 : -1;
        const endX = p.x + sign * 30;
        context.strokeStyle = "rgba(176,205,187,.3)";
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(endX, p.y - 16);
        context.lineTo(endX + sign * 17, p.y - 16);
        context.stroke();
        context.textAlign = sign > 0 ? "left" : "right";
        context.fillStyle = "rgba(198,217,204,.7)";
        context.fillText(text, endX + sign * 23, p.y - 16);
      });
      if (visible && !document.hidden && !paused && !reduced)
        frame = requestAnimationFrame(draw);
    }
    function restart() {
      cancelAnimationFrame(frame);
      lastTime = 0;
      draw(performance.now());
    }
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      w = bounds.width;
      h = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      restart();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) restart();
      else cancelAnimationFrame(frame);
    });
    intersection.observe(canvas);
    const move = (event: PointerEvent) => {
      if (media.matches || paused) return;
      const bounds = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.3;
    };
    const leave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", restart);
    media.addEventListener("change", restart);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", restart);
      media.removeEventListener("change", restart);
    };
  }, [paused]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
