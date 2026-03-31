import { Service, PriceItem, Testimonial } from '@/lib/index';
import { IMAGES } from '@/assets/images';

export const services: Service[] = [
  {
    id: 'service-1',
    title: '젤 네일 아트',
    description: '오래 지속되는 아름다운 젤 네일로 당신의 손끝을 화사하게 꾸며드립니다',
    image: IMAGES.SERVICE_1,
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
    image: IMAGES.SERVICE_4,
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
    image: IMAGES.SERVICE_7,
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
    image: IMAGES.SERVICE_10,
    features: [
      '큐티클 정리',
      '손톱 영양 공급',
      '각질 제거',
      '보습 마사지'
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