import React, { useState } from "react";
import { Button } from "@mantine/core";
import { config } from "../config";
import { BondeeIconWhite } from "@bondee/branding";

interface InstagramButtonProps {
  username: string;
}

const InstagramButton: React.FC<InstagramButtonProps> = ({ username }) => {
  const [isLoading, setIsLoading] = useState(false);

  const sanitizeName = (name: string): string => {
    // Remove emojis and special characters, keep only letters and spaces
    return name
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "") // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, "") // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, "") // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, "") // Variation Selectors
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "") // Chess Symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "") // Symbols and Pictographs Extended-A
      .replace(/[^\p{L}\s'-]/gu, "") // Keep only letters, spaces, hyphens, and apostrophes
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .trim();
  };

  const extractProfileName = (): {
    firstName: string;
    middleName?: string;
    lastName?: string;
  } | null => {
    const nameElement = document.querySelector(
      ".x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x5n08af.x10wh9bi.xpm28yp.x8viiok.x1o7cslx",
    );

    if (!nameElement || !nameElement.textContent) {
      return null;
    }

    const fullName = sanitizeName(nameElement.textContent.trim());

    if (!fullName) {
      // Fallback to username if name is empty after sanitization
      return { firstName: username };
    }

    const nameParts = fullName.split(/\s+/);

    if (nameParts.length === 0) return null;

    if (nameParts.length === 1) {
      return { firstName: nameParts[0] };
    }

    if (nameParts.length === 2) {
      return { firstName: nameParts[0], lastName: nameParts[1] };
    }

    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const middleName = nameParts.slice(1, -1).join(" ");

    return { firstName, lastName, middleName };
  };

  const extractProfilePhotoUrl = (): string | null => {
    const img = document.querySelector(
      `img[alt="${username}'s profile picture"]`,
    ) as HTMLImageElement;
    if (img && img.src) {
      return img.src;
    }
    return null;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      const profileName = extractProfileName();
      const profilePhotoUrl = extractProfilePhotoUrl();

      // Log extracted data
      console.log("Instagram Profile Data:", {
        username,
        name: profileName,
        profilePicture: profilePhotoUrl,
      });

      // Build URL with all data as search params
      const params = new URLSearchParams({
        instagram: username,
        ...(profileName?.firstName && { firstName: profileName.firstName }),
        ...(profileName?.middleName && { middleName: profileName.middleName }),
        ...(profileName?.lastName && { lastName: profileName.lastName }),
        ...(profilePhotoUrl && { profileImageUrl: profilePhotoUrl }),
      });

      // Single redirect with all data
      window.open(`${config.appUrl}/api/redirect?${params.toString()}`, "_blank");
    } catch (error) {
      console.error("Error opening in Bondee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      loading={isLoading}
      fullWidth
      leftSection={<BondeeIconWhite width={16} height={16} />}
    >
      Open in Bondee
    </Button>
  );
};

export default InstagramButton;
