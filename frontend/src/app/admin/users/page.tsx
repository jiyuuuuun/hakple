'use client'

import { useState, useEffect } from 'react'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// 백엔드 API로부터 받는 사용자 정보 인터페이스
interface User {
  id: number
  userName: string
  nickName: string
  socialProvider: string | null
  phoneNum: string | null
  academyId: string | null
  academyName: string | null
  status: string
  reportedCount: number
  creationTime: string // 가입일 필드 추가
}

interface ChangeUserStateRequestDto {
  id: number
  state: string
}

export default function AdminUsersPage() {
  const { loginMember } = useGlobalLoginMember()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterState, setFilterState] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('creationTime')
  const [sortDirection, setSortDirection] = useState<string>('desc')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newState, setNewState] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (!loginMember) {
          router.push('/login')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/check`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          router.push('/')
          return
        }

        fetchUsers()
      } catch (error) {
        console.error('관리자 권한 확인 중 오류 발생:', error)
        router.push('/')
      }
    }

    checkAdmin()
  }, [loginMember, router])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:8090/api/v1/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('회원 목록을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setUsers(data)
      sortUsers(data, sortField, sortDirection)
    } catch (error) {
      console.error('회원 목록 조회 에러:', error)
      setError('회원 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const sortUsers = (usersToSort: User[], field: string, direction: string) => {
    const sortedUsers = [...usersToSort]
    
    sortedUsers.sort((a, b) => {
      if (field === 'reportedCount') {
        return direction === 'asc' 
          ? a.reportedCount - b.reportedCount
          : b.reportedCount - a.reportedCount
      } else if (field === 'creationTime') {
        return direction === 'asc'
          ? new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime()
          : new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
      }
      return 0
    })
    
    setUsers(sortedUsers)
  }

  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortDirection(newDirection)
    sortUsers(users, field, newDirection)
  }

  const changeUserStatus = async (id: number, state: string) => {
    try {
      const response = await fetch('http://localhost:8090/api/v1/admin/user/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id,
          state
        } as ChangeUserStateRequestDto)
      })

      if (!response.ok) {
        throw new Error('회원 상태 변경에 실패했습니다')
      }

      // 상태 변경 성공 시 해당 사용자 상태 업데이트
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id ? { ...user, status: state } : user
        )
      )
      
      alert('회원 상태가 변경되었습니다')
    } catch (error) {
      console.error('회원 상태 변경 에러:', error)
      alert('회원 상태 변경에 실패했습니다')
    }
  }

  const handleStatusChange = (userId: number, newStatus: string) => {
    changeUserStatus(userId, newStatus)
  }

  const filteredUsers = users
    .filter(user => {
      if (filterState === 'all') return true
      return user.status === filterState
    })
    .filter(user =>
      (user.nickName && user.nickName.toLowerCase().includes(searchText.toLowerCase())) ||
      (user.userName && user.userName.toLowerCase().includes(searchText.toLowerCase()))
    )

  const getStateColor = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800'
      case 'PENDING':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSocialProviderLabel = (provider: string | null) => {
    if (!provider) return '일반';
    switch (provider.toUpperCase()) {
      case 'KAKAO':
        return '카카오';
      case 'GOOGLE':
        return '구글';
      case 'NAVER':
        return '네이버';
      default:
        return provider;
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stateOptions = [
    { value: 'all', label: '전체' },
    { value: 'ACTIVE', label: '활성화' },
    { value: 'INACTIVE', label: '비활성화' },
    { value: 'PENDING', label: '대기중' }
  ]

  const changeStateOptions = [
    { value: 'ACTIVE', label: '활성화' },
    { value: 'INACTIVE', label: '비활성화' },
    { value: 'PENDING', label: '대기중' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8C4FF2]"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 회원 목록 조회</h1>
          <Link href="/admin" className="text-[#8C4FF2] hover:underline">
            관리자 홈으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 mb-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="아이디 또는 닉네임으로 검색"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
                />
              </div>
              <div>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4FF2]/20"
                >
                  {stateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <div className="flex">
                <select
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-[#8C4FF2]"
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <option value="creationTime">가입일</option>
                  <option value="reportedCount">신고횟수</option>
                </select>
                <select
                  className="px-3 py-1.5 text-sm border-l-0 border border-gray-300 rounded-r-md focus:outline-none focus:ring-1 focus:ring-[#8C4FF2]"
                  value={sortDirection}
                  onChange={(e) => {
                    setSortDirection(e.target.value)
                    sortUsers(users, sortField, e.target.value)
                  }}
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>
              
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-[#8C4FF2] text-white rounded-lg hover:bg-[#7340C2]"
              >
                새로고침
              </button>
            </div>
          </div>

          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              {searchText || filterState !== 'all' ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소셜계정</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학원</th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('reportedCount')}
                    >
                      신고횟수
                      {sortField === 'reportedCount' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('creationTime')}
                    >
                      가입일
                      {sortField === 'creationTime' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태/관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">{user.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{user.userName}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{user.nickName}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getSocialProviderLabel(user.socialProvider)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.academyName || '미지정'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user.reportedCount > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            {user.reportedCount}
                          </span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {formatDate(user.creationTime)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStateColor(user.status)}`}>
                            {user.status}
                          </span>
                          <select
                            className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8C4FF2]"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusChange(user.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                          >
                            <option value="">상태 변경</option>
                            {changeStateOptions
                              .filter(option => option.value !== user.status)
                              .map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}로 변경
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 