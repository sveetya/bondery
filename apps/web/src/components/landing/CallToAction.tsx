"use client";

import { Button, Card, Container, Stack, Title } from "@mantine/core";
import { IconArrowUpRight } from "@tabler/icons-react";
import Link from "next/link";

export function CallToAction() {
  return (
    <Container
      bg="var(--mantine-color-body)"
      py={{
        base: "calc(var(--mantine-spacing-lg) * 4)",
        xs: "calc(var(--mantine-spacing-lg) * 5)",
        lg: "calc(var(--mantine-spacing-lg) * 6)",
      }}
      fluid
    >
      <Container size="lg">
        <Card
          mih={400}
          p="xl"
          bg="var(--mantine-primary-color-filled)"
          className="flex justify-center items-center"
        >
          <Stack align="center" justify="center" h="100%" flex={1} p="xl" className="gap-y-12!">
            <Title order={2} ta="center" fw={"bold"} className="text-3xl!" c={"white"} maw="80%">
              Ready to organize your network? Start building meaningful connections today.
            </Title>
            <Button
              component={Link}
              href="/login"
              size="lg"
              rightSection={<IconArrowUpRight />}
              variant="white"
            >
              Start building connections
            </Button>
          </Stack>
        </Card>
      </Container>
    </Container>
  );
}
