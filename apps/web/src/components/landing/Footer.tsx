"use client";

import { BonderyIcon } from "@bondery/branding";
import { Anchor, Box, Divider, Flex, Paper, Text } from "@mantine/core";
import { IconBrandGithubFilled, IconBrandLinkedinFilled } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";

type LinkItem = {
  title: ReactNode;
  href: string;
  target?: string;
};

type LinkGroupItem = {
  title: string;
  links: LinkItem[];
};

const LinkGroup = ({ title, links }: LinkGroupItem) => (
  <Box>
    <Text fw="bold" mb="xs">
      {title}
    </Text>
    {links.map((link) => (
      <Anchor
        c="dimmed"
        target={link.target}
        display="block"
        fz="sm"
        href={link.href}
        key={link.href}
        py={4}
      >
        {link.title}
      </Anchor>
    ))}
  </Box>
);

export function Footer() {
  return (
    <Box component="footer" mb={"xl"}>
      <Paper
        maw={1440}
        mx={{ base: "xs", md: "xl" }}
        shadow="md"
        radius="md"
        withBorder
        p={"xl"}
        style={{
          backgroundColor: "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
        }}
      >
        <Flex gap={{ base: "lg" }} mb="xl" wrap="wrap" px="md">
          <Box style={{ minWidth: "200px" }}>
            <LinkGroup
              title="About app"
              links={[
                { title: "Features", href: "#features" },
                { title: "Pricing", href: "#pricing" },
              ]}
            />
          </Box>
          <Box style={{ minWidth: "200px" }}>
            <LinkGroup
              title="About us"
              links={[
                { title: "Privacy Policy", href: "#privacy" },
                { title: "Terms of Service", href: "#terms" },
              ]}
            />
          </Box>
          <Box style={{ minWidth: "200px" }}>
            <LinkGroup
              title="Connect with us"
              links={[
                {
                  title: (
                    <Flex align="center" gap={4}>
                      <IconBrandGithubFilled size={16} /> GitHub
                    </Flex>
                  ),
                  href: "https://github.com/Marilok/bondery",
                  target: "_blank",
                },
                {
                  title: (
                    <Flex align="center" gap={4}>
                      <IconBrandLinkedinFilled size={16} /> LinkedIn
                    </Flex>
                  ),
                  href: "https://www.linkedin.com/company/bondery",
                  target: "_blank",
                },
              ]}
            />
          </Box>
        </Flex>
        <Divider my="xl" />
        <Flex justify="space-between" align="center" px="md">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Flex align="center" gap="xs">
              <BonderyIcon width={28} height={28} />
              <Text fw={700} size="md" c="white">
                Bondery
              </Text>
            </Flex>
          </Link>
          <Text size="xs" c="dimmed" ta="right">
            Made with 💜 for meaningful connections
          </Text>
        </Flex>
      </Paper>
    </Box>
  );
}
