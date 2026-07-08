export interface Song {
  id: string
  title: string
  artist: string
  album: string
  streams: number
  duration: string
  trend: number // positive = up, negative = down (percent change)
  lat?: number
  lng?: number
}

export interface Artist {
  id: string
  name: string
  streams: number
  trend: number
  topSong: string
  lat?: number
  lng?: number
}

export interface Album {
  id: string
  title: string
  artist: string
  streams: number
  trend: number
  lat?: number
  lng?: number
}

export interface CountryData {
  name: string
  lat: number
  lng: number
  topArtists: Artist[]
  topSongs: Song[]
  topAlbums: Album[]
  totalStreams: number
  trendPercent: number
}

export interface GlobalData {
  topArtists: Artist[]
  topSongs: Song[]
  topAlbums: Album[]
  totalStreams: number
  trendPercent: number
}

export interface Metrics {
  global: GlobalData
  countries: { [key: string]: CountryData }
}

export type Metric = 'artists' | 'songs' | 'albums'

export interface PlaylistItem {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  addedAt: string
}
