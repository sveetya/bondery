"use client";

import {
  Container,
  Title,
  Group,
  Stack,
  Text,
  Avatar,
  Paper,
  Badge,
  Divider,
  ActionIcon,
  LoadingOverlay,
  TextInput,
  Textarea,
  Loader,
  Select,
  Menu,
  Button,
  Modal,
  Flex,
} from "@mantine/core";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconMapPin,
  IconPhone,
  IconMail,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandFacebook,
  IconCalendar,
  IconCheck,
  IconX,
  IconBriefcase,
  IconNote,
  IconDotsVertical,
  IconTrash,
  IconAlertCircle,
  IconWorld,
} from "@tabler/icons-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ContactsTable from "@/components/ContactsTable";
import NetworkGraph from "@/components/NetworkGraph";
import DateWithNotification from "@/components/DateWithNotification";
import {
  extractUsername,
  createSocialMediaUrl,
} from "@/lib/socialMediaHelpers";
import { INPUT_MAX_LENGTHS, LIMITS } from "@/lib/config";
import {
  countryCodes,
  parsePhoneNumber,
  combinePhoneNumber,
} from "@/lib/phoneHelpers";

// Dynamic import for map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/app/(app)/app/map/MapComponent"), {
  ssr: false,
});

import type { Contact } from "@/lib/mockData";

export default function PersonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const personId = searchParams.get("person_id");

  const [contact, setContact] = useState<Contact | null>(null);
  const [connectedContacts, setConnectedContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<{
    [key: string]: string;
  }>({});
  const [phonePrefix, setPhonePrefix] = useState("+1");
  const [whatsappPrefix, setWhatsappPrefix] = useState("+1");
  const [signalPrefix, setSignalPrefix] = useState("+1");
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [notifyBirthday, setNotifyBirthday] = useState(false);
  const [importantDates, setImportantDates] = useState<
    Array<{ date: Date | null; name: string; notify: boolean }>
  >([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchPersonData() {
      if (!personId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch individual contact
        const contactResponse = await fetch(`/api/contacts/${personId}`);

        if (!contactResponse.ok) {
          throw new Error("Contact not found");
        }

        const contactData = await contactResponse.json();
        const person = contactData.contact;

        setContact({
          ...person,
          lastInteraction: new Date(person.lastInteraction),
        });

        // Fetch connected contacts if they exist
        if (person.connections && person.connections.length > 0) {
          const connectionPromises = person.connections.map((id: string) =>
            fetch(`/api/contacts/${id}`).then((res) => res.json())
          );

          const connectionsData = await Promise.all(connectionPromises);
          const connections = connectionsData
            .filter((data) => data.contact)
            .map((data) => ({
              ...data.contact,
              lastInteraction: new Date(data.contact.lastInteraction),
            }));

          setConnectedContacts(connections);
        }
      } catch (error) {
        console.error("Error fetching person data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPersonData();
  }, [personId]);

  // Initialize edited values when contact loads
  useEffect(() => {
    if (contact) {
      // Parse phone number
      const phoneParsed = parsePhoneNumber(contact.phone || "");
      if (phoneParsed) {
        setPhonePrefix(phoneParsed.dialCode);
        setEditedValues((prev) => ({
          ...prev,
          phone: phoneParsed.number,
        }));
      }

      // Parse whatsapp number
      const whatsappParsed = parsePhoneNumber(contact.whatsapp || "");
      if (whatsappParsed) {
        setWhatsappPrefix(whatsappParsed.dialCode);
        setEditedValues((prev) => ({
          ...prev,
          whatsapp: whatsappParsed.number,
        }));
      }

      // Parse signal number
      const signalParsed = parsePhoneNumber(contact.signal || "");
      if (signalParsed) {
        setSignalPrefix(signalParsed.dialCode);
        setEditedValues((prev) => ({
          ...prev,
          signal: signalParsed.number,
        }));
      }

      // Set birthday
      if (contact.birthdate) {
        setBirthday(new Date(contact.birthdate));
      } else {
        setBirthday(null);
      }
      setNotifyBirthday(contact.notifyBirthday || false);

      // Set important dates
      if (contact.importantDates && contact.importantDates.length > 0) {
        setImportantDates(
          contact.importantDates.map((d) => ({
            date: new Date(d.date),
            name: d.name,
            notify: d.notify,
          }))
        );
      } else {
        setImportantDates([]);
      }

      setEditedValues((prev) => ({
        ...prev,
        firstName: contact.firstName || "",
        middleName: contact.middleName || "",
        lastName: contact.lastName || "",
        title: contact.title || "",
        place: contact.place || "",
        description: contact.description || "",
        notes: contact.notes || "",
        email: contact.email || "",
        linkedin: contact.linkedin || "",
        instagram: contact.instagram || "",
        facebook: contact.facebook || "",
        website: contact.website || "",
      }));
    }
  }, [contact]);

  // Initialize rich text editor
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: contact?.notes || "",
    immediatelyRender: false,
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== contact?.notes) {
        handleSocialMediaSave("notes", html);
      }
    },
  });

  // Update editor content when contact changes
  useEffect(() => {
    if (editor && contact?.notes !== undefined) {
      editor.commands.setContent(contact.notes || "");
    }
  }, [contact?.notes, editor]);

  const handleSocialMediaSave = async (field: string, value: string) => {
    if (!contact || !personId) return;

    // Extract username from URL if applicable
    let processedValue = value;
    if (["linkedin", "instagram", "facebook", "whatsapp"].includes(field)) {
      processedValue = extractUsername(field, value);
    }

    // Handle phone and whatsapp - combine with prefix
    if (field === "phone") {
      processedValue = combinePhoneNumber(phonePrefix, value);
    } else if (field === "whatsapp") {
      processedValue = combinePhoneNumber(whatsappPrefix, value);
    } else if (field === "signal") {
      processedValue = combinePhoneNumber(signalPrefix, value);
    }

    // Check if value actually changed
    const originalValue = contact[field as keyof Contact] || "";
    if (processedValue === originalValue) {
      // Update display to show username even if not changed
      setEditedValues((prev) => ({
        ...prev,
        [field]: processedValue,
      }));
      return;
    }

    setSavingField(field);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you'd call your API here:
      // await fetch(`/api/contacts/${personId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [field]: processedValue }),
      // });

      // Update local state with username
      setContact({
        ...contact,
        [field]: processedValue,
      });

      // Update edited values to show username
      setEditedValues((prev) => ({
        ...prev,
        [field]: processedValue,
      }));

      notifications.show({
        title: "Success",
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } updated successfully`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch {
      notifications.show({
        title: "Error",
        message: `Failed to update ${field}`,
        color: "red",
        icon: <IconX size={18} />,
      });

      // Revert to original value on error
      const revertValue = String(contact[field as keyof Contact] || "");
      setEditedValues((prev) => ({
        ...prev,
        [field]: revertValue,
      }));
    } finally {
      setSavingField(null);
    }
  };

  const handleBlur = (field: string) => {
    const value = editedValues[field] || "";
    handleSocialMediaSave(field, value);
  };

  const handleChange = (field: string, value: string) => {
    // Parse full phone number if pasted
    if (field === "phone" || field === "whatsapp" || field === "signal") {
      const parsed = parsePhoneNumber(value);
      if (parsed && value.includes("+")) {
        // User pasted a full number with prefix
        if (field === "phone") {
          setPhonePrefix(parsed.dialCode);
          setEditedValues((prev) => ({
            ...prev,
            [field]: parsed.number,
          }));
        } else if (field === "whatsapp") {
          setWhatsappPrefix(parsed.dialCode);
          setEditedValues((prev) => ({
            ...prev,
            [field]: parsed.number,
          }));
        } else if (field === "signal") {
          setSignalPrefix(parsed.dialCode);
          setEditedValues((prev) => ({
            ...prev,
            [field]: parsed.number,
          }));
        }
        return;
      }
    }

    setEditedValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddImportantDate = () => {
    if (importantDates.length >= LIMITS.maxImportantDates) {
      notifications.show({
        title: "Limit reached",
        message: `You can only add up to ${LIMITS.maxImportantDates} important dates`,
        color: "orange",
      });
      return;
    }
    setImportantDates([
      ...importantDates,
      { date: null, name: "", notify: false },
    ]);
  };

  const handleRemoveImportantDate = (index: number) => {
    setImportantDates(importantDates.filter((_, i) => i !== index));
    // TODO: Save to API
  };

  const handleImportantDateChange = (index: number, date: Date | null) => {
    const newDates = [...importantDates];
    newDates[index] = { ...newDates[index], date };

    // If date is cleared, also clear notify
    if (!date) {
      newDates[index].notify = false;
    }

    setImportantDates(newDates);
    // TODO: Save to API
  };

  const handleImportantDateNameChange = (index: number, name: string) => {
    const newDates = [...importantDates];
    newDates[index] = { ...newDates[index], name };
    setImportantDates(newDates);
    // TODO: Save to API
  };

  const handleImportantDateNotifyChange = (index: number, notify: boolean) => {
    const newDates = [...importantDates];
    newDates[index] = { ...newDates[index], notify };
    setImportantDates(newDates);
    // TODO: Save to API
  };

  const handleDeleteContact = async () => {
    if (!contact || !personId) return;

    setIsDeleting(true);

    // Show loading notification
    const loadingNotification = notifications.show({
      title: "Deleting contact...",
      message: "Please wait while we delete this contact",
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/error for demo
          // In production, this would be a real API call
          const success = true; // Change to false to test error handling
          if (success) {
            resolve(true);
          } else {
            reject(new Error("Failed to delete contact"));
          }
        }, 2000);
      });

      // Success - hide loading notification
      notifications.hide(loadingNotification);

      // Show success notification
      notifications.show({
        title: "Success",
        message: "Contact deleted successfully",
        color: "green",
        icon: <IconCheck size={18} />,
      });

      // Close modal and redirect
      setDeleteModalOpened(false);

      // Redirect to relationships page
      setTimeout(() => {
        router.push("/app/relationships");
      }, 500);
    } catch {
      // Error - hide loading notification
      notifications.hide(loadingNotification);

      // Show error notification
      notifications.show({
        title: "Error",
        message: "Failed to delete contact. Please try again.",
        color: "red",
        icon: <IconX size={18} />,
      });

      setIsDeleting(false);
      // Don't close modal on error
    }
  };

  if (!personId) {
    return (
      <Container size="xl">
        <Stack gap="xl" mt="xl">
          <Title order={1}>Person not found</Title>
          <Text c="dimmed">Please select a person to view their details.</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" style={{ position: "relative", minHeight: "100%" }}>
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      {contact && (
        <Stack gap="xl">
          <Group justify="space-between">
            <Group gap="sm">
              <IconUser size={32} stroke={1.5} />
              <Title order={1}>Contact Profile</Title>
            </Group>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  variant="default"
                  leftSection={<IconDotsVertical size={18} />}
                >
                  Actions
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => setDeleteModalOpened(true)}
                >
                  Delete Contact
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          <Modal
            opened={deleteModalOpened}
            onClose={() => !isDeleting && setDeleteModalOpened(false)}
            title="Delete Contact"
            centered
            closeOnClickOutside={!isDeleting}
            closeOnEscape={!isDeleting}
          >
            <Stack gap="md">
              <Group gap="xs">
                <IconAlertCircle size={20} color="red" />
                <Text size="sm">
                  Are you sure you want to delete{" "}
                  <strong>
                    {contact.firstName} {contact.lastName}
                  </strong>
                  ? This action cannot be undone.
                </Text>
              </Group>
              <Group justify="flex-end" gap="xs">
                <Button
                  variant="default"
                  onClick={() => setDeleteModalOpened(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="red"
                  onClick={handleDeleteContact}
                  loading={isDeleting}
                  leftSection={!isDeleting && <IconTrash size={16} />}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          </Modal>

          <Paper withBorder shadow="sm" radius="md" p="xl">
            <Stack gap="lg">
              <Group align="flex-start">
                <Avatar
                  src={contact.avatar || undefined}
                  color={contact.avatarColor}
                  radius="xl"
                  size={120}
                  style={{ fontSize: "3rem" }}
                  name={`${contact.firstName} ${contact.lastName}`}
                >
                  {!contact.avatar && (
                    <>
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </>
                  )}
                </Avatar>

                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group gap="sm" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs" wrap="nowrap">
                        <TextInput
                          placeholder="First name"
                          value={editedValues.firstName || ""}
                          onChange={(e) =>
                            handleChange("firstName", e.target.value)
                          }
                          onFocus={() => setFocusedField("firstName")}
                          onBlur={() => {
                            setFocusedField(null);
                            handleBlur("firstName");
                          }}
                          maxLength={INPUT_MAX_LENGTHS.firstName}
                          styles={{
                            root: { flex: 1 },
                            input: { fontSize: "1.5rem", fontWeight: 700 },
                          }}
                          rightSection={
                            savingField === "firstName" ? (
                              <Loader size="xs" />
                            ) : focusedField === "firstName" ? (
                              <Text size="10px" c="dimmed">
                                {editedValues.firstName?.length || 0}/
                                {INPUT_MAX_LENGTHS.firstName}
                              </Text>
                            ) : null
                          }
                          disabled={savingField === "firstName"}
                        />
                        <TextInput
                          placeholder="Middle name"
                          value={editedValues.middleName || ""}
                          onChange={(e) =>
                            handleChange("middleName", e.target.value)
                          }
                          onFocus={() => setFocusedField("middleName")}
                          onBlur={() => {
                            setFocusedField(null);
                            handleBlur("middleName");
                          }}
                          maxLength={INPUT_MAX_LENGTHS.middleName}
                          styles={{
                            root: { flex: 1 },
                            input: { fontSize: "1.5rem", fontWeight: 700 },
                          }}
                          rightSection={
                            savingField === "middleName" ? (
                              <Loader size="xs" />
                            ) : focusedField === "middleName" ? (
                              <Text size="10px" c="dimmed">
                                {editedValues.middleName?.length || 0}/
                                {INPUT_MAX_LENGTHS.middleName}
                              </Text>
                            ) : null
                          }
                          disabled={savingField === "middleName"}
                        />
                        <TextInput
                          placeholder="Last name"
                          value={editedValues.lastName || ""}
                          onChange={(e) =>
                            handleChange("lastName", e.target.value)
                          }
                          onFocus={() => setFocusedField("lastName")}
                          onBlur={() => {
                            setFocusedField(null);
                            handleBlur("lastName");
                          }}
                          maxLength={INPUT_MAX_LENGTHS.lastName}
                          styles={{
                            root: { flex: 1 },
                            input: { fontSize: "1.5rem", fontWeight: 700 },
                          }}
                          rightSection={
                            savingField === "lastName" ? (
                              <Loader size="xs" />
                            ) : focusedField === "lastName" ? (
                              <Text size="10px" c="dimmed">
                                {editedValues.lastName?.length || 0}/
                                {INPUT_MAX_LENGTHS.lastName}
                              </Text>
                            ) : null
                          }
                          disabled={savingField === "lastName"}
                        />
                      </Group>
                    </Stack>
                    {contact.myself && (
                      <Badge color="violet" variant="light">
                        You
                      </Badge>
                    )}
                  </Group>

                  <TextInput
                    placeholder="Title"
                    value={editedValues.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    onFocus={() => setFocusedField("title")}
                    onBlur={() => {
                      setFocusedField(null);
                      handleBlur("title");
                    }}
                    maxLength={INPUT_MAX_LENGTHS.title}
                    size="lg"
                    leftSection={<IconBriefcase size={18} />}
                    styles={{
                      input: { color: "var(--mantine-color-dimmed)" },
                    }}
                    style={{
                      width: "fit-content",
                      minWidth: 200,
                      maxWidth: "100%",
                    }}
                    rightSection={
                      savingField === "title" ? (
                        <Loader size="xs" />
                      ) : focusedField === "title" ? (
                        <Text size="10px" c="dimmed">
                          {editedValues.title?.length || 0}/
                          {INPUT_MAX_LENGTHS.title}
                        </Text>
                      ) : null
                    }
                    disabled={savingField === "title"}
                  />

                  <TextInput
                    placeholder="Location"
                    value={editedValues.place || ""}
                    onChange={(e) => handleChange("place", e.target.value)}
                    onBlur={() => handleBlur("place")}
                    maxLength={INPUT_MAX_LENGTHS.place}
                    leftSection={<IconMapPin size={18} />}
                    style={{
                      width: "fit-content",
                      minWidth: 200,
                      maxWidth: "100%",
                    }}
                    rightSection={
                      savingField === "place" ? <Loader size="xs" /> : null
                    }
                    disabled={savingField === "place"}
                  />
                </Stack>
              </Group>

              <Divider />

              <div>
                <Group gap="xs" mb="xs">
                  <IconNote size={18} stroke={1.5} />
                  <Text size="sm" fw={600}>
                    Short bio
                  </Text>
                </Group>
                <Textarea
                  placeholder="Add a short bio about the person, like what he loves, what you should tell him etc..."
                  value={editedValues.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onFocus={() => setFocusedField("description")}
                  onBlur={() => {
                    setFocusedField(null);
                    handleBlur("description");
                  }}
                  maxLength={INPUT_MAX_LENGTHS.description}
                  minRows={3}
                  autosize
                  rightSection={
                    savingField === "description" ? (
                      <Loader size="xs" />
                    ) : focusedField === "description" ? (
                      <Text size="10px" c="dimmed">
                        {editedValues.description?.length || 0}/
                        {INPUT_MAX_LENGTHS.description}
                      </Text>
                    ) : null
                  }
                  disabled={savingField === "description"}
                />
              </div>

              <Divider />

              <div>
                <Group gap="xs" mb="xs" align="center">
                  <Text size="sm" fw={600}>
                    Notes
                  </Text>
                  {savingField === "notes" && <Loader size="xs" />}
                </Group>
                <RichTextEditor editor={editor}>
                  <RichTextEditor.Toolbar sticky stickyOffset={60}>
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Bold />
                      <RichTextEditor.Italic />
                      <RichTextEditor.Underline />
                      <RichTextEditor.Strikethrough />
                      <RichTextEditor.ClearFormatting />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.H1 />
                      <RichTextEditor.H2 />
                      <RichTextEditor.H3 />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Blockquote />
                      <RichTextEditor.Hr />
                      <RichTextEditor.BulletList />
                      <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Link />
                      <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Undo />
                      <RichTextEditor.Redo />
                    </RichTextEditor.ControlsGroup>
                  </RichTextEditor.Toolbar>

                  <RichTextEditor.Content />
                </RichTextEditor>
              </div>

              <Divider />

              <div>
                <Text size="sm" fw={600} mb="md">
                  Contact Information
                </Text>
                <Flex gap="md" direction={{ base: "column", sm: "row" }}>
                  {/* Column 1: Phone, WhatsApp, Signal, Email */}
                  <Stack gap="sm" style={{ flex: 1 }}>
                    <Group gap="sm" align="center" wrap="nowrap">
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
                      <Select
                        value={phonePrefix}
                        onChange={(value) => setPhonePrefix(value || "+1")}
                        data={Array.from(
                          new Map(
                            countryCodes.map((country) => [
                              country.dialCode,
                              {
                                value: country.dialCode,
                                label: country.dialCode,
                              },
                            ])
                          ).values()
                        )}
                        renderOption={({ option }) => {
                          const country = countryCodes.find(
                            (c) => c.dialCode === option.value
                          );
                          return (
                            <Group gap="xs">
                              <span
                                className={`fi fi-${country?.flag || "us"}`}
                              />
                              <span>{option.value}</span>
                            </Group>
                          );
                        }}
                        leftSection={
                          <span
                            className={`fi fi-${
                              countryCodes.find(
                                (c) => c.dialCode === phonePrefix
                              )?.flag || "us"
                            }`}
                          />
                        }
                        searchable
                        style={{ width: 100 }}
                        size="sm"
                      />
                      <TextInput
                        placeholder="Phone number"
                        value={editedValues.phone || ""}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "phone" ? <Loader size="xs" /> : null
                        }
                        disabled={savingField === "phone"}
                      />
                    </Group>

                    <Group gap="sm" align="center" wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        color="green"
                        component="a"
                        href={
                          contact.whatsapp
                            ? createSocialMediaUrl("whatsapp", contact.whatsapp)
                            : undefined
                        }
                        target="_blank"
                        disabled={!contact.whatsapp}
                      >
                        <IconBrandWhatsapp size={18} />
                      </ActionIcon>
                      <Select
                        value={whatsappPrefix}
                        onChange={(value) => setWhatsappPrefix(value || "+1")}
                        data={Array.from(
                          new Map(
                            countryCodes.map((country) => [
                              country.dialCode,
                              {
                                value: country.dialCode,
                                label: country.dialCode,
                              },
                            ])
                          ).values()
                        )}
                        renderOption={({ option }) => {
                          const country = countryCodes.find(
                            (c) => c.dialCode === option.value
                          );
                          return (
                            <Group gap="xs">
                              <span
                                className={`fi fi-${country?.flag || "us"}`}
                              />
                              <span>{option.value}</span>
                            </Group>
                          );
                        }}
                        leftSection={
                          <span
                            className={`fi fi-${
                              countryCodes.find(
                                (c) => c.dialCode === whatsappPrefix
                              )?.flag || "us"
                            }`}
                          />
                        }
                        searchable
                        style={{ width: 100 }}
                        size="sm"
                      />
                      <TextInput
                        placeholder="WhatsApp number or URL"
                        value={editedValues.whatsapp || ""}
                        onChange={(e) =>
                          handleChange("whatsapp", e.target.value)
                        }
                        onBlur={() => handleBlur("whatsapp")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "whatsapp" ? (
                            <Loader size="xs" />
                          ) : null
                        }
                        disabled={savingField === "whatsapp"}
                      />
                    </Group>

                    <Group gap="sm" align="center" wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        color="cyan"
                        component="a"
                        href={
                          contact.signal
                            ? `signal://signal.me/#p/${contact.signal.replace(
                                /\D/g,
                                ""
                              )}`
                            : undefined
                        }
                        disabled={!contact.signal}
                      >
                        <IconPhone size={18} />
                      </ActionIcon>
                      <Select
                        value={signalPrefix}
                        onChange={(value) => setSignalPrefix(value || "+1")}
                        data={Array.from(
                          new Map(
                            countryCodes.map((country) => [
                              country.dialCode,
                              {
                                value: country.dialCode,
                                label: country.dialCode,
                              },
                            ])
                          ).values()
                        )}
                        renderOption={({ option }) => {
                          const country = countryCodes.find(
                            (c) => c.dialCode === option.value
                          );
                          return (
                            <Group gap="xs">
                              <span
                                className={`fi fi-${country?.flag || "us"}`}
                              />
                              <span>{option.value}</span>
                            </Group>
                          );
                        }}
                        leftSection={
                          <span
                            className={`fi fi-${
                              countryCodes.find(
                                (c) => c.dialCode === signalPrefix
                              )?.flag || "us"
                            }`}
                          />
                        }
                        searchable
                        style={{ width: 100 }}
                        size="sm"
                      />
                      <TextInput
                        placeholder="Signal number"
                        value={editedValues.signal || ""}
                        onChange={(e) => handleChange("signal", e.target.value)}
                        onBlur={() => handleBlur("signal")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "signal" ? <Loader size="xs" /> : null
                        }
                        disabled={savingField === "signal"}
                      />
                    </Group>

                    <Group gap="sm" align="center">
                      <ActionIcon
                        variant="light"
                        color="red"
                        component="a"
                        href={
                          contact.email ? `mailto:${contact.email}` : undefined
                        }
                        disabled={!contact.email}
                      >
                        <IconMail size={18} />
                      </ActionIcon>
                      <TextInput
                        placeholder="Email address"
                        value={editedValues.email || ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "email" ? <Loader size="xs" /> : null
                        }
                        disabled={savingField === "email"}
                      />
                    </Group>
                  </Stack>

                  {/* Column 2: LinkedIn, Website, Instagram, Facebook */}
                  <Stack gap="sm" style={{ flex: 1 }}>
                    <Group gap="sm" align="center">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        component="a"
                        href={
                          contact.linkedin
                            ? createSocialMediaUrl("linkedin", contact.linkedin)
                            : undefined
                        }
                        target="_blank"
                        disabled={!contact.linkedin}
                      >
                        <IconBrandLinkedin size={18} />
                      </ActionIcon>
                      <TextInput
                        placeholder="LinkedIn username or URL"
                        value={editedValues.linkedin || ""}
                        onChange={(e) =>
                          handleChange("linkedin", e.target.value)
                        }
                        onBlur={() => handleBlur("linkedin")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "linkedin" ? (
                            <Loader size="xs" />
                          ) : null
                        }
                        disabled={savingField === "linkedin"}
                      />
                    </Group>

                    <Group gap="sm" align="center">
                      <ActionIcon
                        variant="light"
                        color="gray"
                        component="a"
                        href={contact.website || undefined}
                        target="_blank"
                        disabled={!contact.website}
                      >
                        <IconWorld size={18} />
                      </ActionIcon>
                      <TextInput
                        placeholder="Website URL"
                        value={editedValues.website || ""}
                        onChange={(e) =>
                          handleChange("website", e.target.value)
                        }
                        onBlur={() => handleBlur("website")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "website" ? (
                            <Loader size="xs" />
                          ) : null
                        }
                        disabled={savingField === "website"}
                      />
                    </Group>

                    <Group gap="sm" align="center">
                      <ActionIcon
                        variant="light"
                        color="pink"
                        component="a"
                        href={
                          contact.instagram
                            ? createSocialMediaUrl(
                                "instagram",
                                contact.instagram
                              )
                            : undefined
                        }
                        target="_blank"
                        disabled={!contact.instagram}
                      >
                        <IconBrandInstagram size={18} />
                      </ActionIcon>
                      <TextInput
                        placeholder="Instagram username or URL"
                        value={editedValues.instagram || ""}
                        onChange={(e) =>
                          handleChange("instagram", e.target.value)
                        }
                        onBlur={() => handleBlur("instagram")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "instagram" ? (
                            <Loader size="xs" />
                          ) : null
                        }
                        disabled={savingField === "instagram"}
                      />
                    </Group>

                    <Group gap="sm" align="center">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        component="a"
                        href={
                          contact.facebook
                            ? createSocialMediaUrl("facebook", contact.facebook)
                            : undefined
                        }
                        target="_blank"
                        disabled={!contact.facebook}
                      >
                        <IconBrandFacebook size={18} />
                      </ActionIcon>
                      <TextInput
                        placeholder="Facebook username or URL"
                        value={editedValues.facebook || ""}
                        onChange={(e) =>
                          handleChange("facebook", e.target.value)
                        }
                        onBlur={() => handleBlur("facebook")}
                        style={{ flex: 1 }}
                        rightSection={
                          savingField === "facebook" ? (
                            <Loader size="xs" />
                          ) : null
                        }
                        disabled={savingField === "facebook"}
                      />
                    </Group>
                  </Stack>
                </Flex>
              </div>

              <Divider />

              <DateWithNotification
                title="Birthday"
                dateLabel="Select birthday"
                dateValue={birthday}
                notifyValue={notifyBirthday}
                onDateChange={(date) => {
                  setBirthday(date);

                  // If birthday is cleared, set notifyBirthday to false
                  if (!date && notifyBirthday) {
                    setNotifyBirthday(false);
                    // Also save the notification preference change
                    if (contact && personId) {
                      setSavingField("notifyBirthday");
                      setTimeout(() => {
                        setContact({
                          ...contact,
                          notifyBirthday: false,
                          birthdate: undefined,
                        });
                        notifications.show({
                          title: "Success",
                          message: "Birthday and notification cleared",
                          color: "green",
                          icon: <IconCheck size={18} />,
                        });
                        setSavingField(null);
                      }, 500);
                    }
                    return;
                  }

                  // Auto-save birthday if valid date
                  if (contact && personId && date) {
                    setSavingField("birthday");
                    setTimeout(() => {
                      setContact({ ...contact, birthdate: date });
                      notifications.show({
                        title: "Success",
                        message: "Birthday updated successfully",
                        color: "green",
                        icon: <IconCheck size={18} />,
                      });
                      setSavingField(null);
                    }, 1000);
                  }
                }}
                onNotifyChange={(checked) => {
                  setNotifyBirthday(checked);
                  // Auto-save notification preference
                  if (contact && personId) {
                    setSavingField("notifyBirthday");
                    setTimeout(() => {
                      setContact({ ...contact, notifyBirthday: checked });
                      notifications.show({
                        title: "Success",
                        message: "Notification preference updated",
                        color: "green",
                        icon: <IconCheck size={18} />,
                      });
                      setSavingField(null);
                    }, 500);
                  }
                }}
                saving={
                  savingField === "birthday" || savingField === "notifyBirthday"
                }
                focusedField={focusedField}
                onFocus={setFocusedField}
                onBlur={setFocusedField}
                fieldPrefix="birthday"
              />

              <Divider />

              <div>
                <Group justify="space-between" mb="md">
                  <Text size="sm" fw={600}>
                    Important Dates
                  </Text>
                  {importantDates.length < LIMITS.maxImportantDates && (
                    <Button
                      size="xs"
                      variant="light"
                      onClick={handleAddImportantDate}
                    >
                      Add Date
                    </Button>
                  )}
                </Group>
                {importantDates.length > 0 ? (
                  <Stack gap="md">
                    {importantDates.map((importantDate, index) => (
                      <Group key={index} align="flex-start" gap="sm">
                        <div style={{ flex: 1 }}>
                          <DateWithNotification
                            title=""
                            dateLabel="Select date"
                            nameLabel="Event name"
                            dateValue={importantDate.date}
                            nameValue={importantDate.name}
                            notifyValue={importantDate.notify}
                            onDateChange={(date) =>
                              handleImportantDateChange(index, date)
                            }
                            onNameChange={(name) =>
                              handleImportantDateNameChange(index, name)
                            }
                            onNotifyChange={(notify) =>
                              handleImportantDateNotifyChange(index, notify)
                            }
                            showNameInput
                            saving={savingField === `importantDate-${index}`}
                            focusedField={focusedField}
                            onFocus={setFocusedField}
                            onBlur={setFocusedField}
                            fieldPrefix={`importantDate-${index}`}
                          />
                        </div>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleRemoveImportantDate(index)}
                          style={{ marginTop: 4 }}
                        >
                          <IconX size={18} />
                        </ActionIcon>
                      </Group>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    No important dates added yet.
                  </Text>
                )}
              </div>

              <Divider />

              <div>
                <Group gap="xs" mb="xs">
                  <IconCalendar size={18} stroke={1.5} />
                  <Text size="sm" fw={600}>
                    Last Interaction
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {contact.lastInteraction.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </div>
            </Stack>
          </Paper>

          {contact.position && (
            <Paper withBorder shadow="sm" radius="md" p="md">
              <Stack gap="md">
                <Text size="sm" fw={600}>
                  Location Map
                </Text>

                <div
                  style={{
                    width: "100%",
                    height: "400px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <MapComponent
                    contacts={[
                      contact,
                      ...connectedContacts.filter((c) => c.position),
                    ]}
                    focusContactId={contact.id}
                  />
                </div>
              </Stack>
            </Paper>
          )}

          {connectedContacts.length > 0 && (
            <>
              <Paper withBorder shadow="sm" radius="md" p="md">
                <Stack gap="md">
                  <Text size="sm" fw={600}>
                    Network Visualization
                  </Text>

                  <NetworkGraph
                    contacts={[contact, ...connectedContacts]}
                    height={400}
                    centerNodeId={contact.id}
                  />
                </Stack>
              </Paper>

              <Paper withBorder shadow="sm" radius="md" p="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>
                      Connections ({connectedContacts.length})
                    </Text>
                  </Group>

                  <ContactsTable
                    contacts={connectedContacts}
                    visibleColumns={[
                      { key: "avatar", label: "Avatar", visible: true },
                      { key: "name", label: "Name", visible: true },
                      { key: "title", label: "Title", visible: true },
                      { key: "place", label: "Place", visible: true },
                      { key: "shortNote", label: "Short Note", visible: true },
                      { key: "social", label: "Social Media", visible: true },
                    ]}
                    showSelection={false}
                  />
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      )}
    </Container>
  );
}
