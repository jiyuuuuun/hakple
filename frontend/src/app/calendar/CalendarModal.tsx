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

  // 컬러 매핑 정보
  const colorInfo = [
    { value: '#a855f7', label: '시험', emoji: '📚', bg: 'bg-purple-100' },
    { value: '#facc15', label: '상담', emoji: '🗣️', bg: 'bg-yellow-100' },
    { value: '#4ade80', label: '모임', emoji: '👥', bg: 'bg-green-100' },
    { value: '#f87171', label: '과제', emoji: '✏️', bg: 'bg-red-100' },
    { value: '#64748b', label: '기타', emoji: '📌', bg: 'bg-slate-100' },
    // 연한 색상 추가
    { value: '#f1dffb', label: '시험', emoji: '📚', bg: 'bg-purple-100' },
    { value: '#fff2bd', label: '상담', emoji: '🗣️', bg: 'bg-yellow-100' },
    { value: '#e3f1cf', label: '모임', emoji: '👥', bg: 'bg-green-100' },
    { value: '#ffe0e0', label: '과제', emoji: '✏️', bg: 'bg-red-100' },
    { value: '#e5e7ec', label: '기타', emoji: '📌', bg: 'bg-slate-100' },
  ]

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
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 진한 색상을 연한 색상으로 변환
    let finalColor = color;
    if (color === '#a855f7') finalColor = '#f1dffb';
    else if (color === '#facc15') finalColor = '#fff2bd';
    else if (color === '#4ade80') finalColor = '#e3f1cf';
    else if (color === '#f87171') finalColor = '#ffe0e0';
    else if (color === '#64748b') finalColor = '#e5e7ec';

    const payload = {
      title,
      description,
      startDate: start,
      endDate: end,
      color: finalColor,
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

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // 현재 선택된 색상의 정보 찾기
  const selectedColorInfo = colorInfo.find(c => c.value === color) || colorInfo[0];

  // 카테고리 선택용 고유 색상 목록 (중복 제거)
  const uniqueColorOptions = [
    { value: '#a855f7', label: '시험', emoji: '📚', bg: 'bg-purple-100' },
    { value: '#facc15', label: '상담', emoji: '🗣️', bg: 'bg-yellow-100' },
    { value: '#4ade80', label: '모임', emoji: '👥', bg: 'bg-green-100' },
    { value: '#f87171', label: '과제', emoji: '✏️', bg: 'bg-red-100' },
    { value: '#64748b', label: '기타', emoji: '📌', bg: 'bg-slate-100' },
  ];

  // 읽기 전용 뷰를 렌더링하는 함수
  const renderReadOnlyView = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedColorInfo.bg}`}
          style={{ boxShadow: `0 2px 4px -1px ${color}40` }}
        >
          <span className="text-xl">{selectedColorInfo.emoji}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      
      {description && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-700 whitespace-pre-line">{description}</p>
        </div>
      )}
      
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 mt-4">
        <div className="flex items-center gap-3">
          <span className="material-icons text-purple-500">event</span>
          <div>
            <p className="text-sm text-gray-500">시작</p>
            <p className="text-gray-800 font-medium">{formatDate(start)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="material-icons text-purple-500">event_busy</span>
          <div>
            <p className="text-sm text-gray-500">종료</p>
            <p className="text-gray-800 font-medium">{formatDate(end)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        {mode === 'edit' && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors flex items-center gap-2"
          >
            <span className="material-icons text-sm">edit</span>
            수정하기
          </button>
        )}
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span className="material-icons text-sm">close</span>
          닫기
        </button>
      </div>
    </div>
  )

  // 수정 모드 뷰를 렌더링하는 함수
  const renderEditView = () => (
    <>
      <div className="flex items-center gap-2 mb-6">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedColorInfo.bg}`}
        >
          <span className="text-xl">{selectedColorInfo.emoji}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {mode === 'create' ? '일정 추가' : '일정 수정'}
        </h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-icons text-purple-400">title</span>
          </div>
          <input
            type="text"
            placeholder="일정 제목"
            className="w-full pl-10 p-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="material-icons text-purple-400">description</span>
          </div>
          <textarea
            placeholder="상세 설명 (선택사항)"
            className="w-full pl-10 pt-3 p-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-icons text-purple-400">schedule</span>
            </div>
            <input
              type="datetime-local"
              className="w-full pl-10 p-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-purple-600 font-medium">
              시작
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-icons text-purple-400">event_busy</span>
            </div>
            <input
              type="datetime-local"
              className="w-full pl-10 p-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
            <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-purple-600 font-medium">
              종료
            </label>
          </div>
        </div>

        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <div className="grid grid-cols-3 gap-2">
            {uniqueColorOptions.map((item) => (
              <div 
                key={item.value}
                onClick={() => setColor(item.value)}
                className={`cursor-pointer p-3 rounded-xl flex items-center justify-center flex-col gap-1 transition-all ${
                  color === item.value || 
                  (color === '#f1dffb' && item.value === '#a855f7') || 
                  (color === '#fff2bd' && item.value === '#facc15') || 
                  (color === '#e3f1cf' && item.value === '#4ade80') || 
                  (color === '#ffe0e0' && item.value === '#f87171') || 
                  (color === '#e5e7ec' && item.value === '#64748b')
                    ? `${item.bg} ring-2 ring-offset-2 shadow-md`
                    : 'bg-white hover:bg-gray-50'
                }`}
                style={{ 
                  boxShadow: color === item.value || 
                  (color === '#f1dffb' && item.value === '#a855f7') || 
                  (color === '#fff2bd' && item.value === '#facc15') || 
                  (color === '#e3f1cf' && item.value === '#4ade80') || 
                  (color === '#ffe0e0' && item.value === '#f87171') || 
                  (color === '#e5e7ec' && item.value === '#64748b')
                    ? `0 4px 6px -1px ${item.value}20` : 'none' 
                }}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        {mode === 'edit' && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 flex items-center gap-1 hover:underline text-sm font-medium"
          >
            <span className="material-icons text-sm">delete</span>
            삭제
          </button>
        )}

        <div className="flex gap-3 ml-auto">
          <button
            onClick={() => mode === 'edit' ? setIsEditing(false) : onClose()}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <span className="material-icons text-sm">cancel</span>
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-1"
          >
            <span className="material-icons text-sm">save</span>
            저장
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 sm:p-6 md:p-8 w-full max-w-lg mx-4 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {mode === 'edit' && !isEditing ? renderReadOnlyView() : renderEditView()}
      </div>
    </div>
  )
}
