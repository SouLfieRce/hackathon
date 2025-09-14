"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Bus, Clock, Users, Navigation, Zap } from "lucide-react"
import { busRoutes, type BusLocation } from "@/lib/bus-data"

interface LiveBusMapProps {
  busLocations: BusLocation[]
}

export default function LiveBusMap({ busLocations }: LiveBusMapProps) {
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 }) // Bangalore center

  // Simulate map bounds for Bangalore
  const mapBounds = {
    north: 13.1,
    south: 12.8,
    east: 77.8,
    west: 77.3,
  }

  const getRouteColor = (routeId: string) => {
    const route = busRoutes.find((r) => r.id === routeId)
    return route?.color || "#3b82f6"
  }

  const getBusStatusColor = (bus: BusLocation) => {
    if (bus.delay > 10) return "bg-red-500"
    if (bus.delay > 5) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getBusStatusText = (bus: BusLocation) => {
    if (bus.delay > 10) return "Severely Delayed"
    if (bus.delay > 5) return "Delayed"
    if (bus.delay < -2) return "Early"
    return "On Time"
  }

  // Convert real coordinates to map pixel positions
  const getMapPosition = (lat: number, lng: number) => {
    const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100
    const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Interactive Map */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Bus Locations - Bangalore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-border overflow-hidden">
            {/* Map Background with Streets */}
            <div className="absolute inset-0">
              {/* Major Roads */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-300 transform -translate-x-1/2" />
              <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gray-200" />
              <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-gray-200" />
              <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-gray-200" />
              <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-gray-200" />

              {/* Area Labels */}
              <div className="absolute top-4 left-4 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                North Bangalore
              </div>
              <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                South Bangalore
              </div>
              <div className="absolute top-4 right-4 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                East Bangalore
              </div>
              <div className="absolute bottom-4 left-4 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                West Bangalore
              </div>
            </div>

            {/* Bus Markers */}
            {busLocations.map((bus) => {
              const position = getMapPosition(bus.lat, bus.lng)
              const isSelected = selectedBus?.busId === bus.busId

              return (
                <div
                  key={bus.busId}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    isSelected ? "scale-125 z-20" : "hover:scale-110 z-10"
                  }`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                  onClick={() => setSelectedBus(bus)}
                >
                  <div className="relative">
                    {/* Bus Icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: getRouteColor(bus.routeId) }}
                    >
                      <Bus className="h-3 w-3" />
                    </div>

                    {/* Status Indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getBusStatusColor(bus)}`} />

                    {/* Bus ID Label */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white px-1 py-0.5 rounded shadow whitespace-nowrap">
                      {bus.busId}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Route Lines (simplified) */}
            {busRoutes.map((route) => {
              const routeBuses = busLocations.filter((bus) => bus.routeId === route.id)
              if (routeBuses.length < 2) return null

              return (
                <svg key={route.id} className="absolute inset-0 w-full h-full pointer-events-none">
                  {routeBuses.slice(0, -1).map((bus, index) => {
                    const nextBus = routeBuses[index + 1]
                    const pos1 = getMapPosition(bus.lat, bus.lng)
                    const pos2 = getMapPosition(nextBus.lat, nextBus.lng)

                    return (
                      <line
                        key={`${bus.busId}-${nextBus.busId}`}
                        x1={`${pos1.x}%`}
                        y1={`${pos1.y}%`}
                        x2={`${pos2.x}%`}
                        y2={`${pos2.y}%`}
                        stroke={route.color}
                        strokeWidth="2"
                        strokeOpacity="0.3"
                        strokeDasharray="5,5"
                      />
                    )
                  })}
                </svg>
              )
            })}

            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>On Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span>Delayed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Severely Delayed</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bus Details Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{selectedBus ? `Bus ${selectedBus.busId}` : "Select a Bus"}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedBus ? (
            <div className="space-y-4">
              {/* Route Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getRouteColor(selectedBus.routeId) }}
                  />
                  <span className="font-medium">{busRoutes.find((r) => r.id === selectedBus.routeId)?.name}</span>
                </div>
                <Badge variant="outline">{selectedBus.routeId}</Badge>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant={selectedBus.delay <= 2 ? "default" : selectedBus.delay <= 10 ? "secondary" : "destructive"}
                  >
                    {getBusStatusText(selectedBus)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Delay:</span>
                  <span className="font-medium">
                    {selectedBus.delay > 0 ? "+" : ""}
                    {selectedBus.delay} min
                  </span>
                </div>
              </div>

              {/* Occupancy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Occupancy:
                  </span>
                  <span className="font-medium">{selectedBus.occupancy}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      selectedBus.occupancy > 80
                        ? "bg-red-500"
                        : selectedBus.occupancy > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${selectedBus.occupancy}%` }}
                  />
                </div>
              </div>

              {/* Speed & Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Speed:
                  </span>
                  <span className="font-medium">{selectedBus.speed} km/h</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Navigation className="h-4 w-4" />
                    Next Stop:
                  </span>
                  <span className="font-medium text-sm">{selectedBus.nextStop}</span>
                </div>
              </div>

              {/* Coordinates */}
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <div>Lat: {selectedBus.lat.toFixed(4)}</div>
                  <div>Lng: {selectedBus.lng.toFixed(4)}</div>
                  <div>Updated: {selectedBus.timestamp.toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Action Button */}
              <Button className="w-full" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click on a bus marker to view details</p>
              <p className="text-sm mt-2">{busLocations.length} buses currently active</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
