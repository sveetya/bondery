"use client";

import {
  Text,
  Button,
  Group,
  Divider,
  Card,
  Modal,
  Stack,
} from "@mantine/core";
import {
  IconDownload,
  IconTrash,
  IconDatabase,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

interface DataManagementCardProps {
  email: string;
}

export function DataManagementCard({ email }: DataManagementCardProps) {
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [exportOpened, { open: openExport, close: closeExport }] =
    useDisclosure(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = () => {
    openExport();
  };

  const confirmExport = async () => {
    try {
      setExporting(true);

      notifications.show({
        id: "export-data",
        title: "Exporting data",
        message: "Please wait...",
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });

      const response = await fetch("/api/account/export", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to export data");
      }

      notifications.hide("export-data");
      notifications.show({
        title: "Export Started",
        message: "We will send your data to your email shortly",
        color: "green",
      });

      closeExport();
    } catch (error) {
      notifications.hide("export-data");
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to export data",
        color: "red",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    openDelete();
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);

      notifications.show({
        id: "delete-account",
        title: "Deleting account",
        message: "Please wait...",
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });

      const response = await fetch("/api/account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // API redirects automatically on success
    } catch (error) {
      notifications.hide("delete-account");
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to delete account",
        color: "red",
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <Card withBorder shadow="sm" radius="md">
        <Card.Section withBorder inheritPadding py="md">
          <Group gap="xs">
            <IconDatabase size={20} stroke={1.5} />
            <Text size="lg" fw={600}>
              Data Management
            </Text>
          </Group>
        </Card.Section>

        <Card.Section inheritPadding py="md">
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} mb={4}>
                Export your data
              </Text>
              <Text size="xs" c="dimmed">
                Download all your data in JSON format
              </Text>
            </div>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={handleExportData}
              disabled
            >
              Export Data
            </Button>
          </Group>
        </Card.Section>

        <Divider />

        <Card.Section inheritPadding py="md">
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} mb={4} c="red">
                Delete your account
              </Text>
              <Text size="xs" c="dimmed">
                Permanently delete your account and all associated data
              </Text>
            </div>
            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              variant="light"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </Group>
        </Card.Section>
      </Card>

      <Modal
        opened={exportOpened}
        onClose={exporting ? () => {} : closeExport}
        title={
          <Group gap="xs">
            <IconDownload size={20} stroke={1.5} />
            <Text>Export Your Data</Text>
          </Group>
        }
        centered
        closeOnClickOutside={!exporting}
        closeOnEscape={!exporting}
        withCloseButton={!exporting}
      >
        <Stack gap="md">
          <Text size="sm">
            We will send your data to your email address: <b>{email}</b>
          </Text>
          <Group justify="space-between" w="100%">
            <Button
              variant="default"
              onClick={closeExport}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={confirmExport}
              loading={exporting}
            >
              Export Data
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={deleting ? () => {} : closeDelete}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} stroke={1.5} />
            <Text>Are you sure?</Text>
          </Group>
        }
        centered
        closeOnClickOutside={!deleting}
        closeOnEscape={!deleting}
        withCloseButton={!deleting}
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete your account? This action cannot be
            undone and all your <b>data will be permanently deleted</b>.
          </Text>
          <Group justify="space-between" w="100%">
            <Button variant="default" onClick={closeDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={deleting}>
              Yes, I want to delete my account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
