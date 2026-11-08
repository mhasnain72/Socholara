const BOOKMARKS_KEY = 'scholara_bookmarked_ids';
export const Storage = {
  // Bookmarks
  getBookmarks() {
    try {
      const data = localStorage.getItem(BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isBookmarked(id) {
    const list = this.getBookmarks();
    return list.includes(id);
  },

  toggleBookmark(id) {
    const list = this.getBookmarks();
    const index = list.indexOf(id);
    let updated = [];
    let added = false;
    if (index > -1) {
      updated = list.filter(item => item !== id);
      added = false;
    } else {
      updated = [...list, id];
      added = true;
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return { bookmarked: added, list: updated };
  },

};

export default Storage;
