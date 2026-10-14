import spring from '../references/櫻花漩渦中的少女們.png'
import summer from '../references/夏日花海中的飞舞少女.png'
import autumn from '../references/秋日古寺贈花冠.png'
import winter from '../references/冰霜森林中的雙劍守望者.png'

export const seasons = [
  { name: 'Spring', label: '春', dance: '春の舞', characters: ['花葉雛菊', '姫鷹さくら'], image: spring,
    color: '#eac3d0', paper: '#f8e9ed', ink: '#643345', accent: '#b76285', light: '#fff8ef', glow: '#ebbad0', secondary: '#e0d9ea' },
  { name: 'Summer', label: '夏', dance: '夏の舞', characters: ['葉桜瑠璃', '葉桜あやめ'], image: summer,
    color: '#88c3b1', paper: '#e8f2ef', ink: '#254e58', accent: '#438d91', light: '#f7fcf0', glow: '#b7dcec', secondary: '#c5e1cc' },
  { name: 'Autumn', label: '秋', dance: '秋の舞', characters: ['祝月撫子', '阿左美竜胆'], image: autumn,
    color: '#eea255', paper: '#f7ecdf', ink: '#6c432c', accent: '#b97637', light: '#fff8e4', glow: '#edc392', secondary: '#ead0bd' },
  { name: 'Winter', label: '冬', dance: '冬の舞', characters: ['寒椿狼星', '寒月凍蝶'], image: winter,
    color: '#96b8e1', paper: '#eaf0f8', ink: '#354b70', accent: '#6c8cbc', light: '#f9fbff', glow: '#c1d5f0', secondary: '#d9dded' },
] as const

// Measured from the 30 fps reference. The second eight seconds repeat these beats.
// 0–2: round petals / flow / dots / contour lines.
// 2–4: horizontal capsules / concentric lens / dots / color separation.
// 4–6: pointed petals / pixel grid / fine grain / contour lines.
// 6–8: offset circle lattice / fine grid / dots / rotating return.
export const referenceTiming = {
  cycle: 8,
  season: 2,
  incomingEnd: 0.26,
  clearEnd: 0.64,
  matrixStart: 0.67,
  matrixPeak: 0.79,
  contourPeak: 1.02,
  secondClear: 1.24,
  outgoingStart: 1.62,
} as const
