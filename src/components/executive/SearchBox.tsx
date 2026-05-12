type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchBox({
  value,
  onChange,
  placeholder = "Buscar...",
}: Props) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 42,
          borderRadius: 15,
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          padding: "0 14px",
          fontSize: 13,
          color: "#334155",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}