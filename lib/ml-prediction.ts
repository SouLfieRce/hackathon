
import type { PassengerData } from "./bus-data"

export interface DemandPrediction {
  routeId: string
  stopId: string
  hour: number
  predictedBoardings: number
  predictedAlightings: number
  confidence: number
}

export interface RouteOptimization {
  routeId: string
  currentFrequency: number // buses per hour
  optimizedFrequency: number
  expectedImprovement: number // percentage
  reasoning: string
}

// Simple time-series prediction using moving averages and trend analysis
export class BusDemandPredictor {
  private historicalData: PassengerData[]

  constructor(historicalData: PassengerData[]) {
    this.historicalData = historicalData
  }

  // Predict passenger demand for next few hours
  predictDemand(routeId: string, hours = 6): DemandPrediction[] {
    const predictions: DemandPrediction[] = []
    const now = new Date()

    // Get historical data for this route
    const routeData = this.historicalData.filter((d) => d.routeId === routeId)

    // Group by stop and hour
    const stopHourData = new Map<string, PassengerData[]>()

    routeData.forEach((data) => {
      const hour = data.timestamp.getHours()
      const key = `${data.stopId}-${hour}`

      if (!stopHourData.has(key)) {
        stopHourData.set(key, [])
      }
      stopHourData.get(key)!.push(data)
    })

    // Generate predictions for each stop and hour
    const uniqueStops = [...new Set(routeData.map((d) => d.stopId))]

    for (let h = 0; h < hours; h++) {
      const targetHour = (now.getHours() + h) % 24

      uniqueStops.forEach((stopId) => {
        const key = `${stopId}-${targetHour}`
        const historicalForHour = stopHourData.get(key) || []

        if (historicalForHour.length > 0) {
          // Calculate moving average
          const avgBoardings = historicalForHour.reduce((sum, d) => sum + d.boardings, 0) / historicalForHour.length
          const avgAlightings = historicalForHour.reduce((sum, d) => sum + d.alightings, 0) / historicalForHour.length

          // Add some trend and seasonality factors
          const dayOfWeek = now.getDay()
          const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0
          const peakHourFactor =
            (targetHour >= 7 && targetHour <= 10) || (targetHour >= 17 && targetHour <= 20) ? 1.3 : 1.0

          predictions.push({
            routeId,
            stopId,
            hour: targetHour,
            predictedBoardings: Math.round(avgBoardings * weekendFactor * peakHourFactor),
            predictedAlightings: Math.round(avgAlightings * weekendFactor * peakHourFactor),
            confidence: Math.min(0.95, historicalForHour.length / 30), // Higher confidence with more data
          })
        }
      })
    }

    return predictions
  }

  // Optimize bus schedules based on demand predictions
  optimizeSchedules(): RouteOptimization[] {
    const optimizations: RouteOptimization[] = []

    // Get current hour predictions for all routes
    const routeIds = [...new Set(this.historicalData.map((d) => d.routeId))]

    routeIds.forEach((routeId) => {
      const predictions = this.predictDemand(routeId, 1)
      const totalDemand = predictions.reduce((sum, p) => sum + p.predictedBoardings, 0)

      // Current frequency (assumed baseline)
      const currentFrequency = 4 // 4 buses per hour

      // Calculate optimal frequency based on demand
      let optimizedFrequency = currentFrequency
      let reasoning = "Maintaining current schedule"

      if (totalDemand > 200) {
        optimizedFrequency = 6
        reasoning = "High demand detected - increasing frequency"
      } else if (totalDemand < 50) {
        optimizedFrequency = 2
        reasoning = "Low demand - reducing frequency to save costs"
      }

      const improvement = ((optimizedFrequency - currentFrequency) / currentFrequency) * 100

      optimizations.push({
        routeId,
        currentFrequency,
        optimizedFrequency,
        expectedImprovement: Math.abs(improvement),
        reasoning,
      })
    })

    return optimizations
  }
}

// Detect and prevent bus bunching
export function detectBusBunching(locations: any[]): any[] {
  const alerts: any[] = []

  // Group buses by route
  const routeGroups = new Map()
  locations.forEach((bus) => {
    if (!routeGroups.has(bus.routeId)) {
      routeGroups.set(bus.routeId, [])
    }
    routeGroups.get(bus.routeId).push(bus)
  })

  // Check for bunching (buses too close together)
  routeGroups.forEach((buses, routeId) => {
    for (let i = 0; i < buses.length - 1; i++) {
      for (let j = i + 1; j < buses.length; j++) {
        const distance = calculateDistance(buses[i].lat, buses[i].lng, buses[j].lat, buses[j].lng)

        // If buses are within 500m of each other, it's bunching
        if (distance < 0.5) {
          alerts.push({
            type: "bunching",
            routeId,
            busIds: [buses[i].busId, buses[j].busId],
            distance: Math.round(distance * 1000), // in meters
            severity: distance < 0.2 ? "high" : "medium",
            recommendation: "Hold back trailing bus or speed up leading bus",
          })
        }
      }
    }
  })

  return alerts
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

