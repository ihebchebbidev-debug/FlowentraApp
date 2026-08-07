import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
}

interface AnimatedBackgroundProps {
  className?: string;
}

export function AnimatedBackground({ className = "" }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeNodes();
    };

    const initializeNodes = () => {
      const nodeCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 15000));
      nodesRef.current = [];
      
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          connections: []
        });
      }
    };

    const updateNodes = () => {
      nodesRef.current.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });
    };

    const findConnections = () => {
      const maxDistance = 120;
      
      nodesRef.current.forEach((node, i) => {
        node.connections = [];
        nodesRef.current.forEach((otherNode, j) => {
          if (i !== j) {
            const distance = Math.sqrt(
              Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
            );
            if (distance < maxDistance) {
              node.connections.push(j);
            }
          }
        });
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get CSS custom property values for colors
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryColor = computedStyle.getPropertyValue('--primary').trim();
      const accentColor = computedStyle.getPropertyValue('--accent').trim();
      
      // Convert HSL values to usable format
      const primaryHSL = `hsl(${primaryColor})`;
      const accentHSL = `hsl(${accentColor})`;

      // Draw connections
      nodesRef.current.forEach((node, i) => {
        node.connections.forEach(connectionIndex => {
          const connectedNode = nodesRef.current[connectionIndex];
          const distance = Math.sqrt(
            Math.pow(node.x - connectedNode.x, 2) + Math.pow(node.y - connectedNode.y, 2)
          );
          
          const opacity = Math.max(0, 1 - distance / 120) * 0.3;
          
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.strokeStyle = `${primaryHSL.replace(')', `, ${opacity})`)}`;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // Draw nodes
      nodesRef.current.forEach((node, i) => {
        const pulseScale = 1 + Math.sin(Date.now() * 0.002 + i * 0.5) * 0.2;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = node.connections.length > 2 ? accentHSL : primaryHSL;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        
        // Add glow effect
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4 * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = node.connections.length > 2 ? accentHSL : primaryHSL;
        ctx.globalAlpha = 0.1;
        ctx.fill();
        
        ctx.globalAlpha = 1;
      });
    };

    const animate = () => {
      updateNodes();
      findConnections();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ opacity: 0.6 }}
    />
  );
}