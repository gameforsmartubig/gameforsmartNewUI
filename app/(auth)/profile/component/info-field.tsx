interface InfoFieldProps {
  label: string;
  value: string | number;
}

export function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value !== "" ? value : "-"}</p>
    </div>
  );
}
