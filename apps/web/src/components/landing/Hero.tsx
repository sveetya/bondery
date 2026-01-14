"use client";

import { useEffect, useRef } from "react";
import { Box, Button, Container, Flex, Grid, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconBrandGithub,
  IconRocket,
  IconNetwork,
  IconCalendar,
  IconUsers,
  IconTopologyStar,
  IconTopologyStar2,
  IconTopologyStarRing2,
} from "@tabler/icons-react";
import Link from "next/link";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: Particle[] = [];
    const particleCount = 60;
    const maxDistance = 100;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    function animate() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = (1 - distance / maxDistance) * 0.25;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <Box className="min-h-[calc(100vh-60px)] flex items-center ">
      <Container size="xl" py={{ base: "xl", md: "calc(var(--mantine-spacing-xl) * 3)" }}>
        <Grid gutter={{ base: "xl", md: "calc(var(--mantine-spacing-xl) * 2)" }} align="center">
          {/* Left Content */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg">
              {/* Title */}
              <Title
                order={1}
                c="primary"
                className="text-5xl md:text-6xl font-extrabold leading-tight "
              >
                Never forget the details about people who matter
              </Title>

              {/* Description */}
              <Text size="lg" c="dimmed" maw={500}>
                Track relationships, remember details, and stay connected with the people in your
                life, all in one place.
              </Text>

              {/* CTA Buttons */}
              <Group mt="md">
                <Button
                  component={Link}
                  href="/login"
                  size="lg"
                  leftSection={<IconTopologyStar size={20} />}
                >
                  Get started
                </Button>
                <Button component="a" href="#features" size="lg" variant="default">
                  Learn more
                </Button>
              </Group>
            </Stack>
          </Grid.Col>

          {/* Right Content - Network Animation */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box className="relative w-full h-100 bg-white dark:bg-dark-6 rounded-lg shadow-xl overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
