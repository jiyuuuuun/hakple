'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">학플 서비스 이용약관</h1>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제1조 (목적)</h2>
                            <p className="text-gray-700 leading-relaxed">
                                본 약관은 학원 플랫폼 서비스(이하 "학플")가 제공하는 모든 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 학플의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제2조 (용어의 정의)</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
                            </p>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>"서비스"란 학원 커뮤니티 활동을 위해 학플이 제공하는 서비스를 의미합니다.</li>
                                <li>"이용자"란 학플에 접속하여 본 약관에 따라 학플이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                                <li>"회원"이란 학플에 개인정보를 제공하여 회원등록을 한 자로서, 학플의 정보를 지속적으로 제공받으며, 학플이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                                <li>"비회원"이란 회원에 가입하지 않고 학플이 제공하는 서비스를 이용하는 자를 말합니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제3조 (약관의 게시와 개정)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>학플은 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                                <li>학플은 필요한 경우 관련법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                                <li>학플이 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 학플의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                                <li>이용자는 변경된 약관에 대해 거부할 권리가 있습니다. 이용자가 약관 시행일 이후 서비스를 이용하는 경우 개정 약관에 동의한 것으로 간주됩니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제4조 (서비스의 제공 및 변경)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>학플은 다음과 같은 서비스를 제공합니다.
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                        <li>학원 관련 정보 제공 서비스</li>
                                        <li>학원 커뮤니티 서비스</li>
                                        <li>학원 일정 관리 서비스</li>
                                        <li>기타 학플이 추가 개발하거나 제휴를 통해 이용자에게 제공하는 서비스</li>
                                    </ul>
                                </li>
                                <li>학플은 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 변경 사항은 사전에 공지합니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제5조 (서비스 이용시간)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.</li>
                                <li>학플은 시스템 정기점검, 증설 및 교체를 위해 서비스를 일시 중단할 수 있으며, 예정된 작업으로 인한 서비스 일시 중단은 학플 웹사이트를 통해 사전에 공지합니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제6조 (회원가입)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>이용자는 학플이 정한 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                                <li>학플은 다음의 경우에 회원가입 신청을 승낙하지 않을 수 있습니다.
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                        <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                                        <li>허위 정보를 기재하거나, 학플이 요구하는 정보를 제공하지 않은 경우</li>
                                        <li>만 14세 미만의 아동이 법정대리인(부모 등)의 동의를 얻지 않은 경우</li>
                                        <li>이전에 학플 서비스 이용약관을 위반하여 이용계약이 해지된 적이 있는 경우</li>
                                    </ul>
                                </li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제7조 (개인정보보호)</h2>
                            <p className="text-gray-700 leading-relaxed">
                                학플은 관련법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 이용에 대해서는 관련법령 및 학플의 개인정보처리방침이 적용됩니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제8조 (회원의 의무)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>회원은 다음 행위를 하여서는 안 됩니다.
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                        <li>신청 또는 변경 시 허위내용의 등록</li>
                                        <li>타인의 정보 도용</li>
                                        <li>학플 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                                        <li>학플 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                                        <li>외설 또는 폭력적인 메시지, 화상, 음성 등 공서양속에 반하는 정보를 공유하는 행위</li>
                                        <li>기타 불법적이거나 부당한 행위</li>
                                    </ul>
                                </li>
                                <li>회원은 학플의 사전 승낙 없이 상업적 목적의 광고성 정보를 게시, 전송할 수 없습니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제9조 (저작권의 귀속 및 이용제한)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>학플이 작성한 저작물에 대한 저작권 및 기타 지적재산권은 학플에 귀속됩니다.</li>
                                <li>이용자는 학플을 이용함으로써 얻은 정보를 학플의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 등 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 해서는 안됩니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제10조 (계약해제, 해지 등)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>회원은 언제든지 학플에 탈퇴를 요청할 수 있으며, 학플은 즉시 회원탈퇴를 처리합니다.</li>
                                <li>회원이 다음 각 호의 사유에 해당하는 경우, 학플은 회원과의 계약을 해지할 수 있습니다.
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                        <li>회원이 타인의 서비스 이용을 방해하거나 정보를 도용하는 등 전자상거래질서를 위협하는 경우</li>
                                        <li>서비스를 이용하여 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                                    </ul>
                                </li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제11조 (분쟁해결)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>학플은 이용자로부터 제출되는 불만사항 및 의견을 신속하게 처리합니다.</li>
                                <li>학플과 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[#9C50D4] mb-4">제12조 (재판권 및 준거법)</h2>
                            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
                                <li>학플과 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법을 준거법으로 합니다.</li>
                                <li>학플과 이용자 간에 제기된 전자상거래 소송에는 대한민국의 법원에 전속적 관할권이 있습니다.</li>
                            </ol>
                        </section>

                        <section>
                            <p className="text-gray-700 pt-4 border-t">
                                부칙 (시행일) 이 약관은 2025년 5월 1일부터 시행합니다.
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 pt-6 border-t flex justify-center">
                        <button 
                            onClick={() => router.back()}
                            className="px-6 py-2 bg-[#9C50D4] text-white rounded-md hover:bg-purple-600 transition-colors"
                        >
                            이전 페이지로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
} 