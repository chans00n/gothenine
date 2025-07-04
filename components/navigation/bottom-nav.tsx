"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Home,
  CheckSquare,
  Calendar,
  Camera,
  Timer,
  Footprints,
  LucideIcon
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/checklist",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
  },
  {
    href: "/photos",
    label: "Photos",
    icon: Camera,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t" />
      
      {/* Navigation items */}
      <div className="relative">
        <ul className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== "/dashboard" && pathname.startsWith(item.href))
            
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "min-h-[56px] px-2 py-2 rounded-lg",
                    "transition-all duration-200",
                    "hover:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "group"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 bg-primary/10 rounded-lg"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon container */}
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "h-5 w-5 mb-1 transition-all duration-200",
                        isActive 
                          ? "text-primary stroke-[2.5px]" 
                          : "text-muted-foreground stroke-2 group-hover:text-foreground"
                      )}
                    />
                    
                    {/* Badge */}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-200",
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </span>

                  {/* Touch ripple effect */}
                  <motion.span
                    className="absolute inset-0 rounded-lg"
                    whileTap={{
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </nav>
  )
}

// Floating Action Button variant
export function FloatingBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-background/95 backdrop-blur-lg border rounded-2xl shadow-lg"
      >
        <ul className="flex items-center justify-around px-4 py-3">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || 
                           (item.href !== "/dashboard" && pathname.startsWith(item.href))
            
            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-1"
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "px-3 py-2 rounded-xl",
                    "transition-all duration-200",
                    "hover:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "group"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <item.icon
                      className={cn(
                        "h-6 w-6 mb-1 transition-all duration-200",
                        isActive 
                          ? "text-primary stroke-[2.5px]" 
                          : "text-muted-foreground stroke-2"
                      )}
                    />
                  </motion.div>

                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive ? 1 : 0.7 }}
                    className={cn(
                      "text-[11px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </motion.span>

                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="floatingNavDot"
                      className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </motion.div>
    </nav>
  )
}