"use client"

import { signOut } from "next-auth/react"
import { Button } from "./ui/button"
import { LogOut, Bell } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

interface HeaderProps {
  user: any
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {user?.organization?.name || "Dashboard"}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 dark:text-gray-300" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="dark:text-gray-300 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  )
}
