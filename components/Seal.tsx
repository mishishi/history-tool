/**
 * 印章标签组件
 * variant: 'red' 朱砂红 / 'gold' 暗金
 */
interface SealProps {
  children: React.ReactNode;
  variant?: 'red' | 'gold';
  className?: string;
}

export default function Seal({ children, variant = 'red', className = '' }: SealProps) {
  const variantClass = variant === 'gold' ? 'seal-gold' : 'seal';
  return <span className={`${variantClass} ${className}`}>{children}</span>;
}