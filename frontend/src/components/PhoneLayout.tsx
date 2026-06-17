import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'

interface PhoneLayoutProps {
  children: ReactNode
}

export default function PhoneLayout({ children }: PhoneLayoutProps) {
  return (
    <div className="phone-frame">
      <div className="phone-bg" />
      <StatusBar />
      <div className="phone-scroll">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
