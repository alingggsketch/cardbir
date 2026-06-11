const THEME_COLORS = [
  { name: '玫瑰粉', value: '#ff6b9d' },
  { name: '珊瑚橙', value: '#ff8a65' },
  { name: '琥珀金', value: '#ffca28' },
  { name: '薄荷绿', value: '#66bb6a' },
  { name: '天空蓝', value: '#42a5f5' },
  { name: '薰衣草', value: '#ab47bc' },
  { name: '中国红', value: '#ef5350' },
  { name: '深空灰', value: '#546e7a' },
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      {THEME_COLORS.map((color) => (
        <button
          key={color.value}
          className={`color-swatch ${value === color.value ? 'active' : ''}`}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.value)}
          title={color.name}
        >
          {value === color.value && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8L6.5 11.5L13 5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
