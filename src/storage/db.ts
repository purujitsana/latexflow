import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DocumentModel } from '../types/document'

export interface StoredDocument {
  id: string
  name: string
  model: DocumentModel
  latexSource: string
  createdAt: string
  updatedAt: string
}

interface LatexFlowDB extends DBSchema {
  documents: {
    key: string
    value: StoredDocument
    indexes: { 'by-updatedAt': string }
  }
}

const DB_NAME = 'latexflow'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<LatexFlowDB>> | null = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<LatexFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' })
          store.createIndex('by-updatedAt', 'updatedAt')
        }
      },
    })
  }
  return dbPromise
}

export async function listDocuments(): Promise<StoredDocument[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('documents', 'by-updatedAt')
  return all.reverse()
}

export async function getDocument(id: string): Promise<StoredDocument | undefined> {
  const db = await getDb()
  return db.get('documents', id)
}

export async function putDocument(doc: StoredDocument): Promise<void> {
  const db = await getDb()
  await db.put('documents', doc)
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('documents', id)
}

export function isStorageAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}
