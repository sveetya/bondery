"use client";

import { BonderyIcon } from "@bondery/branding";
import { Anchor, Box, Container, Divider, Flex, Grid, Text } from "@mantine/core";
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
    <Text fw="bold" mb="sm">
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
    <Container
      component="footer"
      fluid
      style={{
        backgroundColor: "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
        borderTop: "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))",
      }}
    >
      <Container
        size="xl"
        px={0}
        py={{
          base: "xl",
          sm: "calc(var(--mantine-spacing-xl) * 2)",
        }}
      >
        <Grid gutter="xl" mb="xl">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <LinkGroup
              title="About app"
              links={[
                { title: "Features", href: "#features" },
                { title: "Pricing", href: "#pricing" },
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <LinkGroup
              title="About us"
              links={[
                { title: "Privacy Policy", href: "#privacy" },
                { title: "Terms of Service", href: "#terms" },
              ]}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
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
          </Grid.Col>
        </Grid>
        <Divider my="xl" />
        <Grid align="center">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Flex align="center" gap="xs">
                <BonderyIcon width={28} height={28} />
                <Text fw={700} size="md">
                  Bondery
                </Text>
              </Flex>
            </Link>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text size="xs" c="dimmed" ta="center">
              © {new Date().getFullYear()} Bondery. All rights reserved.
            </Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text size="xs" c="dimmed" ta="right">
              Made with 💜 for meaningful connections
            </Text>
          </Grid.Col>
        </Grid>
      </Container>
    </Container>
  );
}
