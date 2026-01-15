"use client";

import { Box, Button, Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { IconTopologyStar } from "@tabler/icons-react";
import Link from "next/link";
import { ROUTES } from "@/lib/config";
import { AnimatedPeople } from "@/components/landing/AnimatedPeople";

export function Hero() {
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
                c="white"
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
                  href={ROUTES.LOGIN}
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

          {/* Right Content - Animated People Examples */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <AnimatedPeople />
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
