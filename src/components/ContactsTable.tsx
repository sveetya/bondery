"use client";

import {
  Table,
  Checkbox,
  Avatar,
  Group,
  ActionIcon,
  Text,
  Anchor,
} from "@mantine/core";
import {
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandFacebook,
  IconPhone,
  IconMail,
} from "@tabler/icons-react";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  place?: string;
  description: string;
  avatar?: string;
  avatarColor: string;
  lastInteraction: Date;
  connections?: string[];
  phone?: string;
  email?: string;
  linkedin?: string;
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  myself?: boolean;
  position?: {
    lat: number;
    lng: number;
  };
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

interface ContactsTableProps {
  contacts: Contact[];
  selectedIds?: Set<string>;
  visibleColumns: ColumnConfig[];
  onSelectAll?: () => void;
  onSelectOne?: (id: string) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  showSelection?: boolean;
}

export default function ContactsTable({
  contacts,
  selectedIds = new Set(),
  visibleColumns,
  onSelectAll,
  onSelectOne,
  allSelected = false,
  someSelected = false,
  showSelection = true,
}: ContactsTableProps) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          {showSelection && (
            <Table.Th style={{ width: 40 }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onSelectAll}
              />
            </Table.Th>
          )}
          {visibleColumns.map((col) => (
            <Table.Th
              key={col.key}
              style={col.key === "avatar" ? { width: 60 } : undefined}
            >
              {col.label}
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {contacts.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={visibleColumns.length + (showSelection ? 1 : 0)}>
              <Text ta="center" c="dimmed">
                No contacts found
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          contacts.map((contact) => (
            <Table.Tr key={contact.id}>
              {showSelection && (
                <Table.Td>
                  <Checkbox
                    checked={selectedIds.has(contact.id)}
                    onChange={() => onSelectOne?.(contact.id)}
                  />
                </Table.Td>
              )}
              {visibleColumns.map((col) => {
                switch (col.key) {
                  case "avatar":
                    return (
                      <Table.Td key={col.key}>
                        <Avatar
                          src={contact.avatar || undefined}
                          color={contact.avatarColor}
                          radius="xl"
                          size="md"
                          name={`${contact.firstName} ${contact.lastName}`}
                        >
                          {!contact.avatar && (
                            <>
                              {contact.firstName[0]}
                              {contact.lastName[0]}
                            </>
                          )}
                        </Avatar>
                      </Table.Td>
                    );
                  case "name":
                    return (
                      <Table.Td key={col.key}>
                        <Anchor
                          component={Link}
                          href={`/app/person?person_id=${contact.id}`}
                          c="blue"
                          underline="hover"
                        >
                          {contact.firstName} {contact.lastName}
                        </Anchor>
                      </Table.Td>
                    );
                  case "title":
                    return (
                      <Table.Td key={col.key}>{contact.title || "-"}</Table.Td>
                    );
                  case "place":
                    return (
                      <Table.Td key={col.key}>{contact.place || "-"}</Table.Td>
                    );
                  case "shortNote":
                    return (
                      <Table.Td key={col.key}>{contact.description}</Table.Td>
                    );
                  case "lastInteraction":
                    return (
                      <Table.Td key={col.key}>
                        {contact.lastInteraction.toLocaleDateString()}
                      </Table.Td>
                    );
                  case "social":
                    return (
                      <Table.Td key={col.key}>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            component="a"
                            href={
                              contact.phone ? `tel:${contact.phone}` : undefined
                            }
                            disabled={!contact.phone}
                          >
                            <IconPhone size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            component="a"
                            href={
                              contact.email
                                ? `mailto:${contact.email}`
                                : undefined
                            }
                            disabled={!contact.email}
                          >
                            <IconMail size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            component="a"
                            href={contact.linkedin}
                            target="_blank"
                            disabled={!contact.linkedin}
                          >
                            <IconBrandLinkedin size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="pink"
                            component="a"
                            href={contact.instagram}
                            target="_blank"
                            disabled={!contact.instagram}
                          >
                            <IconBrandInstagram size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="green"
                            component="a"
                            href={contact.whatsapp}
                            target="_blank"
                            disabled={!contact.whatsapp}
                          >
                            <IconBrandWhatsapp size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            component="a"
                            href={contact.facebook}
                            target="_blank"
                            disabled={!contact.facebook}
                          >
                            <IconBrandFacebook size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    );
                  default:
                    return null;
                }
              })}
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}
