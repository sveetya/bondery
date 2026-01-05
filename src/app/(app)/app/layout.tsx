"use client";

import {
  AppShell,
  Avatar,
  Group,
  Text,
  Stack,
  NavLink,
  Box,
} from "@mantine/core";
import {
  IconUsers,
  IconSettings,
  IconTopologyFull,
  IconChartDots3,
  IconMap,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/api/account");
        const result = await response.json();

        if (response.ok && result.success) {
          const user = result.data;
          const firstName = user.user_metadata?.name || "";
          const middleName = user.user_metadata?.middlename || "";
          const lastName = user.user_metadata?.surname || "";
          const fullName = [firstName, middleName, lastName]
            .filter(Boolean)
            .join(" ");
          setUserName(fullName || user.email || "User");
          setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 280,
        breakpoint: "sm",
      }}
    >
      <AppShell.Navbar p="md">
        <AppShell.Section>
          {/* Branding Card */}
          <Group mb="md">
            <Avatar
              src={null}
              alt="Bondee logo"
              color="violet"
              radius="xl"
              size="md"
            >
              B
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={600}>
                Bondee
              </Text>
              <Text size="xs" c="dimmed">
                Build bonds that last
              </Text>
            </Box>
          </Group>
        </AppShell.Section>

        <AppShell.Section grow>
          {/* Navigation Links */}
          <Stack gap="xs">
            <NavLink
              component={Link}
              href="/app/relationships"
              label="Relationships"
              leftSection={<IconTopologyFull size={20} stroke={1.5} />}
              active={pathname === "/app/relationships"}
            />
            <NavLink
              component={Link}
              href="/app/network"
              label="Network Graph"
              leftSection={<IconChartDots3 size={20} stroke={1.5} />}
              active={pathname === "/app/network"}
            />
            <NavLink
              component={Link}
              href="/app/map"
              label="Map"
              leftSection={<IconMap size={20} stroke={1.5} />}
              active={pathname === "/app/map"}
            />
            <NavLink
              component={Link}
              href="/app/settings"
              label="Settings"
              leftSection={<IconSettings size={20} stroke={1.5} />}
              active={pathname === "/app/settings"}
            />
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          {/* User Avatar Card */}
          <Group>
            <Avatar
              src={avatarUrl}
              alt="User avatar"
              color="blue"
              radius="xl"
              size="md"
              name={userName}
            />
            <Text size="sm" fw={500}>
              {userName}
            </Text>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
