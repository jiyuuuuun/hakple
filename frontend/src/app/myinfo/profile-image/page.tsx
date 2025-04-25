'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, UserIcon, ArrowUpTrayIcon, XMarkIcon, CheckIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import NextImage from 'next/image'
import { useGlobalLoginMember } from '@/stores/auth/loginMember'
import { fetchApi } from '@/utils/api'
import Cropper from 'react-easy-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface Area {
    x: number
    y: number
    width: number
    height: number
}

export default function ProfileImagePage() {
    const router = useRouter()
    const { loginMember, setLoginMember } = useGlobalLoginMember()
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(loginMember?.profileImageUrl || null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isCropping, setIsCropping] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    
    // Easy Crop 상태
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    // 이미지 프리뷰 설정
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // 파일 크기 체크 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                setError('이미지 크기는 5MB 이하여야 합니다.')
                return
            }

            // 이미지 파일 형식 체크
            if (!file.type.match('image.*')) {
                setError('이미지 파일만 업로드 가능합니다.')
                return
            }

            setSelectedFile(file)
            setError(null)

            const reader = new FileReader()
            reader.onload = () => {
                setImagePreview(reader.result as string)
                setIsCropping(true)
                setCrop({ x: 0, y: 0 })
                setZoom(1)
            }
            reader.onerror = (error) => {
                console.error('FileReader 오류:', error)
                setError('이미지를 읽는 중 오류가 발생했습니다.')
            }
            reader.readAsDataURL(file)
        }
    }

    // 크롭 영역 완료 시 호출되는 콜백
    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])
    
    // 크롭 이미지 생성 함수
    const createCroppedImage = async () => {
        if (!imagePreview || !croppedAreaPixels) {
            console.error('이미지 또는 크롭 영역이 없습니다')
            return null
        }
        
        try {
            const image = new Image()
            image.src = imagePreview
            
            // 이미지 로드 대기
            await new Promise((resolve) => {
                if (image.complete) {
                    resolve(true)
                } else {
                    image.onload = () => resolve(true)
                }
            })
            
            // 캔버스 생성
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                throw new Error('캔버스 컨텍스트를 가져올 수 없습니다')
            }
            
            // 캔버스 크기 설정
            canvas.width = croppedAreaPixels.width
            canvas.height = croppedAreaPixels.height
            
            // 이미지 그리기
            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            )
            
            // 캔버스를 blob으로 변환
            return new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Blob 변환 실패'))
                    }
                }, 'image/png', 1.0)
            })
        } catch (error) {
            console.error('이미지 크롭 처리 중 오류:', error)
            throw error
        }
    }
    
    // 크롭 완료 및 다음 단계로 진행
    const finishCrop = async () => {
        if (!selectedFile || !imagePreview || !croppedAreaPixels) {
            setError('이미지 또는 크롭 영역이 없습니다.')
            return
        }

        try {
            // 크롭된 이미지 생성
            const croppedBlob = await createCroppedImage()
            
            if (!croppedBlob) {
                throw new Error('크롭된 이미지를 생성할 수 없습니다')
            }
            
            // 블롭에서 URL 생성
            const croppedUrl = URL.createObjectURL(croppedBlob)
            
            // 새 File 객체 생성
            const croppedFile = new File([croppedBlob], selectedFile.name || 'profile.png', {
                type: 'image/png',
                lastModified: Date.now()
            })
            
            // 상태 업데이트
            setImagePreview(croppedUrl)
            setSelectedFile(croppedFile)
            setIsCropping(false)
            
            console.log('크롭 완료:', {
                크기: croppedBlob.size,
                파일명: croppedFile.name
            })
            
        } catch (error) {
            console.error('크롭 처리 중 오류:', error)
            setError('이미지 처리 중 오류가 발생했습니다.')
        }
    }
    
    // 크롭 취소
    const cancelCrop = () => {
        setIsCropping(false)
        setSelectedFile(null)
        setImagePreview(null)
    }
    
    // 프로필 이미지 업로드
    const uploadProfileImage = async () => {
        if (!selectedFile) return
        
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const formData = new FormData()
            formData.append('multipartFile', selectedFile)

            console.log('프로필 이미지 업로드 요청 시작')
            
            const response = await fetch('http://localhost:8090/api/v1/profile-images/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error('서버 응답 에러:', response.status, errorText);
                
                if (response.status === 401) {
                    throw new Error('로그인이 필요하거나 인증이 만료되었습니다.');
                } else if (response.status === 413) {
                    throw new Error('이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 업로드해주세요.');
                } else if (response.status === 415) {
                    throw new Error('지원하지 않는 이미지 형식입니다. JPG 또는 PNG 형식을 사용해주세요.');
                } else {
                    throw new Error('프로필 이미지 업로드에 실패했습니다: ' + (errorText || response.statusText));
                }
            }
            
            // 응답 타입 확인 후 처리
            const contentType = response.headers.get('content-type');
            console.log('응답 Content-Type:', contentType);
            
            let imageUrl = '';
            
            if (contentType && contentType.includes('application/json')) {
                // JSON 응답인 경우
                const data = await response.json();
                console.log('JSON 응답 데이터:', data);
                imageUrl = typeof data === 'string' ? data : (data.profileImageUrl || data.url || '');
            } else {
                // 텍스트 응답인 경우 - URL이 직접 반환될 수 있음
                const textData = await response.text();
                console.log('텍스트 응답 데이터:', textData);
                imageUrl = textData.trim();
            }
            
            console.log('원본 이미지 URL:', imageUrl);
            
            if (!imageUrl) {
                throw new Error('서버에서 유효한 이미지 URL을 반환하지 않았습니다.');
            }
            
            // 캐시 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const finalImageUrl = imageUrl.includes('?') 
                ? `${imageUrl}&t=${timestamp}` 
                : `${imageUrl}?t=${timestamp}`;
            
            setProfileImageUrl(finalImageUrl);
            setSuccess('프로필 이미지가 성공적으로 업로드되었습니다.');
            setSelectedFile(null);
            setImagePreview(null);
            
            // 글로벌 상태 업데이트
            if (loginMember) {
                const updatedUser = {
                ...loginMember,
                    profileImageUrl: finalImageUrl
                };
                setLoginMember(updatedUser);
            }
            
            // 3초 후 성공 메시지 숨기기
            setTimeout(() => {
                setSuccess(null)
                router.push('/myinfo')
            }, 3000)
        } catch (error) {
            console.error('프로필 이미지 업로드 에러:', error)
            setError(error instanceof Error ? error.message : '프로필 이미지 업로드에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setLoading(false)
        }
    }
    
    // 프로필 이미지 삭제
    const deleteProfileImage = async () => {
        if (!profileImageUrl) return

        if (!confirm('프로필 이미지를 삭제하시겠습니까?')) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetchApi('/api/v1/profile-images/delete', {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error('서버 응답 에러:', response.status, errorText);
                
                if (response.status === 401) {
                    throw new Error('로그인이 필요하거나 인증이 만료되었습니다.');
                } else {
                    throw new Error('프로필 이미지 삭제에 실패했습니다: ' + (errorText || response.statusText));
                }
            }
            
            // 응답 확인 (텍스트 메시지만 있을 수 있음)
            const responseText = await response.text().catch(() => '프로필 이미지가 삭제되었습니다.');
            console.log('삭제 응답:', responseText);
            
            setProfileImageUrl(null)
            setSuccess('프로필 이미지가 성공적으로 삭제되었습니다.')

            // 글로벌 상태 업데이트 - 유저 정보 복사 후 프로필 이미지 URL 제거
            if (loginMember) {
                const updatedUser = {
                    ...loginMember,
                    profileImageUrl: ''
                };
                setLoginMember(updatedUser);
            }
            
            // 3초 후 성공 메시지 숨기기
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (error) {
            console.error('프로필 이미지 삭제 에러:', error)
            setError(error instanceof Error ? error.message : '프로필 이미지 삭제에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setLoading(false)
        }
    }
    
    const cancelUpload = () => {
        setSelectedFile(null)
        setImagePreview(null)
        setError(null)
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    }

    // 컴포넌트 언마운트 시 생성된 모든 Object URL 정리
    useEffect(() => {
        // Object URL 정리 함수
        return () => {
            // imagePreview가 Object URL인 경우 해제
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
                console.log('Object URL 해제:', imagePreview);
            }
        };
    }, [imagePreview]);

    // 로그인 체크
    useEffect(() => {
        if (!loginMember) {
            router.push('/login')
        }
    }, [loginMember, router])

    if (!loginMember) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9C50D4]"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* 뒤로가기 버튼 */}
                <div className="mb-8">
                    <Link 
                        href="/myinfo" 
                        className="inline-flex items-center text-gray-600 hover:text-[#9C50D4] transition-colors text-lg"
                    >
                        <ArrowLeftIcon className="h-6 w-6 mr-2" />
                        <span>내 정보로 돌아가기</span>
                        </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* 헤더 부분 */}
                    <div className="bg-[#F7F3FD] px-8 py-6 border-b border-gray-100">
                        <div className="flex items-center">
                            <UserIcon className="h-9 w-9 text-[#9C50D4] mr-4" />
                            <h1 className="text-2xl font-bold text-gray-800">프로필 이미지 관리</h1>
                        </div>
                        <p className="text-gray-600 mt-3 text-lg">
                            나를 표현하는 프로필 이미지를 설정하세요.
                        </p>
                    </div>

                    {/* 알림 메시지 */}
                    {error && (
                        <div className="mx-8 mt-6 bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-base text-red-600">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mx-8 mt-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <div className="flex items-center">
                                <CheckIcon className="h-6 w-6 text-green-500 mr-3" />
                                <p className="text-base text-green-600">{success}</p>
                            </div>
                        </div>
                    )}

                    <div className="p-8">
                    {/* 현재 프로필 이미지 */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">현재 프로필 이미지</h3>
                            <div className="flex flex-col sm:flex-row items-center bg-gray-50 p-6 rounded-xl">
                                <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-6 sm:mb-0 sm:mr-8">
                                    {profileImageUrl ? (
                                        <img 
                                            src={profileImageUrl} 
                                            alt="프로필 이미지" 
                                            width={144}
                                            height={144}
                                            style={{
                                                objectFit: 'cover',
                                                width: '100%',
                                                height: '100%',
                                                display: 'block'
                                            }}
                                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                console.error('이미지 로드 오류:', profileImageUrl);
                                                // Base64 인코딩된 기본 유저 아이콘
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMTkgMjFhNyA3IDAgMCAwLTEzLjhcLTIuMkE3IDcgMCAwIDAgMTkgMjFaIj48L3BhdGg+PGNpcmNsZSBjeD0iMTJcIiBjeT0iN1wiIHI9IjRcIj48L2NpcmNsZT48L3N2Zz4=';
                                        }}
                                    />
                                ) : (
                                        <UserIcon className="h-20 w-20 text-gray-400" />
                                    )}
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-gray-600 mb-4">
                                        {profileImageUrl 
                                            ? '프로필 이미지가 설정되어 있습니다.' 
                                            : '프로필 이미지가 설정되어 있지 않습니다.'}
                                    </p>
                                    {profileImageUrl && (
                                        <div>
                                            <button
                                                onClick={deleteProfileImage}
                                                disabled={loading}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                            >
                                                {loading ? '삭제 중...' : '이미지 삭제'}
                                            </button>
                                    </div>
                                )}
                                </div>
                        </div>
                    </div>

                        {/* 이미지 업로드 영역 */}
                        {!isCropping && !imagePreview && (
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">새 프로필 이미지 업로드</h3>
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#9C50D4] transition-colors cursor-pointer"
                                    onClick={triggerFileInput}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        ref={fileInputRef}
                                    />
                                    <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-2">이미지를 끌어다 놓거나 클릭하여 업로드하세요</p>
                                    <p className="text-sm text-gray-500">JPG, PNG 형식 지원 (최대 5MB)</p>
                                </div>
                        </div>
                    )}

                        {/* 이미지 자르기 UI - Easy Crop 사용 */}
                        {isCropping && imagePreview && (
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">이미지 크기 조정</h3>
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <div className="max-w-md mx-auto">
                                        <div className="mb-6 text-center">
                                            <p className="text-gray-600 mb-2">이미지를 드래그하고 확대/축소하여 원하는 부분을 선택하세요</p>
                                            <div className="flex items-center justify-center gap-3 mt-3">
                                                <span className="text-sm text-gray-500">축소</span>
                        <input
                                                    type="range"
                                                    value={zoom}
                                                    min={1}
                                                    max={3}
                                                    step={0.1}
                                                    aria-labelledby="Zoom"
                                                    onChange={(e) => setZoom(Number(e.target.value))}
                                                    className="w-52 accent-[#9C50D4]"
                                                />
                                                <span className="text-sm text-gray-500">확대</span>
                        </div>
                        </div>

                                        {/* 크롭 영역 컨테이너 */}
                                        <div className="relative h-64 w-full rounded-xl overflow-hidden border-4 border-white shadow-md">
                                            <Cropper
                                                image={imagePreview}
                                                    crop={crop}
                                                zoom={zoom}
                                                    aspect={1}
                                                onCropChange={setCrop}
                                                onCropComplete={onCropComplete}
                                                onZoomChange={setZoom}
                                                cropShape="round"
                                                showGrid={false}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-center space-x-4 mt-8">
                                            <button
                                                onClick={cancelCrop}
                                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                                type="button"
                                            >
                                                취소
                                            </button>
                                            <button
                                                onClick={finishCrop}
                                                className="px-5 py-2.5 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8A45BC] transition-colors font-medium"
                                                type="button"
                                            >
                                                이 크기로 설정
                                            </button>
                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                        )}

                        {/* 이미지 미리보기 및 업로드 버튼 */}
                        {!isCropping && imagePreview && (
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">이미지 미리보기</h3>
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <div className="flex flex-col sm:flex-row items-center">
                                        <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-6 sm:mb-0 sm:mr-8">
                                            <img 
                                                src={imagePreview} 
                                                alt="프로필 이미지 미리보기" 
                                                width={144}
                                                height={144}
                                                style={{
                                                    objectFit: 'cover',
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'block'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-gray-600 mb-4">
                                                이 이미지를 프로필 사진으로 사용하시겠습니까?
                                            </p>
                                            <div className="flex space-x-4">
                                                <button
                                                    onClick={cancelUpload}
                                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={uploadProfileImage}
                                                    disabled={loading}
                                                    className="px-5 py-2.5 bg-[#9C50D4] text-white rounded-lg hover:bg-[#8A45BC] transition-colors font-medium flex items-center"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            업로드 중...
                                                        </>
                                                    ) : '업로드'}
                                                </button>
                                            </div>
                                        </div>
                                </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
