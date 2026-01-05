"use client";

import {
  Avatar,
  Combobox,
  InputBase,
  useCombobox,
  CloseButton,
  Group,
  Text,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useState, useEffect } from "react";

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
  myself?: boolean;
  position?: {
    lat: number;
    lng: number;
  };
}

interface ContactSearchProps {
  contacts: Contact[];
  onContactSelect: (contactId: string | null) => void;
  selectedContactId?: string | null;
  disabled?: boolean;
}

function ContactOption({ contact }: { contact: Contact }) {
  return (
    <Group gap="sm">
      <Avatar color={contact.avatarColor} radius="xl" size="sm">
        {contact.firstName[0]}
        {contact.lastName[0]}
      </Avatar>
      <Text size="sm" fw={500}>
        {contact.firstName} {contact.lastName}
        {contact.myself ? " (me)" : ""}
      </Text>
    </Group>
  );
}

export default function ContactSearch({
  contacts,
  onContactSelect,
  selectedContactId,
  disabled,
}: ContactSearchProps) {
  const [search, setSearch] = useState("");
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const selectedContact = selectedContactId
    ? contacts.find((c) => c.id === selectedContactId)
    : null;

  // Filter contacts based on search (exclude "Me" from search)
  const filteredContacts = contacts
    .filter((contact) => !contact.myself)
    .filter((contact) =>
      `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    );

  // Update search text when selected contact changes externally
  useEffect(() => {
    if (selectedContact) {
      setSearch(`${selectedContact.firstName} ${selectedContact.lastName}`);
    } else {
      setSearch("");
    }
  }, [selectedContactId, selectedContact]);

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      disabled={disabled}
      onOptionSubmit={(val) => {
        const contact = contacts.find((c) => c.id === val);
        if (contact) {
          setSearch(`${contact.firstName} ${contact.lastName}`);
          onContactSelect(val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={selectedContactId ? "Selected person" : "Find a person"}
          size="md"
          disabled={disabled}
          leftSection={
            selectedContact ? (
              <Avatar color={selectedContact.avatarColor} radius="xl" size="sm">
                {selectedContact.firstName[0]}
                {selectedContact.lastName ? selectedContact.lastName[0] : ""}
              </Avatar>
            ) : (
              <IconSearch size={16} />
            )
          }
          rightSection={
            selectedContactId ? (
              <CloseButton
                size="lg"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearch("");
                  onContactSelect(null);
                }}
                aria-label="Clear selection"
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          value={search}
          onChange={(event) => {
            if (disabled) return;
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
            if (event.currentTarget.value === "") {
              onContactSelect(null);
            }
          }}
          onClick={() => !disabled && combobox.openDropdown()}
          onFocus={() => !disabled && combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            if (selectedContact) {
              setSearch(
                `${selectedContact.firstName} ${selectedContact.lastName}`
              );
            } else {
              setSearch("");
            }
          }}
          placeholder={disabled ? "Loading..." : "Type the person's name..."}
          rightSectionPointerEvents="auto"
          style={{ width: 400 }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={250} style={{ overflowY: "auto" }}>
          {filteredContacts.length > 0 ? (
            filteredContacts.slice(0, 5).map((contact) => (
              <Combobox.Option value={contact.id} key={contact.id}>
                <ContactOption contact={contact} />
              </Combobox.Option>
            ))
          ) : (
            <Combobox.Empty>No contacts found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
