'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Withdraw() {
    const router = useRouter()
    const [reason, setReason] = useState('')
    const [password, setPassword] = useState('')
    const [agreeToDelete, setAgreeToDelete] = useState(false)
    const [selectedReason, setSelectedReason] = useState('')
    const [errors, setErrors] = useState({
        password: false,
        reason: false,
        agreement: false,
    })

    const handleWithdraw = () => {
        // 필드 유효성 검사
        const newErrors = {
            password: !password,
            reason: !selectedReason,
            agreement: !agreeToDelete,
        }

        setErrors(newErrors)

        // 모든 필수 필드가 입력되었는지 확인
        if (!password || !agreeToDelete || !selectedReason) {
            return
        }

        // 실제 탈퇴 로직은 여기에 구현
        // 현재는 단순히 홈으로 이동
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-lg mx-auto pt-6 pb-10">
                <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-auto max-w-2xl mt-4">
                    <div className="p-10">
                        <h1 className="text-2xl font-bold mb-10 text-center">회원 탈퇴</h1>
                        <div className="mb-8 bg-amber-50 p-4 border-l-4 border-amber-400 rounded">
                            <div className="flex items-start">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-amber-400 mr-2 mt-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <div>
                                    <ul className="list-disc ml-5 text-amber-700">
                                        회원 탈퇴 시 아래 사항을 숙지해 주시기 바랍니다.
                                        <li>모든 개인정보가 삭제되며 복구할 수 없습니다.</li>
                                        <li>작성하신 게시물은 삭제되지 않습니다.</li>
                                        <li>탈퇴 후 동일한 이메일로 재가입이 30일간 제한됩니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">탈퇴 사유를 선택해 주세요</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="form-radio text-purple-600"
                                            value="서비스 이용이 불편해서"
                                            onChange={() => setSelectedReason('서비스 이용이 불편해서')}
                                        />
                                        <span className="ml-2">서비스 이용이 불편해서</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="form-radio text-purple-600"
                                            value="다른 서비스를 이용하기 위해서"
                                            onChange={() => setSelectedReason('다른 서비스를 이용하기 위해서')}
                                        />
                                        <span className="ml-2">다른 서비스를 이용하기 위해서</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="form-radio text-purple-600"
                                            value="개인정보 보호를 위해서"
                                            onChange={() => setSelectedReason('개인정보 보호를 위해서')}
                                        />
                                        <span className="ml-2">개인정보 보호를 위해서</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="withdrawReason"
                                            className="form-radio text-purple-600"
                                            value="기타"
                                            onChange={() => setSelectedReason('기타')}
                                        />
                                        <span className="ml-2">기타</span>
                                    </label>
                                </div>
                                {errors.reason && <p className="text-red-500 text-sm mt-1">탈퇴 사유를 선택해주세요</p>}
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">상세 사유 (선택사항)</h3>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="서비스 개선을 위해 의견을 남겨주세요."
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">비밀번호 확인</h3>
                                <div className="relative">
                                    <input
                                        type="password"
                                        className={`w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="비밀번호를 입력해주세요"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            if (e.target.value) {
                                                setErrors((prev) => ({ ...prev, password: false }))
                                            }
                                        }}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg
                                            className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-sm mt-1">비밀번호를 입력해주세요</p>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className={`form-checkbox rounded ${
                                            errors.agreement ? 'text-red-500 border-red-500' : 'text-purple-600'
                                        }`}
                                        checked={agreeToDelete}
                                        onChange={(e) => {
                                            setAgreeToDelete(e.target.checked)
                                            if (e.target.checked) {
                                                setErrors((prev) => ({ ...prev, agreement: false }))
                                            }
                                        }}
                                    />
                                    <span className={`ml-2 ${errors.agreement ? 'text-red-500' : ''}`}>
                                        회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없다는 점을 이해했습니다.
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    className="px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-500 font-medium"
                                    onClick={handleWithdraw}
                                >
                                    탈퇴하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
