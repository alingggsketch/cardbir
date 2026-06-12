import oneImg from '../assets/one.jpg?url';
import twoImg from '../assets/two.jpg?url';
import threeImg from '../assets/three.jpg?url';
import fourImg from '../assets/four.jpg?url';
import fiveImg from '../assets/five.jpg?url';
import sixImg from '../assets/six.jpg?url';

const THEMES = [
  { id: 'one', img: oneImg, color: '#ff6b9d', name: '玫瑰粉' },
  { id: 'two', img: twoImg, color: '#ff8a65', name: '珊瑚橙' },
  { id: 'three', img: threeImg, color: '#ffca28', name: '琥珀金' },
  { id: 'four', img: fourImg, color: '#66bb6a', name: '薄荷绿' },
  { id: 'five', img: fiveImg, color: '#42a5f5', name: '天空蓝' },
  { id: 'six', img: sixImg, color: '#ab47bc', name: '薰衣草' },
];

export default function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          className={`theme-option ${value === theme.id ? 'active' : ''}`}
          onClick={() => onChange(theme.id)}
          title={theme.name}
        >
          <img src={theme.img} alt={theme.name} />
          <span className="theme-name">{theme.name}</span>
        </button>
      ))}
    </div>
  );
}

export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
