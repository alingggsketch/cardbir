import { useState, useRef, useEffect } from 'react';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const COLUMN_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDaysInMonth(month) {
  // Use a non-leap year base; 2月 defaults to 28
  return new Date(2001, month, 0).getDate();
}

function parseValue(value) {
  if (!value) return { month: 0, day: 0 };
  const parts = value.split('-');
  return { month: Number(parts[1]), day: Number(parts[2]) };
}

function formatValue(month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `2001-${mm}-${dd}`;
}

function ScrollColumn({ items, selected, onSelect, labelRef }) {
  const scrollRef = useRef(null);
  const ignoreScroll = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && selected > 0) {
      const index = items.indexOf(selected);
      if (index >= 0) {
        ignoreScroll.current = true;
        scrollRef.current.scrollTop = index * ITEM_HEIGHT;
        requestAnimationFrame(() => { ignoreScroll.current = false; });
      }
    }
  }, []);

  const handleScroll = () => {
    if (ignoreScroll.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      ignoreScroll.current = true;
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
      onSelect(items[index]);
      setTimeout(() => { ignoreScroll.current = false; }, 100);
    }, 80);
  };

  return (
    <div className="scroll-column-wrapper">
      <div className="scroll-column-label">{labelRef}</div>
      <div
        ref={scrollRef}
        className="scroll-column"
        style={{ height: COLUMN_HEIGHT }}
        onScroll={handleScroll}
      >
        <div className="scroll-spacer" />
        {items.map((item) => (
          <div
            key={item}
            className={`scroll-item ${item === selected ? 'active' : ''}`}
            style={{ height: ITEM_HEIGHT }}
            onClick={() => {
              const index = items.indexOf(item);
              ignoreScroll.current = true;
              scrollRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
              onSelect(item);
              setTimeout(() => { ignoreScroll.current = false; }, 200);
            }}
          >
            {item}
          </div>
        ))}
        <div className="scroll-spacer" />
      </div>
      <div className="scroll-highlight" style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }} />
    </div>
  );
}

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const { month: initM, day: initD } = parseValue(value);
  const [tempMonth, setTempMonth] = useState(initM || new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(initD || new Date().getDate());

  const openPicker = () => {
    const { month, day } = parseValue(value);
    setTempMonth(month || new Date().getMonth() + 1);
    setTempDay(day || new Date().getDate());
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(formatValue(tempMonth, tempDay));
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(tempMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Clamp day when month changes
  const handleMonthChange = (m) => {
    setTempMonth(m);
    const maxDay = getDaysInMonth(m);
    if (tempDay > maxDay) setTempDay(maxDay);
  };

  const displayText = value
    ? `${parseValue(value).month}月${parseValue(value).day}日`
    : '选择日期';

  return (
    <div className="datepicker">
      <button
        type="button"
        className={`datepicker-trigger ${value ? 'has-value' : ''}`}
        onClick={openPicker}
      >
        <span>{displayText}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="dp-overlay" onClick={() => setOpen(false)}>
          <div className="dp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dp-toolbar">
              <button type="button" className="dp-btn dp-cancel" onClick={() => setOpen(false)}>取消</button>
              <span className="dp-title">选择日期</span>
              <button type="button" className="dp-btn dp-confirm" onClick={handleConfirm}>确定</button>
            </div>
            <div className="dp-columns">
              <ScrollColumn
                items={MONTHS}
                selected={tempMonth}
                onSelect={handleMonthChange}
                labelRef="月"
              />
              <ScrollColumn
                items={days}
                selected={tempDay}
                onSelect={setTempDay}
                labelRef="日"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
