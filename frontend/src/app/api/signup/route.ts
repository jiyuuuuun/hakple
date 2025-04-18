import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // 필수 필드 검증
        if (!data.nickname || !data.id || !data.password || !data.phone) {
            return NextResponse.json({ success: false, message: '모든 필드를 입력해주세요.' }, { status: 400 })
        }

        // 실제 프로덕션에서는 여기에 데이터베이스 연결 코드가 들어갑니다.
        // 예시: await db.collection('users').insertOne(data);

        // 임시 파일 저장 부분을 주석 처리하여 DB에 저장되지 않도록 함
        /*
        // 임시 저장 - 실제 구현에서는 DB에 저장해야 합니다
        // 개발 환경에서만 사용할 임시 파일 저장 방식
        const dbDir = path.join(process.cwd(), 'db')

        // db 디렉토리가 없으면 생성
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }

        const filePath = path.join(dbDir, 'users.json')

        // 기존 데이터 읽기 또는 빈 배열 생성
        let users = []
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8')
            users = JSON.parse(fileContent)
        }

        // 중복 ID 확인
        const existingUser = users.find((user: any) => user.id === data.id)
        if (existingUser) {
            return NextResponse.json({ success: false, message: '이미 사용 중인 아이디입니다.' }, { status: 400 })
        }

        // 중복 닉네임 확인
        const existingNickname = users.find((user: any) => user.nickname === data.nickname)
        if (existingNickname) {
            return NextResponse.json({ success: false, message: '이미 사용 중인 닉네임입니다.' }, { status: 400 })
        }

        // 비밀번호 암호화 - 실제 구현에서는 bcrypt 등을 사용해야 합니다
        // 예시: data.password = await bcrypt.hash(data.password, 10);

        // 새 사용자 객체 생성 (비밀번호 확인 필드는 제외)
        const newUser = {
            id: data.id,
            nickname: data.nickname,
            password: data.password, // 실제로는 암호화된 비밀번호
            phone: data.phone,
            createdAt: new Date().toISOString(),
        }

        // 사용자 추가
        users.push(newUser)

        // 파일에 저장
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
        */

        // 데이터 저장 없이 성공 응답만 반환
        console.log('회원가입 데이터 수신 (저장하지 않음):', data)

        return NextResponse.json(
            {
                success: true,
                message: '회원가입이 완료되었습니다.',
                user: { id: data.id, nickname: data.nickname },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('회원가입 처리 중 오류 발생:', error)
        return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
