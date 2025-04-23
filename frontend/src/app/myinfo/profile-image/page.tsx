'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { fetchApi } from '@/utils/api'
// 주의: 이 라이브러리 사용 전 'npm install react-image-crop' 명령어로 설치해야 합니다
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { Crop, PercentCrop } from 'react-image-crop'

export default function ProfileImagePage() {
    const router = useRouter()
    const { isLogin, loginMember, setLoginMember } = useGlobalLoginMember()

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // 이미지 편집 관련 상태
    const [isCropMode, setIsCropMode] = useState(false)
    const initialCrop: Crop = {
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
    }
    const [crop, setCrop] = useState<Crop>(initialCrop)
    const [completedCrop, setCompletedCrop] = useState<PercentCrop | null>(null)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
    // 원본 이미지 크기 정보 저장
    const [imgSize, setImgSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isLogin) {
            router.push('/login')
            return
        }

        // 현재 프로필 이미지 설정
        setCurrentImageUrl(loginMember.profileImageUrl || null)

        // 사용자 정보 가져오기
        const fetchUserInfo = async () => {
            try {
                const response = await fetchApi('/api/v1/myInfos', {
                    method: 'GET',
                    credentials: 'include',
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.profileImageUrl) {
                        setCurrentImageUrl(data.profileImageUrl)
                    }
                }
            } catch (err) {
                console.error('사용자 정보를 가져오는 중 오류 발생:', err)
            }
        }

        fetchUserInfo()
    }, [isLogin, loginMember, router])

    // 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null

        if (file) {
            // 파일 크기 검사 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                setError('파일 크기는 5MB 이하여야 합니다.')
                return
            }

            // 이미지 파일 타입 검사
            if (!file.type.startsWith('image/')) {
                setError('이미지 파일만 업로드 가능합니다.')
                return
            }

            setSelectedFile(file)
            setError(null)

            // 이미지 미리보기 생성
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string)
                // 파일 선택 시 자동으로 편집 모드 활성화하고 초기 크롭 상태로 설정
                setIsCropMode(true)
                setCrop(initialCrop)
                setCompletedCrop(null)
            }
            reader.readAsDataURL(file)
        }
    }

    // 파일 업로드 트리거
    const handleSelectFile = () => {
        fileInputRef.current?.click()
    }

    // 이미지 업로드 처리
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('업로드할 이미지를 선택해주세요.')
            return
        }

        setUploading(true)
        setError(null)
        setSuccess(null)

        try {
            const formData = new FormData()
            formData.append('multipartFile', selectedFile)

            const response = await fetch('/api/v1/profile-images/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('이미지 업로드에 실패했습니다.')
            }

            // 응답을 텍스트로 먼저 받아서 처리
            const responseText = await response.text()
            let filePath = ''

            try {
                // JSON 파싱 시도
                if (responseText) {
                    const data = JSON.parse(responseText)
                    filePath = data.filePath || responseText
                } else {
                    filePath = responseText
                }
            } catch (jsonError) {
                // JSON이 아닌 경우 텍스트 자체를 URL로 사용
                console.log('JSON 파싱 오류:', jsonError)
                console.log('JSON이 아닌 응답:', responseText)
                filePath = responseText
            }

            // 전역 상태 업데이트
            setLoginMember({
                ...loginMember,
                profileImageUrl: filePath,
            })

            // 현재 이미지 업데이트
            setCurrentImageUrl(filePath)
            setSelectedFile(null)
            setPreviewUrl(null)
            setSuccess('프로필 이미지가 성공적으로 업로드되었습니다.')

            // 3초 후 성공 메시지 제거
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (err) {
            console.error('이미지 업로드 중 오류 발생:', err)
            setError('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setUploading(false)
        }
    }

    // 이미지 삭제 처리
    const handleDelete = async () => {
        if (!currentImageUrl) {
            setError('삭제할 이미지가 없습니다.')
            return
        }

        if (!confirm('프로필 이미지를 삭제하시겠습니까?')) {
            return
        }

        setUploading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await fetch('/api/v1/profile-images/delete', {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('이미지 삭제에 실패했습니다.')
            }

            // 응답 확인 (필요시 처리)
            try {
                await response.text()
            } catch (error) {
                console.log('응답 처리 중 오류:', error)
            }

            // 전역 상태 업데이트
            setLoginMember({
                ...loginMember,
                profileImageUrl: '',
            })

            // 현재 이미지 상태 초기화
            setCurrentImageUrl(null)
            setSuccess('프로필 이미지가 성공적으로 삭제되었습니다.')

            // 3초 후 성공 메시지 제거
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (err) {
            console.error('이미지 삭제 중 오류 발생:', err)
            setError('이미지 삭제에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setUploading(false)
        }
    }

    // 이미지 편집 완료 후 처리 함수
    const handleCropComplete = (newCrop: Crop, percentCrop: PercentCrop) => {
        setCompletedCrop(percentCrop)
        // 크롭 완료 시 즉시 미리보기 그리기
        if (imgRef.current && percentCrop.width && percentCrop.height) {
            setCompletedCrop(percentCrop)
        }
    }

    // 이미지 로드 완료 시 호출되는 함수
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget
        imgRef.current = img
        // 이미지 로드 시 크기 정보 저장
        setImgSize({
            width: img.width,
            height: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
        })
    }

    // 크롭된 이미지를 캔버스에 그리는 함수
    const drawCropImage = () => {
        if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
            return
        }

        const image = imgRef.current
        const canvas = previewCanvasRef.current
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            return
        }

        // 캔버스 크기를 2배로 설정하여 선명도 향상 (Retina 디스플레이 대응)
        const displaySize = 96 // 24*4 = 96 (w-24 h-24 클래스를 위한 적절한 픽셀값)
        const canvasSize = displaySize * 2 // 고해상도를 위해 실제 캔버스는 2배 크기로

        canvas.width = canvasSize
        canvas.height = canvasSize

        // 캔버스 스타일에서는 표시 크기 유지
        canvas.style.width = `${displaySize}px`
        canvas.style.height = `${displaySize}px`

        // 캔버스 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 이미지 렌더링 품질 설정
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // 배경을 하얀색으로 채우기 (투명 배경 방지)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvasSize, canvasSize)

        // 패딩 추가 (테두리가 잘리지 않도록)
        const padding = 4 * 2 // 2px 패딩 * 2배 크기

        // 원형 클리핑 패스 생성 (패딩 고려)
        ctx.save()
        ctx.beginPath()
        ctx.arc(canvasSize / 2, canvasSize / 2, (canvasSize - padding) / 2, 0, Math.PI * 2)
        ctx.clip()

        // 이미지의 실제 크기와 표시 크기 비율 계산
        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height

        // 선택한 영역의 좌표와 크기 계산 (퍼센트 -> 픽셀)
        const cropX = (completedCrop.x / 100) * image.width
        const cropY = (completedCrop.y / 100) * image.height
        const cropWidth = (completedCrop.width / 100) * image.width
        const cropHeight = (completedCrop.height / 100) * image.height

        // 원본 이미지에서의 실제 픽셀 위치 계산
        const sourceX = cropX * scaleX
        const sourceY = cropY * scaleY
        const sourceWidth = cropWidth * scaleX
        const sourceHeight = cropHeight * scaleY

        // 캔버스에 맞게 크기 조정 (원형을 유지하면서)
        const drawSize = canvasSize - padding

        // 중앙 정렬을 위한 위치 계산
        const dx = (canvasSize - drawSize) / 2
        const dy = (canvasSize - drawSize) / 2

        // 이미지 그리기
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight, // 소스 이미지의 위치와 크기
            dx,
            dy,
            drawSize,
            drawSize, // 캔버스에 그릴 위치와 크기
        )

        ctx.restore()

        // 원형 테두리 그리기 (클리핑 영역 외부에)
        ctx.beginPath()
        ctx.arc(canvasSize / 2, canvasSize / 2, (canvasSize - padding) / 2, 0, Math.PI * 2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3 * 2 // 2px 테두리 * 2배 크기
        ctx.stroke()
    }

    // useEffect로 크롭 이미지 그리기 - 의존성 배열 개선
    useEffect(() => {
        if (completedCrop && imgRef.current && previewCanvasRef.current) {
            // requestAnimationFrame을 사용하여 렌더링 성능 최적화
            requestAnimationFrame(() => {
                drawCropImage()
            })
        }
    }, [completedCrop, imgRef.current, crop])

    // 크롭된 이미지 최종 적용 함수
    const applyCrop = () => {
        if (!previewCanvasRef.current || !completedCrop || !imgRef.current) {
            setError('이미지를 크롭할 수 없습니다. 다시 시도해주세요.')
            return
        }

        try {
            // 캔버스에 이미지 그리기
            drawCropImage()

            // 캔버스 이미지를 URL로 변환 - 최고 품질 설정
            const croppedImageUrl = previewCanvasRef.current.toDataURL('image/png', 1.0)

            // 캔버스의 이미지를 File 객체로 변환
            previewCanvasRef.current.toBlob(
                (blob) => {
                    if (blob) {
                        // 새 File 객체 생성
                        const croppedFile = new File([blob], 'cropped-profile.png', { type: 'image/png' })

                        // 상태 업데이트
                        setSelectedFile(croppedFile)
                        setPreviewUrl(croppedImageUrl)

                        // 크롭 모드 종료
                        setIsCropMode(false)

                        console.log('이미지 크롭 완료:', {
                            size: `${Math.round(blob.size / 1024)} KB`,
                            type: blob.type,
                            crop: completedCrop, // 디버깅을 위해 크롭 정보 기록
                            imageSize: imgSize, // 디버깅을 위해 이미지 크기 정보 기록
                        })
                    } else {
                        throw new Error('이미지 변환에 실패했습니다.')
                    }
                },
                'image/png', // JPEG 대신 PNG 사용하여 품질 향상
                1.0, // 최대 품질
            )
        } catch (err) {
            console.error('이미지 크롭 중 오류:', err)
            setError('이미지 크롭에 실패했습니다.')
        }
    }

    // 크롭 취소 함수
    const cancelCrop = () => {
        setIsCropMode(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <main className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-6">
                {/* 헤더 섹션 */}
                <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center">
                        <Link href="/myinfo" className="mr-4">
                            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-800">프로필 이미지 변경</h1>
                    </div>
                </div>

                <div className="p-6">
                    {/* 에러 메시지 */}
                    {error && (
                        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* 성공 메시지 */}
                    {success && (
                        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                            <p>{success}</p>
                        </div>
                    )}

                    {/* 현재 프로필 이미지 */}
                    <div className="mb-6">
                        <h2 className="text-md font-medium text-gray-700 mb-3">현재 프로필 이미지</h2>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 relative">
                                {currentImageUrl ? (
                                    <Image
                                        src={currentImageUrl}
                                        alt="현재 프로필 이미지"
                                        width={128}
                                        height={128}
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = 'https://via.placeholder.com/112?text=사용자'
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-16 w-16 text-[#9C50D4]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {currentImageUrl && (
                                <p className="text-xs text-gray-500">이 이미지가 프로필에 사용됩니다</p>
                            )}
                        </div>
                    </div>

                    {/* 이미지 삭제 버튼 - 현재 이미지가 있을 때만 표시 */}
                    {currentImageUrl && (
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={handleDelete}
                                disabled={uploading}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center hover:bg-gray-200 transition-colors"
                            >
                                <TrashIcon className="h-5 w-5 mr-1" />
                                기본 이미지로 변경
                            </button>
                        </div>
                    )}

                    <hr className="my-6" />

                    {/* 새 이미지 업로드 섹션 */}
                    <div>
                        <h2 className="text-md font-medium text-gray-700 mb-3">새 프로필 이미지 업로드</h2>

                        {/* 파일 업로드 입력 */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {/* 파일 선택 버튼 */}
                        <div
                            onClick={handleSelectFile}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors mb-2"
                        >
                            <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">클릭하여 이미지 파일 선택</p>
                            <p className="text-xs text-gray-400 mt-1">최대 5MB, JPG, PNG 파일</p>
                        </div>
                        <div className="text-xs text-gray-500 mb-4 px-2">
                            <p className="mb-1">• 정사각형 이미지를 사용하면 프로필에 가장 잘 맞습니다</p>
                            <p className="mb-1">• 얼굴이나 상반신 이미지가 원형 프로필에 적합합니다</p>
                            <p>• 업로드 후 이미지 중앙이 프로필 원형에 맞춰 표시됩니다</p>
                        </div>

                        {/* 선택된 이미지 미리보기 */}
                        {previewUrl && (
                            <div className="mt-4 mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">이미지 미리보기</h3>
                                <div className="flex flex-col items-center space-y-4">
                                    {isCropMode ? (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2">
                                                원형 영역에 맞게 이미지를 조정하세요
                                            </p>
                                            <div className="relative border border-gray-200 p-1 rounded">
                                                <ReactCrop
                                                    crop={crop}
                                                    onChange={(c) => setCrop(c)}
                                                    onComplete={handleCropComplete}
                                                    circularCrop
                                                    aspect={1}
                                                    minWidth={50}
                                                    keepSelection
                                                >
                                                    <img
                                                        ref={imgRef}
                                                        src={previewUrl || ''}
                                                        alt="편집 중인 이미지"
                                                        onLoad={onImageLoad}
                                                        style={{
                                                            maxHeight: '300px',
                                                            maxWidth: '100%',
                                                        }}
                                                    />
                                                </ReactCrop>

                                                <div className="mt-4 flex justify-center">
                                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-200 bg-white">
                                                        <canvas ref={previewCanvasRef} className="w-full h-full" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-center space-x-3 mt-3">
                                                <button
                                                    type="button"
                                                    onClick={cancelCrop}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applyCrop}
                                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                                                >
                                                    적용하기
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-100 bg-gray-100 relative">
                                                <Image
                                                    src={previewUrl}
                                                    alt="이미지 미리보기"
                                                    width={128}
                                                    height={128}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCropMode(true)}
                                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                >
                                                    이미지 편집
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                업로드 후 이미지는 프로필 원형에 맞게 표시됩니다
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className="text-center text-sm text-gray-500 mt-2">
                                    {selectedFile?.name} (
                                    {(selectedFile?.size || 0) / 1024 < 1000
                                        ? `${Math.round((selectedFile?.size || 0) / 1024)} KB`
                                        : `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                                    )
                                </div>
                            </div>
                        )}

                        {/* 업로드 버튼 */}
                        {previewUrl && (
                            <div className="flex justify-center">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !selectedFile}
                                    className={`px-6 py-2 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8C4FF2] transition-colors ${
                                        uploading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {uploading ? '업로드 중...' : '업로드하기'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
