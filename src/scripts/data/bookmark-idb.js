// src/scripts/data/bookmark-idb.js
import { openDB } from 'idb';

const DB_NAME = 'story-bookmark-db';
const STORE_NAME = 'bookmarks';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  },
});

const BookmarkIdb = {
  async getAll() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  async get(id) {
    return (await dbPromise).get(STORE_NAME, id);
  },
  async add(story) {
    // story must contain id field (from API) — store full story object
    return (await dbPromise).put(STORE_NAME, story);
  },
  async remove(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
  async isBookmarked(id) {
    const s = await this.get(id);
    return !!s;
  },
};

export default BookmarkIdb;
