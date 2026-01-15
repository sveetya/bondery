import {
  Avatar,
  Card,
  Container,
  Group,
  SimpleGrid,
  Text,
  Title,
  ActionIcon,
  Stack,
  Image,
  Flex,
} from "@mantine/core";
import { IconBrandLinkedin } from "@tabler/icons-react";
import NextImage from "next/image";
import Link from "next/link";

interface TeamMember {
  name: string;
  image: string;
  role: string;
  description: string;
  linkedin: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Marek",
    image: "/images/team/marek.jpg",
    role: "Engineering",
    description: "Built the foundation.",
    linkedin: "https://linkedin.com/in/mareksvitek",
  },
  {
    name: "Martin",
    image: "/images/team/martin.jpg",
    role: "Engineering",
    description: "Driving development.",
    linkedin: "https://www.linkedin.com/in/martin-aschermann-6235791a9",
  },
];

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <Card padding="lg" withBorder className="card-scale-effect">
      <Group gap="lg" align="center">
        <Avatar size={160} src={member.image} alt={member.name} />
        <Stack gap="sm" align="left">
          <Stack gap={0}>
            <Text size="xl" fw={"bold"} c={"white"}>
              {member.name}
            </Text>
            <Text size="md" c="dimmed" fw={500}>
              {member.role}
            </Text>
          </Stack>
          <Text size="sm" c="dimmed" miw={200}>
            {member.description}
          </Text>

          <ActionIcon
            size="lg"
            variant="subtle"
            color="gray"
            component={Link}
            href={member.linkedin}
            target="_blank"
          >
            <IconBrandLinkedin />
          </ActionIcon>
        </Stack>
      </Group>
    </Card>
  );
}

export function Team() {
  return (
    <Container size="lg" py="xl" mb={"xl"}>
      <Title order={2} ta="center" className="text-3xl! mb-12!">
        Our team
      </Title>
      <Flex justify={"center"} gap={"xl"} wrap={"wrap"}>
        {TEAM_MEMBERS.map((member) => (
          <TeamCard key={member.name} member={member} />
        ))}
      </Flex>
    </Container>
  );
}
