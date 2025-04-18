import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
    try {
        const { field, value } = await request.json()

        if (!field || !value) {
            return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 })
        }

        // JSON 파일 확인 부분 주석 처리
        /*
        // 파일 경로 설정
        const dbDir = path.join(process.cwd(), 'db')
        const filePath = path.join(dbDir, 'users.json')

        // 사용자 데이터가 없는 경우 (파일이 없는 경우)
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({
                success: true,
                available: true,
                message: '사용 가능합니다.',
            })
        }

        // 파일에서 사용자 데이터 읽기
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const users = JSON.parse(fileContent)

        // 필드 타입에 따라 중복 체크
        let isDuplicate = false

        if (field === 'id') {
            isDuplicate = users.some((user: any) => user.id === value)
        } else if (field === 'nickname') {
            isDuplicate = users.some((user: any) => user.nickname === value)
        } else {
            return NextResponse.json({ success: false, message: '지원하지 않는 필드입니다.' }, { status: 400 })
        }

        if (isDuplicate) {
            return NextResponse.json({
                success: true,
                available: false,
                message: `이미 사용 중인 ${field === 'id' ? '아이디' : '닉네임'}입니다.`,
            })
        }
        */

        // 중복 체크 없이 항상 사용 가능한 응답 반환
        console.log('중복 확인 요청 (확인하지 않음):', field, value)

        return NextResponse.json({
            success: true,
            available: true,
            message: '사용 가능합니다.',
        })
    } catch (error) {
        console.error('중복 확인 처리 중 오류 발생:', error)
        return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
