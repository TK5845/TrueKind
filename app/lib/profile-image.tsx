import type { CSSProperties } from "react";

type ProfileImageProps = {
  src: string;
  name: string;
  size: number;
  radius?: string | number;
  shadow?: string;
  fallbackFontSize?: number;
};

export function getProfileInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function ProfileImage({
  src,
  name,
  size,
  radius = "50%",
  shadow = "",
  fallbackFontSize,
}: ProfileImageProps) {
  const sharedStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    border: "1px solid rgba(231,223,218,0.95)",
    ...(shadow ? { boxShadow: shadow } : {}),
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          ...sharedStyle,
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      aria-label={`${name} saknar profilbild`}
      style={{
        ...sharedStyle,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #efe7e2, #e8ddd6)",
        color: "#6d625d",
        fontWeight: 800,
        ...(fallbackFontSize ? { fontSize: fallbackFontSize } : {}),
      }}
    >
      {getProfileInitial(name)}
    </div>
  );
}
