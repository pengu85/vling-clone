import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          개인정보처리방침
        </h1>
        <p className="text-sm text-slate-500 mb-10">최종 수정일: 2024.01.01</p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          1. 개인정보의 수집 및 이용 목적
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          블링(Bling)은 YouTube 채널 분석 서비스 제공, 회원 가입 및 관리,
          맞춤형 콘텐츠 추천을 위해 개인정보를 수집·이용합니다. 수집된 정보는
          서비스 품질 개선 및 신규 기능 개발에 활용될 수 있습니다. 이용자의
          동의 없이 수집 목적 이외의 용도로 개인정보를 이용하지 않습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          2. 수집하는 개인정보 항목
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          회원 가입 시 이메일 주소, 이름(닉네임)을 수집하며, 서비스 이용 과정에서
          서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보가 자동으로 생성·수집될
          수 있습니다. Google 소셜 로그인을 이용하는 경우 해당 계정의 이메일 및
          프로필 정보가 제공될 수 있습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          3. 개인정보의 보유 및 이용기간
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          수집된 개인정보는 회원 탈퇴 시까지 보유·이용되며, 탈퇴 후에는 지체
          없이 파기됩니다. 단, 관련 법령에 의해 보존 의무가 있는 경우에는 해당
          법령에서 정한 기간 동안 보관합니다. 전자상거래 등에서의 소비자보호에
          관한 법률에 따라 계약 또는 청약철회에 관한 기록은 5년간 보존됩니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          4. 개인정보의 파기
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 복구 불가능한
          방법으로 지체 없이 파기합니다. 전자적 파일 형태로 저장된 개인정보는
          기록을 재생할 수 없는 기술적 방법을 적용하여 삭제하며, 종이 문서에
          기록된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          5. 개인정보의 제3자 제공
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          블링은 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          다만, YouTube Data API를 통해 공개된 채널 정보 및 영상 데이터를 수집·분석하며,
          이는 Google의 개인정보처리방침을 따릅니다. 법령에 의한 요청이 있는 경우에만
          예외적으로 제공될 수 있습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          6. 쿠키의 운용
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          블링은 로그인 상태 유지, 사용자 환경 설정 저장, 서비스 이용 분석을 위해
          쿠키를 사용합니다. 이용자는 웹 브라우저 설정에서 쿠키 저장을 거부하거나
          삭제할 수 있으며, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          7. 개인정보 보호책임자
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          개인정보 처리에 관한 업무를 총괄하고 관련 불만 처리 및 피해구제를 담당하는
          개인정보 보호책임자는 다음과 같습니다. 이름: 블링 운영팀,
          이메일: privacy@bling.kr. 개인정보와 관련한 문의사항은 위 연락처로 문의해
          주시면 신속하게 답변드리겠습니다.
        </p>

        <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3">
          8. 권리 행사 방법
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          이용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제, 처리 정지를
          요청할 수 있습니다. 권리 행사는 서비스 내 계정 설정 페이지 또는
          개인정보 보호책임자에게 이메일로 요청하실 수 있으며, 접수 후 10영업일
          이내에 처리 결과를 안내드립니다.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
