import { Container, Title, Stack, Group } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import { ProfileCard } from "./components/ProfileCard";
import { DataManagementCard } from "./components/DataManagementCard";

export default async function SettingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/account`, {
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/login");
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const user = result.data;

  const {
    user_metadata: { name, middlename, surname, avatar_url: avatarUrl } = {},
    app_metadata: { providers } = {},
    email,
  } = user;

  return (
    <Container size="md">
      <Stack gap="xl">
        <Group gap="sm">
          <IconSettings size={32} stroke={1.5} />
          <Title order={1}>Settings</Title>
        </Group>

        <ProfileCard
          initialName={name}
          initialMiddlename={middlename}
          initialSurname={surname}
          email={email}
          avatarUrl={avatarUrl}
          providers={providers}
        />

        <DataManagementCard email={email} />
      </Stack>
    </Container>
  );
}
