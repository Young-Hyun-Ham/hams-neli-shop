import { Service, PriceItem, Testimonial } from '@/lib/index';
import { IMAGES } from '@/assets/images';

export const services: Service[] = [
  {
    id: 'service-1',
    title: '젤 네일 아트',
    description: '오래 지속되는 아름다운 젤 네일로 당신의 손끝을 화사하게 꾸며드립니다',
    image: IMAGES.SERVICE_GEL_ART,
    features: [
      '2-3주 지속력',
      '다양한 컬러 선택',
      '광택 마무리',
      '손톱 보호 효과'
    ]
  },
  {
    id: 'service-2',
    title: '프렌치 매니큐어',
    description: '클래식하고 우아한 프렌치 스타일로 세련된 손끝을 연출합니다',
    image: IMAGES.SERVICE_FRENCH_MANICURE,
    features: [
      '깔끔한 화이트 팁',
      '자연스러운 베이스',
      '어떤 스타일에도 어울림',
      '오피스룩에 완벽'
    ]
  },
  {
    id: 'service-3',
    title: '아트 디자인',
    description: '개성 넘치는 맞춤형 네일 아트로 특별한 날을 더욱 빛나게 합니다',
    image: IMAGES.SERVICE_ART_DESIGN,
    features: [
      '맞춤형 디자인',
      '트렌디한 패턴',
      '스톤 & 글리터 장식',
      '특별한 날 추천'
    ]
  },
  {
    id: 'service-4',
    title: '케어 & 트리트먼트',
    description: '손톱과 큐티클을 건강하게 관리하는 전문 케어 서비스',
    image: IMAGES.SERVICE_CARE_TREATMENT,
    features: [
      '큐티클 정리',
      '손톱 영양 공급',
      '각질 제거',
      '보습 마사지'
    ]
  },
  {
    id: 'service-5',
    title: '대리석 네일',
    description: '은은한 스톤 결 표현으로 고급스럽고 세련된 무드의 네일을 완성합니다',
    image: IMAGES.SERVICE_MARBLE_NAIL,
    features: [
      '천연석 느낌의 패턴',
      '뉴트럴 톤 조합',
      '고급스러운 분위기',
      '웨딩 네일로 추천'
    ]
  },
  {
    id: 'service-6',
    title: '자석젤 네일',
    description: '빛에 따라 움직이는 입체 광택으로 트렌디한 포인트를 더해드립니다',
    image: IMAGES.SERVICE_MAGNET_GEL,
    features: [
      '오묘한 캣아이 광택',
      '깊이감 있는 컬러감',
      '트렌디한 연출',
      '야간 조명에서 더 돋보임'
    ]
  },
  {
    id: 'service-7',
    title: '프렌치 네일',
    description: '깔끔한 라인과 단정한 컬러 밸런스로 데일리로 좋은 프렌치 스타일입니다',
    image: IMAGES.SERVICE_FRENCH_NAIL,
    features: [
      '얇고 정교한 팁 라인',
      '베이직부터 컬러 프렌치까지 가능',
      '단정한 손끝 연출',
      '직장인 고객 선호'
    ]
  },
  {
    id: 'service-8',
    title: '그라데이션 네일',
    description: '부드럽게 번지는 컬러 표현으로 손끝이 길고 여리하게 보이도록 연출합니다',
    image: IMAGES.SERVICE_GRADIENT_NAIL,
    features: [
      '자연스러운 컬러 블렌딩',
      '손톱이 길어 보이는 효과',
      '은은한 데일리 무드',
      '컬러 조합 맞춤 가능'
    ]
  },
  {
    id: 'service-9',
    title: '바다 여행 네일',
    description: '청량한 블루 톤과 반짝이는 포인트로 휴양지 무드를 담아낸 시즌 아트입니다',
    image: IMAGES.SERVICE_OCEAN_TRAVEL_NAIL,
    features: [
      '오션 블루 컬러 구성',
      '글리터와 파츠 포인트',
      '휴가 시즌에 적합',
      '사진이 잘 나오는 디자인'
    ]
  },
  {
    id: 'service-10',
    title: '봄 네일',
    description: '화사한 핑크와 플라워 감성을 담아 산뜻한 계절감을 표현합니다',
    image: IMAGES.SERVICE_SPRING_NAIL,
    features: [
      '파스텔 컬러 중심',
      '꽃잎 느낌 아트 가능',
      '러블리한 분위기',
      '벚꽃 시즌 추천'
    ]
  },
  {
    id: 'service-11',
    title: '여름 네일',
    description: '맑고 생동감 있는 컬러로 시원하고 경쾌한 여름 스타일을 제안합니다',
    image: IMAGES.SERVICE_SUMMER_NAIL,
    features: [
      '비비드 컬러 포인트',
      '시원한 블루와 화이트 조합',
      '바캉스룩과 매칭 용이',
      '젤 광택이 돋보이는 스타일'
    ]
  },
  {
    id: 'service-12',
    title: '겨울 네일',
    description: '차분한 톤과 반짝이는 포인트를 더해 포근하고 우아한 겨울 무드를 완성합니다',
    image: IMAGES.SERVICE_WINTER_NAIL,
    features: [
      '실버 글리터 포인트',
      '니트 느낌 컬러 조합',
      '연말룩과 잘 어울림',
      '차분한 고급스러움'
    ]
  },
  {
    id: 'service-13',
    title: '할로윈 네일',
    description: '오렌지와 블랙 포인트로 위트 있고 개성 있는 시즌 네일을 연출합니다',
    image: IMAGES.SERVICE_HALLOWEEN_NAIL,
    features: [
      '호박과 별 포인트 아트',
      '블랙 컬러 조합 가능',
      '유니크한 시즌 분위기',
      '파티 네일로 적합'
    ]
  },
  {
    id: 'service-14',
    title: '크리스마스 네일',
    description: '레드, 그린, 골드 포인트로 따뜻하고 화려한 연말 감성을 담았습니다',
    image: IMAGES.SERVICE_CHRISTMAS_NAIL,
    features: [
      '레드 계열 컬러 구성',
      '글리터와 파츠 장식',
      '연말 모임 포인트',
      '선물 같은 분위기 연출'
    ]
  },
  {
    id: 'service-15',
    title: '발렌타인 네일',
    description: '사랑스러운 핑크와 하트 포인트로 달콤한 무드를 표현하는 로맨틱 디자인입니다',
    image: IMAGES.SERVICE_VALENTINE_NAIL,
    features: [
      '핑크와 레드 조합',
      '하트 포인트 아트',
      '데이트 네일로 추천',
      '부드럽고 로맨틱한 느낌'
    ]
  },
  {
    id: 'service-16',
    title: '설날 네일',
    description: '단아한 컬러와 전통적인 포인트를 조화롭게 담아 특별한 명절 분위기를 더합니다',
    image: IMAGES.SERVICE_LUNAR_NEW_YEAR_NAIL,
    features: [
      '골드 포인트 활용',
      '단정한 컬러 밸런스',
      '한복과 어울리는 스타일',
      '가족 행사에 적합'
    ]
  }
];

export const priceItems: PriceItem[] = [
  {
    id: 'price-1',
    category: '기본 케어',
    name: '베이직 매니큐어',
    price: '30,000원',
    duration: '40분',
    description: '손톱 정리 + 큐티클 케어 + 컬러 도포'
  },
  {
    id: 'price-2',
    category: '기본 케어',
    name: '베이직 페디큐어',
    price: '35,000원',
    duration: '50분',
    description: '발톱 정리 + 각질 제거 + 컬러 도포'
  },
  {
    id: 'price-3',
    category: '젤 네일',
    name: '젤 매니큐어',
    price: '45,000원',
    duration: '60분',
    description: '손톱 정리 + 젤 베이스 + 컬러 젤 + 탑코트'
  },
  {
    id: 'price-4',
    category: '젤 네일',
    name: '젤 페디큐어',
    price: '50,000원',
    duration: '70분',
    description: '발톱 정리 + 각질 제거 + 젤 도포'
  },
  {
    id: 'price-5',
    category: '아트 디자인',
    name: '심플 아트 (손 1개당)',
    price: '5,000원',
    duration: '10분',
    description: '라인, 도트 등 간단한 디자인'
  },
  {
    id: 'price-6',
    category: '아트 디자인',
    name: '프리미엄 아트 (손 1개당)',
    price: '10,000원',
    duration: '20분',
    description: '복잡한 패턴, 그라데이션, 스톤 장식'
  },
  {
    id: 'price-7',
    category: '스페셜 케어',
    name: '프렌치 매니큐어',
    price: '50,000원',
    duration: '70분',
    description: '클래식 프렌치 스타일 + 젤 도포'
  },
  {
    id: 'price-8',
    category: '스페셜 케어',
    name: '손 집중 케어',
    price: '60,000원',
    duration: '80분',
    description: '딥 클렌징 + 각질 제거 + 영양 마스크 + 마사지'
  }
];

export const testimonials: Testimonial[] = [
  // {
  //   id: 'testimonial-1',
  //   name: '김지은',
  //   rating: 5,
  //   comment: '정말 꼼꼼하게 케어해주셔서 너무 만족스러워요! 젤 네일이 3주가 지나도 멀쩡하네요. 다음에도 꼭 방문할게요.',
  //   date: '2026-03-15'
  // },
  // {
  //   id: 'testimonial-2',
  //   name: '박서연',
  //   rating: 5,
  //   comment: '아트 디자인이 정말 예뻐요. 제가 원하는 스타일을 완벽하게 구현해주셨어요. 친구들한테 자랑하고 다녀요!',
  //   date: '2026-03-10'
  // },
  // {
  //   id: 'testimonial-3',
  //   name: '이민지',
  //   rating: 5,
  //   comment: '매장 분위기도 좋고 원장님이 너무 친절하세요. 손톱 상태도 많이 좋아졌어요. 단골 확정입니다!',
  //   date: '2026-03-05'
  // },
  // {
  //   id: 'testimonial-4',
  //   name: '최유진',
  //   rating: 5,
  //   comment: '프렌치 매니큐어 받았는데 너무 깔끔하고 예뻐요. 회사 다니면서 하기 딱 좋은 스타일이에요. 추천합니다!',
  //   date: '2026-02-28'
  // },
  // {
  //   id: 'testimonial-5',
  //   name: '정수아',
  //   rating: 5,
  //   comment: '손 케어 받고 나니까 손이 정말 부드러워졌어요. 마사지도 시원하고 힐링되는 시간이었습니다.',
  //   date: '2026-02-20'
  // },
  // {
  //   id: 'testimonial-6',
  //   name: '강혜진',
  //   rating: 5,
  //   comment: '결혼식 전에 방문했는데 정말 예쁘게 해주셨어요. 사진 찍을 때마다 손이 너무 예뻐서 기분이 좋았어요!',
  //   date: '2026-02-15'
  // }
];
