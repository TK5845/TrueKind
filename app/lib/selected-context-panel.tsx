type SelectedContextPanelProps = {
  preview: string;
  label?: string;
};

export function SelectedContextPanel({
  preview,
  label = "Aktuell signal",
}: SelectedContextPanelProps) {
  return (
    <div
      style={{
        background: "rgba(248,245,242,0.82)",
        borderRadius: 18,
        border: "1px solid rgba(231,223,218,0.95)",
        padding: "14px 16px",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ color: "#6d625d", fontSize: 13, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ color: "#2f2a27", fontSize: 15, lineHeight: 1.65 }}>
        {preview}
      </div>
    </div>
  );
}
