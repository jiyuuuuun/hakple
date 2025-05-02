'use client'

import { useEffect, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import './fixed-calendar.css'
import CalendarModal from './CalendarModal'
import { fetchApi } from '@/utils/api'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { useRouter } from 'next/navigation'

interface EventItem {
  id: string
  title: string
  start: string
  end: string
  description?: string
  color?: string
  backgroundColor: string
  borderColor: string
  textColor: string
  classNames?: string[]
  extendedProps: {
    category: string
  }
}

export default function CalendarPage() {
  const { isLogin, loginMember, isLoginMemberPending } = useGlobalLoginMember()
  const router = useRouter()
  const calendarRef = useRef<any>(null)
  const alertShownRef = useRef(false)

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
    '#f1dffb': '시험',
    '#fff2bd': '상담',
    '#e3f1cf': '모임',
    '#ffe0e0': '과제',
    '#e5e7ec': '기타',
    '#a855f7': '시험',
    '#facc15': '상담',
    '#4ade80': '모임',
    '#f87171': '과제',
    '#64748b': '기타'
  }

  // 학원 코드 확인 및 리다이렉트 로직 추가
  useEffect(() => {
    // 인증 상태 로딩 중이면 대기
    if (isLoginMemberPending) {
      return;
    }

    // Ref를 확인하여 이미 알림/리다이렉션이 시작되지 않았는지 체크
    if (isLogin && !loginMember?.academyCode && !alertShownRef.current) {
      alertShownRef.current = true; // 플래그 설정
      alert('학원코드를 먼저 등록하세요.');
      router.push('/myinfo/academyRegister');
    }
    // 로그인하지 않았으면 로그인 페이지로
    else if (!isLogin && !alertShownRef.current) { // 로그인 안된 경우도 중복 방지
      alertShownRef.current = true; // 플래그 설정
      router.push('/login');
    }
  }, [isLogin, loginMember, isLoginMemberPending, router]);

  // 일정 불러오기
  const fetchEvents = async () => {
    // 로그인 상태 및 학원 코드 확인 추가
    if (!isLogin || !loginMember?.academyCode) {
        setLoading(false); // 로딩 상태 해제
        return;
    }

    setLoading(true)
    try {
      const res = await fetchApi('/api/v1/schedules', {
        method: 'GET',
      })
      if (!res.ok) return

      const data = await res.json()
      const mappedEvents = data.map((item: any) => {
        // 카테고리별 색상 매핑
        let eventColor = item.color || '#f1dffb';
        
        // 기존 색상 코드를 새 색상 코드로 변환
        if (eventColor === '#a855f7') eventColor = '#f1dffb';  // 시험: 연한 보라색
        else if (eventColor === '#facc15') eventColor = '#fff2bd'; // 상담: 연한 노란색
        else if (eventColor === '#4ade80') eventColor = '#e3f1cf'; // 모임: 연한 녹색
        else if (eventColor === '#f87171') eventColor = '#ffe0e0'; // 과제: 연한 빨간색
        else if (eventColor === '#64748b') eventColor = '#e5e7ec'; // 기타: 연한 회색
        
        // 헥스 값을 제거한 색상 코드만 추출 (예: #f1dffb -> f1dffb)
        const colorCode = eventColor.replace('#', '');
        
        return {
          id: String(item.id),
          title: item.title,
          start: item.startDate,
          end: item.endDate,
          description: item.description,
          color: eventColor,
          backgroundColor: eventColor,
          borderColor: eventColor,
          textColor: colorCode === 'fff2bd' ? '#111' : '#333',
          className: `event-category-${colorCode}`,
          extendedProps: {
            category: colorNameMap[eventColor] || '기타'
          }
        };
      })

      mappedEvents.forEach(scheduleNotification)
      setEvents(mappedEvents)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // fetchEvents 호출 시점 조정
  useEffect(() => {
    // 로그인 및 학원 코드 확인 후 호출
    if (isLogin && loginMember?.academyCode) {
        fetchEvents();
    }
  }, [isLogin, loginMember]); // isLogin, loginMember 의존성 추가

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
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterColor || event.color === filterColor);
  });

  // 카테고리 메뉴를 위한 이번달 필터링 (왼쪽 메뉴에만 적용)
  const thisMonthEvents = events.filter((event) => {
    const eventDate = new Date(event.start);
    const now = new Date();
    const isSameMonth = eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear();
    
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterColor || event.color === filterColor) &&
      isSameMonth;
  });

  const categorizedEvents: Record<string, EventItem[]> = {}
  thisMonthEvents.forEach((event) => {
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

  // 리다이렉트 중이거나 로딩 중일 때 표시할 내용
  if (isLoginMemberPending || (isLogin && !loginMember?.academyCode)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[90vw] mt-8 p-6 bg-white rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row gap-6">
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
                  <span className="inline-block w-4 h-4 rounded-full border border-gray-300" 
                    style={{ 
                      backgroundColor: color,
                      boxShadow: `0 0 0 1px rgba(0,0,0,0.1) inset` 
                    }} />
                  <span className="font-semibold text-gray-800">{colorNameMap[color] || '기타'} ({items.length})</span>
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
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: true
              }}
              eventDisplay="block"
              eventContent={(eventInfo) => {
                // 카테고리별 아이콘 설정
                let icon = '📌';
                const colorCode = eventInfo.event.backgroundColor?.replace('#', '');
                
                // 카테고리에 맞는 모던한 아이콘 설정
                if (colorCode === 'f1dffb' || colorCode === 'a855f7') icon = '📚'; // 시험
                else if (colorCode === 'fff2bd' || colorCode === 'facc15') icon = '🗣️'; // 상담
                else if (colorCode === 'e3f1cf' || colorCode === '4ade80') icon = '👥'; // 모임
                else if (colorCode === 'ffe0e0' || colorCode === 'f87171') icon = '✏️'; // 과제
                else if (colorCode === 'e5e7ec' || colorCode === '64748b') icon = '📌'; // 기타
                
                return (
                  <div 
                    className={`fc-event-main event-category-${colorCode}`} 
                    style={{
                      backgroundColor: eventInfo.event.backgroundColor, 
                      color: colorCode === 'e5e7ec' ? '#333340' : eventInfo.event.textColor, 
                      padding: '6px 12px',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      overflow: 'hidden'
                    }}
                  >
                    <div className="fc-event-title" style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      fontWeight: 700,
                      fontSize: '0.9em'
                    }}>
                      <span style={{
                        marginRight: '6px',
                        fontSize: '0.9em'
                      }}>{icon}</span>
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{eventInfo.event.title}</span>
                    </div>
                    {eventInfo.timeText && (
                      <div className="fc-event-time" style={{
                        fontSize: '0.75em', 
                        opacity: 0.9,
                        marginTop: '2px',
                        fontWeight: 600
                      }}>
                        {eventInfo.timeText}
                      </div>
                    )}
                  </div>
                )
              }}
            />
          )}
        </div>
      </div>

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
  )
}
