"use client";

import {
  Text,
  TextInput,
  Button,
  Group,
  Divider,
  Card,
  Avatar,
  Stack,
  Modal,
} from "@mantine/core";
import {
  IconUser,
  IconMail,
  IconUserCircle,
  IconBrandGithub,
  IconBrandLinkedin,
  IconUnlink,
  IconLink,
  IconLinkOff,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { INPUT_MAX_LENGTHS } from "@/lib/config";

interface ProfileCardProps {
  initialName: string;
  initialMiddlename: string;
  initialSurname: string;
  email: string;
  avatarUrl: string | null;
  providers: string[];
}

export function ProfileCard({
  initialName,
  initialMiddlename,
  initialSurname,
  email,
  avatarUrl,
  providers: initialProviders,
}: ProfileCardProps) {
  const [name, setName] = useState(initialName);
  const [middlename, setMiddlename] = useState(initialMiddlename);
  const [surname, setSurname] = useState(initialSurname);
  const [providers, setProviders] = useState<string[]>(initialProviders);
  const [linkingGithub, setLinkingGithub] = useState(false);
  const [linkingLinkedin, setLinkingLinkedin] = useState(false);
  const [unlinkingGithub, setUnlinkingGithub] = useState(false);
  const [unlinkingLinkedin, setUnlinkingLinkedin] = useState(false);
  const [unlinkOpened, { open: openUnlink, close: closeUnlink }] =
    useDisclosure(false);
  const [providerToUnlink, setProviderToUnlink] = useState<
    "github" | "linkedin" | null
  >(null);
  const [originalName, setOriginalName] = useState(initialName);
  const [originalMiddlename, setOriginalMiddlename] =
    useState(initialMiddlename);
  const [originalSurname, setOriginalSurname] = useState(initialSurname);
  const [nameError, setNameError] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [middlenameFocused, setMiddlenameFocused] = useState(false);
  const [surnameFocused, setSurnameFocused] = useState(false);

  const linkProvider = async (provider: "github" | "linkedin") => {
    try {
      if (provider === "github") {
        setLinkingGithub(true);
      } else {
        setLinkingLinkedin(true);
      }

      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data, error } = await supabase.auth.linkIdentity({
        provider: provider === "linkedin" ? "linkedin_oidc" : provider,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : `Failed to link ${provider}`,
        color: "red",
      });
    } finally {
      if (provider === "github") {
        setLinkingGithub(false);
      } else {
        setLinkingLinkedin(false);
      }
    }
  };

  const handleUnlinkClick = (provider: "github" | "linkedin") => {
    if (providers.length <= 1) {
      notifications.show({
        title: "Cannot unlink",
        message: "You must have at least one authentication method",
        color: "red",
      });
      return;
    }
    setProviderToUnlink(provider);
    openUnlink();
  };

  const confirmUnlinkProvider = async () => {
    if (!providerToUnlink) return;

    const provider = providerToUnlink;

    try {
      closeUnlink();
      if (provider === "github") {
        setUnlinkingGithub(true);
      } else {
        setUnlinkingLinkedin(true);
      }

      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      // Retrieve all identities linked to the user
      const { data: identities, error: identitiesError } =
        await supabase.auth.getUserIdentities();

      if (identitiesError) {
        throw new Error(identitiesError.message);
      }

      // Find the identity to unlink
      const providerName = provider === "linkedin" ? "linkedin_oidc" : provider;
      const targetIdentity = identities.identities.find(
        (identity) => identity.provider === providerName
      );

      if (!targetIdentity) {
        throw new Error(`${provider} identity not found`);
      }

      // Unlink the identity
      const { error } = await supabase.auth.unlinkIdentity(targetIdentity);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setProviders((prev) => prev.filter((p) => p !== providerName));

      notifications.show({
        title: "Success",
        message: `${provider} account unlinked successfully`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : `Failed to unlink ${provider}`,
        color: "red",
      });
    } finally {
      if (provider === "github") {
        setUnlinkingGithub(false);
      } else {
        setUnlinkingLinkedin(false);
      }
      setProviderToUnlink(null);
    }
  };

  const updateName = async (
    field: "name" | "middlename" | "surname",
    value: string
  ) => {
    if (field === "name" && value.trim().length === 0) {
      setNameError("First name is required");
      setName(originalName);
      return;
    }

    if (field === "name") {
      setNameError("");
    }

    const currentValues = {
      name,
      middlename,
      surname,
    };

    const originalValues = {
      name: originalName,
      middlename: originalMiddlename,
      surname: originalSurname,
    };

    if (value === originalValues[field]) {
      return;
    }

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentValues,
          [field]: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update name");
      }

      if (field === "name") setOriginalName(value);
      if (field === "middlename") setOriginalMiddlename(value);
      if (field === "surname") setOriginalSurname(value);

      notifications.show({
        title: "Success",
        message: "Name updated successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update name",
        color: "red",
      });
    }
  };

  return (
    <Card withBorder shadow="sm" radius="md">
      <Card.Section withBorder inheritPadding py="md">
        <Group gap="xs">
          <IconUserCircle size={20} stroke={1.5} />
          <Text size="lg" fw={600}>
            Profile
          </Text>
        </Group>
      </Card.Section>

      <Card.Section inheritPadding py="md">
        <Group align="flex-start">
          <Avatar
            src={avatarUrl}
            alt="User avatar"
            color="blue"
            radius="xl"
            size="lg"
            name={[name, middlename, surname].filter(Boolean).join(" ")}
          />
          <Group grow align="flex-start" style={{ flex: 1 }}>
            <TextInput
              label="Name"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={(e) => {
                setNameFocused(false);
                updateName("name", e.currentTarget.value);
              }}
              leftSection={<IconUser size={16} />}
              rightSection={
                nameFocused ? (
                  <Text size="xs" c="dimmed" pr={"xs"}>
                    {name.length}/{INPUT_MAX_LENGTHS.firstName}
                  </Text>
                ) : undefined
              }
              error={nameError}
              required
            />
            <TextInput
              label=" "
              placeholder="Middle names"
              value={middlename}
              onChange={(e) => setMiddlename(e.currentTarget.value)}
              onFocus={() => setMiddlenameFocused(true)}
              onBlur={(e) => {
                setMiddlenameFocused(false);
                updateName("middlename", e.currentTarget.value);
              }}
              leftSection={<IconUser size={16} />}
              rightSection={
                middlenameFocused ? (
                  <Text size="xs" c="dimmed" pr={"xs"}>
                    {middlename.length}/{INPUT_MAX_LENGTHS.middleName}
                  </Text>
                ) : undefined
              }
            />
            <TextInput
              label=" "
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.currentTarget.value)}
              onFocus={() => setSurnameFocused(true)}
              onBlur={(e) => {
                setSurnameFocused(false);
                updateName("surname", e.currentTarget.value);
              }}
              leftSection={<IconUser size={16} />}
              rightSection={
                surnameFocused ? (
                  <Text size="xs" c="dimmed" pr={"xs"}>
                    {surname.length}/{INPUT_MAX_LENGTHS.lastName}
                  </Text>
                ) : undefined
              }
            />
          </Group>
        </Group>
      </Card.Section>

      <Divider />

      <Card.Section inheritPadding py="md">
        <TextInput
          label="Email"
          placeholder="your@email.com"
          type="email"
          value={email}
          leftSection={<IconMail size={16} />}
          disabled
          readOnly
        />
      </Card.Section>

      <Divider />

      <Card.Section inheritPadding py="md">
        <Stack gap="sm">
          <Text size="sm" fw={500}>
            Connected Accounts
          </Text>
          <Group gap="sm">
            {providers.includes("github") ? (
              <Button
                leftSection={<IconBrandGithub size={16} />}
                variant="filled"
                color="dark"
                onClick={() => handleUnlinkClick("github")}
                loading={unlinkingGithub}
                disabled={providers.length <= 1}
                rightSection={
                  providers.length > 1 ? <IconLink size={16} /> : undefined
                }
              >
                GitHub linked
              </Button>
            ) : (
              <Button
                leftSection={<IconBrandGithub size={16} />}
                variant="default"
                color="gray"
                onClick={() => linkProvider("github")}
                loading={linkingGithub}
                rightSection={<IconLinkOff size={16} />}
              >
                Tap to connect GitHub account
              </Button>
            )}
            {providers.includes("linkedin_oidc") ? (
              <Button
                leftSection={<IconBrandLinkedin size={16} />}
                variant="filled"
                color="blue"
                onClick={() => handleUnlinkClick("linkedin")}
                loading={unlinkingLinkedin}
                disabled={providers.length <= 1}
                rightSection={
                  providers.length > 1 ? <IconLink size={16} /> : undefined
                }
              >
                LinkedIn linked
              </Button>
            ) : (
              <Button
                leftSection={<IconBrandLinkedin size={16} />}
                variant="default"
                color="gray"
                onClick={() => linkProvider("linkedin")}
                loading={linkingLinkedin}
                rightSection={<IconLinkOff size={16} />}
              >
                Tap to connect LinkedIn account
              </Button>
            )}
          </Group>
        </Stack>
      </Card.Section>

      <Modal
        opened={unlinkOpened}
        onClose={closeUnlink}
        title={
          <Group gap="xs">
            <IconUnlink size={20} stroke={1.5} />
            <Text>Unlink Account</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to unlink your{" "}
            <b>{providerToUnlink === "github" ? "GitHub" : "LinkedIn"}</b>{" "}
            account? You can always link it again later.
          </Text>
          <Group justify="space-between" w="100%">
            <Button variant="default" onClick={closeUnlink}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmUnlinkProvider}
              loading={unlinkingGithub || unlinkingLinkedin}
            >
              Unlink Account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}
