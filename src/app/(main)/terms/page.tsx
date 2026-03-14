import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <article className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">이용약관</h1>
        <p className="text-sm text-slate-500 mb-10">최종 업데이트: 2024.01.01</p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제1조 (목적)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          이 약관은 블링(Bling)이 제공하는 YouTube 채널 분석 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다. 본 약관에 동의함으로써 이용자는 서비스 이용에 관한 모든 조건을 수락한 것으로 간주합니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제2조 (정의)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          "서비스"란 블링이 제공하는 YouTube 채널 통계 조회, 성과 분석, 트렌드 탐색 등의 기능을 포함한 온라인 플랫폼을 의미합니다. "회원"이란 본 약관에 동의하고 서비스에 가입하여 이용하는 개인 또는 단체를 말하며, "콘텐츠"란 서비스 내에서 제공되거나 생성되는 텍스트, 데이터, 차트 등 일체의 정보를 의미합니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제3조 (약관의 효력)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일 이후부터 효력이 발생합니다. 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제4조 (서비스 이용)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          서비스는 회원 가입 후 이용할 수 있으며, 일부 기능은 유료 플랜 구독을 요구할 수 있습니다. 회원은 1인 1계정 원칙에 따라 서비스를 이용하여야 하며, 계정 정보는 타인과 공유할 수 없습니다. 회사는 서비스의 원활한 운영을 위해 이용 시간, 횟수 등에 제한을 둘 수 있습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제5조 (회원의 의무)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          회원은 서비스를 이용함에 있어 관련 법령 및 본 약관을 준수하여야 하며, 타인의 권리를 침해하거나 서비스의 정상적인 운영을 방해하는 행위를 하여서는 안 됩니다. 서비스를 통해 제공되는 데이터를 무단으로 크롤링, 스크래핑하거나 상업적 목적으로 재배포하는 행위는 금지됩니다. 위반 시 회사는 사전 통보 없이 이용을 제한하거나 계정을 해지할 수 있습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제6조 (서비스 제공의 변경)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          회사는 운영상 또는 기술상의 필요에 따라 서비스의 내용을 변경하거나 일시적으로 중단할 수 있습니다. 서비스 변경 또는 중단이 예정된 경우 사전에 공지를 통해 회원에게 안내하며, 불가피한 긴급 상황의 경우 사후 공지로 갈음할 수 있습니다. 서비스 변경 또는 중단으로 인한 손해에 대해 회사는 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제7조 (면책조항)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          블링이 제공하는 분석 데이터는 YouTube Data API를 기반으로 하며, YouTube의 정책 변경이나 API 제한으로 인해 데이터의 정확성, 완전성, 최신성이 보장되지 않을 수 있습니다. 본 서비스의 분석 결과는 참고용으로만 제공되며, 이를 근거로 한 비즈니스 결정에 대해 회사는 책임을 지지 않습니다. 회원의 귀책 사유 또는 천재지변 등 불가항력으로 인한 서비스 장애에 대해서도 회사는 책임이 면제됩니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">제8조 (분쟁해결)</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          본 약관에 관한 분쟁은 대한민국 법률에 따라 해석되며, 회사와 회원 간의 분쟁이 발생한 경우 상호 협의를 통해 해결하는 것을 원칙으로 합니다. 협의가 이루어지지 않는 경우 민사소송법상의 관할 법원을 제1심 관할법원으로 하며, 서울중앙지방법원을 합의 관할법원으로 합니다.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </article>
    </div>
  );
}
