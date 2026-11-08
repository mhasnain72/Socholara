import React from 'react';
import { Bookmark, ArrowLeft, Compass } from 'lucide-react';
import OpportunityCard from './OpportunityCard';

export const SavedPage = ({ 
  opportunities = [], 
  savedIds = [], 
  onViewDetails, 
  onToggleBookmark, 
  onShare,
  onExploreAll 
}) => {
  const savedList = opportunities.filter(opp => savedIds.includes(opp._id || opp.id));

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#FAF7F2] border border-[#DDD2BF] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6EFF9] text-xs font-bold text-[#0F2744] mb-2">
            <Bookmark className="w-3.5 h-3.5 text-[#C26D38] fill-current" />
            <span>Saved Opportunities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2744] font-['Plus_Jakarta_Sans']">
            Your Bookmarked Opportunities ({savedList.length})
          </h2>
          <p className="text-xs sm:text-sm text-[#5A6B82] mt-1">
            Keep track of upcoming application deadlines, stipend awards, and required documents.
          </p>
        </div>

        <button
          onClick={onExploreAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F2744] hover:bg-[#16365D] text-white text-xs sm:text-sm font-semibold transition shadow-sm"
        >
          <Compass className="w-4 h-4 text-[#C26D38]" />
          <span>Explore More</span>
        </button>
      </div>

      {/* Grid of Saved Items */}
      {savedList.length > 0 ? (
        <div className="opps-cards-grid">
          {savedList.map(opp => {
            const oppId = opp._id || opp.id;
            return (
              <OpportunityCard
                key={oppId}
                opportunity={opp}
                isBookmarked={true}
                onToggleBookmark={onToggleBookmark}
                onViewDetails={onViewDetails}
                onShare={onShare}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#DDD2BF] rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#DDD2BF] text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#0F2744] font-['Plus_Jakarta_Sans']">
            No Saved Opportunities Yet
          </h3>
          <p className="text-xs sm:text-sm text-[#5A6B82] leading-relaxed">
            While browsing scholarships or internships, click the bookmark icon on any card to save it here for quick reference.
          </p>
          <div className="pt-2">
            <button
              onClick={onExploreAll}
              className="px-5 py-2.5 rounded-xl bg-[#0F2744] hover:bg-[#16365D] text-white text-xs sm:text-sm font-bold transition shadow"
            >
              Browse All Opportunities
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SavedPage;
