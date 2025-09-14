export interface BusRoute {
  id: string
  name: string
  stops: string[]
  color: string
}

export interface BusLocation {
  busId: string
  routeId: string
  lat: number
  lng: number
  occupancy: number
  speed: number
  timestamp: Date
  nextStop: string
  delay: number // in minutes
}

export interface PassengerData {
  routeId: string
  stopId: string
  timestamp: Date
  boardings: number
  alightings: number
}

export interface TicketSale {
  id: string
  routeId: string
  fromStop: string
  toStop: string
  timestamp: Date
  price: number
}

// Sample data for demonstration
export const busRoutes: BusRoute[] = [
  {
    id: "R1",
    name: "Koramangala - Whitefield",
    stops: ["Koramangala", "HSR Layout", "Marathahalli", "Whitefield"],
    color: "#3b82f6",
  },
  {
    id: "R2",
    name: "Banashankari - Electronic City",
    stops: ["Banashankari", "BTM Layout", "Silk Board", "Electronic City"],
    color: "#f59e0b",
  },
  { id: "R3", name: "Indiranagar - Airport", stops: ["Indiranagar", "Domlur", "HAL", "Airport"], color: "#10b981" },
  { id: "R4", name: "Jayanagar - Hebbal", stops: ["Jayanagar", "Lalbagh", "Majestic", "Hebbal"], color: "#ef4444" },
  {
    id: "R5",
    name: "Rajajinagar - Sarjapur",
    stops: ["Rajajinagar", "Malleswaram", "MG Road", "Sarjapur"],
    color: "#8b5cf6",
  },
]

// Generate sample bus locations
export function generateBusLocations(): BusLocation[] {
  const locations: BusLocation[] = []

  busRoutes.forEach((route) => {
    // Generate 3-5 buses per route
    const busCount = Math.floor(Math.random() * 3) + 3

    for (let i = 0; i < busCount; i++) {
      locations.push({
        busId: `${route.id}-${i + 1}`,
        routeId: route.id,
        lat: 12.9716 + (Math.random() - 0.5) * 0.2, // Bangalore coordinates with variation
        lng: 77.5946 + (Math.random() - 0.5) * 0.2,
        occupancy: Math.floor(Math.random() * 100),
        speed: Math.floor(Math.random() * 40) + 10,
        timestamp: new Date(),
        nextStop: route.stops[Math.floor(Math.random() * route.stops.length)],
        delay: Math.floor(Math.random() * 20) - 5, // -5 to +15 minutes
      })
    }
  })

  return locations
}

// Generate historical passenger data for ML prediction
export function generatePassengerData(days = 30): PassengerData[] {
  const data: PassengerData[] = []
  const now = new Date()

  for (let day = 0; day < days; day++) {
    const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000)

    busRoutes.forEach((route) => {
      route.stops.forEach((stop) => {
        // Generate hourly data for peak and off-peak hours
        for (let hour = 6; hour < 23; hour++) {
          const timestamp = new Date(date)
          timestamp.setHours(hour, 0, 0, 0)

          // Peak hours: 7-10 AM and 5-8 PM
          const isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)
          const basePassengers = isPeakHour ? 50 : 20

          data.push({
            routeId: route.id,
            stopId: stop,
            timestamp,
            boardings: Math.floor(Math.random() * basePassengers) + 5,
            alightings: Math.floor(Math.random() * basePassengers) + 5,
          })
        }
      })
    })
  }

  return data
}

// Clean and process data (remove outliers, fix missing values)
export function cleanBusData(locations: BusLocation[]): BusLocation[] {
  return locations.filter((location) => {
    // Remove invalid coordinates
    if (location.lat < 12.8 || location.lat > 13.2) return false
    if (location.lng < 77.3 || location.lng > 77.8) return false

    // Remove impossible speeds
    if (location.speed < 0 || location.speed > 80) return false

    // Remove invalid occupancy
    if (location.occupancy < 0 || location.occupancy > 100) return false

    return true
  })
}
