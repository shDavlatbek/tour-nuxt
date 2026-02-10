export interface VillageDetail {
  id: string
  cityName: string
  villageName: string
  heroImage: string
  description: {
    subtitle: string
    paragraphs: string[]
  }
  gallery: GalleryImage[]
  comments: VillageComment[]
  location: {
    lat: number
    lng: number
    zoom: number
  }
}

export interface GalleryImage {
  id: number
  src: string
  alt: string
}

export interface VillageComment {
  id: number
  text: string
  authorName: string
  authorRole: string
  authorInitials: string
}
