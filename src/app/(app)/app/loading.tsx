import { Center, Loader, Stack, Text } from "@mantine/core";

export default function Loading() {
  return (
    <Center h="100%">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed" size="sm">
          Loading...
        </Text>
      </Stack>
    </Center>
  );
}
