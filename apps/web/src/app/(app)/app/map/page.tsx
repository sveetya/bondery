"use client";

import {
  Container,
  Title,
  Group,
  Text,
  LoadingOverlay,
  Stack,
  Paper,
} from "@mantine/core";
import { IconMap } from "@tabler/icons-react";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ContactSearch from "@/components/ContactSearch";
import ContactsTable from "@/components/ContactsTable";

import type { Contact } from "@/lib/mockData";

// Dynamic import for the map component to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function MapPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [focusContactId, setFocusContactId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [visibleContacts, setVisibleContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch("/api/contacts");
        const data = await response.json();
        setContacts(
          data.contacts.filter((c: Contact) => !c.myself && c.position)
        );
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  const handleContactSelect = useCallback((contactId: string | null) => {
    setSelectedContactId(contactId);
    setFocusContactId(contactId);
  }, []);

  return (
    <Container size="xl" style={{ position: "relative", minHeight: "100%" }}>
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <Stack gap="xl">
        <Group gap="sm">
          <IconMap size={32} stroke={1.5} />
          <Title order={1}>Contact Map</Title>
        </Group>

        <Group justify="space-between" align="flex-end">
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              Total Contacts
            </Text>
            <Text size="xl" fw={700}>
              {totalCount}
            </Text>
          </div>

          <ContactSearch
            contacts={contacts}
            selectedContactId={selectedContactId}
            onContactSelect={handleContactSelect}
            disabled={loading}
          />

          <div style={{ width: 100 }} />
        </Group>

        <div
          style={{
            width: "100%",
            height: "calc(100vh - 450px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {!loading && (
            <MapComponent
              contacts={contacts}
              focusContactId={focusContactId}
              onVisibleContactsChange={setVisibleContacts}
            />
          )}
        </div>

        <Paper withBorder shadow="sm" radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Contacts in current view: <b>{visibleContacts.length}</b>
              </Text>
            </Group>

            <ContactsTable
              contacts={visibleContacts}
              visibleColumns={[
                "avatar",
                "name",
                "title",
                "place",
                "shortNote",
                "social",
              ]}
              showSelection={false}
            />
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
