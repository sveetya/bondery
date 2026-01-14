"use client";

import { BonderyIcon } from "@bondery/branding";
import { Anchor, Box, Button, Flex, Group, Paper, Text } from "@mantine/core";
import { IconBrandGithub, IconTopologyStar } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export function Header() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/Marilok/bondery")
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => setStars(null));
  }, []);

  return (
    <Box component="header" className="sticky top-6 z-50" mb={{ base: "lg", md: "0" }}>
      <Paper maw={1440} mx={{ base: "xs", md: "xl" }} shadow="md" py={"md"} px={"xs"}>
        <Flex justify="space-between" align="center" h="100%" px="md">
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Flex align="center" gap="xs">
              <BonderyIcon width={32} height={32} />
              <Text fw={700} size="lg" c="white">
                Bondery
              </Text>
            </Flex>
          </Link>

          {/* Navigation Links */}
          <Group gap="xl" visibleFrom="sm">
            {navLinks.map((link) => (
              <Anchor key={link.label} href={link.href} c="white">
                {link.label}
              </Anchor>
            ))}
          </Group>

          {/* Right section */}
          <Flex align="center" gap="md">
            {/* GitHub Stars */}
            <Button
              component={Link}
              href="https://github.com/Marilok/bondery"
              target="_blank"
              variant="default"
              leftSection={<IconBrandGithub size={20} />}
              loading={stars === null}
            >
              {stars !== null ? stars.toLocaleString() : "Loading..."}
            </Button>

            {/* CTA Button */}
            <Button
              component={Link}
              href="/login"
              size="md"
              leftSection={<IconTopologyStar size={20} />}
            >
              Go to app
            </Button>
          </Flex>
        </Flex>
      </Paper>
    </Box>
  );
}
