export interface Product {
  id: string;
  name: string;
  en: string;
  type: string;
  tag: string;
  image: string;
  desc: string;
  params: string[];
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
    params: ['负载 7kg', '六轴串联', '0.02mm 重复定位', '工作半径 920mm'],
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
    params: ['负载 12kg', '轻量化设计', '紧凑控制柜', '精密作业'],
    accent: 'electric',
  },
  {
    id: 'scara-406',
    name: '406 SCARA',
    en: 'SCARA 4-Axis',
    type: 'SCARA 四轴机械臂',
    tag: '0.01MM',
    image: '/products/scara-406.jpg',
    desc: '白色四轴 SCARA，紧凑轻量，关节灵活，适合精密装配、点胶、贴装等高速作业。',
    params: ['四轴结构', '高速点胶', '精密装配', '紧凑桌面级'],
    accent: 'ivory',
  },
  {
    id: 'twr750-5',
    name: 'TWR750-5',
    en: 'Dual-Arm Robot',
    type: '双臂机器人',
    tag: 'DUAL',
    image: '/products/twr750-5.jpg',
    desc: '对称安装的双臂结构，双臂协同作业，面向教学科研与仿人操作研究。',
    params: ['双臂协同', '模块化关节', '科研教学', '仿人操作'],
    accent: 'dim',
  },
  {
    id: 'tw-12',
    name: 'TW-12',
    en: 'Quadruped',
    type: '四足机器狗',
    tag: 'LEG',
    image: '/products/tw-12.jpg',
    desc: '工业级轻量化四足骨架，铝合金机身，腿部关节清晰可见，面向巡检与运动控制研究。',
    params: ['四足结构', '铝合金骨架', '多自由度', '运动控制'],
    accent: 'neon',
  },
  {
    id: '7kg-black',
    name: '7KG 改色款',
    en: 'Custom Edition',
    type: '黑色定制协作臂',
    tag: 'CUSTOM',
    image: '/products/7kg-black.jpg',
    desc: '7kg 负载协作臂定制改色版本，黑化机身，面向品牌化与展示场景。',
    params: ['定制改色', '7kg 负载', '品牌展示', '个性化'],
    accent: 'electric',
  },
];

export const capabilities = [
  { title: '机械设计', desc: '结构设计 · 轻量化 · 模块化', icon: 'MD' },
  { title: '运动控制', desc: '轨迹规划 · 伺服控制 · 标定', icon: 'MC' },
  { title: 'ROS / 二次开发', desc: 'ROS1/2 · 接口封装 · SDK', icon: 'RO' },
  { title: '电气与集成', desc: '控制柜 · 示教器 · 产线集成', icon: 'EL' },
  { title: '视觉与感知', desc: '2D/3D 视觉 · 抓取定位 · 巡检', icon: 'VI' },
];

export const stats = [
  { value: 6, suffix: '+', label: '机器人产品线' },
  { value: 12, suffix: 'kg', label: '最大负载等级' },
  { value: 0.01, suffix: 'mm', label: '重复定位精度', decimal: 2 },
  { value: 100, suffix: '%', label: '自主设计制造' },
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
