export interface Profile {
  id: string
  name: string
  age: number | null
  height_in: number | null
  single: boolean | null
  identity: string | null
  interested_in: string[] | null
  country: string | null
  city: string | null
  neighborhood: string | null
  occupation: string | null
  languages: string | null
  social_handle: string | null
  about: string | null
  interests: string[] | null
  photo_url: string | null
  photos: string[] | null
  video_url: string | null
  created_at: string
}

export type ProfileDraft = Omit<Profile, 'id' | 'created_at'>

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
  read_at: string | null
}
