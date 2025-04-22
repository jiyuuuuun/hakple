'use client'

import { useEffect, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import './calendar.css'
import CalendarModal from './CalendarModal'

interface EventItem {
  id: string
  title: string
  start: string
  end: string
  description?: string
  color?: string
}

export default function CalendarPage() {
  const calendarRef = useRef<any>(null)

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [mode, setMode] = useState<'create' | 'edit'>('create')

  const [filterColor, setFilterColor] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // 색상별 카테고리 이름
  const colorNameMap: Record<string, string> = {
    '#a855f7': '시험',
    '#facc15': '상담',
    '#4ade80': '모임',
    '#f87171': '과제',
  }

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission()
    }
  }, [])

  // 일정 불러오기
  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/schedules', {
        credentials: 'include',
      })
      if (!res.ok) return

      const data = await res.json()
      const mappedEvents = data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        start: item.startDate,
        end: item.endDate,
        description: item.description,
        color: item.color,
      }))

      mappedEvents.forEach(scheduleNotification)
      setEvents(mappedEvents)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // 알림 설정
  const scheduleNotification = (event: EventItem) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const delay = new Date(event.start).getTime() - Date.now() - 5 * 60 * 1000
    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        new Notification('📅 일정 알림', {
          body: `${event.title} 일정이 곧 시작됩니다.`,
        })
      }, delay)
    }
  }

  // 날짜 이동
  const goToDate = (dateStr: string) => {
    calendarRef.current?.getApi()?.gotoDate(dateStr)
  }

  // 필터링
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.start);
    const now = new Date();
    const isSameMonth = eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear();

    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterColor || event.color === filterColor) &&
      isSameMonth;
  });

  const categorizedEvents: Record<string, EventItem[]> = {}
  filteredEvents.forEach((event) => {
    const color = event.color ?? '#ccc'
    categorizedEvents[color] = categorizedEvents[color] || []
    categorizedEvents[color].push(event)
  })

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr)
    setMode('create')
    setModalOpen(true)
  }

  const handleEventClick = (info: any) => {
    const clicked = events.find((e) => e.id === info.event.id)
    if (clicked) {
      setSelectedEvent(clicked)
      setMode('edit')
      setModalOpen(true)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedDate(null)
    setSelectedEvent(null)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 calendar-wrapper p-4 md:p-8">
      {/* 좌측 분류 + 검색 */}
      <div className="md:w-64 w-full shrink-0 bg-white shadow rounded-xl p-4">
        <input
          type="text"
          placeholder="🔍 일정 검색..."
          className="mb-4 w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {Object.entries(categorizedEvents).map(([color, items]) => (
          <div key={color}>
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [color]: !prev[color] }))}
              className="flex items-center justify-between font-semibold mb-2 w-full text-left"
            >
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {colorNameMap[color] || '기타'} ({items.length})
              </span>
              {collapsed[color] ? '▸' : '▾'}
            </button>
            {!collapsed[color] && (
              <ul className="pl-5 text-gray-600 mb-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="cursor-pointer hover:text-purple-500 truncate"
                    onClick={() => {
                      setSelectedEvent(item)
                      setMode('edit')
                      setModalOpen(true)
                      goToDate(item.start)
                    }}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="flex-1">
        {loading ? (
          <div className="text-center py-20">일정을 불러오는 중...</div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={filteredEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: window.innerWidth > 768 ? 'dayGridMonth,dayGridWeek,dayGridDay' : '',
            }}
            height="auto"
          />
        )}

        {modalOpen && (
          <CalendarModal
            mode={mode}
            date={selectedDate}
            event={selectedEvent}
            onClose={closeModal}
            onRefresh={fetchEvents}
          />
        )}
      </div>
    </div>
  )
}
