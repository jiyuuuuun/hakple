'use client'

import { useEffect, useState } from 'react'
import { fetchApi } from '@/utils/api'

interface CalendarModalProps {
  mode: 'create' | 'edit'
  date?: string | null
  event?: any
  onClose: () => void
  onRefresh: () => void
}

export default function CalendarModal({
  mode,
  date,
  event,
  onClose,
  onRefresh,
}: CalendarModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [color, setColor] = useState(event?.color || '#a855f7')


  useEffect(() => {
    if (mode === 'edit' && event) {
      setTitle(event.title || '')
      setDescription(event.description || '')
      setStart(new Date(event.start).toISOString().slice(0, 16))
      setEnd(new Date(event.end).toISOString().slice(0, 16))
    } else if (mode === 'create' && date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setHours(endDate.getHours() + 1)
      setStart(startDate.toISOString().slice(0, 16))
      setEnd(endDate.toISOString().slice(0, 16))
      setIsEditing(true) // 새로운 일정 생성시에는 바로 수정 모드
    }
  }, [mode, event, date])

  const handleSubmit = async () => {
    const payload = {
      title,
      description,
      startDate: start,
      endDate: end,
      color,
    }

    try {
      const res = await fetchApi(
        mode === 'create'
          ? '/api/v1/schedules'
          : `/api/v1/schedules/${event.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      )

      if (res.ok) {
        onRefresh()
        onClose()
      } else {
        const errorText = await res.text()
        console.log('일정 저장 실패:', errorText)
        alert('일정 저장에 실패했어요 😢')
      }
    } catch (error) {
      console.error('일정 저장 중 오류:', error)
      alert('일정 저장에 실패했어요 😢')
    }
  }

  const handleDelete = async () => {
    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      try {
        const res = await fetchApi(`/api/v1/schedules/${event.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (res.ok) {
          onRefresh()
          onClose()
        } else {
          const errorText = await res.text()
          console.log('일정 삭제 실패:', errorText)
          alert('삭제에 실패했어요 😢')
        }
      } catch (error) {
        console.error('일정 삭제 중 오류:', error)
        alert('삭제에 실패했어요 😢')
      }
    }
  }

  // 읽기 전용 뷰를 렌더링하는 함수
  const renderReadOnlyView = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">{title}</h3>
        <p className="text-gray-600 whitespace-pre-line mb-4">{description}</p>
      </div>
      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-medium">시작:</span>{' '}
          {new Date(start).toLocaleString()}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">종료:</span>{' '}
          {new Date(end).toLocaleString()}
        </p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        {mode === 'edit' && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
          >
            수정하기
          </button>
        )}
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  )

  // 수정 모드 뷰를 렌더링하는 함수
  const renderEditView = () => (
    <>
      <h2 className="text-xl font-semibold mb-6 text-gray-700">
        {mode === 'create' ? '일정 추가' : '일정 수정'}
      </h2>

      <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
      <input
        type="text"
        className="w-full p-3 border border-purple-100 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
      <textarea
        className="w-full p-3 border border-purple-100 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
      <input
        type="datetime-local"
        className="w-full p-3 border border-purple-100 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
      <input
        type="datetime-local"
        className="w-full p-3 border border-purple-100 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />

      <label className="block text-sm mb-1">카테고리 색상</label>
      <select
        className="w-full p-2 border rounded mb-3"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      >
        <option value="#a855f7">🟣 시험</option>
        <option value="#facc15">🟡 상담</option>
        <option value="#4ade80">🟢 모임</option>
        <option value="#f87171">🔴 과제</option>
      </select>


      <div className="flex justify-between items-center">
        {mode === 'edit' && (
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-500 hover:underline text-sm"
          >
            🗑 삭제
          </button>
        )}

        <div className="flex gap-3 ml-auto">
          <button
            onClick={() => mode === 'edit' ? setIsEditing(false) : onClose()}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 sm:p-6 md:p-8 w-full max-w-md mx-4 animate-fade-in">
        {mode === 'edit' && !isEditing ? renderReadOnlyView() : renderEditView()}
      </div>
    </div>
  )
}
