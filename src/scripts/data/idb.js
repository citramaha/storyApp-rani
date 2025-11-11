import { openDB } from 'idb';

const DATABASE_NAME = 'stories-database';
const DATABASE_VERSION = 1;
const STORE_NAME = 'stories';
const PENDING_STORE = 'pending-stories'; 

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
    if (!database.objectStoreNames.contains(PENDING_STORE)) {
      database.createObjectStore(PENDING_STORE, { keyPath: 'id', autoIncrement: true });
    }
  },
});

const IdbHelper = {
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  async addStory(story) {
    return (await dbPromise).put(STORE_NAME, story);
  },
  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
  async clearStories() {
    return (await dbPromise).clear(STORE_NAME);
  },

  async addPendingStory(story) {
    return (await dbPromise).put(PENDING_STORE, story);
  },
  async getAllPendingStories() {
    return (await dbPromise).getAll(PENDING_STORE);
  },
  async clearPendingStories() {
    return (await dbPromise).clear(PENDING_STORE);
  }
};

export default IdbHelper;
