import { InfoField } from "./info-field";
import type { AddressInfo } from "../types";

interface AddressSectionProps {
  address: AddressInfo;
}

export function AddressSection({ address }: AddressSectionProps) {
  return (
    <div>
      <h3 className="font-semibold mb-4">Address Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted rounded-lg p-6">
        <InfoField label="COUNTRY"          value={address.country} />
        <InfoField label="PROVINCE / STATE" value={address.state} />
        <InfoField label="CITY"             value={address.city} />
      </div>
    </div>
  );
}
