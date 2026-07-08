# My Dashboard - Project Brief

## What is this?
A single-page analytics dashboard showing what music is played around the world and that allows an user to create a playlist.

## What this dashboard provides
- The user can see what kind of music is preferred around the world 
- Current music trends
- Discover new music to add to their personal playlist

## Data
Generate a dataset as a JSON file (src/data/metrics.json).
- Most played song
- Most played album
- Most played artist
- Number of streams by artist, song, album

## Layout (Vuetify)
- v-app-bar at the top with the dashboard title (make a fun one) and two options: Home, Playlist
- Left content:
    - 4 summary cards (v-card) showing the key metrics with a country picker (default to ALL) - top artist, top song, top album, number of streams
- Right content: map with a music note icon pin showing the top artist, song, and album, most-streamed (add a segmented button over the map so the user can toggle between those options). 

## Interactions
- Country picker in the app bar filters the cards and map - summary cards show top 10 
- When “All” is selected, summary cards show world totals
- Cards should show a small up/down arrow or color indicating an increase or decrease of streams
- Scatter the pins using only the TOP 10 of the list, update as the user zooms in a country/region

## Style
- Dark theme by default (Vuetify dark theme)
- Clean, minimal, lots of whitespace
- Charts should use a cohesive color palette, not rainbow
- Mobile responsive - cards stack on small screens

## Tech
- Vue 3 + TypeScripts + Vuetify 3
- Chart.js via vue-chartjs for all charts
- Fake data from a local JSON file (no API calls)
- Single page - no routing needed for this app
