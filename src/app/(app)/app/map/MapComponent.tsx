"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

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

interface MapComponentProps {
  contacts: Contact[];
  focusContactId?: string | null;
  onVisibleContactsChange?: (contacts: Contact[]) => void;
}

// Map Mantine colors to hex values
const getColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    blue: "#228be6",
    green: "#40c057",
    pink: "#f06595",
    orange: "#fd7e14",
    violet: "#7950f2",
    cyan: "#15aabf",
    teal: "#12b886",
    red: "#fa5252",
  };
  return colorMap[color] || "#228be6";
};

export default function MapComponent({
  contacts,
  focusContactId,
  onVisibleContactsChange,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 4,
      maxZoom: 19,
    });

    mapRef.current = map;

    // Add OpenFreeMap using MapLibre GL
    // @ts-ignore - maplibreGL is added to L by the plugin
    L.maplibreGL({
      style: "https://tiles.openfreemap.org/styles/liberty",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create marker cluster group
    const markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let size = "small";
        if (count > 20) size = "large";
        else if (count > 10) size = "medium";

        return L.divIcon({
          html: `<div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 3px solid white;
          ">${count}</div>`,
          className: "custom-cluster-icon",
          iconSize: L.point(40, 40),
        });
      },
    });

    // Add markers for each contact
    contacts.forEach((contact) => {
      if (!contact.position) return;

      // Create avatar-style marker using divIcon
      const avatarIcon = L.divIcon({
        html: `
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: ${getColorHex(contact.avatarColor)};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ${contact.firstName[0]}${contact.lastName[0]}
          </div>
        `,
        className: "custom-avatar-marker",
        iconSize: L.point(36, 36),
        iconAnchor: L.point(18, 18),
        popupAnchor: L.point(0, -18),
      });

      const marker = L.marker([contact.position.lat, contact.position.lng], {
        icon: avatarIcon,
      });

      // Store marker reference
      markersRef.current.set(contact.id, marker);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: ${getColorHex(contact.avatarColor)};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 14px;
            ">
              ${contact.firstName[0]}${contact.lastName[0]}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 14px;">
                ${contact.firstName} ${contact.lastName}
              </div>
              ${
                contact.title
                  ? `<div style="font-size: 12px; color: #666;">${contact.title}</div>`
                  : ""
              }
            </div>
          </div>
          ${
            contact.place
              ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">📍 ${contact.place}</div>`
              : ""
          }
          <div style="font-size: 12px;">${contact.description}</div>
          ${
            contact.connections && contact.connections.length > 0
              ? `<div style="margin-top: 8px; display: inline-block; background-color: ${getColorHex(
                  contact.avatarColor
                )}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                  ${contact.connections.length} connections
                </div>`
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupContent);
      markers.addLayer(marker);
    });

    map.addLayer(markers);

    // Function to update visible contacts based on map bounds
    const updateVisibleContacts = () => {
      if (!mapRef.current || !onVisibleContactsChange) return;

      const bounds = mapRef.current.getBounds();
      const visible = contacts.filter((contact) => {
        if (!contact.position) return false;
        return bounds.contains([contact.position.lat, contact.position.lng]);
      });
      onVisibleContactsChange(visible);
    };

    // Update visible contacts on map move/zoom
    map.on("moveend", updateVisibleContacts);
    map.on("zoomend", updateVisibleContacts);

    // Initial update
    updateVisibleContacts();

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [contacts, onVisibleContactsChange]);

  // Handle focusing on a contact
  useEffect(() => {
    if (!mapRef.current || !focusContactId) return;

    const marker = markersRef.current.get(focusContactId);
    if (!marker) return;

    const contact = contacts.find((c) => c.id === focusContactId);
    if (!contact || !contact.position) return;

    // Fly to the contact's location and open popup
    mapRef.current.flyTo([contact.position.lat, contact.position.lng], 12, {
      duration: 1.5,
    });

    // Open popup after animation
    setTimeout(() => {
      marker.openPopup();
    }, 1500);
  }, [focusContactId, contacts]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
}
