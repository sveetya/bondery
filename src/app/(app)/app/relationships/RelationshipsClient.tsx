"use client";

import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  TextInput,
  Paper,
} from "@mantine/core";
import { IconTopologyFull, IconSearch, IconPlus } from "@tabler/icons-react";
import { useState, useDeferredValue } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "@mantine/hooks";
import ContactsTable, { ColumnConfig } from "@/components/ContactsTable";
import { ColumnVisibilityMenu } from "./components/ColumnVisibilityMenu";
import { SortMenu, SortOrder } from "./components/SortMenu";

import type { Contact } from "@/lib/mockData";

interface RelationshipsClientProps {
  initialContacts: Contact[];
  totalCount: number;
}

export function RelationshipsClient({
  initialContacts,
  totalCount,
}: RelationshipsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial state from URL params
  const initialSearch = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortOrder) || "nameAsc";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "avatar", label: "Avatar", visible: true },
    { key: "name", label: "Name", visible: true },
    { key: "title", label: "Title", visible: true },
    { key: "place", label: "Place", visible: true },
    { key: "shortNote", label: "Short Note", visible: true },
    { key: "lastInteraction", label: "Last Interaction", visible: true },
    { key: "social", label: "Social Media", visible: true },
  ]);

  // Defer the columns update to prevent UI freezing when toggling visibility
  const deferredColumns = useDeferredValue(columns);
  const visibleColumns = deferredColumns.filter((c) => c.visible);

  // Handle search with debounce
  const handleSearch = useDebouncedCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  // Handle sort
  const handleSort = (order: SortOrder) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", order);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === initialContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialContacts.map((c) => c.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const allSelected =
    initialContacts.length > 0 && selectedIds.size === initialContacts.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < initialContacts.length;

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group gap="sm">
          <IconTopologyFull size={32} stroke={1.5} />
          <Title order={1}>My Relationships</Title>
        </Group>

        <Paper withBorder shadow="sm" radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Total contacts: <b>{totalCount}</b>
              </Text>
              <Button leftSection={<IconPlus size={16} />}>
                Add Relationship
              </Button>
            </Group>

            <Group>
              <TextInput
                placeholder="Search by name..."
                leftSection={<IconSearch size={16} />}
                defaultValue={initialSearch}
                onChange={(e) => handleSearch(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <ColumnVisibilityMenu columns={columns} setColumns={setColumns} />
              <SortMenu sortOrder={initialSort} setSortOrder={handleSort} />
            </Group>

            <ContactsTable
              contacts={initialContacts}
              selectedIds={selectedIds}
              visibleColumns={visibleColumns}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              allSelected={allSelected}
              someSelected={someSelected}
              showSelection={true}
            />
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
