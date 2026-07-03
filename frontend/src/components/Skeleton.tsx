// Shimmer placeholders shown while data loads — replaces bare "Loading..." text.

export function Skeleton({ width, height = 14, style }: {
  width: number | string;
  height?: number;
  style?: React.CSSProperties;
}) {
  return <span className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c}>
              <span className="skeleton" style={{ width: c === 0 ? 80 : '70%', height: 12 }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
