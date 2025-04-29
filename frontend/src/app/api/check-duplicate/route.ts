import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
    try {
        const { field, value } = await request.json()

        if (!field || !value) {
            return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 })
        }

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
