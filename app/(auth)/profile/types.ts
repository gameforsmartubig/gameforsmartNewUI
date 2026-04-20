// ─── Profile Types ────────────────────────────────────────────────────────────

export interface Profile {
  fullName: string;
  username: string;
  avatar: string;
  followers: number;
  following: number;
  friends: number;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  username: string;
  birthDate: string;
  isoBirthDate: string;
  grade: string;
  organization: string;
  phone: string;
  gender: string;
  nickname: string;
}

export interface AddressInfo {
  country: string;
  state: string;
  city: string;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
}

export interface ProfileData {
  id: string;
  profile: Profile;
  personal: PersonalInfo;
  address: AddressInfo;
}

// ─── Public Profile Types ─────────────────────────────────────────────────────

export interface PublicProfileData {
  found: boolean;
  profile: Profile;
  nickname: string;
  fullName: string;
  username: string;
  organization: string;
  gender: string;
  country: string;
}

// ─── Form / Action Types ──────────────────────────────────────────────────────

export interface UpdateProfileState {
  success?: boolean;
  message?: string;
  error?: string;
}
