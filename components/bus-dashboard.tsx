"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Bus, Clock, Users, TrendingUp, AlertTriangle, Play, Pause, RotateCcw } from "lucide-react"
import { busRoutes, generateBusLocations, generatePassengerData, cleanBusData, type BusLocation } from "@/lib/bus-data"
import {
  BusDemandPredictor,
  detectBusBunching,
  type DemandPrediction,
  type RouteOptimization,
} from "@/lib/ml-prediction"


export default function BusDashboard() {
  const [busLocations, setBusLocations] = useState<BusLocation[]>([])
  const [predictions, setPredictions] = useState<DemandPrediction[]>([])
  const [optimizations, setOptimizations] = useState<RouteOptimization[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Initialize data and ML predictor
  useEffect(() => {
    const historicalData = generatePassengerData(30)
    const predictor = new BusDemandPredictor(historicalData)

    // Initial data load
    updateBusData(predictor)

    // Set up real-time simulation
    const interval = setInterval(() => {
      if (isSimulationRunning) {
        updateBusData(predictor)
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isSimulationRunning])

  const updateBusData = (predictor: BusDemandPredictor) => {
    // Generate new bus locations
    const rawLocations = generateBusLocations()
    const cleanedLocations = cleanBusData(rawLocations)
    setBusLocations(cleanedLocations)

    // Generate predictions for all routes
    const allPredictions: DemandPrediction[] = []
    busRoutes.forEach((route) => {
      const routePredictions = predictor.predictDemand(route.id, 6)
      allPredictions.push(...routePredictions)
    })
    setPredictions(allPredictions)

    // Get schedule optimizations
    const opts = predictor.optimizeSchedules()
    setOptimizations(opts)

    // Detect issues
    const bunchingAlerts = detectBusBunching(cleanedLocations)
    setAlerts(bunchingAlerts)

    setLastUpdate(new Date())
  }

  const toggleSimulation = () => {
    setIsSimulationRunning(!isSimulationRunning)
  }

  const resetSimulation = () => {
    setIsSimulationRunning(false)
    setBusLocations([])
    setPredictions([])
    setOptimizations([])
    setAlerts([])
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Smart Bus Management System</h1>
            <p className="text-muted-foreground mt-2">Real-time optimization for Bangalore city buses</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</div>
            <Button
              onClick={toggleSimulation}
              variant={isSimulationRunning ? "destructive" : "default"}
              className={`flex items-center gap-2 ${
                isSimulationRunning
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isSimulationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSimulationRunning ? "Stop" : "Start"} Simulation
            </Button>
            <Button
              onClick={resetSimulation}
              variant="outline"
              size="icon"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Buses</CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{busLocations.length}</div>
            <p className="text-xs text-muted-foreground">Across {busRoutes.length} routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {busLocations.length > 0
                ? Math.round(busLocations.reduce((sum, bus) => sum + bus.occupancy, 0) / busLocations.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">System-wide average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Performance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {busLocations.length > 0
                ? Math.round((busLocations.filter((bus) => bus.delay <= 2).length / busLocations.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Within 2 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live">Live Tracking</TabsTrigger>
          <TabsTrigger value="predictions">Demand Forecast</TabsTrigger>
          <TabsTrigger value="optimization">Schedule Optimization</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">


          {/* Route Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busRoutes.map((route) => {
              const routeBuses = busLocations.filter((bus) => bus.routeId === route.id)
              const avgOccupancy =
                routeBuses.length > 0 ? routeBuses.reduce((sum, bus) => sum + bus.occupancy, 0) / routeBuses.length : 0
              const onTimeBuses = routeBuses.filter((bus) => bus.delay <= 2).length

              return (
                <Card key={route.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{route.name}</CardTitle>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Active Buses:</span>
                      <span className="font-medium">{routeBuses.length}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Avg Occupancy:</span>
                        <span className="font-medium">{Math.round(avgOccupancy)}%</span>
                      </div>
                      <Progress value={avgOccupancy} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>On Time:</span>
                      <span className="font-medium">
                        {onTimeBuses}/{routeBuses.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Passenger Demand Forecast
              </CardTitle>
              <CardDescription>ML-powered predictions for the next 6 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {busRoutes.map((route) => {
                  const routePredictions = predictions.filter((p) => p.routeId === route.id)
                  const totalDemand = routePredictions.reduce((sum, p) => sum + p.predictedBoardings, 0)

                  return (
                    <div key={route.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{route.name}</h3>
                        <Badge variant="outline">{totalDemand} predicted passengers</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }, (_, i) => {
                          const hour = (new Date().getHours() + i) % 24
                          const hourPredictions = routePredictions.filter((p) => p.hour === hour)
                          const hourDemand = hourPredictions.reduce((sum, p) => sum + p.predictedBoardings, 0)

                          return (
                            <div key={i} className="text-center p-2 bg-muted rounded">
                              <div className="text-xs text-muted-foreground">{hour.toString().padStart(2, "0")}:00</div>
                              <div className="font-medium text-sm">{hourDemand}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Optimization Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions to improve efficiency and reduce wait times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizations.map((opt) => (
                  <div key={opt.routeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{busRoutes.find((r) => r.id === opt.routeId)?.name}</h3>
                      <Badge variant={opt.expectedImprovement > 0 ? "default" : "secondary"}>
                        {opt.expectedImprovement > 0 ? "+" : ""}
                        {opt.expectedImprovement.toFixed(1)}% change
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Current Frequency</div>
                        <div className="font-medium">{opt.currentFrequency} buses/hour</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Recommended</div>
                        <div className="font-medium">{opt.optimizedFrequency} buses/hour</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{opt.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="text-green-600 mb-2">✓</div>
                    <p className="text-muted-foreground">No active alerts - system running smoothly</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert, index) => (
                <Alert key={index} className="border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Bus Bunching Detected</AlertTitle>
                  <AlertDescription>
                    Route {alert.routeId}: Buses {alert.busIds.join(" and ")} are only {alert.distance}m apart.
                    <br />
                    <strong>Recommendation:</strong> {alert.recommendation}
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
