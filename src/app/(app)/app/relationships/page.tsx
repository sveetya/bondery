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
  Loader,
  Center,
  Menu,
  Box,
  Divider,
} from "@mantine/core";
import {
  IconTopologyFull,
  IconSearch,
  IconPlus,
  IconEye,
  IconArrowsSort,
  IconGripVertical,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ContactsTable from "@/components/ContactsTable";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  place?: string;
  description: string;
  avatarColor: string;
  lastInteraction: Date;
  connections?: string[];
  phone?: string;
  email?: string;
  linkedin?: string;
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
}

type ColumnKey =
  | "avatar"
  | "name"
  | "title"
  | "place"
  | "shortNote"
  | "lastInteraction"
  | "social";

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

interface SortableColumnItemProps {
  column: ColumnConfig;
  onToggle: () => void;
}

function SortableColumnItem({ column, onToggle }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      p="xs"
      bg={isDragging ? "gray.1" : undefined}
    >
      <Group gap="xs" wrap="nowrap">
        <Box
          {...listeners}
          style={{ cursor: "grab", display: "flex", alignItems: "center" }}
        >
          <IconGripVertical size={16} />
        </Box>
        <Checkbox
          checked={column.visible}
          label={column.label}
          onChange={onToggle}
          disabled={column.key === "name"}
          style={{ flex: 1 }}
        />
      </Group>
    </Box>
  );
}

export default function RelationshipsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [sortOrder, setSortOrder] = useState<
    | "nameAsc"
    | "nameDesc"
    | "surnameAsc"
    | "surnameDesc"
    | "interactionAsc"
    | "interactionDesc"
  >("nameAsc");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch contacts from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/contacts");
        const data = await response.json();
        // Convert date strings back to Date objects
        const contactsWithDates = data.contacts.map((contact: any) => ({
          ...contact,
          lastInteraction: new Date(contact.lastInteraction),
        }));
        setContacts(contactsWithDates);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredContacts = contacts
    .filter((contact) =>
      `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "nameAsc":
          return a.firstName.localeCompare(b.firstName);
        case "nameDesc":
          return b.firstName.localeCompare(a.firstName);
        case "surnameAsc":
          return a.lastName.localeCompare(b.lastName);
        case "surnameDesc":
          return b.lastName.localeCompare(a.lastName);
        case "interactionAsc":
          return a.lastInteraction.getTime() - b.lastInteraction.getTime();
        case "interactionDesc":
          return b.lastInteraction.getTime() - a.lastInteraction.getTime();
        default:
          return 0;
      }
    });

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
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
    filteredContacts.length > 0 && selectedIds.size === filteredContacts.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < filteredContacts.length;

  const visibleColumns = columns.filter((c) => c.visible);
  const hiddenColumns = columns.filter((c) => !c.visible);

  const handleDragEnd = (event: DragEndEvent, isVisible: boolean) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setColumns(() => {
      const targetColumns = isVisible ? visibleColumns : hiddenColumns;
      const oldIndex = targetColumns.findIndex((col) => col.key === active.id);
      const newIndex = targetColumns.findIndex((col) => col.key === over.id);

      const reordered = arrayMove(targetColumns, oldIndex, newIndex);

      // Rebuild the full columns array maintaining the order
      const otherColumns = isVisible ? hiddenColumns : visibleColumns;
      return isVisible
        ? [...reordered, ...otherColumns]
        : [...visibleColumns, ...reordered];
    });
  };

  const toggleColumn = (key: ColumnKey) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Menu shadow="md" width={250}>
                <Menu.Target>
                  <Button variant="light" leftSection={<IconEye size={16} />}>
                    Visible columns
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Box p="xs">
                    <Text size="xs" fw={600} c="dimmed" mb="xs">
                      Visible
                    </Text>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, true)}
                    >
                      <SortableContext
                        items={visibleColumns.map((c) => c.key)}
                        strategy={verticalListSortingStrategy}
                      >
                        {visibleColumns.length === 0 ? (
                          <Text size="sm" c="dimmed" ta="center" py="sm">
                            No visible columns
                          </Text>
                        ) : (
                          visibleColumns.map((column) => (
                            <SortableColumnItem
                              key={column.key}
                              column={column}
                              onToggle={() => toggleColumn(column.key)}
                            />
                          ))
                        )}
                      </SortableContext>
                    </DndContext>

                    <Divider my="sm" />

                    <Text size="xs" fw={600} c="dimmed" mb="xs">
                      Hidden
                    </Text>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, false)}
                    >
                      <SortableContext
                        items={hiddenColumns.map((c) => c.key)}
                        strategy={verticalListSortingStrategy}
                      >
                        {hiddenColumns.length === 0 ? (
                          <Text size="sm" c="dimmed" ta="center" py="sm">
                            No hidden columns
                          </Text>
                        ) : (
                          hiddenColumns.map((column) => (
                            <SortableColumnItem
                              key={column.key}
                              column={column}
                              onToggle={() => toggleColumn(column.key)}
                            />
                          ))
                        )}
                      </SortableContext>
                    </DndContext>
                  </Box>
                </Menu.Dropdown>
              </Menu>
              <Menu shadow="md" width={220}>
                <Menu.Target>
                  <Button
                    variant="light"
                    leftSection={<IconArrowsSort size={16} />}
                  >
                    Sort
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Sort Options</Menu.Label>
                  <Menu.Item
                    onClick={() => setSortOrder("nameAsc")}
                    rightSection={sortOrder === "nameAsc" ? "✓" : ""}
                    bg={
                      sortOrder === "nameAsc"
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    Name A→Z
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setSortOrder("nameDesc")}
                    rightSection={sortOrder === "nameDesc" ? "✓" : ""}
                    bg={
                      sortOrder === "nameDesc"
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    Name Z→A
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setSortOrder("surnameAsc")}
                    rightSection={sortOrder === "surnameAsc" ? "✓" : ""}
                    bg={
                      sortOrder === "surnameAsc"
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    Surname A→Z
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setSortOrder("surnameDesc")}
                    rightSection={sortOrder === "surnameDesc" ? "✓" : ""}
                    bg={
                      sortOrder === "surnameDesc"
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    Surname Z→A
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setSortOrder("interactionDesc")}
                    rightSection={sortOrder === "interactionDesc" ? "✓" : ""}
                    bg={
                      sortOrder === "interactionDesc"
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    Recently Interacted
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => setSortOrder("interactionAsc")}
                    rightSection={sortOrder === "interactionAsc" ? "✓" : ""}
                    bg={
                      sortOrder === "interactionAsc"
                        ? "var(--mantine-primary-color-light)"
                        : undefined
                    }
                  >
                    Least Recently Interacted
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            {loading ? (
              <Center py="xl">
                <Loader />
              </Center>
            ) : (
              <ContactsTable
                contacts={filteredContacts}
                selectedIds={selectedIds}
                visibleColumns={visibleColumns}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                allSelected={allSelected}
                someSelected={someSelected}
                showSelection={true}
              />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
