interface SectionHeaderProps {
  title: string;
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
}

export default function SectionHeader({
  title,
  showSeeAll = true,
  onSeeAllClick
}: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      
      {showSeeAll && (
        <button 
          className="see-all" 
          onClick={onSeeAllClick}
        >
          See all
        </button>
      )}
    </div>
  );
}