export interface Profile {
  name: string
  username: string
  avatar: string
  followers: number
  following: number
  friends: number
}

export interface PersonalInfo {
  fullName: string
  email: string
  username: string
  birthDate: string
  grade: string
  organization: string
  phone: string
  gender: string
  nickname: string
}

export interface AddressInfo {
  country: string
  state: string
  city: string
}

export interface ProfileData {
  profile: Profile
  personal: PersonalInfo
  address: AddressInfo
}

export async function getProfileData(): Promise<ProfileData> {
  return {
    profile: {
      name: "Alex Johnson",
      username: "@alex_j_dev",
      avatar: "https://i.pravatar.cc/150?img=12",
      followers: 1200,
      following: 850,
      friends: 430
    },

    personal: {
      fullName: "Alex Johnson",
      email: "alex.johnson@technova.io",
      username: "@alex_j_dev",
      birthDate: "6 Oct 2026",
      grade: "Senior High School",
      organization: "SMAN 1 Padang",
      phone: "+1 (555) 902-3456",
      gender: "Male",
      nickname: "Alexios",
    },

    address: {
      country: "United States",
      state: "California",
      city: "San Francisco"
    }
  }
}