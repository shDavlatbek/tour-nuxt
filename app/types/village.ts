// --- Paginated Response Wrapper ---
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// --- City ---
export interface CityList {
  id: number
  name: string
  slug: string
  short_description: string
  village_count: number
}

export interface CityDetail extends CityList {
  villages: VillageList[]
}

// --- Village ---
export interface VillageList {
  id: number
  name: string
  slug: string
  short_description: string
  city: number
  city_name: string
  latitude: string | null
  longitude: string | null
  image: {
    original: string
    thumbnail: string
  } | null
}

export interface VillageDetail extends VillageList {
  description: string
  gallery: GalleryImage[]
  comments: VillageComment[]
}

// --- Gallery (API response) ---
export interface GalleryImage {
  id: number
  image: {
    original: string
    thumbnail: string
  }
  name: string
}

// --- Comment (API response) ---
export interface VillageComment {
  id: number
  full_name: string
  who: string
  comment: string
  created_at: string
}

// --- Display interfaces used by components ---
export interface GalleryImageDisplay {
  id: number
  src: string
  alt: string
}

export interface VillageCommentDisplay {
  id: number
  text: string
  authorName: string
  authorRole: string
  authorInitials: string
}

// --- Settings (API response) ---
export interface SiteSettings {
  about_title: string
  about_description: string
  bg_image: string | null
}
