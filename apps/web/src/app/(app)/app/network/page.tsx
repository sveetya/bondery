"use client";

import {
  Container,
  Title,
  Group,
  Stack,
  Text,
  LoadingOverlay,
  Paper,
} from "@mantine/core";
import { IconTopologyFull } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import ContactSearch from "@/components/ContactSearch";
import ContactsTable from "@/components/ContactsTable";

import type { Contact } from "@/lib/mockData";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  color: string;
  initials: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function NetworkPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [totalCount, setTotalCount] = useState(0);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(
    null
  );
  const nodesRef = useRef<GraphNode[]>([]);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Focus on selected node
  const focusOnNode = (contactId: string | null) => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    const width = container?.clientWidth || 1200;
    const height = 600;

    if (!contactId) {
      // Reset all opacities and zoom when deselected
      svg.selectAll("foreignObject").attr("opacity", 1);
      svg.selectAll("line").attr("opacity", 0.6);

      // Reset zoom to identity
      svg
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity);
      return;
    }

    const node = nodesRef.current.find((n) => n.id === contactId);
    if (!node || node.x === undefined || node.y === undefined) return;

    // Get the selected contact's connections
    const selectedContact = contacts.find((c) => c.id === contactId);
    const connectedIds = new Set(selectedContact?.connections || []);

    // Highlight the selected node, connected nodes subtly, and dim others
    svg
      .selectAll<SVGForeignObjectElement, GraphNode>("foreignObject")
      .attr("opacity", (d) => {
        if (d.id === contactId) return 1; // Fully visible for selected
        if (connectedIds.has(d.id)) return 0.7; // Subtle highlight for connected
        return 0.3; // Dimmed for others
      });

    // Highlight connections to/from selected node
    svg.selectAll("line").attr("opacity", (d: any) => {
      const sourceId = typeof d.source === "object" ? d.source.id : d.source;
      const targetId = typeof d.target === "object" ? d.target.id : d.target;
      if (sourceId === contactId || targetId === contactId) return 0.6; // Highlight connections
      return 0.1; // Dim other connections
    });

    // Create transform to center on selected node
    const scale = 1.5;
    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-node.x, -node.y);

    // Apply transform with smooth transition
    svg.transition().duration(750).call(zoomRef.current.transform, transform);
  };

  // Fetch contacts from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/contacts");
        const data = await response.json();
        // Convert date strings back to Date objects
        const contactsWithDates = data.contacts.map(
          (contact: Contact & { lastInteraction: string }) => ({
            ...contact,
            lastInteraction: new Date(contact.lastInteraction),
          })
        );
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

  useEffect(() => {
    if (!svgRef.current || contacts.length === 0 || loading) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Use container width
    const container = svgRef.current.parentElement;
    const width = container?.clientWidth || 1200;
    const height = 600;

    // Map Mantine colors to hex
    const colorMap: Record<string, string> = {
      blue: "#228be6",
      green: "#40c057",
      pink: "#f06595",
      orange: "#fd7e14",
      violet: "#9775fa",
      cyan: "#22b8cf",
      teal: "#20c997",
      red: "#fa5252",
    };

    // Prepare nodes
    const nodes: GraphNode[] = contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}${
        contact.myself ? " (me)" : ""
      }`,
      color: contact.avatarColor,
      initials: `${contact.firstName[0]}${contact.lastName[0]}`,
    }));
    nodesRef.current = nodes;

    // Prepare links
    const links: GraphLink[] = [];
    contacts.forEach((contact) => {
      if (contact.connections) {
        contact.connections.forEach((targetId) => {
          // Avoid duplicate links
          const linkExists = links.some(
            (link) =>
              (link.source === contact.id && link.target === targetId) ||
              (link.source === targetId && link.target === contact.id)
          );
          if (!linkExists) {
            links.push({
              source: contact.id,
              target: targetId,
            });
          }
        });
      }
    });

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Create a group for all graph elements (enables zoom/pan)
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Click on background to deselect
    svg.on("click", function (event) {
      // Only deselect if clicking directly on SVG background (not on nodes)
      if (
        event.target === event.currentTarget ||
        event.target.tagName === "svg"
      ) {
        setSelectedContactId(null);
        focusOnNode(null);
      }
    });

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    simulationRef.current = simulation;

    // Create links (as children of zoom group)
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Create nodes using foreignObject for custom HTML content
    const nodeWidth = 80;
    const nodeHeight = 70;

    // Track drag state to differentiate click from drag
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const node = g
      .append("g")
      .selectAll("foreignObject")
      .data(nodes)
      .enter()
      .append("foreignObject")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .style("cursor", "pointer")
      .on("click", function (event, d) {
        // Only handle click if there was no dragging
        if (!isDragging) {
          event.stopPropagation();
          setSelectedContactId(d.id);
          focusOnNode(d.id);
        }
      })
      .call(
        d3
          .drag<SVGForeignObjectElement, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add custom HTML content to each node
    node
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("cursor", "pointer")
      .html(
        (d) => `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${colorMap[d.color] || "#228be6"};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 2px solid white;
        ">${d.initials}</div>
        <div style="
          margin-top: 4px;
          font-size: 11px;
          color: #333;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 80px;
        ">${d.name}</div>
      `
      );

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x || 0)
        .attr("y1", (d) => (d.source as GraphNode).y || 0)
        .attr("x2", (d) => (d.target as GraphNode).x || 0)
        .attr("y2", (d) => (d.target as GraphNode).y || 0);

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Drag functions
    function dragstarted(
      event: d3.D3DragEvent<SVGForeignObjectElement, GraphNode, GraphNode>
    ) {
      isDragging = false;
      dragStartX = event.x;
      dragStartY = event.y;
      d3.select(event.sourceEvent.target as Element).style(
        "cursor",
        "grabbing"
      );
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGForeignObjectElement, GraphNode, GraphNode>
    ) {
      // Check if mouse has moved significantly
      const dx = Math.abs(event.x - dragStartX);
      const dy = Math.abs(event.y - dragStartY);
      if (dx > 5 || dy > 5) {
        isDragging = true;
      }
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGForeignObjectElement, GraphNode, GraphNode>
    ) {
      d3.select(event.sourceEvent.target as Element).style("cursor", "pointer");
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      // Reset isDragging after a short delay to let click event process
      setTimeout(() => {
        isDragging = false;
      }, 10);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [contacts, loading]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  return (
    <Container size="xl" style={{ position: "relative", minHeight: "100%" }}>
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <Stack gap="xl">
        <Group gap="sm">
          <IconTopologyFull size={32} stroke={1.5} />
          <Title order={1}>Network Graph</Title>
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
            onContactSelect={(contactId) => {
              setSelectedContactId(contactId);
              focusOnNode(contactId);
            }}
            disabled={loading}
          />

          <div style={{ width: 100 }} />
        </Group>

        <div style={{ width: "100%", position: "relative" }}>
          <svg
            ref={svgRef}
            style={{
              width: "100%",
              height: 600,
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              display: "block",
            }}
          />
        </div>

        {selectedContact && (
          <Paper withBorder shadow="sm" radius="md" p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Selected contact and their connections:{" "}
                  <b>{1 + (selectedContact.connections?.length || 0)}</b>
                </Text>
              </Group>

              <ContactsTable
                contacts={[
                  selectedContact,
                  ...contacts.filter((c) =>
                    selectedContact.connections?.includes(c.id)
                  ),
                ]}
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
        )}
      </Stack>
    </Container>
  );
}
