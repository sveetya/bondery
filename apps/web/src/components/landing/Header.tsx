"use client";

import {
  Anchor,
  Box,
  Button,
  Flex,
  Group,
  Paper,
  ActionIcon,
  Drawer,
  Stack,
  Burger,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGithub, IconTopologyStar, IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export function Header() {
  const [stars, setStars] = useState<number | null>(null);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

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
          <Logo iconSize={32} textSize="lg" />

          {/* Navigation Links */}
          <Group gap="xl" visibleFrom="sm">
            {navLinks.map((link) => (
              <Anchor key={link.label} href={link.href} c="white">
                {link.label}
              </Anchor>
            ))}
          </Group>

          {/* Right section - Desktop */}
          <Flex align="center" gap="md" visibleFrom="sm">
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

          {/* Burger menu - Mobile */}
          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" color="white" />
        </Flex>
      </Paper>

      {/* Mobile Drawer */}
      <Drawer.Root
        opened={drawerOpened}
        onClose={closeDrawer}
        position="right"
        hiddenFrom="sm"
        size="xs"
      >
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title />
            <ActionIcon
              variant="default"
              size="xl"
              aria-label="Close menu"
              onClick={closeDrawer}
              mt={"md"}
            >
              <IconX size={24} />
            </ActionIcon>
          </Drawer.Header>
          <Drawer.Body>
            <Flex direction="column" gap="lg">
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Anchor key={link.label} href={link.href} c="white" size="lg" onClick={closeDrawer}>
                  {link.label}
                </Anchor>
              ))}

              {/* Buttons Stack */}
              <Stack gap="xs">
                {/* GitHub Stars */}
                <Button
                  component={Link}
                  href="https://github.com/Marilok/bondery"
                  target="_blank"
                  variant="default"
                  leftSection={<IconBrandGithub size={20} />}
                  loading={stars === null}
                  fullWidth
                >
                  {stars !== null ? stars.toLocaleString() : "Loading..."}
                </Button>

                {/* CTA Button */}
                <Button
                  component={Link}
                  href="/login"
                  size="md"
                  leftSection={<IconTopologyStar size={20} />}
                  fullWidth
                >
                  Go to app
                </Button>
              </Stack>
            </Flex>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </Box>
  );
}
