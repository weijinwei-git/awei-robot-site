export interface Product {
  id: string;
  name: string;
  en: string;
  type: string;
  tag: string;
  image: string;
  desc: string;
  specs: { label: string; value: string }[];
  price: number;
  taxNote: string;
  video?: string;
  accent: 'neon' | 'electric' | 'ivory' | 'dim';
}

export const products: Product[] = [
  {
    id: 'cr-0709',
    name: 'CR-0709',
    en: 'Cobot 6-Axis',
    type: '六轴协作机器人',
    tag: '7KG',
    image: '/products/cr-0709.jpg',
    desc: '银灰金属质感六轴协作臂，固定于工作台面，轻量精密，适配装配、上下料、检测等场景。',
    specs: [
      { label: '臂长', value: '780mm' },
      { label: '负载', value: '7kg' },
      { label: '精度', value: '±0.05mm' },
    ],
    price: 19999,
    taxNote: '未税',
    video: 'videos/cr-0709-show.mp4',
    accent: 'neon',
  },
  {
    id: 'cr-12e',
    name: 'CR-12E',
    en: 'Heavy Cobot',
    type: '12kg 协作机器人',
    tag: '12KG',
    image: '/products/cr-12e.jpg',
    desc: '12kg 级多关节协作臂，搭配小型控制柜，面向轻负载精密作业与柔性产线。',
    specs: [
      { label: '臂长', value: '1280mm' },
      { label: '负载', value: '12kg' },
      { label: '精度', value: '±0.1mm' },
    ],
    price: 26999,
    taxNote: '未税',
    video: 'videos/cr-12e-show.mp4',
    accent: 'electric',
  },
  {
    id: 'scara-406',
    name: '406 SCARA',
    en: 'SCARA 4-Axis',
    type: 'SCARA 四轴机械臂',
    tag: '5KG',
    image: '/products/scara-406.jpg',
    desc: '白色四轴 SCARA，紧凑轻量，关节灵活，适合精密装配、点胶、贴装等高速作业。',
    specs: [
      { label: '臂长', value: '600mm' },
      { label: '负载', value: '5kg' },
      { label: '精度', value: '±0.05mm' },
    ],
    price: 9999,
    taxNote: '未税',
    video: 'videos/scara-406-show.mp4',
    accent: 'ivory',
  },
  {
    id: 'twr750-5',
    name: 'TWR750-5',
    en: 'Dual-Arm Robot',
    type: '双臂机器人',
    tag: '4/5KG',
    image: '/products/twr750-5.jpg',
    desc: '对称安装的双臂结构，双臂协同作业，面向教学科研与仿人操作研究。',
    specs: [
      { label: '臂长', value: '750mm × 2' },
      { label: '负载', value: '4kg / 5kg' },
      { label: '精度', value: '±0.03mm' },
    ],
    price: 55000,
    taxNote: '未税',
    video: 'videos/twr750-5-show.mp4',
    accent: 'dim',
  },
  {
    id: 'tw-12',
    name: 'TW-12',
    en: 'Quadruped',
    type: '四足机器狗',
    tag: '8KG',
    image: '/products/tw-12.jpg',
    desc: '工业级轻量化四足骨架，铝合金机身，腿部关节清晰可见，面向巡检与运动控制研究。',
    specs: [
      { label: '负载', value: '8kg' },
      { label: '续航', value: '1.5h' },
    ],
    price: 16999,
    taxNote: '未税',
    video: 'videos/tw-12-show.mp4',
    accent: 'neon',
  },
];

export const capabilities = [
  { title: '机械设计', desc: '结构设计 · 轻量化 · 模块化', icon: 'MD' },
  { title: '运动控制', desc: '轨迹规划 · 伺服控制 · 标定', icon: 'MC' },
  { title: 'ROS / 二次开发', desc: 'ROS1/2 · 接口封装 · SDK', icon: 'RO' },
  { title: '简单操作', desc: '中文界面 · 可视化示教', icon: 'SO' },
  { title: '视觉与感知', desc: '2D/3D 视觉 · 抓取定位 · 巡检', icon: 'VI' },
];

export const sellingPoints = [
  { en: 'NO LOGO', title: '无LOGO出货', desc: '出厂不贴牌 · 机器以最纯粹的状态交付' },
  { en: 'BEST VALUE', title: '性价比之王', desc: '同配置低价格 · 同价格高配置' },
  { en: 'NO TRICKS', title: '互联网不需要套路', desc: '明码标价 · 官网价就是成交价' },
];

export const clients = [
  '智能制造研究院',
  '高校实验室',
  '自动化集成商',
  '创客教育',
  '科研院所',
  '柔性产线',
  '机器人竞赛',
  '定制开发',
];
