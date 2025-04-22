'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useEffect, useState } from 'react'
import './calendar.css'


interface EventItem {
  id: string 
  title: string
  start: string
  end: string
  description?: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/v1/schedules', {
          method: 'GET',
          credentials: 'include', // ✅ 쿠키 기반 인증 필수!
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        console.log('불러온 일정:', res)
        console.log('이벤트 리스트:', events) // 👈 이거 찍어봐!



        if (!res.ok) {
          console.error('일정 불러오기 실패')
          return
        }

        const data = await res.json()
        const mappedEvents = data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          start: item.startDate,
          end: item.endDate,
          description: item.description,
        }))

        setEvents(mappedEvents)
      } catch (err) {
        console.error('에러 발생:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <div className="calendar-wrapper">
      {loading ? (
        <div className="text-center py-20 text-gray-400">📅 일정을 불러오는 중입니다...</div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          height="auto"
        />
      )}
    </div>
  )
}
