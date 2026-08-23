import Image from "next/image";
import { useContext } from "react";
import { SettingsContext } from "utils/contexts/settings";
import { ThemeContext } from "utils/contexts/theme";

// Every icon set is served out of public/icons rather than a CDN, so icons come
// off local disk and the dashboard works without internet access.
// scripts/fetch-icons.sh downloads whatever config/*.yaml references; re-run it
// after adding an icon.
// ponytail: no CDN fallback, so an unfetched icon 404s rather than loading
// remotely. Add a fallback branch here if that ever bites.
const iconSetURLs = {
  mdi: "/icons/mdi/",
  si: "/icons/si/",
  // Font Awesome Free, symlinked at public/icons/fa. Routed through the mask
  // branch below so they take the theme color: FA svgs are fill="currentColor",
  // which renders flat black when loaded as a plain <img>.
  fas: "/icons/fa/solid/",
  far: "/icons/fa/regular/",
  fab: "/icons/fa/brands/",
};

// Mirrors the CDN's <ext>/<name>.<ext> layout, so this is a prefix swap.
const dashboardIconsURL = "/icons/dashboard/";
const selfhstIconsURL = "/icons/selfhst/";

export default function ResolvedIcon({ icon, width = 32, height = 32, alt = "logo" }) {
  const { settings } = useContext(SettingsContext);
  const { theme } = useContext(ThemeContext);

  // direct or relative URLs
  if (icon.startsWith("http") || icon.startsWith("/")) {
    return (
      <Image
        src={`${icon}`}
        width={width}
        height={height}
        style={{
          width,
          height,
          objectFit: "contain",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
        alt={alt}
      />
    );
  }

  // check mdi- or si- prefixed icons
  const prefix = icon.split("-")[0];

  if (prefix === "sh") {
    const iconName = icon.replace("sh-", "").replace(".svg", "").replace(".png", "").replace(".webp", "");

    let extension;
    if (icon.endsWith(".svg")) {
      extension = "svg";
    } else if (icon.endsWith(".webp")) {
      extension = "webp";
    } else {
      extension = "png";
    }

    return (
      <Image
        src={`${selfhstIconsURL}${extension}/${iconName}.${extension}`}
        width={width}
        height={height}
        style={{
          width,
          height,
          objectFit: "contain",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
        alt={alt}
      />
    );
  }

  if (prefix in iconSetURLs) {
    // default to theme setting
    let iconName = icon.replace(`${prefix}-`, "").replace(".svg", "");
    let iconColor =
      settings.iconStyle === "theme"
        ? `rgb(var(--color-${theme === "dark" ? 300 : 900}) / var(--tw-text-opacity, 1))`
        : "linear-gradient(180deg, rgb(var(--color-logo-start)), rgb(var(--color-logo-stop)))";

    // use custom hex color if provided
    const colorMatches = icon.match(/[#][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9]$/i);
    if (colorMatches?.length) {
      iconName = icon.replace(`${prefix}-`, "").replace(".svg", "").replace(`-${colorMatches[0]}`, "");
      iconColor = `${colorMatches[0]}`;
    }

    const iconSource = `${iconSetURLs[prefix]}${iconName}.svg`;

    return (
      <div
        style={{
          width,
          height,
          maxWidth: "100%",
          maxHeight: "100%",
          background: `${iconColor}`,
          mask: `url(${iconSource}) no-repeat center / contain`,
          WebkitMask: `url(${iconSource}) no-repeat center / contain`,
        }}
      />
    );
  }

  // fallback to dashboard-icons
  if (icon.endsWith(".svg")) {
    const iconName = icon.replace(".svg", "");
    return (
      <Image
        src={`${dashboardIconsURL}svg/${iconName}.svg`}
        width={width}
        height={height}
        style={{
          width,
          height,
          objectFit: "contain",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
        alt={alt}
      />
    );
  }

  if (icon.endsWith(".webp")) {
    const iconName = icon.replace(".webp", "");
    return (
      <Image
        src={`${dashboardIconsURL}webp/${iconName}.webp`}
        width={width}
        height={height}
        style={{
          width,
          height,
          objectFit: "contain",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
        alt={alt}
      />
    );
  }

  const iconName = icon.replace(".png", "");
  return (
    <Image
      src={`${dashboardIconsURL}png/${iconName}.png`}
      width={width}
      height={height}
      style={{
        width,
        height,
        objectFit: "contain",
        maxHeight: "100%",
        maxWidth: "100%",
      }}
      alt={alt}
    />
  );
}
