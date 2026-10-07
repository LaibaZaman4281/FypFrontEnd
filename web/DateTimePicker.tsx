import React from 'react';

export default function DateTimePicker({ value, onChange }: any) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value ? new Date(e.target.value) : null;
    onChange && onChange(null, d);
  };
  const dateValue = value instanceof Date ? value.toISOString().slice(0, 10) : '';
  return <input type="date" value={dateValue} onChange={handle} />;
}
