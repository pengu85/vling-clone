export const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'gaming', label: '게임' },
  { value: 'music', label: '음악' },
  { value: 'entertainment', label: '엔터테인먼트' },
  { value: 'education', label: '교육' },
  { value: 'sports', label: '스포츠' },
  { value: 'beauty', label: '뷰티' },
  { value: 'food', label: '음식' },
  { value: 'travel', label: '여행' },
  { value: 'tech', label: '기술/IT' },
  { value: 'news', label: '뉴스/정치' },
  { value: 'pets', label: '동물/반려동물' },
  { value: 'comedy', label: '코미디' },
  { value: 'autos', label: '자동차' },
  { value: 'film', label: '영화/애니' },
  { value: 'howto', label: 'How-to/스타일' },
  { value: 'science', label: '과학기술' },
  { value: 'kids', label: '키즈' },
] as const;

export const COUNTRIES = [
  { value: 'KR', label: '한국' },
  { value: 'US', label: '미국' },
  { value: 'JP', label: '일본' },
  { value: 'CN', label: '중국' },
  { value: 'TW', label: '대만' },
  { value: 'TH', label: '태국' },
  { value: 'VN', label: '베트남' },
  { value: 'ID', label: '인도네시아' },
  { value: 'IN', label: '인도' },
  { value: 'GB', label: '영국' },
  { value: 'DE', label: '독일' },
  { value: 'FR', label: '프랑스' },
  { value: 'BR', label: '브라질' },
] as const;

export const SUBSCRIBER_RANGES = [
  { value: '0-10000', label: '1만 이하', min: 0, max: 10000 },
  { value: '10000-100000', label: '1만~10만', min: 10000, max: 100000 },
  { value: '100000-500000', label: '10만~50만', min: 100000, max: 500000 },
  { value: '500000-1000000', label: '50만~100만', min: 500000, max: 1000000 },
  { value: '1000000+', label: '100만 이상', min: 1000000, max: Infinity },
] as const;

export const DAILY_VIEW_RANGES = [
  { value: '0-1000', label: '1천 이하', min: 0, max: 1000 },
  { value: '1000-10000', label: '1천~1만', min: 1000, max: 10000 },
  { value: '10000-100000', label: '1만~10만', min: 10000, max: 100000 },
  { value: '100000-1000000', label: '10만~100만', min: 100000, max: 1000000 },
  { value: '1000000+', label: '100만 이상', min: 1000000, max: Infinity },
] as const;

export const SHORTS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'yes', label: 'Shorts 채널' },
  { value: 'no', label: '일반 채널' },
] as const;

export const SORT_OPTIONS = [
  { value: 'subscriber', label: '구독자 수' },
  { value: 'view', label: '일 평균 조회수' },
  { value: 'growth', label: '성장률' },
  { value: 'trendsScore', label: '트렌드 스코어' },
  { value: 'revenue', label: '예상 수익' },
  { value: 'latest', label: '최신순' },
] as const;
