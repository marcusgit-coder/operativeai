"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface InvoiceMetricsProps {
  data: {
    monthlyVolume: Array<{ month: string; count: number }>
    monthlyRevenue: Array<{ month: string; amount: number }>
    processingTime: Array<{ month: string; avgTime: number }>
    confidenceScore: Array<{ month: string; avgScore: number }>
  }
}

export default function InvoiceMetrics({ data }: InvoiceMetricsProps) {
  // Custom tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm dark:text-gray-300" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
      {/* Monthly Invoice Volume */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-gray-100">Invoice Volume</CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400">Monthly processed</p>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.monthlyVolume} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
                width={25}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Invoices"
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Revenue */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-gray-100">Monthly Revenue</CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total amounts (HKD)</p>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
                width={25}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Revenue (HKD)"
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Processing Time */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-gray-100">Processing Time</CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg time (seconds)</p>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.processingTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
                width={25}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: number) => [`${value.toFixed(1)}s`, 'Avg Time']}
              />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Processing Time (s)"
                dot={{ fill: '#f59e0b', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Confidence Score */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base dark:text-gray-100">AI Confidence</CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg accuracy (%)</p>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.confidenceScore} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                stroke="currentColor"
                axisLine={false}
                width={25}
                domain={[0, 100]}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
              />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Confidence Score (%)"
                dot={{ fill: '#8b5cf6', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
